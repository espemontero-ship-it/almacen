import Cabecera from './components/Cabecera';
import Escritorio from './components/Escritorio';
import { idiomaActual } from '../lib/idioma';
import { sesionActual } from '../lib/sesionActual';
const { listarTodo } = require('../lib/datos.cjs');

export const dynamic = 'force-dynamic';

// Inicio: el mismo diseño en móvil y ordenador (filtros, Cuadrícula / Lista y tarjetas).
// En el móvil, Crear caja e Historial van como botones arriba, porque su barra no los tiene.
export default async function Inicio() {
  const idioma = await idiomaActual();
  const filas = await listarTodo(idioma);
  const sesion = await sesionActual();
  const puedeEditar = Boolean(sesion && ['admin', 'editor'].includes(sesion.rol));
  return (
    <>
      <Cabecera idioma={idioma} />
      <Escritorio filas={filas} idioma={idioma} puedeEditar={puedeEditar} conAcciones />
    </>
  );
}
