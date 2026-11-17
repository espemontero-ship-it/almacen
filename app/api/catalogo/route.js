const { listarCatalogo } = require('../../../lib/datos.cjs');
const { obtenerSesion } = require('../../../lib/auth.cjs');

export const dynamic = 'force-dynamic';

// Catálogo para "Añadir artículo" (solo quien edita).
export async function GET(request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || !['admin', 'editor'].includes(sesion.rol)) return Response.json({ error: 'No autorizado' }, { status: 403 });
  const idioma = request.cookies.get('idioma')?.value === 'en' ? 'en' : 'es';
  return Response.json({ articulos: await listarCatalogo(idioma) });
}
