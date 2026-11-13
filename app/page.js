import Cabecera from './components/Cabecera';
import TablaTodo from './components/TablaTodo';
const { listarTodo } = require('../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export default async function Inicio() {
  const filas = await listarTodo();
  return (
    <>
      <Cabecera />
      <main className="contenido">
        <TablaTodo filas={filas} />
      </main>
    </>
  );
}
