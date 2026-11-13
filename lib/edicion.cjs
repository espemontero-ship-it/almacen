const { query, getPool } = require('./db.cjs');
const { normalizar, leerContenedor } = require('./normalizar.cjs');
const { textoBuscable } = require('./nombresIA.cjs');
const { tallasPosibles } = require('./tallas.cjs');

const entero = (v, min = 0) => Math.max(min, Math.floor(Number(v) || 0));
const texto = v => String(v ?? '').replace(/\s+/g, ' ').trim();

async function cambiarCantidad(id, cantidad) {
  const n = entero(cantidad);
  const r = await query(
    'UPDATE contenido SET cantidad = $2, rotos = LEAST(rotos, $2) WHERE id = $1 AND borrado IS NULL RETURNING id, cantidad, rotos',
    [id, n]
  );
  return r.rows[0] || null;
}

async function cambiarRotos(id, rotos) {
  const r = await query(
    'UPDATE contenido SET rotos = LEAST($2, cantidad) WHERE id = $1 AND borrado IS NULL RETURNING id, cantidad, rotos',
    [id, entero(rotos)]
  );
  return r.rows[0] || null;
}

async function cambiarComentarios(id, comentarios) {
  const r = await query(
    'UPDATE contenido SET comentarios = $2 WHERE id = $1 AND borrado IS NULL RETURNING id, comentarios',
    [id, texto(comentarios) || null]
  );
  return r.rows[0] || null;
}

async function quitar(id) {
  const r = await query('UPDATE contenido SET borrado = now() WHERE id = $1 AND borrado IS NULL RETURNING id', [id]);
  return r.rows[0] || null;
}

async function anadir({ sitioId, articuloId, cantidad, talla }) {
  const t = texto(talla) || null;
  const existente = await query(
    `SELECT id FROM contenido
     WHERE sitio_id = $1 AND articulo_id = $2 AND borrado IS NULL AND talla IS NOT DISTINCT FROM $3
     ORDER BY id LIMIT 1`,
    [sitioId, articuloId, t]
  );
  if (existente.rows.length) {
    const r = await query(
      'UPDATE contenido SET cantidad = cantidad + $2 WHERE id = $1 RETURNING id',
      [existente.rows[0].id, entero(cantidad, 1)]
    );
    return r.rows[0];
  }
  const r = await query(
    `INSERT INTO contenido (sitio_id, articulo_id, cantidad, rotos, talla, estado)
     VALUES ($1, $2, $3, 0, $4, 'bueno') RETURNING id`,
    [sitioId, articuloId, entero(cantidad, 1), t]
  );
  if (t) {
    await query(
      `UPDATE articulos SET tallas = (SELECT ARRAY(SELECT DISTINCT unnest(tallas || ARRAY[$2::text])))
       WHERE id = $1 AND NOT ($2 = ANY(tallas))`,
      [articuloId, t]
    );
  }
  return r.rows[0];
}

async function crearArticulo({ es, en, etiquetas, ropa, sitioId, cantidad, talla }) {
  const nombreEs = texto(es);
  const nombreEn = texto(en) || nombreEs;
  if (!nombreEs) throw new Error('Falta el nombre.');
  const cliente = await getPool().connect();
  try {
    await cliente.query('BEGIN');
    const original = nombreEs;
    const existe = await cliente.query('SELECT id FROM articulos WHERE lower(nombre) = lower($1)', [original]);
    if (existe.rows.length) throw new Error('Ya existe un artículo con ese nombre.');
    const tallas = ropa ? tallasPosibles(texto(talla) ? [texto(talla)] : []) : [];
    const a = await cliente.query(
      `INSERT INTO articulos (nombre, nombre_norm, nombre_es, nombre_en, buscable, tallas)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [original, normalizar(original), nombreEs, nombreEn, textoBuscable([original, nombreEs, nombreEn]), tallas]
    );
    const articuloId = a.rows[0].id;
    await cliente.query(
      `INSERT INTO nombres_ia (tipo, original, es, en, otros, corregido, revisado)
       VALUES ('articulo', $1, $2, $3, '{}', true, now())
       ON CONFLICT (tipo, original) DO UPDATE SET es = EXCLUDED.es, en = EXCLUDED.en`,
      [original, nombreEs, nombreEn]
    );
    for (const etiquetaId of (etiquetas || []).map(Number).filter(Boolean)) {
      await cliente.query(
        'INSERT INTO articulo_etiquetas (articulo_id, etiqueta_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [articuloId, etiquetaId]
      );
    }
    await cliente.query(
      `INSERT INTO contenido (sitio_id, articulo_id, cantidad, rotos, talla, estado)
       VALUES ($1, $2, $3, 0, $4, 'bueno')`,
      [sitioId, articuloId, entero(cantidad, 1), ropa ? texto(talla) || null : null]
    );
    await cliente.query('COMMIT');
    return { articuloId };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function siguienteNumero(letra) {
  const r = await query('SELECT COALESCE(MAX(numero), 0) + 1 AS n FROM sitios WHERE letra = $1', [letra]);
  return r.rows[0].n;
}

async function crearCaja({ letra, numero, nombre }) {
  const l = texto(letra).toUpperCase();
  if (!/^[A-Z]$/.test(l)) throw new Error('Letra no válida.');
  const n = entero(numero, 1);
  const codigo = `${l}${n}`;
  const existe = await query('SELECT id FROM sitios WHERE codigo = $1 OR clave = $1', [codigo]);
  if (existe.rows.length) throw new Error(`La caja ${codigo} ya existe.`);
  const r = await query(
    'INSERT INTO sitios (clave, codigo, letra, numero, nombre) VALUES ($1, $1, $2, $3, $4) RETURNING id',
    [codigo, l, n, texto(nombre) || null]
  );
  return r.rows[0];
}

async function listarEtiquetas(idioma) {
  const col = idioma === 'en' ? 'COALESCE(nombre_en, nombre)' : 'COALESCE(nombre_es, nombre)';
  const r = await query(`SELECT id, ${col} AS nombre FROM etiquetas ORDER BY lower(${col})`);
  return r.rows;
}

module.exports = {
  cambiarCantidad,
  cambiarRotos,
  cambiarComentarios,
  quitar,
  anadir,
  crearArticulo,
  siguienteNumero,
  crearCaja,
  listarEtiquetas,
  leerContenedor,
};
