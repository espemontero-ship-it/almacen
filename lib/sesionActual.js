import { cookies } from 'next/headers';
const { leerSesion, SESSION_COOKIE } = require('./auth.cjs');

export async function sesionActual() {
  const almacen = await cookies();
  return leerSesion(almacen.get(SESSION_COOKIE)?.value);
}
