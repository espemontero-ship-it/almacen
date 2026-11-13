'use client';

import { useState } from 'react';
import Link from 'next/link';
import { textos } from '../../lib/textos';

export default function TallasArticulo({ tallas, sitios, idioma }) {
  const t = textos(idioma);
  const [elegida, setElegida] = useState(null);
  const cajas = elegida ? sitios.filter(s => s.talla === elegida) : [];

  return (
    <div className="tallas-bloque">
      <div className="tallas-fila" role="group" aria-label={t.talla}>
        {tallas.map(({ talla, cantidad }) => (
          <button
            key={talla}
            type="button"
            className={talla === elegida ? 'talla-chip talla-chip-activa' : 'talla-chip'}
            aria-pressed={talla === elegida}
            onClick={() => setElegida(talla === elegida ? null : talla)}
          >
            <strong>{talla}</strong> {cantidad}
          </button>
        ))}
      </div>
      {elegida && (
        <ul className="talla-cajas">
          {cajas.map((s, i) => (
            <li key={`${s.id}-${i}`}>
              <Link href={`/sitio/${s.id}`} className="fila fila-enlace fila-desglose">
                <span className="fila-texto">
                  <span className="codigo">{s.codigo || s.nombre}</span>
                  {s.codigo && s.nombre && <span className="nombre-sitio">{s.nombre}</span>}
                  {s.estado === 'roto' && <span className="estado estado-roto">{t.roto}</span>}
                  {s.comentarios && <span className="comentarios">{s.comentarios}</span>}
                </span>
                <span className="fila-dato">{s.cantidad}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
