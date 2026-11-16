import Link from 'next/link';
import Cabecera from '../components/Cabecera';
import BorrarCaja from '../components/BorrarCaja';
import Llenado from '../sitio/[id]/Llenado';
import { idiomaActual } from '../../lib/idioma';
import { textos } from '../../lib/textos';
import { sesionActual } from '../../lib/sesionActual';
const { listarCajas, purgarCajas } = require('../../lib/edicion.cjs');

export const dynamic = 'force-dynamic';

// Todas las cajas por código. Quien edita cambia el llenado con el selector (como en la caja) y puede borrar
// la caja con el aspa; quien solo consulta ve el llenado como texto.
export default async function Cajas() {
  const idioma = await idiomaActual();
  const t = textos(idioma);
  const sesion = await sesionActual();
  const puedeEditar = Boolean(sesion && ['admin', 'editor'].includes(sesion.rol));
  await purgarCajas();
  const cajas = await listarCajas();
  // Junto a cada caja, cuándo se revisó por última vez (si se ha revisado alguna vez).
  const revisadaEl = f => {
    const dia = new Intl.DateTimeFormat(idioma === 'en' ? 'en-GB' : 'es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short' }).format(new Date(f));
    return idioma === 'en' ? `Checked on ${dia}` : `Revisada el ${dia}`;
  };
  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido reducido">
        <h1 className="sitio-titulo">{t.cajasTitulo}</h1>
        <ul className="lista-cajas">
          {cajas.map(c => (
            <li key={c.id} className="lista-cajas-fila">
              <Link href={`/sitio/${c.id}`} className="lista-cajas-nombre">
                <strong>{c.codigo || c.nombre}</strong>
                {c.codigo && c.nombre ? ` ${c.nombre}` : ''}
              </Link>
              {c.revisada && <span className="lista-cajas-revisada">{revisadaEl(c.revisada)}</span>}
              {puedeEditar ? (
                <span className="lista-cajas-acciones">
                  <Llenado sitioId={c.id} llenado={c.llenado} idioma={idioma} soloVer={false} />
                  <BorrarCaja sitioId={c.id} codigo={c.codigo || c.nombre} idioma={idioma} />
                </span>
              ) : (
                <span className="lista-cajas-llenado">{c.llenado ? t.llenado[c.llenado] : ''}</span>
              )}
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
