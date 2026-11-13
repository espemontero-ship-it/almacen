const { obtenerSesion } = require('../../../lib/auth.cjs');
const ed = require('../../../lib/edicion.cjs');

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || !['admin', 'editor'].includes(sesion.rol)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 });
  }
  const c = await request.json();
  try {
    switch (c.accion) {
      case 'cantidad':
        return Response.json({ ok: true, fila: await ed.cambiarCantidad(Number(c.id), c.cantidad) });
      case 'rotos':
        return Response.json({ ok: true, fila: await ed.cambiarRotos(Number(c.id), c.rotos) });
      case 'comentarios':
        return Response.json({ ok: true, fila: await ed.cambiarComentarios(Number(c.id), c.comentarios) });
      case 'quitar':
        return Response.json({ ok: true, fila: await ed.quitar(Number(c.id)) });
      case 'anadir':
        return Response.json({
          ok: true,
          fila: await ed.anadir({ sitioId: Number(c.sitioId), articuloId: Number(c.articuloId), cantidad: c.cantidad, talla: c.talla }),
        });
      case 'crearArticulo':
        return Response.json({ ok: true, ...(await ed.crearArticulo({ ...c, sitioId: Number(c.sitioId) })) });
      case 'crearCaja':
        return Response.json({ ok: true, caja: await ed.crearCaja(c) });
      default:
        return Response.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message || 'No se ha podido guardar.' }, { status: 400 });
  }
}
