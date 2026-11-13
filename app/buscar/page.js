import { redirect } from 'next/navigation';
import Cabecera from '../components/Cabecera';
import FichaArticulo from '../components/FichaArticulo';
import { idiomaActual } from '../../lib/idioma';
import { textos } from '../../lib/textos';
const { buscar, sitioPorCodigo } = require('../../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export default async function Buscar({ searchParams }) {
  const { q = '' } = await searchParams;
  const texto = String(q).trim();
  if (!texto) redirect('/');
  const sitioId = await sitioPorCodigo(texto);
  if (sitioId) redirect(`/sitio/${sitioId}`);
  const idioma = await idiomaActual();
  const t = textos(idioma);
  const { articulos, aproximado } = await buscar(texto);
  return (
    <>
      <Cabecera busqueda={texto} volver idioma={idioma} />
      <main className="contenido">
        {!articulos.length && <p className="aviso">{t.nadaParecido(texto)}</p>}
        {aproximado && articulos.length > 0 && <p className="aviso">{t.nadaExacto(texto)}</p>}
        <ul className="lista">
          {articulos.map(a => (
            <FichaArticulo key={a.id} articulo={a} idioma={idioma} />
          ))}
        </ul>
      </main>
    </>
  );
}
