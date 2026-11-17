const { sugerencias } = require('../../../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const texto = (url.searchParams.get('q') || '').trim();
  // catalogo=1 ("Añadir artículo"): también los artículos que ahora no están en ninguna caja.
  const catalogo = url.searchParams.get('catalogo') === '1';
  if (texto.length < 2) return Response.json({ lista: [], aproximado: false });
  const idioma = request.cookies.get('idioma')?.value === 'en' ? 'en' : 'es';
  return Response.json(await sugerencias(texto, idioma, { catalogo }));
}
