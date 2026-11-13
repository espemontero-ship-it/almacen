import Link from 'next/link';
import Cabecera from './components/Cabecera';
import TablaTodo from './components/TablaTodo';
import { idiomaActual } from '../lib/idioma';
import { sesionActual } from '../lib/sesionActual';
const { listarTodo } = require('../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export default async function Inicio() {
  const idioma = await idiomaActual();
  const filas = await listarTodo(idioma);
  const sesion = await sesionActual();
  const puedeEditar = Boolean(sesion && ['admin', 'editor'].includes(sesion.rol));
  return (
    <>
      <Cabecera idioma={idioma} />
      <main className="contenido">
        {puedeEditar && (
          <Link href="/caja-nueva" className="boton-secundario boton-crear-caja">
            {idioma === 'en' ? '+ New box' : '+ Crear caja'}
          </Link>
        )}
        <TablaTodo filas={filas} idioma={idioma} />
      </main>
    </>
  );
}
