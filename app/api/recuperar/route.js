const { buscarPorCorreo, crearEnlace } = require('../../../lib/usuarios.cjs');
const { enviarRecuperacion } = require('../../../lib/correo.cjs');

export async function POST(request) {
  const { correo } = await request.json();
  const u = await buscarPorCorreo(correo);
  if (u) {
    const token = await crearEnlace(u.id, 2);
    const enlace = `${new URL(request.url).origin}/invitacion/${token}`;
    await enviarRecuperacion(u.correo, { nombre: u.nombre, enlace });
  }
  return Response.json({ ok: true });
}
