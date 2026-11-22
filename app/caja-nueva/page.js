import { notFound } from 'next/navigation';
import Cabecera from '../components/Cabecera';
import FormularioCaja from './FormularioCaja';
import { idiomaActual } from '../../lib/idioma';
import { sesionActual } from '../../lib/sesionActual';
const { siguienteNumero, numerosLibres } = require('../../lib/edicion.cjs');

export const dynamic = 'force-dynamic';

const LETRAS = ['P', 'C', 'O', 'M', 'L', 'D', 'A', 'U', 'R'];

// ?inventario=1: viene de la pantalla Inventario; la caja nueva entra en el inventario abierto.
export default async function CajaNueva({ searchParams }) {
  const sesion = await sesionActual();
  if (!sesion || !['admin', 'editor'].includes(sesion.rol)) notFound();
  const idioma = await idiomaActual();
  const siguientes = {};
  const libres = {};
  for (const l of LETRAS) {
    siguientes[l] = await siguienteNumero(l);
    libres[l] = await numerosLibres(l);
  }
  const { inventario } = await searchParams;
  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido reducido">
        <FormularioCaja letras={LETRAS} siguientes={siguientes} libres={libres} alInventario={inventario === '1'} idioma={idioma} />
      </main>
    </>
  );
}
