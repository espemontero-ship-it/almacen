const { query, getPool } = require('./db.cjs');
const { normalizar } = require('./normalizar.cjs');
const { textoBuscable } = require('./nombresIA.cjs');
const { tallasPosibles } = require('./tallas.cjs');

const entero = (v, min = 0) => Math.max(min, Math.floor(Number(v) || 0));
const texto = v => String(v ?? '').replace(/\s+/g, ' ').trim();

async function apuntar(quien, { sitioId = null, articuloId = null, contenidoId = null, accion, detalle = {} }, db = { query }) {
  await db.query(
    `INSERT INTO cambios (usuario_id, usuario_nombre, sitio_id, articulo_id, contenido_id, accion, detalle)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [quien?.id ?? null, quien?.nombre ?? null, sitioId, articuloId, contenidoId, accion, JSON.stringify(detalle)]
  );
}

async function linea(id) {
  const r = await query('SELECT id, sitio_id, articulo_id, cantidad, rotos, comentarios, talla, borrado FROM contenido WHERE id = $1', [id]);
  return r.rows[0] || null;
}

async function cambiarCantidad(id, cantidad, quien) {
  const antes = await linea(id);
  if (!antes || antes.borrado) return null;
  const n = entero(cantidad);
  const r = await query(
    'UPDATE contenido SET cantidad = $2, rotos = LEAST(rotos, $2) WHERE id = $1 RETURNING id, cantidad, rotos',
    [id, n]
  );
  if (antes.cantidad !== n) {
    await apuntar(quien, {
      sitioId: antes.sitio_id, articuloId: antes.articulo_id, contenidoId: id, accion: 'cantidad',
      detalle: { antes: antes.cantidad, despues: n, talla: antes.talla },
    });
  }
  return r.rows[0];
}

async function cambiarRotos(id, rotos, quien) {
  const antes = await linea(id);
  if (!antes || antes.borrado) return null;
  const r = await query('UPDATE contenido SET rotos = LEAST($2, cantidad) WHERE id = $1 RETURNING id, cantidad, rotos', [id, entero(rotos)]);
  if (antes.rotos !== r.rows[0].rotos) {
    await apuntar(quien, {
      sitioId: antes.sitio_id, articuloId: antes.articulo_id, contenidoId: id, accion: 'rotos',
      detalle: { antes: antes.rotos, despues: r.rows[0].rotos, talla: antes.talla },
    });
  }
  return r.rows[0];
}

async function cambiarComentarios(id, comentarios, quien) {
  const antes = await linea(id);
  if (!antes || antes.borrado) return null;
  const nuevo = texto(comentarios) || null;
  const r = await query('UPDATE contenido SET comentarios = $2 WHERE id = $1 RETURNING id, comentarios', [id, nuevo]);
  if ((antes.comentarios || null) !== nuevo) {
    await apuntar(quien, {
      sitioId: antes.sitio_id, articuloId: antes.articulo_id, contenidoId: id, accion: 'comentarios',
      detalle: { despues: nuevo, talla: antes.talla },
    });
  }
  return r.rows[0];
}

async function quitar(id, quien) {
  const antes = await linea(id);
  if (!antes || antes.borrado) return null;
  const r = await query('UPDATE contenido SET borrado = now() WHERE id = $1 RETURNING id', [id]);
  await apuntar(quien, {
    sitioId: antes.sitio_id, articuloId: antes.articulo_id, contenidoId: id, accion: 'quitar',
    detalle: { cantidad: antes.cantidad, talla: antes.talla },
  });
  return r.rows[0];
}

async function recuperar(id, quien) {
  const antes = await linea(id);
  if (!antes || !antes.borrado) return null;
  const r = await query('UPDATE contenido SET borrado = NULL WHERE id = $1 RETURNING id', [id]);
  await apuntar(quien, {
    sitioId: antes.sitio_id, articuloId: antes.articulo_id, contenidoId: id, accion: 'recuperar',
    detalle: { cantidad: antes.cantidad, talla: antes.talla },
  });
  return r.rows[0];
}

async function quitados(sitioId) {
  const r = await query(
    `SELECT c.id, c.cantidad, c.talla, c.borrado, c.articulo_id, a.nombre, a.nombre_es, a.nombre_en
     FROM contenido c JOIN articulos a ON a.id = c.articulo_id
     WHERE c.sitio_id = $1 AND c.borrado IS NOT NULL AND c.borrado > now() - interval '30 days'
     ORDER BY c.borrado DESC`,
    [sitioId]
  );
  return r.rows;
}

async function anadir({ sitioId, articuloId, cantidad, talla }, quien) {
  const t = texto(talla) || null;
  const n = entero(cantidad, 1);
  const existente = await query(
    `SELECT id FROM contenido
     WHERE sitio_id = $1 AND articulo_id = $2 AND borrado IS NULL AND talla IS NOT DISTINCT FROM $3
     ORDER BY id LIMIT 1`,
    [sitioId, articuloId, t]
  );
  let fila;
  if (existente.rows.length) {
    fila = (await query('UPDATE contenido SET cantidad = cantidad + $2 WHERE id = $1 RETURNING id', [existente.rows[0].id, n])).rows[0];
  } else {
    fila = (
      await query(
        `INSERT INTO contenido (sitio_id, articulo_id, cantidad, rotos, talla, estado)
         VALUES ($1, $2, $3, 0, $4, 'bueno') RETURNING id`,
        [sitioId, articuloId, n, t]
      )
    ).rows[0];
    if (t) {
      await query(
        `UPDATE articulos SET tallas = (SELECT ARRAY(SELECT DISTINCT unnest(tallas || ARRAY[$2::text])))
         WHERE id = $1 AND NOT ($2 = ANY(tallas))`,
        [articuloId, t]
      );
    }
  }
  await apuntar(quien, { sitioId, articuloId, contenidoId: fila.id, accion: 'anadir', detalle: { cantidad: n, talla: t } });
  return fila;
}

async function crearArticulo({ es, en, etiquetas, ropa, sitioId, cantidad, talla }, quien) {
  const nombreEs = texto(es);
  const nombreEn = texto(en) || nombreEs;
  if (!nombreEs) throw new Error('Falta el nombre.');
  const cliente = await getPool().connect();
  try {
    await cliente.query('BEGIN');
    const original = nombreEs;
    const existe = await cliente.query('SELECT id FROM articulos WHERE lower(nombre) = lower($1)', [original]);
    if (existe.rows.length) throw new Error('Ya existe un artículo con ese nombre.');
    const t = ropa ? texto(talla) || null : null;
    const tallas = ropa ? tallasPosibles(t ? [t] : []) : [];
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
      await cliente.query('INSERT INTO articulo_etiquetas (articulo_id, etiqueta_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [articuloId, etiquetaId]);
    }
    const n = entero(cantidad, 1);
    const c = await cliente.query(
      `INSERT INTO contenido (sitio_id, articulo_id, cantidad, rotos, talla, estado)
       VALUES ($1, $2, $3, 0, $4, 'bueno') RETURNING id`,
      [sitioId, articuloId, n, t]
    );
    await apuntar(quien, { sitioId, articuloId, contenidoId: c.rows[0].id, accion: 'crearArticulo', detalle: { cantidad: n, talla: t } }, cliente);
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

async function crearCaja({ letra, numero, nombre }, quien) {
  const l = texto(letra).toUpperCase();
  if (!/^[A-Z]$/.test(l)) throw new Error('Letra no válida.');
  const n = entero(numero, 1);
  const codigo = `${l}${n}`;
  const existe = await query('SELECT id, borrado FROM sitios WHERE codigo = $1 OR clave = $1', [codigo]);
  if (existe.rows.length) throw new Error(existe.rows[0].borrado ? `La caja ${codigo} está borrada; se puede recuperar desde el Historial.` : `La caja ${codigo} ya existe.`);
  const r = await query(
    'INSERT INTO sitios (clave, codigo, letra, numero, nombre) VALUES ($1, $1, $2, $3, $4) RETURNING id',
    [codigo, l, n, texto(nombre) || null]
  );
  await apuntar(quien, { sitioId: r.rows[0].id, accion: 'crearCaja', detalle: { codigo, nombre: texto(nombre) || null } });
  return r.rows[0];
}

async function cambiarLlenado(sitioId, llenado, quien) {
  const nuevo = ['vacia', 'medias', 'llena'].includes(llenado) ? llenado : null;
  if (!nuevo) throw new Error('Valor no válido.');
  const antes = await query('SELECT llenado FROM sitios WHERE id = $1', [sitioId]);
  if (!antes.rows.length) throw new Error('Esa caja no existe.');
  await query('UPDATE sitios SET llenado = $2 WHERE id = $1', [sitioId, nuevo]);
  if (antes.rows[0].llenado !== nuevo) {
    await apuntar(quien, { sitioId, accion: 'llenado', detalle: { antes: antes.rows[0].llenado, despues: nuevo } });
  }
  return { llenado: nuevo };
}

// Borrar una caja entera (con lo que tiene). Queda 30 días: se recupera desde el Historial.
async function borrarCaja(sitioId, quien) {
  const r = await query('UPDATE sitios SET borrado = now() WHERE id = $1 AND borrado IS NULL RETURNING id, codigo, nombre', [sitioId]);
  if (!r.rows.length) throw new Error('Esa caja no existe o ya está borrada.');
  const s = r.rows[0];
  await apuntar(quien, { sitioId, accion: 'borrarCaja', detalle: { codigo: s.codigo, nombre: s.nombre } });
  return { id: s.id };
}

async function recuperarCaja(sitioId, quien) {
  const r = await query(
    "UPDATE sitios SET borrado = NULL WHERE id = $1 AND borrado IS NOT NULL AND borrado > now() - interval '30 days' RETURNING id, codigo, nombre",
    [sitioId]
  );
  if (!r.rows.length) throw new Error('Esa caja ya no se puede recuperar.');
  const s = r.rows[0];
  await apuntar(quien, { sitioId, accion: 'recuperarCaja', detalle: { codigo: s.codigo, nombre: s.nombre } });
  return { id: s.id };
}

// Pasados 30 días, la caja borrada y lo que tenía se borran del todo (el Historial conserva el texto).
async function purgarCajas() {
  await query("DELETE FROM sitios WHERE borrado IS NOT NULL AND borrado <= now() - interval '30 days'");
}

async function listarCajas() {
  const r = await query(`SELECT s.id, s.codigo, s.nombre, s.llenado FROM sitios s WHERE s.borrado IS NULL ORDER BY ${"array_position(ARRAY['P','C','O','M','L','D','A','U','R'], s.letra) NULLS LAST, s.numero, lower(s.nombre)"}`);
  return r.rows;
}

// Inventario: quién revisó la caja por última vez y cuándo.
async function ultimaRevision(sitioId) {
  const r = await query('SELECT cuando, usuario_nombre FROM revisiones WHERE sitio_id = $1 ORDER BY cuando DESC, id DESC LIMIT 1', [sitioId]);
  return r.rows[0] || null;
}

// Inventario abierto (solo puede haber uno) que incluye esta caja, si lo hay.
async function inventarioAbiertoDe(sitioId) {
  const r = await query(
    `SELECT i.id FROM inventarios i JOIN inventario_cajas ic ON ic.inventario_id = i.id
     WHERE i.cerrado IS NULL AND ic.sitio_id = $1 ORDER BY i.id DESC LIMIT 1`,
    [sitioId]
  );
  return r.rows[0]?.id || null;
}

// Caja revisada: se apunta quién y cuándo (y para qué inventario, si hay uno abierto que la incluye).
// Devuelve la siguiente caja sin revisar de ese inventario, en el orden de la app.
async function revisarCaja(sitioId, quien) {
  const existe = await query('SELECT id FROM sitios WHERE id = $1', [sitioId]);
  if (!existe.rows.length) throw new Error('Esa caja no existe.');
  const inventarioId = await inventarioAbiertoDe(sitioId);
  const r = await query(
    'INSERT INTO revisiones (sitio_id, inventario_id, usuario_id, usuario_nombre) VALUES ($1, $2, $3, $4) RETURNING cuando, usuario_nombre',
    [sitioId, inventarioId, quien?.id ?? null, quien?.nombre ?? null]
  );
  await apuntar(quien, { sitioId, accion: 'revisada', detalle: { inventario: inventarioId } });
  let siguiente = null;
  if (inventarioId) {
    const s = await query(
      `SELECT s.id FROM inventario_cajas ic JOIN sitios s ON s.id = ic.sitio_id AND s.borrado IS NULL
       WHERE ic.inventario_id = $1
         AND NOT EXISTS (SELECT 1 FROM revisiones v WHERE v.sitio_id = s.id AND v.inventario_id = $1)
       ORDER BY array_position(ARRAY['P','C','O','M','L','D','A','U','R'], s.letra) NULLS LAST, s.numero, lower(s.nombre)
       LIMIT 1`,
      [inventarioId]
    );
    siguiente = s.rows[0]?.id || null;
  }
  return { ...r.rows[0], siguiente };
}

async function listarEtiquetas(idioma) {
  const col = idioma === 'en' ? 'COALESCE(nombre_en, nombre)' : 'COALESCE(nombre_es, nombre)';
  const r = await query(`SELECT id, ${col} AS nombre FROM etiquetas ORDER BY lower(${col})`);
  return r.rows;
}

async function historial({ sitioId, articuloId, idioma, limite = 300 }) {
  const col = idioma === 'en' ? 'COALESCE(a.nombre_en, a.nombre)' : 'COALESCE(a.nombre_es, a.nombre)';
  const filtros = [];
  const valores = [];
  if (sitioId) {
    valores.push(sitioId);
    filtros.push(`h.sitio_id = $${valores.length}`);
  }
  if (articuloId) {
    valores.push(articuloId);
    filtros.push(`h.articulo_id = $${valores.length}`);
  }
  valores.push(limite);
  const r = await query(
    `SELECT h.id, h.cuando, h.usuario_nombre, h.accion, h.detalle, h.sitio_id, h.articulo_id,
            s.codigo, s.nombre AS sitio_nombre, ${col} AS articulo,
            (s.borrado IS NOT NULL AND s.borrado > now() - interval '30 days') AS caja_recuperable,
            (h.sitio_id IS NOT NULL AND (s.id IS NULL OR s.borrado IS NOT NULL)) AS caja_borrada
     FROM cambios h
     LEFT JOIN sitios s ON s.id = h.sitio_id
     LEFT JOIN articulos a ON a.id = h.articulo_id
     ${filtros.length ? 'WHERE ' + filtros.join(' AND ') : ''}
     ORDER BY h.cuando DESC, h.id DESC
     LIMIT $${valores.length}`,
    valores
  );
  return r.rows;
}

async function cambiarNombres(articuloId, { idioma, nombre, sinonimos }, quien) {
  const r = await query(
    `SELECT a.nombre, COALESCE(n.es, a.nombre_es, a.nombre) AS es, COALESCE(n.en, a.nombre_en, a.nombre) AS en,
            COALESCE(n.otros, '{}') AS otros
     FROM articulos a LEFT JOIN nombres_ia n ON n.tipo = 'articulo' AND n.original = a.nombre
     WHERE a.id = $1`,
    [articuloId]
  );
  const a = r.rows[0];
  if (!a) throw new Error('No existe ese artículo.');
  let { es, en, otros } = a;
  let cambio = null;
  if (nombre !== undefined) {
    const nuevo = texto(nombre);
    if (!nuevo) throw new Error('El nombre no puede quedar vacío.');
    const campo = idioma === 'en' ? 'en' : 'es';
    const antes = campo === 'en' ? en : es;
    if (nuevo === antes) return { es, en, otros };
    if (campo === 'en') en = nuevo;
    else es = nuevo;
    cambio = { accion: 'nombre', detalle: { idioma: campo, antes, despues: nuevo } };
  } else if (sinonimos !== undefined) {
    const lista = [...new Set((Array.isArray(sinonimos) ? sinonimos : String(sinonimos).split(',')).map(texto).filter(Boolean))];
    if (lista.join('|') === (otros || []).join('|')) return { es, en, otros };
    cambio = { accion: 'sinonimos', detalle: { antes: otros, despues: lista } };
    otros = lista;
  } else {
    return { es, en, otros };
  }
  await query(
    `INSERT INTO nombres_ia (tipo, original, es, en, otros, corregido, revisado)
     VALUES ('articulo', $1, $2, $3, $4, true, now())
     ON CONFLICT (tipo, original) DO UPDATE SET es = EXCLUDED.es, en = EXCLUDED.en, otros = EXCLUDED.otros, corregido = true, revisado = now()`,
    [a.nombre, es, en, otros]
  );
  await query('UPDATE articulos SET nombre_es = $2, nombre_en = $3, buscable = $4 WHERE id = $1', [
    articuloId, es, en, textoBuscable([a.nombre, es, en, ...otros]),
  ]);
  await apuntar(quien, { articuloId, ...cambio });
  return { es, en, otros };
}

module.exports = {
  borrarCaja,
  recuperarCaja,
  purgarCajas,
  apuntar,
  cambiarNombres,
  cambiarCantidad,
  cambiarRotos,
  cambiarComentarios,
  quitar,
  recuperar,
  quitados,
  anadir,
  crearArticulo,
  siguienteNumero,
  crearCaja,
  cambiarLlenado,
  listarCajas,
  ultimaRevision,
  inventarioAbiertoDe,
  revisarCaja,
  listarEtiquetas,
  historial,
};
