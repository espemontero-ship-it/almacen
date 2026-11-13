const { query } = require('./db.cjs');
const { trozosBusqueda, normalizar, leerContenedor } = require('./normalizar.cjs');

async function etiquetasDe(ids) {
  if (!ids.length) return new Map();
  const r = await query(
    `SELECT ae.articulo_id, e.nombre FROM articulo_etiquetas ae
     JOIN etiquetas e ON e.id = ae.etiqueta_id
     WHERE ae.articulo_id = ANY($1)
     ORDER BY e.nombre`,
    [ids]
  );
  const mapa = new Map();
  for (const fila of r.rows) {
    if (!mapa.has(fila.articulo_id)) mapa.set(fila.articulo_id, []);
    mapa.get(fila.articulo_id).push(fila.nombre);
  }
  return mapa;
}

async function obtenerSitio(id) {
  const s = await query('SELECT id, codigo, letra, nombre FROM sitios WHERE id = $1', [id]);
  if (!s.rows.length) return null;
  const c = await query(`
    SELECT c.id, c.cantidad, c.estado, c.comentarios, a.id AS articulo_id, a.nombre, a.foto_url
    FROM contenido c
    JOIN articulos a ON a.id = c.articulo_id
    WHERE c.sitio_id = $1
    ORDER BY lower(a.nombre), c.id
  `, [id]);
  const etiquetas = await etiquetasDe([...new Set(c.rows.map(f => f.articulo_id))]);
  const contenido = c.rows.map(f => ({ ...f, etiquetas: etiquetas.get(f.articulo_id) || [] }));
  const unidades = contenido.reduce((suma, f) => suma + f.cantidad, 0);
  return { ...s.rows[0], contenido, unidades };
}

async function sitioPorCodigo(texto) {
  const limpio = String(texto || '').trim();
  if (!limpio) return null;
  const c = leerContenedor(limpio);
  if (!c.codigo || c.nombre) return null;
  const r = await query('SELECT id FROM sitios WHERE codigo = $1 LIMIT 1', [c.codigo]);
  return r.rows[0]?.id || null;
}

async function articulosQueCoinciden(texto) {
  const trozos = trozosBusqueda(texto);
  if (!trozos.length) return { ids: [], aproximado: false };
  const patrones = trozos.map(t => `%${t}%`);
  const porNombre = trozos.map((_, i) => `a.nombre_norm LIKE $${i + 1}`).join(' AND ');
  const porEtiqueta = trozos.map((_, i) => `lower(e.nombre) LIKE $${i + 1}`).join(' AND ');
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
    `SELECT id FROM articulos
     WHERE word_similarity($1, nombre_norm) >= 0.45
     ORDER BY word_similarity($1, nombre_norm) DESC
     LIMIT 50`,
    [normalizar(texto)]
  );
  return { ids: parecidos.rows.map(r => r.id), aproximado: true };
}

async function buscar(texto) {
  const { ids, aproximado } = await articulosQueCoinciden(texto);
  if (!ids.length) return { articulos: [], aproximado: false };
  return agrupar(ids, aproximado);
}

async function agrupar(ids, aproximado) {
  const r = await query(`
    SELECT a.id, a.nombre, a.foto_url,
           c.cantidad, c.estado, c.comentarios,
           s.id AS sitio_id, s.codigo, s.nombre AS sitio_nombre
    FROM articulos a
    JOIN contenido c ON c.articulo_id = a.id
    JOIN sitios s ON s.id = c.sitio_id
    WHERE a.id = ANY($1)
    ORDER BY array_position(ARRAY['P','C','O','M','L','D','A','U','R'], s.letra) NULLS LAST, s.numero, lower(s.nombre), c.id
  `, [ids]);
  const etiquetas = await etiquetasDe(ids);
  const porId = new Map();
  for (const fila of r.rows) {
    let art = porId.get(fila.id);
    if (!art) {
      art = {
        id: fila.id,
        nombre: fila.nombre,
        foto_url: fila.foto_url,
        etiquetas: etiquetas.get(fila.id) || [],
        total: 0,
        rotos: 0,
        sitios: [],
      };
      porId.set(fila.id, art);
    }
    art.total += fila.cantidad;
    if (fila.estado === 'roto') art.rotos += fila.cantidad;
    art.sitios.push({
      id: fila.sitio_id,
      codigo: fila.codigo,
      nombre: fila.sitio_nombre,
      cantidad: fila.cantidad,
      estado: fila.estado,
      comentarios: fila.comentarios,
    });
  }
  const articulos = [...porId.values()];
  if (!aproximado) articulos.sort((x, y) => x.nombre.localeCompare(y.nombre, 'es', { sensitivity: 'base' }));
  else articulos.sort((x, y) => ids.indexOf(x.id) - ids.indexOf(y.id));
  return { articulos, aproximado };
}

async function listarTodo() {
  const r = await query(`
    SELECT c.id, c.cantidad, c.estado, s.id AS sitio_id, s.codigo, s.nombre AS sitio_nombre, s.letra,
           a.id AS articulo_id, a.nombre
    FROM contenido c
    JOIN sitios s ON s.id = c.sitio_id
    JOIN articulos a ON a.id = c.articulo_id
    ORDER BY array_position(ARRAY['P','C','O','M','L','D','A','U','R'], s.letra) NULLS LAST, s.numero, lower(s.nombre), lower(a.nombre), c.id
  `);
  const etiquetas = await etiquetasDe([...new Set(r.rows.map(f => f.articulo_id))]);
  return r.rows.map(f => ({ ...f, etiquetas: etiquetas.get(f.articulo_id) || [] }));
}

async function obtenerArticulo(id) {
  const { articulos } = await agrupar([id], false);
  return articulos[0] || null;
}

module.exports = { obtenerSitio, sitioPorCodigo, buscar, listarTodo, obtenerArticulo };
