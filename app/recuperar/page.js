import FormularioRecuperar from './FormularioRecuperar';
import { idiomaActual } from '../../lib/idioma';

export const dynamic = 'force-dynamic';

export default async function Recuperar() {
  const idioma = await idiomaActual();
  return <FormularioRecuperar idioma={idioma} />;
}
