const { query, getPool } = require('./db.cjs');
const { textoBuscable } = require('./nombresIA.cjs');

const TAMANO = 35;

function ordenar(lista) {
  return lista.sort((x, y) => x.original.localeCompare(y.original, 'es', { sensitivity: 'base', ignorePunctuation: true }));
}

function elemento(f, tipo) {
  return {
    tipo,
    original: f.original,
    es: f.es || f.original,
    en: f.en || f.original,
    otros: f.otros || [],
    generado: Boolean(f.es),
    corregido: Boolean(f.corregido),
    revisado: Boolean(f.revisado),
  };
}

async function grupos() {
  const et = await query(`
    SELECT e.nombre AS original, n.es, n.en, n.otros, n.corregido, n.revisado
    FROM etiquetas e
    LEFT JOIN nombres_ia n ON n.tipo = 'etiqueta' AND n.original = e.nombre
  `);
  const ar = await query(`
    SELECT a.nombre AS original, n.es, n.en, n.otros, n.corregido, n.revisado,
           (SELECT e.nombre FROM articulo_etiquetas ae JOIN etiquetas e ON e.id = ae.etiqueta_id
            WHERE ae.articulo_id = a.id ORDER BY lower(e.nombre) LIMIT 1) AS etiqueta
    FROM articulos a
    LEFT JOIN nombres_ia n ON n.tipo = 'articulo' AND n.original = a.nombre
  `);

  const lista = [{ titulo: 'Etiquetas', elementos: ordenar(et.rows.map(f => elemento(f, 'etiqueta'))) }];

  const porEtiqueta = new Map();
  for (const f of ar.rows) {
    const clave = f.etiqueta || '';
    if (!porEtiqueta.has(clave)) porEtiqueta.set(clave, []);
    porEtiqueta.get(clave).push(elemento(f, 'articulo'));
  }
  const etiquetas = [...porEtiqueta.keys()]
    .filter(Boolean)
    .sort((x, y) => x.localeCompare(y, 'es', { sensitivity: 'base' }));
  if (porEtiqueta.has('')) etiquetas.push('');

  for (const nombre of etiquetas) {
    const elementos = ordenar(porEtiqueta.get(nombre));
    const partes = Math.ceil(elementos.length / TAMANO);
    for (let p = 0; p < partes; p++) {
      const titulo = nombre || 'Sin etiqueta';
      lista.push({
        titulo: partes > 1 ? `${titulo} · ${p + 1} de ${partes}` : titulo,
        elementos: elementos.slice(p * TAMANO, (p + 1) * TAMANO),
      });
    }
  }
  return lista.map(g => ({ ...g, revisado: g.elementos.every(e => e.revisado) }));
}

async function aplicarUno(cliente, tipo, original) {
  const n = await cliente.query('SELECT es, en, otros FROM nombres_ia WHERE tipo = $1 AND original = $2', [tipo, original]);
  if (!n.rows.length) return;
  const { es, en, otros } = n.rows[0];
  const tabla = tipo === 'articulo' ? 'articulos' : 'etiquetas';
  await cliente.query(
    `UPDATE ${tabla} SET nombre_es = $2, nombre_en = $3, buscable = $4 WHERE nombre = $1`,
    [original, es, en, textoBuscable([original, es, en, ...otros])]
  );
}

async function guardarCorreccion({ tipo, original, es, en, otros }) {
  if (!['articulo', 'etiqueta'].includes(tipo)) throw new Error('Tipo no válido');
  const limpiar = t => String(t || '').replace(/\s+/g, ' ').trim();
  const lista = [...new Set((Array.isArray(otros) ? otros : String(otros || '').split(',')).map(limpiar).filter(Boolean))];
  const cliente = await getPool().connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query(
      `INSERT INTO nombres_ia (tipo, original, es, en, otros, corregido, revisado)
       VALUES ($1, $2, $3, $4, $5, true, now())
       ON CONFLICT (tipo, original) DO UPDATE
       SET es = EXCLUDED.es, en = EXCLUDED.en, otros = EXCLUDED.otros, corregido = true, revisado = now()`,
      [tipo, original, limpiar(es) || original, limpiar(en) || original, lista]
    );
    await aplicarUno(cliente, tipo, original);
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function marcarRevisados(elementos) {
  const cliente = await getPool().connect();
  try {
    await cliente.query('BEGIN');
    for (const { tipo, original } of elementos) {
      if (!['articulo', 'etiqueta'].includes(tipo)) continue;
      await cliente.query(
        `INSERT INTO nombres_ia (tipo, original, es, en, otros, revisado)
         VALUES ($1, $2, $2, $2, '{}', now())
         ON CONFLICT (tipo, original) DO UPDATE SET revisado = COALESCE(nombres_ia.revisado, now())`,
        [tipo, original]
      );
      await aplicarUno(cliente, tipo, original);
    }
    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

module.exports = { grupos, guardarCorreccion, marcarRevisados };
