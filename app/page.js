import Link from 'next/link';
import Cabecera from './components/Cabecera';
import TablaTodo from './components/TablaTodo';
import Escritorio from './components/Escritorio';
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
      <div className="solo-escritorio">
        <Escritorio filas={filas} idioma={idioma} puedeEditar={puedeEditar} />
      </div>
      <div className="solo-movil">
        <main className="contenido">
          <div className="acciones-inicio">
            {puedeEditar && (
              <Link href="/caja-nueva" className="boton-secundario">
                {idioma === 'en' ? '+ New box' : '+ Crear caja'}
              </Link>
            )}
            <Link href="/historial" className="boton-secundario">{idioma === 'en' ? 'History' : 'Historial'}</Link>
          </div>
          <TablaTodo filas={filas} idioma={idioma} puedeEditar={puedeEditar} />
        </main>
      </div>
    </>
  );
}
