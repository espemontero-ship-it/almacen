import { notFound } from 'next/navigation';
import Cabecera from '../components/Cabecera';
import GestionPersonas from './GestionPersonas';
import { idiomaActual } from '../../lib/idioma';
import { sesionActual } from '../../lib/sesionActual';
const { listarUsuarios } = require('../../lib/usuarios.cjs');

export const dynamic = 'force-dynamic';

export default async function Personas() {
  const sesion = await sesionActual();
  if (!sesion || sesion.rol !== 'admin') notFound();
  const idioma = await idiomaActual();
  const usuarios = await listarUsuarios();
  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido reducido">
        <GestionPersonas usuarios={usuarios} idioma={idioma} />
      </main>
    </>
  );
}
