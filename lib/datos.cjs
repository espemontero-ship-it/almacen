const { query } = require('./db.cjs');
const { trozosBusqueda, normalizar, leerContenedor } = require('./normalizar.cjs');
const { ordenarTallas } = require('./tallas.cjs');
const { conFotos } = require('./fotos.cjs');

const ORDEN_SITIOS = "array_position(ARRAY['P','C','O','M','L','D','A','U','R'], s.letra) NULLS LAST, s.numero, lower(s.nombre)";
const BUSCABLE_ARTICULO = 'COALESCE(a.buscable, a.nombre_norm)';
const BUSCABLE_ETIQUETA = 'COALESCE(e.buscable, lower(e.nombre))';

// Sinónimos: una sola lista (mezcla español e inglés), la misma en los dos idiomas.
function sinonimosArticulo() {
  return "COALESCE((SELECT n.otros FROM nombres_ia n WHERE n.tipo = 'articulo' AND n.original = a.nombre), '{}'::text[])";
}

function nombreArticulo(idioma) {
  return idioma === 'en' ? 'COALESCE(a.nombre_en, a.nombre)' : 'COALESCE(a.nombre_es, a.nombre)';
}

function nombreEtiqueta(idioma) {
  return idioma === 'en' ? 'COALESCE(e.nombre_en, e.nombre)' : 'COALESCE(e.nombre_es, e.nombre)';
}

function ordenar(lista) {
  return lista.sort((x, y) => x.nombre.localeCompare(y.nombre, 'es', { sensitivity: 'base', ignorePunctuation: true }));
}

async function etiquetasDe(ids, idioma) {
  if (!ids.length) return new Map();
  const r = await query(
    `SELECT ae.articulo_id, ${nombreEtiqueta(idioma)} AS nombre FROM articulo_etiquetas ae
     JOIN etiquetas e ON e.id = ae.etiqueta_id
     WHERE ae.articulo_id = ANY($1)
     ORDER BY 2`,
    [ids]
  );
  const mapa = new Map();
  for (const fila of r.rows) {
    if (!mapa.has(fila.articulo_id)) mapa.set(fila.articulo_id, []);
    mapa.get(fila.articulo_id).push(fila.nombre);
  }
  return mapa;
}

async function obtenerSitio(id, idioma) {
  const s = await query('SELECT id, codigo, letra, nombre, llenado FROM sitios WHERE id = $1 AND borrado IS NULL', [id]);
  if (!s.rows.length) return null;
  const c = await query(`
    SELECT c.id, c.cantidad, c.rotos, c.comentarios, c.talla, a.id AS articulo_id, ${nombreArticulo(idioma)} AS nombre, ${sinonimosArticulo(idioma)} AS sinonimos, a.foto_clave, a.tallas
    FROM contenido c
    JOIN articulos a ON a.id = c.articulo_id
    WHERE c.sitio_id = $1 AND c.borrado IS NULL
  `, [id]);
  const etiquetas = await etiquetasDe([...new Set(c.rows.map(f => f.articulo_id))], idioma);
  const filasConFoto = await conFotos(c.rows);
  const contenido = ordenar(filasConFoto.map(f => ({ ...f, etiquetas: etiquetas.get(f.articulo_id) || [] })));
  const unidades = contenido.reduce((suma, f) => suma + f.cantidad, 0);
  return { ...s.rows[0], contenido, unidades };
}

async function sitioPorCodigo(texto) {
  const limpio = String(texto || '').trim();
  if (!limpio) return null;
  const c = leerContenedor(limpio);
  if (!c.codigo || c.nombre) return null;
  const r = await query('SELECT id FROM sitios WHERE codigo = $1 AND borrado IS NULL LIMIT 1', [c.codigo]);
  return r.rows[0]?.id || null;
}

async function articulosQueCoinciden(texto) {
  const trozos = trozosBusqueda(texto);
  if (!trozos.length) return { ids: [], aproximado: false };
  const patrones = trozos.map(t => `%${t}%`);
  const porNombre = trozos.map((_, i) => `${BUSCABLE_ARTICULO} LIKE $${i + 1}`).join(' AND ');
  const porEtiqueta = trozos.map((_, i) => `${BUSCABLE_ETIQUETA} LIKE $${i + 1}`).join(' AND ');
  const exactos = await query(
    `SELECT a.id FROM articulos a WHERE ${porNombre}
     UNION
     SELECT ae.articulo_id FROM articulo_etiquetas ae
     JOIN etiquetas e ON e.id = ae.etiqueta_id
     WHERE ${porEtiqueta}`,
    patrones
  );
  if (exactos.rows.length) return { ids: exactos.rows.map(r => r.id), aproximado: false };
  const parecidos = await query(
    `SELECT a.id FROM articulos a
     WHERE word_similarity($1, ${BUSCABLE_ARTICULO}) >= 0.45
     ORDER BY word_similarity($1, ${BUSCABLE_ARTICULO}) DESC
     LIMIT 50`,
    [normalizar(texto)]
  );
  return { ids: parecidos.rows.map(r => r.id), aproximado: true };
}

async function buscar(texto, idioma) {
  const { ids, aproximado } = await articulosQueCoinciden(texto);
  if (!ids.length) return { articulos: [], aproximado: false };
  return agrupar(ids, aproximado, idioma);
}

async function agrupar(ids, aproximado, idioma) {
  const r = await query(`
    SELECT a.id, ${nombreArticulo(idioma)} AS nombre, ${sinonimosArticulo(idioma)} AS sinonimos, a.foto_clave,
           c.cantidad, c.rotos, c.comentarios, c.talla,
           s.id AS sitio_id, s.codigo, s.nombre AS sitio_nombre
    FROM articulos a
    JOIN contenido c ON c.articulo_id = a.id
    JOIN sitios s ON s.id = c.sitio_id
    WHERE a.id = ANY($1) AND c.borrado IS NULL AND s.borrado IS NULL
    ORDER BY ${ORDEN_SITIOS}, c.id
  `, [ids]);
  const etiquetas = await etiquetasDe(ids, idioma);
  const porId = new Map();
  for (const fila of r.rows) {
    let art = porId.get(fila.id);
    if (!art) {
      art = {
        id: fila.id,
        nombre: fila.nombre,
        sinonimos: fila.sinonimos || [],
        foto_clave: fila.foto_clave,
        etiquetas: etiquetas.get(fila.id) || [],
        total: 0,
        rotos: 0,
        sitios: [],
        porTalla: {},
      };
      porId.set(fila.id, art);
    }
    art.total += fila.cantidad;
    art.rotos += fila.rotos;
    art.sitios.push({
      id: fila.sitio_id,
      codigo: fila.codigo,
      nombre: fila.sitio_nombre,
      cantidad: fila.cantidad,
      rotos: fila.rotos,
      comentarios: fila.comentarios,
      talla: fila.talla,
    });
    if (fila.talla) art.porTalla[fila.talla] = (art.porTalla[fila.talla] || 0) + fila.cantidad;
  }
  const articulos = (await conFotos([...porId.values()])).map(a => ({ ...a, tallas: ordenarTallas(Object.keys(a.porTalla)).map(t => ({ talla: t, cantidad: a.porTalla[t] })) }));
  if (!aproximado) ordenar(articulos);
  else articulos.sort((x, y) => ids.indexOf(x.id) - ids.indexOf(y.id));
  return { articulos, aproximado };
}

async function listarTodo(idioma) {
  const r = await query(`
    SELECT c.id, c.cantidad, c.rotos, c.talla, s.id AS sitio_id, s.codigo, s.nombre AS sitio_nombre, s.letra,
           a.id AS articulo_id, ${nombreArticulo(idioma)} AS nombre, ${sinonimosArticulo(idioma)} AS sinonimos, a.foto_clave
    FROM contenido c
    JOIN sitios s ON s.id = c.sitio_id
    JOIN articulos a ON a.id = c.articulo_id
    WHERE c.borrado IS NULL AND s.borrado IS NULL
    ORDER BY ${ORDEN_SITIOS}, c.id
  `);
  const etiquetas = await etiquetasDe([...new Set(r.rows.map(f => f.articulo_id))], idioma);
  const fotos = new Map();
  for (const f of r.rows) if (f.foto_clave && !fotos.has(f.foto_clave)) fotos.set(f.foto_clave, null);
  await Promise.all([...fotos.keys()].map(async k => fotos.set(k, (await conFotos([{ foto_clave: k }]))[0].foto_url)));
  return r.rows.map(f => ({ ...f, foto_url: f.foto_clave ? fotos.get(f.foto_clave) : null, etiquetas: etiquetas.get(f.articulo_id) || [] }));
}

// Catálogo para "Añadir artículo": todos los artículos de la base de datos (estén o no en alguna caja),
// con su foto, etiquetas, tallas y el texto en que se busca (español, inglés y sinónimos).
async function listarCatalogo(idioma) {
  const r = await query(`
    SELECT a.id, ${nombreArticulo(idioma)} AS nombre, a.foto_clave, a.tallas, ${BUSCABLE_ARTICULO} AS buscable
    FROM articulos a
    ORDER BY lower(${nombreArticulo(idioma)})
  `);
  const etiquetas = await etiquetasDe(r.rows.map(a => a.id), idioma);
  const lista = await conFotos(r.rows);
  return ordenar(lista.map(({ foto_clave, ...a }) => ({ ...a, tallas: a.tallas || [], etiquetas: etiquetas.get(a.id) || [] })));
}

async function obtenerArticulo(id, idioma) {
  const { articulos } = await agrupar([id], false, idioma);
  return articulos[0] || null;
}

async function sugerencias(texto, idioma, { catalogo = false } = {}) {
  const trozos = trozosBusqueda(texto);
  if (!trozos.length) return { lista: [], aproximado: false };
  const patrones = trozos.map(t => `%${t}%`);
  const condicion = campo => trozos.map((_, i) => `${campo} LIKE $${i + 1}`).join(' AND ');

  const c = leerContenedor(texto);
  const codigoExacto = c.codigo && !c.nombre ? c.codigo : null;
  const cajas = await query(
    `SELECT s.id, s.codigo, s.nombre, s.llenado FROM sitios s
     WHERE s.borrado IS NULL AND ${condicion("lower(coalesce(s.codigo, '') || ' ' || coalesce(s.nombre, ''))")}
     ORDER BY ${ORDEN_SITIOS}`,
    patrones
  );
  const etiquetas = await query(
    `SELECT ${nombreEtiqueta(idioma)} AS nombre, COUNT(ae.articulo_id)::int AS articulos
     FROM etiquetas e JOIN articulo_etiquetas ae ON ae.etiqueta_id = e.id
     WHERE ${condicion(BUSCABLE_ETIQUETA)}
     GROUP BY e.id`,
    patrones
  );
  const articulos = await query(
    `SELECT a.id, ${nombreArticulo(idioma)} AS nombre, a.tallas, COALESCE(SUM(c.cantidad), 0)::int AS total
     FROM articulos a
     ${catalogo ? 'LEFT ' : ''}JOIN (contenido c JOIN sitios s ON s.id = c.sitio_id AND s.borrado IS NULL) ON c.articulo_id = a.id AND c.borrado IS NULL
     WHERE ${condicion(BUSCABLE_ARTICULO)}
     GROUP BY a.id`,
    patrones
  );

  const listaCajas = cajas.rows
    .map(s => ({ tipo: 'caja', id: s.id, codigo: s.codigo, nombre: s.nombre, llenado: s.llenado }))
    .sort((x, y) => (y.codigo === codigoExacto) - (x.codigo === codigoExacto));
  const lista = [
    ...listaCajas,
    ...ordenar(etiquetas.rows).map(e => ({ tipo: 'etiqueta', nombre: e.nombre, articulos: e.articulos })),
    ...ordenar(articulos.rows).map(a => ({ tipo: 'articulo', id: a.id, nombre: a.nombre, total: a.total, tallas: a.tallas })),
  ];
  if (lista.length) return { lista, aproximado: false };

  const parecidos = await query(
    `SELECT a.id, ${nombreArticulo(idioma)} AS nombre, a.tallas, COALESCE(SUM(c.cantidad), 0)::int AS total
     FROM articulos a
     ${catalogo ? 'LEFT ' : ''}JOIN (contenido c JOIN sitios s ON s.id = c.sitio_id AND s.borrado IS NULL) ON c.articulo_id = a.id AND c.borrado IS NULL
     WHERE word_similarity($1, ${BUSCABLE_ARTICULO}) >= 0.45
     GROUP BY a.id
     ORDER BY max(word_similarity($1, ${BUSCABLE_ARTICULO})) DESC
     LIMIT 50`,
    [normalizar(texto)]
  );
  return {
    lista: parecidos.rows.map(a => ({ tipo: 'articulo', id: a.id, nombre: a.nombre, total: a.total, tallas: a.tallas })),
    aproximado: true,
  };
}

module.exports = { obtenerSitio, sitioPorCodigo, buscar, listarTodo, obtenerArticulo, sugerencias, listarCatalogo };
