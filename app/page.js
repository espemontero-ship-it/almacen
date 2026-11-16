import Cabecera from './components/Cabecera';
import Escritorio from './components/Escritorio';
import { idiomaActual } from '../lib/idioma';
import { sesionActual } from '../lib/sesionActual';
const { listarTodo } = require('../lib/datos.cjs');
const { listarCajas, listarEtiquetas } = require('../lib/edicion.cjs');

export const dynamic = 'force-dynamic';

// Inicio: el mismo diseño en móvil y ordenador (filtros, Cuadrícula / Lista y tarjetas). Quien edita tiene, junto
// al recuento de artículos, "Añadir artículo" (eligiendo la caja) y "Añadir caja".
export default async function Inicio() {
  const idioma = await idiomaActual();
  const filas = await listarTodo(idioma);
  const sesion = await sesionActual();
  const puedeEditar = Boolean(sesion && ['admin', 'editor'].includes(sesion.rol));
  const cajasAnadir = puedeEditar
    ? (await listarCajas()).map(c => ({ id: c.id, texto: [c.codigo, c.nombre].filter(Boolean).join(' ') }))
    : [];
  const etiquetasAnadir = puedeEditar ? await listarEtiquetas(idioma) : [];
  return (
    <>
      <Cabecera idioma={idioma} />
      <Escritorio filas={filas} idioma={idioma} puedeEditar={puedeEditar} conAcciones cajasAnadir={cajasAnadir} etiquetasAnadir={etiquetasAnadir} />
    </>
  );
}
