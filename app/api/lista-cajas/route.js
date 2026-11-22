const { listarCajas } = require('../../../lib/edicion.cjs');
const { obtenerSesion } = require('../../../lib/auth.cjs');

export const dynamic = 'force-dynamic';

// Todas las cajas (código y nombre), para elegir la de destino al mover (solo quien edita).
export async function GET(request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || !['admin', 'editor'].includes(sesion.rol)) return Response.json({ error: 'No autorizado' }, { status: 403 });
  const cajas = await listarCajas();
  return Response.json({ cajas: cajas.map(c => ({ id: c.id, codigo: c.codigo, nombre: c.nombre })) });
}
