const { obtenerSesion } = require('../../../lib/auth.cjs');
const { subirFoto, urlFoto } = require('../../../lib/fotos.cjs');
const { query } = require('../../../lib/db.cjs');
const { apuntar } = require('../../../lib/edicion.cjs');

export const dynamic = 'force-dynamic';

const MAXIMO = 3 * 1024 * 1024;

export async function POST(request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || !['admin', 'editor'].includes(sesion.rol)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 });
  }
  const datos = await request.formData();
  const articuloId = Number(datos.get('articuloId'));
  const archivo = datos.get('foto');
  if (!articuloId || !archivo || typeof archivo === 'string') {
    return Response.json({ error: 'Falta la foto.' }, { status: 400 });
  }
  if (archivo.size > MAXIMO) {
    return Response.json({ error: 'La foto es demasiado grande.' }, { status: 400 });
  }
  const existe = await query('SELECT id FROM articulos WHERE id = $1', [articuloId]);
  if (!existe.rows.length) return Response.json({ error: 'No existe el artículo.' }, { status: 404 });

  const clave = `articulos/${articuloId}-${Date.now()}.jpg`;
  try {
    await subirFoto(clave, Buffer.from(await archivo.arrayBuffer()), 'image/jpeg');
  } catch (error) {
    return Response.json({ error: error.message || 'No se ha podido subir la foto.' }, { status: 500 });
  }
  await query('UPDATE articulos SET foto_clave = $2 WHERE id = $1', [articuloId, clave]);
  await apuntar({ id: sesion.id, nombre: sesion.nombre }, { articuloId, accion: 'foto' });
  return Response.json({ ok: true, url: await urlFoto(clave) });
}
