import FormularioEntrar from './FormularioEntrar';
import Cabecera from '../components/Cabecera';
import { idiomaActual } from '../../lib/idioma';

export const dynamic = 'force-dynamic';

export default async function Login() {
  const idioma = await idiomaActual();
  return (
    <>
      <Cabecera idioma={idioma} soloEscritorio />
      <FormularioEntrar idioma={idioma} />
    </>
  );
}
