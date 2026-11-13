import FormularioEntrar from './FormularioEntrar';
import { idiomaActual } from '../../lib/idioma';

export const dynamic = 'force-dynamic';

export default async function Login() {
  const idioma = await idiomaActual();
  return <FormularioEntrar idioma={idioma} />;
}
