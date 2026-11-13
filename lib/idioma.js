import { cookies } from 'next/headers';

export async function idiomaActual() {
  const almacen = await cookies();
  return almacen.get('idioma')?.value === 'en' ? 'en' : 'es';
}
