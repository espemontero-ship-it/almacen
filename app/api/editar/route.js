const { obtenerSesion } = require('../../../lib/auth.cjs');
const ed = require('../../../lib/edicion.cjs');

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || !['admin', 'editor'].includes(sesion.rol)) {
    return Response.json({ error: 'No autorizado' }, { status: 403 });
  }
  const quien = { id: sesion.id, nombre: sesion.nombre };
  const c = await request.json();
  try {
    switch (c.accion) {
      case 'cantidad':
        return Response.json({ ok: true, fila: await ed.cambiarCantidad(Number(c.id), c.cantidad, quien) });
      case 'rotos':
        return Response.json({ ok: true, fila: await ed.cambiarRotos(Number(c.id), c.rotos, quien) });
      case 'comentarios':
        return Response.json({ ok: true, fila: await ed.cambiarComentarios(Number(c.id), c.comentarios, quien) });
      case 'quitar':
        return Response.json({ ok: true, fila: await ed.quitar(Number(c.id), quien) });
      case 'recuperar':
        return Response.json({ ok: true, fila: await ed.recuperar(Number(c.id), quien) });
      case 'anadir':
        return Response.json({
          ok: true,
          fila: await ed.anadir(
            { sitioId: Number(c.sitioId), articuloId: Number(c.articuloId), cantidad: c.cantidad, talla: c.talla },
            quien
          ),
        });
      case 'crearArticulo':
        return Response.json({ ok: true, ...(await ed.crearArticulo({ ...c, sitioId: Number(c.sitioId) }, quien)) });
      case 'nombre':
        return Response.json({ ok: true, nombres: await ed.cambiarNombres(Number(c.id), { idioma: c.idioma, nombre: c.nombre }, quien) });
      case 'sinonimos':
        return Response.json({ ok: true, nombres: await ed.cambiarNombres(Number(c.id), { sinonimos: c.sinonimos }, quien) });
      case 'revisarCaja':
        return Response.json({ ok: true, ...(await ed.revisarCaja(Number(c.sitioId), quien)) });
      case 'llenado':
        return Response.json({ ok: true, ...(await ed.cambiarLlenado(Number(c.sitioId), c.llenado, quien)) });
      case 'borrarCaja':
        return Response.json({ ok: true, ...(await ed.borrarCaja(Number(c.sitioId), quien)) });
      case 'recuperarCaja':
        return Response.json({ ok: true, ...(await ed.recuperarCaja(Number(c.sitioId), quien)) });
      case 'crearCaja':
        return Response.json({ ok: true, caja: await ed.crearCaja(c, quien) });
      default:
        return Response.json({ error: 'Acción no válida' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message || 'No se ha podido guardar.' }, { status: 400 });
  }
}
