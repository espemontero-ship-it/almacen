const { crearTokenSesion, SESSION_COOKIE, DURACION_MS } = require('./auth.cjs');

async function respuestaConSesion(usuario, cuerpo) {
  const token = await crearTokenSesion({ id: usuario.id, rol: usuario.rol, nombre: usuario.nombre });
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const respuesta = Response.json(cuerpo);
  respuesta.headers.set(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly${secure}; SameSite=Lax; Max-Age=${Math.floor(DURACION_MS / 1000)}`
  );
  return respuesta;
}

module.exports = { respuestaConSesion };
