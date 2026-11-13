import { notFound } from 'next/navigation';
import Cabecera from '../../components/Cabecera';
import FichaArticulo from '../../components/FichaArticulo';
const { obtenerArticulo } = require('../../../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export default async function Articulo({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const articulo = await obtenerArticulo(Number(id));
  if (!articulo) notFound();
  return (
    <>
      <Cabecera volver />
      <main className="contenido">
        <ul className="lista">
          <FichaArticulo articulo={articulo} />
        </ul>
      </main>
    </>
  );
}
