import { redirect } from 'next/navigation';
import Cabecera from '../components/Cabecera';
import FichaArticulo from '../components/FichaArticulo';
const { buscar, sitioPorCodigo } = require('../../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export default async function Buscar({ searchParams }) {
  const { q = '' } = await searchParams;
  const texto = String(q).trim();
  if (!texto) redirect('/');
  const sitioId = await sitioPorCodigo(texto);
  if (sitioId) redirect(`/sitio/${sitioId}`);
  const { articulos, aproximado } = await buscar(texto);
  return (
    <>
      <Cabecera busqueda={texto} volver />
      <main className="contenido">
        {!articulos.length && <p className="aviso">No hay nada que se parezca a «{texto}».</p>}
        {aproximado && articulos.length > 0 && (
          <p className="aviso">No hay nada que se llame exactamente «{texto}». Esto es lo más parecido:</p>
        )}
        <ul className="lista">
          {articulos.map(a => (
            <FichaArticulo key={a.id} articulo={a} />
          ))}
        </ul>
      </main>
    </>
  );
}
