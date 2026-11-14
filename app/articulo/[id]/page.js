import { notFound } from 'next/navigation';
import Cabecera from '../../components/Cabecera';
import FichaArticulo from '../../components/FichaArticulo';
import { idiomaActual } from '../../../lib/idioma';
import { sesionActual } from '../../../lib/sesionActual';
const { obtenerArticulo } = require('../../../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export default async function Articulo({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const idioma = await idiomaActual();
  const articulo = await obtenerArticulo(Number(id), idioma);
  if (!articulo) notFound();
  const sesion = await sesionActual();
  const puedeEditar = Boolean(sesion && ['admin', 'editor'].includes(sesion.rol));
  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido reducido">
        <ul className="lista">
          <FichaArticulo articulo={articulo} idioma={idioma} puedeEditar={puedeEditar} />
        </ul>
      </main>
    </>
  );
}
