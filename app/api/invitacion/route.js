const { usarInvitacion } = require('../../../lib/usuarios.cjs');
const { respuestaConSesion } = require('../../../lib/sesion.cjs');

export async function POST(request) {
  const { token, password } = await request.json();
  if (!password || password.length < 8) {
    return Response.json({ error: 'La contraseña tiene que tener al menos 8 caracteres.' }, { status: 400 });
  }
  const u = await usarInvitacion(token, password);
  if (!u) {
    return Response.json({ error: 'Este enlace ya no sirve. Pide uno nuevo.' }, { status: 400 });
  }
  return respuestaConSesion(u, { ok: true });
}
