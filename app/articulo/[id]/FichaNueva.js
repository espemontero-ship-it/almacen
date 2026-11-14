'use client';

import { useState } from 'react';
import Link from 'next/link';
import Foto from '../../components/Foto';
import NombreEditable from '../../components/NombreEditable';
import { textos } from '../../../lib/textos';

const T = {
  es: { talla: 'Talla', todas: 'Todas' },
  en: { talla: 'Size', todas: 'All' },
};

// Ficha del artículo: cabecera (foto, nombre, etiquetas, total y cajas) y cada caja en una tarjeta,
// como las del inicio. En la ropa, botones de talla que filtran las cajas.
export default function FichaNueva({ articulo: a, idioma, puedeEditar }) {
  const t = textos(idioma);
  const y = T[idioma === 'en' ? 'en' : 'es'];
  const [talla, setTalla] = useState(null);

  const tallas = a.tallas || [];
  const sitios = talla ? a.sitios.filter(s => s.talla === talla) : a.sitios;

  return (
    <div className="fx">
      <div className="fx-cabecera">
        <span className="fx-foto"><Foto url={a.foto_url} nombre={a.nombre} /></span>
        <div className="fx-datos">
          <NombreEditable articuloId={a.id} nombre={a.nombre} sinonimos={a.sinonimos} idioma={idioma} puedeEditar={puedeEditar} className="nombre-articulo fx-nombre" />
          {a.etiquetas.length > 0 && <span className="fx-gris">{a.etiquetas.join(' · ')}</span>}
          <span className="fx-total"><strong>{a.total}</strong> {t.enTotal} · {[...new Set(a.sitios.map(s => s.codigo || s.nombre))].join(', ')}</span>
          {a.rotos > 0 && <span className="estado-roto">{t.buenasRotas(a.total - a.rotos, a.rotos)}</span>}
        </div>
      </div>
      {tallas.length > 0 && (
        <div className="fx-tallas" role="group" aria-label={y.talla}>
          <button type="button" className={!talla ? 'fx-talla fx-talla-activa' : 'fx-talla'} onClick={() => setTalla(null)}>{y.todas}</button>
          {tallas.map(({ talla: tl, cantidad }) => (
            <button key={tl} type="button" className={tl === talla ? 'fx-talla fx-talla-activa' : 'fx-talla'} onClick={() => setTalla(tl === talla ? null : tl)}>
              {tl} <span className="fx-gris">{cantidad}</span>
            </button>
          ))}
        </div>
      )}
      <ul className="fx-tarjetas">
        {sitios.map((s, i) => (
          <li key={`${s.id}-${i}`}>
            <Link href={`/sitio/${s.id}`} className="fx-tarjeta">
              <span className="fx-caja"><strong>{s.codigo || s.nombre}</strong></span>
              {s.codigo && s.nombre && <span className="fx-gris">{s.nombre}</span>}
              {s.talla && <span className="fx-gris">{y.talla} {s.talla}</span>}
              <span><strong>{s.cantidad}</strong>{s.rotos > 0 && <span className="estado-roto"> · {t.rotos(s.rotos)}</span>}</span>
              {s.comentarios && <span className="fx-gris">{s.comentarios}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
