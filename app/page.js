import Cabecera from './components/Cabecera';
import TablaTodo from './components/TablaTodo';
import { idiomaActual } from '../lib/idioma';
const { listarTodo } = require('../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export default async function Inicio() {
  const idioma = await idiomaActual();
  const filas = await listarTodo(idioma);
  return (
    <>
      <Cabecera idioma={idioma} />
      <main className="contenido">
        <TablaTodo filas={filas} idioma={idioma} />
      </main>
    </>
  );
}
