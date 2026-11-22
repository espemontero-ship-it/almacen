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
  // Bajar a 0 saca el artículo de la caja: va a la papelera (30 días) y, si se recupera, vuelve con 1 unidad.
  if (n <= 0 && antes.cantidad > 0) {
    await query('UPDATE contenido SET cantidad = 1, rotos = LEAST(rotos, 1), borrado = now() WHERE id = $1', [id]);
    await apuntar(quien, {
      sitioId: antes.sitio_id, articuloId: antes.articulo_id, contenidoId: id, accion: 'quitar',
      detalle: { cantidad: antes.cantidad, talla: antes.talla },
    });
    return { id, quitada: true };
  }
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

// Mover artículos de una caja a otra (pedido por ella). lineas: [{ contenidoId, cantidad, rotos }]. Se mueve lo
// indicado (como mucho lo que hay; las rotas, como mucho las que hay y lo que se mueve). Entero: la línea cambia de
// caja con su talla y comentario (si en la otra ya está el mismo artículo con la misma talla, se suma allí). Una
// parte: se resta aquí y se suma allí (el comentario se queda). No pasa por la papelera. Queda en el historial de
// las dos cajas.
async function moverArticulos({ desdeSitioId, haciaSitioId, lineas }, quien) {
  const desde = Number(desdeSitioId);
  const hacia = Number(haciaSitioId);
  if (!hacia) throw new Error('Elige la caja.');
  if (desde === hacia) throw new Error('Elige otra caja.');
  const cliente = await getPool().connect();
  try {
    await cliente.query('BEGIN');
    const cajas = await cliente.query('SELECT id, codigo FROM sitios WHERE id = ANY($1) AND borrado IS NULL', [[desde, hacia]]);
    const codigo = id => cajas.rows.find(c => c.id === id)?.codigo;
    if (!codigo(desde) || !codigo(hacia)) throw new Error('Esa caja no existe.');
    let movidos = 0;
    for (const l of lineas || []) {
      const r = await cliente.query('SELECT * FROM contenido WHERE id = $1 AND sitio_id = $2 AND borrado IS NULL', [Number(l.contenidoId), desde]);
      const c = r.rows[0];
      if (!c) continue;
      const n = Math.min(c.cantidad, Math.max(0, Math.floor(Number(l.cantidad) || 0)));
      if (!n) continue;
      const rotas = Math.min(c.rotos, n, Math.max(0, Math.floor(Number(l.rotos) || 0)));
      const otra = await cliente.query(
        'SELECT id FROM contenido WHERE sitio_id = $1 AND articulo_id = $2 AND borrado IS NULL AND talla IS NOT DISTINCT FROM $3 ORDER BY id LIMIT 1',
        [hacia, c.articulo_id, c.talla]
      );
      const entero = n === c.cantidad;
      let destinoId;
      if (otra.rows.length) {
        destinoId = otra.rows[0].id;
        await cliente.query('UPDATE contenido SET cantidad = cantidad + $2, rotos = rotos + $3 WHERE id = $1', [destinoId, n, rotas]);
        if (entero) await cliente.query('DELETE FROM contenido WHERE id = $1', [c.id]);
      } else if (entero) {
        destinoId = c.id;
        await cliente.query('UPDATE contenido SET sitio_id = $2, rotos = $3 WHERE id = $1', [c.id, hacia, rotas]);
        await cliente.query('DELETE FROM revision_marcas WHERE contenido_id = $1', [c.id]);
        await cliente.query('DELETE FROM revision_saltadas WHERE contenido_id = $1', [c.id]);
      } else {
        destinoId = (await cliente.query(
          "INSERT INTO contenido (sitio_id, articulo_id, cantidad, rotos, talla, estado) VALUES ($1, $2, $3, $4, $5, 'bueno') RETURNING id",
          [hacia, c.articulo_id, n, rotas, c.talla]
        )).rows[0].id;
      }
      if (!entero) await cliente.query('UPDATE contenido SET cantidad = cantidad - $2, rotos = LEAST(rotos - $3, cantidad - $2) WHERE id = $1', [c.id, n, rotas]);
      const detalle = { desde: codigo(desde), hacia: codigo(hacia), cantidad: n, rotas, talla: c.talla };
      await apuntar(quien, { sitioId: desde, articuloId: c.articulo_id, contenidoId: c.id, accion: 'mover', detalle }, cliente);
      await apuntar(quien, { sitioId: hacia, articuloId: c.articulo_id, contenidoId: destinoId, accion: 'mover', detalle }, cliente);
      movidos++;
    }
    if (!movidos) throw new Error('Elige qué mover.');
    await cliente.query('COMMIT');
    return { movidos, hacia: { id: hacia, codigo: codigo(hacia) } };
  } catch (err) {
    await cliente.query('ROLLBACK');
    throw err;
  } finally {
    cliente.release();
  }
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

// soloCatalogo: se guarda el artículo (nombres, etiquetas, si es ropa) sin meterlo en ninguna caja ni darle unidades.
async function crearArticulo({ es, en, etiquetas, ropa, sitioId, cantidad, talla, sinonimos, soloCatalogo = false }, quien) {
  const nombreEs = texto(es);
  const nombreEn = texto(en) || nombreEs;
  const otros = [...new Set((Array.isArray(sinonimos) ? sinonimos : []).map(texto).filter(Boolean))];
  if (!nombreEs) throw new Error('Falta el nombre.');
  const cliente = await getPool().connect();
  try {
    await cliente.query('BEGIN');
    const original = nombreEs;
    const existe = await cliente.query('SELECT id FROM articulos WHERE lower(nombre) = lower($1)', [original]);
    if (existe.rows.length) throw new Error('Ya existe un artículo con ese nombre.');
    if (!soloCatalogo && !sitioId) throw new Error('Elige la caja.');
    const t = ropa && !soloCatalogo ? texto(talla) || null : null;
    const tallas = ropa ? tallasPosibles(t ? [t] : []) : [];
    const a = await cliente.query(
      `INSERT INTO articulos (nombre, nombre_norm, nombre_es, nombre_en, buscable, tallas)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [original, normalizar(original), nombreEs, nombreEn, textoBuscable([original, nombreEs, nombreEn, ...otros]), tallas]
    );
    const articuloId = a.rows[0].id;
    await cliente.query(
      `INSERT INTO nombres_ia (tipo, original, es, en, otros, corregido, revisado)
       VALUES ('articulo', $1, $2, $3, $4, true, now())
       ON CONFLICT (tipo, original) DO UPDATE SET es = EXCLUDED.es, en = EXCLUDED.en, otros = EXCLUDED.otros`,
      [original, nombreEs, nombreEn, otros]
    );
    for (const etiquetaId of (etiquetas || []).map(Number).filter(Boolean)) {
      await cliente.query('INSERT INTO articulo_etiquetas (articulo_id, etiqueta_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [articuloId, etiquetaId]);
    }
    if (soloCatalogo) {
      await apuntar(quien, { articuloId, accion: 'crearArticulo', detalle: { soloCatalogo: true } }, cliente);
      await cliente.query('COMMIT');
      return { articuloId };
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

// Números libres de un tipo de caja: los que faltan entre el 1 y el más alto (para rellenar huecos al crear una caja).
async function numerosLibres(letra) {
  const r = await query('SELECT numero FROM sitios WHERE letra = $1 AND numero IS NOT NULL', [letra]);
  const usados = new Set(r.rows.map(x => x.numero));
  const max = Math.max(0, ...usados);
  const libres = [];
  for (let n = 1; n < max; n++) if (!usados.has(n)) libres.push(n);
  return libres;
}

async function siguienteNumero(letra) {
  const r = await query('SELECT COALESCE(MAX(numero), 0) + 1 AS n FROM sitios WHERE letra = $1', [letra]);
  return r.rows[0].n;
}

// alInventario: creada desde la pantalla Inventario, entra en el inventario abierto como pendiente.
async function crearCaja({ letra, numero, nombre, alInventario = false }, quien) {
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
  if (alInventario) {
    const inv = await query('SELECT id FROM inventarios WHERE cerrado IS NULL ORDER BY id DESC LIMIT 1');
    if (inv.rows.length) await query('INSERT INTO inventario_cajas (inventario_id, sitio_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [inv.rows[0].id, r.rows[0].id]);
  }
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
  // Cada caja con su tipo (letra), cuántos artículos y unidades tiene y cuándo se revisó por última vez.
  const r = await query(`SELECT s.id, s.codigo, s.nombre, s.llenado, s.letra,
    (SELECT max(v.cuando) FROM revisiones v WHERE v.sitio_id = s.id) AS revisada,
    (SELECT count(*)::int FROM contenido c WHERE c.sitio_id = s.id AND c.borrado IS NULL) AS articulos,
    (SELECT COALESCE(sum(c.cantidad), 0)::int FROM contenido c WHERE c.sitio_id = s.id AND c.borrado IS NULL) AS unidades
    FROM sitios s WHERE s.borrado IS NULL ORDER BY ${"array_position(ARRAY['P','C','O','M','L','D','A','U','R'], s.letra) NULLS LAST, s.numero, lower(s.nombre)"}`);
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

// Inventarios (administración). Solo uno abierto a la vez. forma: 'general' (todas las cajas), 'tipos' (letras;
// 'otros' son los sitios sin letra) o 'cajas' (ids elegidos uno a uno).
async function tiposDeCaja() {
  const r = await query(
    "SELECT COALESCE(letra, 'otros') AS letra, count(*)::int AS cajas FROM sitios WHERE borrado IS NULL GROUP BY 1 ORDER BY array_position(ARRAY['P','C','O','M','L','D','A','U','R','otros'], COALESCE(letra, 'otros')) NULLS LAST, 1"
  );
  return r.rows;
}

async function abrirInventario({ forma, letras = [], cajas = [] }, quien) {
  const abierto = await query('SELECT id FROM inventarios WHERE cerrado IS NULL LIMIT 1');
  if (abierto.rows.length) throw new Error('Ya hay un inventario abierto.');
  let ids;
  if (forma === 'general') {
    ids = (await query('SELECT id FROM sitios WHERE borrado IS NULL')).rows.map(x => x.id);
  } else if (forma === 'tipos') {
    const l = [...new Set(letras.map(String))];
    const r = await query(
      "SELECT id FROM sitios WHERE borrado IS NULL AND (letra = ANY($1) OR ($2 AND letra IS NULL))",
      [l.filter(x => x !== 'otros'), l.includes('otros')]
    );
    ids = r.rows.map(x => x.id);
  } else if (forma === 'cajas') {
    const r = await query('SELECT id FROM sitios WHERE borrado IS NULL AND id = ANY($1)', [cajas.map(Number).filter(Number.isInteger)]);
    ids = r.rows.map(x => x.id);
  } else {
    throw new Error('Elige cómo es el inventario.');
  }
  if (!ids.length) throw new Error('Elige al menos una caja.');
  const detalle = forma === 'tipos' ? { forma, letras: [...new Set(letras.map(String))] } : { forma };
  const inv = await query(
    "INSERT INTO inventarios (tipo, abierto_por, detalle) VALUES ($1, $2, $3) RETURNING id",
    [forma === 'general' ? 'general' : 'parcial', quien?.nombre ?? null, JSON.stringify(detalle)]
  );
  const id = inv.rows[0].id;
  await query('INSERT INTO inventario_cajas (inventario_id, sitio_id) SELECT $1, unnest($2::int[])', [id, ids]);
  return { id, cajas: ids.length };
}

// Cajas de un inventario con su revisión para él (la última, si se revisó más de una vez).
async function cajasDeInventario(inventarioId) {
  const r = await query(
    `SELECT s.id, s.codigo, s.nombre, v.usuario_nombre, v.cuando,
            u.usuario_nombre AS ultima_por, u.cuando AS ultima_cuando,
            EXISTS (SELECT 1 FROM revision_curso rc WHERE rc.sitio_id = s.id) AS en_curso
     FROM inventario_cajas ic JOIN sitios s ON s.id = ic.sitio_id AND s.borrado IS NULL
     LEFT JOIN LATERAL (
       SELECT usuario_nombre, cuando FROM revisiones WHERE sitio_id = s.id AND inventario_id = $1 ORDER BY cuando DESC, id DESC LIMIT 1
     ) v ON true
     LEFT JOIN LATERAL (
       SELECT usuario_nombre, cuando FROM revisiones WHERE sitio_id = s.id ORDER BY cuando DESC, id DESC LIMIT 1
     ) u ON true
     WHERE ic.inventario_id = $1
     ORDER BY array_position(ARRAY['P','C','O','M','L','D','A','U','R'], s.letra) NULLS LAST, s.numero, lower(s.nombre)`,
    [inventarioId]
  );
  return r.rows;
}

async function datosInventario(fila) {
  const cajas = await cajasDeInventario(fila.id);
  const revisadas = cajas.filter(x => x.cuando).sort((a, b) => new Date(b.cuando) - new Date(a.cuando));
  return {
    id: fila.id, tipo: fila.tipo, detalle: fila.detalle || {}, abierto: fila.abierto, cerrado: fila.cerrado, abierto_por: fila.abierto_por,
    total: cajas.length, revisadas, sinRevisar: cajas.filter(x => !x.cuando),
  };
}

async function inventarioActual() {
  const r = await query('SELECT * FROM inventarios WHERE cerrado IS NULL ORDER BY id DESC LIMIT 1');
  return r.rows[0] ? datosInventario(r.rows[0]) : null;
}

async function inventarioPorId(id) {
  const r = await query('SELECT * FROM inventarios WHERE id = $1', [id]);
  return r.rows[0] ? datosInventario(r.rows[0]) : null;
}

async function inventariosAnteriores() {
  const r = await query(
    `SELECT i.id, i.tipo, i.detalle, i.abierto, i.cerrado, i.abierto_por,
            (SELECT count(*)::int FROM inventario_cajas ic WHERE ic.inventario_id = i.id) AS total,
            (SELECT count(DISTINCT v.sitio_id)::int FROM revisiones v WHERE v.inventario_id = i.id) AS revisadas
     FROM inventarios i WHERE i.cerrado IS NOT NULL ORDER BY i.cerrado DESC`
  );
  return r.rows;
}

// Cerrar: las cajas que entraron solas en modo inventario y no se terminaron dejan de estar en revisión.
async function cerrarInventario(id) {
  const r = await query('UPDATE inventarios SET cerrado = now() WHERE id = $1 AND cerrado IS NULL RETURNING *', [id]);
  if (!r.rows.length) throw new Error('Ese inventario ya está cerrado.');
  const sueltas = await query(
    "SELECT rc.sitio_id FROM revision_curso rc JOIN inventario_cajas ic ON ic.sitio_id = rc.sitio_id AND ic.inventario_id = $1 WHERE rc.empezada_por = 'inventario'",
    [id]
  );
  for (const { sitio_id } of sueltas.rows) await terminarRevisionEnCurso(sitio_id);
  return datosInventario(r.rows[0]);
}

// Inventario compartido de una caja. La caja está en revisión si alguien pulsó "Hacer inventario" o si hay un
// inventario abierto que la incluye y aún no la tiene revisada (entonces entra sola).
async function revisionActiva(sitioId) {
  const curso = await query('SELECT 1 FROM revision_curso WHERE sitio_id = $1', [sitioId]);
  if (curso.rows.length) return true;
  const inventarioId = await inventarioAbiertoDe(sitioId);
  if (!inventarioId) return false;
  const hecha = await query('SELECT 1 FROM revisiones WHERE sitio_id = $1 AND inventario_id = $2 LIMIT 1', [sitioId, inventarioId]);
  if (hecha.rows.length) return false;
  await query("INSERT INTO revision_curso (sitio_id, empezada_por) VALUES ($1, 'inventario') ON CONFLICT DO NOTHING", [sitioId]);
  return true;
}

// Estado para la pantalla (se pide al abrir la caja y cada 5 segundos mientras está en revisión).
// Apunta que quien lo pide está dentro y devuelve a los demás que han avisado en los últimos 15 segundos.
async function estadoRevision(sitioId, quien) {
  const activa = await revisionActiva(sitioId);
  if (!activa) return { activa: false, marcas: [], saltadas: [], presentes: [] };
  if (quien?.id) {
    await query(
      `INSERT INTO revision_presentes (sitio_id, usuario_id, usuario_nombre, visto) VALUES ($1, $2, $3, now())
       ON CONFLICT (sitio_id, usuario_id) DO UPDATE SET visto = now(), usuario_nombre = EXCLUDED.usuario_nombre`,
      [sitioId, quien.id, quien.nombre ?? null]
    );
  }
  const marcas = await query('SELECT contenido_id, usuario_nombre FROM revision_marcas WHERE sitio_id = $1', [sitioId]);
  const saltadas = await query('SELECT contenido_id FROM revision_saltadas WHERE sitio_id = $1', [sitioId]);
  const presentes = await query(
    "SELECT usuario_nombre FROM revision_presentes WHERE sitio_id = $1 AND usuario_id <> $2 AND visto > now() - interval '15 seconds' ORDER BY usuario_nombre",
    [sitioId, quien?.id ?? -1]
  );
  return {
    activa: true,
    marcas: marcas.rows.map(m => ({ id: m.contenido_id, nombre: m.usuario_nombre })),
    saltadas: saltadas.rows.map(x => x.contenido_id),
    presentes: presentes.rows.map(p => p.usuario_nombre || '—'),
  };
}

async function empezarRevision(sitioId, quien) {
  const existe = await query('SELECT id FROM sitios WHERE id = $1 AND borrado IS NULL', [sitioId]);
  if (!existe.rows.length) throw new Error('Esa caja no existe.');
  await query('INSERT INTO revision_curso (sitio_id, empezada_por) VALUES ($1, $2) ON CONFLICT DO NOTHING', [sitioId, quien?.nombre ?? null]);
  return estadoRevision(sitioId, quien);
}

// Marcar o desmarcar un artículo; si dos personas lo tocan a la vez, vale el último toque.
async function marcarRevision(sitioId, contenidoId, marcado, quien) {
  const c = await query('SELECT id FROM contenido WHERE id = $1 AND sitio_id = $2 AND borrado IS NULL', [contenidoId, sitioId]);
  if (!c.rows.length) throw new Error('Ese artículo ya no está en esta caja.');
  await query('INSERT INTO revision_curso (sitio_id, empezada_por) VALUES ($1, $2) ON CONFLICT DO NOTHING', [sitioId, quien?.nombre ?? null]);
  if (marcado) {
    await query(
      `INSERT INTO revision_marcas (sitio_id, contenido_id, usuario_nombre) VALUES ($1, $2, $3)
       ON CONFLICT (sitio_id, contenido_id) DO UPDATE SET usuario_nombre = EXCLUDED.usuario_nombre, cuando = now()`,
      [sitioId, contenidoId, quien?.nombre ?? null]
    );
  } else {
    await query('DELETE FROM revision_marcas WHERE sitio_id = $1 AND contenido_id = $2', [sitioId, contenidoId]);
  }
  return { ok: true };
}

// "Están bien": marca lo que quede sin marcar.
async function marcarTodas(sitioId, quien) {
  await query(
    `INSERT INTO revision_marcas (sitio_id, contenido_id, usuario_nombre)
     SELECT $1, c.id, $2 FROM contenido c WHERE c.sitio_id = $1 AND c.borrado IS NULL
     ON CONFLICT (sitio_id, contenido_id) DO NOTHING`,
    [sitioId, quien?.nombre ?? null]
  );
  return { ok: true };
}

async function saltarFoto(sitioId, contenidoId) {
  await query('INSERT INTO revision_saltadas (sitio_id, contenido_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [sitioId, contenidoId]);
  return { ok: true };
}

async function terminarRevisionEnCurso(sitioId) {
  for (const t of ['revision_marcas', 'revision_saltadas', 'revision_presentes', 'revision_curso']) {
    await query(`DELETE FROM ${t} WHERE sitio_id = $1`, [sitioId]);
  }
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
  await terminarRevisionEnCurso(sitioId);
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
  tiposDeCaja,
  abrirInventario,
  cerrarInventario,
  inventarioActual,
  inventarioPorId,
  inventariosAnteriores,
  estadoRevision,
  empezarRevision,
  marcarRevision,
  marcarTodas,
  saltarFoto,
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
  moverArticulos,
  numerosLibres,
  crearCaja,
  cambiarLlenado,
  listarCajas,
  ultimaRevision,
  inventarioAbiertoDe,
  revisarCaja,
  listarEtiquetas,
  historial,
};
