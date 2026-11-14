import FormularioRecuperar from './FormularioRecuperar';
import Cabecera from '../components/Cabecera';
import { idiomaActual } from '../../lib/idioma';

export const dynamic = 'force-dynamic';

export default async function Recuperar() {
  const idioma = await idiomaActual();
  return (
    <>
      <Cabecera idioma={idioma} soloEscritorio />
      <FormularioRecuperar idioma={idioma} />
    </>
  );
}
