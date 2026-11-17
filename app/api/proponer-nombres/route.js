const { proponerNombres } = require('../../../lib/proponerNombres.cjs');
const { obtenerSesion } = require('../../../lib/auth.cjs');

export const dynamic = 'force-dynamic';

// "Proponer con IA" en Crear artículo nuevo (solo quien edita): nombre en inglés y sinónimos propuestos.
export async function POST(request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || !['admin', 'editor'].includes(sesion.rol)) return Response.json({ error: 'No autorizado' }, { status: 403 });
  const { es } = await request.json().catch(() => ({}));
  try {
    return Response.json(await proponerNombres(es));
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
