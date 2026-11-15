const { buscarPorCorreo, crearEnlace } = require('../../../lib/usuarios.cjs');
const { enviarRecuperacion } = require('../../../lib/correo.cjs');

export async function POST(request) {
  const { correo } = await request.json();
  const u = await buscarPorCorreo(correo);
  if (u) {
    const token = await crearEnlace(u.id, 2);
    const enlace = `${new URL(request.url).origin}/invitacion/${token}`;
    try {
      await enviarRecuperacion(u.correo, { nombre: u.nombre, enlace });
    } catch (error) {
      console.error('No se ha podido enviar el correo de recuperación:', error.message);
      return Response.json({ error: 'correo' }, { status: 502 });
    }
  }
  return Response.json({ ok: true });
}
