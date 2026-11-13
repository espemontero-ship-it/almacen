const { verificarUsuario } = require('../../../lib/usuarios.cjs');
const { respuestaConSesion } = require('../../../lib/sesion.cjs');

export async function POST(request) {
  const { usuario, password } = await request.json();
  const u = await verificarUsuario(usuario, password);
  if (!u) {
    return Response.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 });
  }
  return respuestaConSesion(u, { ok: true });
}
