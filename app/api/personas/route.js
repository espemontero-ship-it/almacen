const { obtenerSesion } = require('../../../lib/auth.cjs');
const { crearUsuario, crearEnlace, obtenerUsuario } = require('../../../lib/usuarios.cjs');
const { enviarInvitacion } = require('../../../lib/correo.cjs');

const ROLES = ['admin', 'editor', 'consulta'];

export async function POST(request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== 'admin') return Response.json({ error: 'No autorizado' }, { status: 403 });
  const cuerpo = await request.json();
  const origen = new URL(request.url).origin;

  if (cuerpo.accion === 'invitar') {
    const { nombre, usuario, correo, rol } = cuerpo;
    if (!nombre || !usuario || !ROLES.includes(rol)) {
      return Response.json({ error: 'Faltan datos.' }, { status: 400 });
    }
    let id;
    try {
      id = await crearUsuario({ nombre, usuario, correo, rol });
    } catch {
      return Response.json({ error: 'Ese usuario o ese correo ya existen.' }, { status: 400 });
    }
    const enlace = `${origen}/invitacion/${await crearEnlace(id, 24 * 7)}`;
    const envio = correo ? await enviarInvitacion(correo, { nombre, enlace }) : { enviado: false };
    return Response.json({ ok: true, enlace, enviado: envio.enviado });
  }

  if (cuerpo.accion === 'enlace') {
    const u = await obtenerUsuario(Number(cuerpo.id));
    if (!u) return Response.json({ error: 'No existe.' }, { status: 404 });
    const enlace = `${origen}/invitacion/${await crearEnlace(u.id, 24 * 7)}`;
    return Response.json({ ok: true, enlace });
  }

  return Response.json({ error: 'Acción no válida' }, { status: 400 });
}
