import Link from 'next/link';
import { describir, fechaHora, textosHistorial } from '../../lib/textosHistorial';

export default function ListaHistorial({ cambios, idioma, mostrarCaja = true }) {
  const t = textosHistorial(idioma);
  if (!cambios.length) return <p className="aviso">{t.vacio}</p>;
  return (
    <ul className="lista">
      {cambios.map(h => (
        <li key={h.id} className="historial-linea">
          <p className="historial-quien">
            <strong>{h.usuario_nombre || t.alguien}</strong> · {fechaHora(h.cuando, idioma)}
          </p>
          <p className="historial-que">{describir(h, idioma)}</p>
          {mostrarCaja && h.sitio_id && (
            <Link href={`/sitio/${h.sitio_id}`} className="enlace-volver historial-caja">
              {h.codigo || h.sitio_nombre}
              {h.codigo && h.sitio_nombre ? ` ${h.sitio_nombre}` : ''}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
