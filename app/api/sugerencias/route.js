const { sugerencias } = require('../../../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const texto = (new URL(request.url).searchParams.get('q') || '').trim();
  if (texto.length < 2) return Response.json({ lista: [], aproximado: false });
  return Response.json(await sugerencias(texto));
}
