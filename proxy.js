import { NextResponse } from 'next/server';
const { leerSesion, SESSION_COOKIE } = require('./lib/auth.cjs');

export async function proxy(request) {
  const sesion = await leerSesion(request.cookies.get(SESSION_COOKIE)?.value);
  if (sesion && sesion.rol === 'admin') return NextResponse.next();
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/personas/:path*', '/api/personas/:path*'],
};
