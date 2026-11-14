import { notFound } from 'next/navigation';
import Cabecera from '../components/Cabecera';
import FormularioCaja from './FormularioCaja';
import { idiomaActual } from '../../lib/idioma';
import { sesionActual } from '../../lib/sesionActual';
const { siguienteNumero } = require('../../lib/edicion.cjs');

export const dynamic = 'force-dynamic';

const LETRAS = ['P', 'C', 'O', 'M', 'L', 'D', 'A', 'U', 'R'];

export default async function CajaNueva() {
  const sesion = await sesionActual();
  if (!sesion || !['admin', 'editor'].includes(sesion.rol)) notFound();
  const idioma = await idiomaActual();
  const siguientes = {};
  for (const l of LETRAS) siguientes[l] = await siguienteNumero(l);
  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido reducido">
        <FormularioCaja letras={LETRAS} siguientes={siguientes} idioma={idioma} />
      </main>
    </>
  );
}
