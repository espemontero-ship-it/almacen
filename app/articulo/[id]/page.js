import { notFound } from 'next/navigation';
import Cabecera from '../../components/Cabecera';
import FichaArticulo from '../../components/FichaArticulo';
import { idiomaActual } from '../../../lib/idioma';
const { obtenerArticulo } = require('../../../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export default async function Articulo({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const idioma = await idiomaActual();
  const articulo = await obtenerArticulo(Number(id), idioma);
  if (!articulo) notFound();
  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido">
        <ul className="lista">
          <FichaArticulo articulo={articulo} idioma={idioma} />
        </ul>
      </main>
    </>
  );
}
