const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk').default;
const { getPool } = require('../lib/db.cjs');
const { aplicarNombresIA } = require('../lib/nombresIA.cjs');

const MODELO = 'claude-opus-5-5';
const PRECIO_ENTRADA = 4 / 1e6;
const PRECIO_SALIDA = 20 / 1e6;
const TANDA = 50;

const SISTEMA = `Ayudas a catalogar el almacén de una asociación que organiza juegos de rol en vivo (larp): atrezo, vestuario, iluminación, cocina, oficina, colchones, armas de juguete o de látex, maquillaje, botiquín.
Cada elemento que recibes es el nombre de un artículo (o de una etiqueta de categoría) tal como alguien lo escribió en una hoja, casi siempre en inglés y a veces en español, a menudo con tallas, medidas, números o marcas.
Para cada elemento devuelve:
- "es": el nombre en español, natural y breve, como lo diría un voluntario del almacén.
- "en": el nombre en inglés, natural y breve.
- "otros": entre 3 y 8 términos de búsqueda alternativos, mezclando español e inglés: sinónimos, nombres coloquiales y la categoría general del objeto. No repitas "es" ni "en", ni variantes que solo cambien singular y plural.
Conserva tal cual tallas (XL, 3XL, T.44), medidas (10m, 20W), números, códigos y marcas (JBL, Nerf, Dell). Si un nombre es ambiguo, usa las etiquetas para entender el contexto. Si es un nombre propio o una referencia interna de un juego, deja "es" y "en" como el original y pon en "otros" lo que pueda ayudar a encontrarlo.
Devuelve un elemento por cada "i" recibido, con el mismo "i".`;

const ESQUEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          i: { type: 'integer' },
          es: { type: 'string' },
          en: { type: 'string' },
          otros: { type: 'array', items: { type: 'string' } },
        },
        required: ['i', 'es', 'en', 'otros'],
        additionalProperties: false,
      },
    },
  },
  required: ['items'],
  additionalProperties: false,
};

function leerClave() {
  const archivo = path.join(__dirname, '..', '.env.ia');
  const linea = fs.readFileSync(archivo, 'utf8').split(/\r?\n/).find(l => l.startsWith('ANTHROPIC_API_KEY='));
  const clave = linea ? linea.slice('ANTHROPIC_API_KEY='.length).trim() : '';
  if (!clave) throw new Error('Falta la clave en .env.ia');
  return clave;
}

async function pendientes(cliente) {
  const articulos = await cliente.query(`
    SELECT a.nombre, COALESCE(array_agg(e.nombre ORDER BY e.nombre) FILTER (WHERE e.nombre IS NOT NULL), '{}') AS etiquetas
    FROM articulos a
    LEFT JOIN articulo_etiquetas ae ON ae.articulo_id = a.id
    LEFT JOIN etiquetas e ON e.id = ae.etiqueta_id
    WHERE NOT EXISTS (SELECT 1 FROM nombres_ia n WHERE n.tipo = 'articulo' AND n.original = a.nombre)
    GROUP BY a.nombre
    ORDER BY a.nombre
  `);
  const etiquetas = await cliente.query(`
    SELECT nombre FROM etiquetas e
    WHERE NOT EXISTS (SELECT 1 FROM nombres_ia n WHERE n.tipo = 'etiqueta' AND n.original = e.nombre)
    ORDER BY nombre
  `);
  return [
    ...etiquetas.rows.map(f => ({ tipo: 'etiqueta', nombre: f.nombre, etiquetas: [] })),
    ...articulos.rows.map(f => ({ tipo: 'articulo', nombre: f.nombre, etiquetas: f.etiquetas })),
  ];
}

async function pedirTanda(anthropic, elementos, gasto) {
  const entrada = elementos.map((e, i) => ({
    i,
    tipo: e.tipo === 'etiqueta' ? 'etiqueta de categoría' : 'artículo',
    nombre: e.nombre,
    etiquetas: e.etiquetas,
  }));
  const respuesta = await anthropic.beta.messages.create({
    model: MODELO,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: SISTEMA,
    output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
    messages: [{ role: 'user', content: JSON.stringify(entrada) }],
  });
  gasto.entrada += respuesta.usage.input_tokens || 0;
  gasto.salida += respuesta.usage.output_tokens || 0;
  if (respuesta.stop_reason === 'refusal') throw new Error('Claude ha rechazado una tanda.');
  if (respuesta.stop_reason === 'max_tokens') throw new Error('La respuesta se cortó por longitud.');
  const texto = respuesta.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const { items } = JSON.parse(texto);
  const porI = new Map(items.map(it => [it.i, it]));
  return elementos.map((e, i) => ({ ...e, ia: porI.get(i) || null }));
}

async function guardar(cliente, resultados) {
  for (const r of resultados) {
    if (!r.ia) continue;
    const otros = [...new Set(r.ia.otros.map(o => o.trim()).filter(Boolean))];
    await cliente.query(
      `INSERT INTO nombres_ia (tipo, original, es, en, otros) VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tipo, original) DO UPDATE SET es = EXCLUDED.es, en = EXCLUDED.en, otros = EXCLUDED.otros`,
      [r.tipo, r.nombre, r.ia.es.trim() || r.nombre, r.ia.en.trim() || r.nombre, otros]
    );
  }
}

async function generar() {
  const anthropic = new Anthropic({ apiKey: leerClave() });
  const cliente = await getPool().connect();
  const gasto = { entrada: 0, salida: 0 };
  const copia = [];
  try {
    await cliente.query(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
    const limite = Number(process.env.NOMBRES_LIMITE) || Infinity;
    const lista = (await pendientes(cliente)).slice(0, limite);
    console.log(`Pendientes: ${lista.length}`);
    for (let inicio = 0; inicio < lista.length; inicio += TANDA) {
      const tanda = lista.slice(inicio, inicio + TANDA);
      let resultados = await pedirTanda(anthropic, tanda, gasto);
      const faltan = resultados.filter(r => !r.ia);
      if (faltan.length) {
        const reintento = await pedirTanda(anthropic, faltan.map(({ ia, ...e }) => e), gasto);
        const porNombre = new Map(reintento.map(r => [`${r.tipo}|${r.nombre}`, r]));
        resultados = resultados.map(r => r.ia ? r : porNombre.get(`${r.tipo}|${r.nombre}`) || r);
      }
      await guardar(cliente, resultados);
      copia.push(...resultados);
      const coste = gasto.entrada * PRECIO_ENTRADA + gasto.salida * PRECIO_SALIDA;
      console.log(`Tanda ${inicio / TANDA + 1}: ${Math.min(inicio + TANDA, lista.length)}/${lista.length} · llevamos ${coste.toFixed(3)} $`);
    }
    await aplicarNombresIA(cliente);
  } finally {
    cliente.release();
  }
  const sinRespuesta = copia.filter(r => !r.ia).map(r => r.nombre);
  const coste = gasto.entrada * PRECIO_ENTRADA + gasto.salida * PRECIO_SALIDA;
  return { tokensEntrada: gasto.entrada, tokensSalida: gasto.salida, costeDolares: Number(coste.toFixed(3)), sinRespuesta, copia };
}

async function exportar(archivo) {
  const r = await getPool().query('SELECT tipo, original, es, en, otros FROM nombres_ia ORDER BY tipo, original');
  fs.writeFileSync(archivo, JSON.stringify(r.rows, null, 1));
  return r.rows.length;
}

async function importarArchivo(archivo) {
  const filas = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const cliente = await getPool().connect();
  try {
    await cliente.query(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
    for (const f of filas) {
      await cliente.query(
        `INSERT INTO nombres_ia (tipo, original, es, en, otros) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (tipo, original) DO UPDATE SET es = EXCLUDED.es, en = EXCLUDED.en, otros = EXCLUDED.otros`,
        [f.tipo, f.original, f.es, f.en, f.otros]
      );
    }
    await aplicarNombresIA(cliente);
  } finally {
    cliente.release();
  }
  return filas.length;
}

if (require.main === module) {
  const [orden, archivo] = process.argv.slice(2);
  const tarea =
    orden === 'exportar' ? exportar(archivo).then(n => console.log({ exportados: n }))
    : orden === 'importar' ? importarArchivo(archivo).then(n => console.log({ importados: n }))
    : generar().then(({ copia, ...resumen }) => console.log(resumen));
  tarea
    .then(() => getPool().end())
    .catch(error => {
      console.error(error.message);
      process.exit(1);
    });
}
