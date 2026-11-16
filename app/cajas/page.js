import Cabecera from '../components/Cabecera';
import ListaCajas from './ListaCajas';
import { idiomaActual } from '../../lib/idioma';
import { textos } from '../../lib/textos';
import { sesionActual } from '../../lib/sesionActual';
const { listarCajas, purgarCajas } = require('../../lib/edicion.cjs');

export const dynamic = 'force-dynamic';

// Todas las cajas por código, con filtros (tipo, sin revisar desde, sin revisar) y en cada fila su resumen de
// artículos y cuándo se revisó. Quien edita cambia el llenado con el selector y puede borrar la caja con el aspa;
// quien solo consulta ve el llenado como texto.
export default async function Cajas() {
  const idioma = await idiomaActual();
  const t = textos(idioma);
  const sesion = await sesionActual();
  const puedeEditar = Boolean(sesion && ['admin', 'editor'].includes(sesion.rol));
  await purgarCajas();
  const cajas = await listarCajas();
  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido reducido">
        <h1 className="sitio-titulo">{t.cajasTitulo}</h1>
        <ListaCajas
          cajas={cajas.map(c => ({ ...c, revisada: c.revisada ? new Date(c.revisada).toISOString() : null }))}
          idioma={idioma}
          puedeEditar={puedeEditar}
        />
      </main>
    </>
  );
}
