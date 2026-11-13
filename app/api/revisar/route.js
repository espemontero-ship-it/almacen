const { guardarCorreccion, marcarRevisados } = require('../../../lib/revision.cjs');

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const cuerpo = await request.json();
  const clave = process.env.CLAVE_REVISION;
  if (!clave || cuerpo.clave !== clave) {
    return Response.json({ error: 'No autorizado' }, { status: 404 });
  }
  if (cuerpo.accion === 'guardar') {
    await guardarCorreccion(cuerpo.elemento);
    return Response.json({ ok: true });
  }
  if (cuerpo.accion === 'grupo') {
    await marcarRevisados(cuerpo.elementos || []);
    return Response.json({ ok: true });
  }
  return Response.json({ error: 'Acción no válida' }, { status: 400 });
}
