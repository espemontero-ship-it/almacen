import Link from 'next/link';
import { describir, fechaHora, textosHistorial } from '../../lib/textosHistorial';
import RecuperarCaja from './RecuperarCaja';
import DeshacerMovimiento from './DeshacerMovimiento';

// Estas líneas ya dicen qué caja es en su propio texto.
const CAJA_EN_TEXTO = new Set(['borrarCaja', 'recuperarCaja']);

// puedeEditar: en la línea más reciente de "Caja borrada" de cada caja sale "Recuperar" durante 30 días.
export default function ListaHistorial({ cambios, idioma, mostrarCaja = true, puedeEditar = false }) {
  const t = textosHistorial(idioma);
  if (!cambios.length) return <p className="aviso">{t.vacio}</p>;
  const conRecuperar = new Set();
  const vistas = new Set();
  for (const h of cambios) {
    if (h.accion !== 'borrarCaja' || vistas.has(h.sitio_id)) continue;
    vistas.add(h.sitio_id);
    if (puedeEditar && h.caja_recuperable) conRecuperar.add(h.id);
  }
  // Un movimiento deja una línea en cada caja (y una por artículo): "Deshacer" sale en la primera de cada movimiento.
  const conDeshacer = new Set();
  const grupos = new Set();
  for (const h of cambios) {
    if (!puedeEditar || !h.deshacible || grupos.has(h.detalle?.grupo)) continue;
    grupos.add(h.detalle.grupo);
    conDeshacer.add(h.id);
  }
  return (
    <ul className="lista">
      {cambios.map(h => (
        <li key={h.id} className="historial-linea">
          <p className="historial-quien">
            <strong>{h.usuario_nombre || t.alguien}</strong> · {fechaHora(h.cuando, idioma)}
          </p>
          <p className="historial-que">
            {describir(h, idioma)}
            {conRecuperar.has(h.id) && <RecuperarCaja sitioId={h.sitio_id} texto={t.recuperar} idioma={idioma} />}
            {conDeshacer.has(h.id) && <DeshacerMovimiento grupo={h.detalle.grupo} texto={t.deshacer} idioma={idioma} />}
            {mostrarCaja && h.caja_borrada && h.codigo && !CAJA_EN_TEXTO.has(h.accion) && <>{' · '}{h.codigo}{h.sitio_nombre ? ` ${h.sitio_nombre}` : ''}</>}
            {mostrarCaja && h.sitio_id && !h.caja_borrada && !CAJA_EN_TEXTO.has(h.accion) && (
              <>
                {' · '}
                <Link href={`/sitio/${h.sitio_id}`} className="historial-caja">
                  {h.codigo || h.sitio_nombre}
                  {h.codigo && h.sitio_nombre ? ` ${h.sitio_nombre}` : ''}
                </Link>
              </>
            )}
          </p>
        </li>
      ))}
    </ul>
  );
}
