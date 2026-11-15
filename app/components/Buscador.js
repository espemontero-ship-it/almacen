'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { textos } from '../../lib/textos';

function enlace(s) {
  if (s.tipo === 'caja') return `/sitio/${s.id}`;
  if (s.tipo === 'etiqueta') return `/buscar?q=${encodeURIComponent(s.nombre)}`;
  return `/articulo/${s.id}`;
}

export default function Buscador({ busqueda = '', idioma }) {
  const t = textos(idioma);
  const [texto, setTexto] = useState(busqueda);
  const [resultado, setResultado] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    const limpio = texto.trim();
    if (limpio.length < 2) {
      setResultado(null);
      return;
    }
    const control = new AbortController();
    const espera = setTimeout(async () => {
      try {
        const r = await fetch(`/api/sugerencias?q=${encodeURIComponent(limpio)}`, { signal: control.signal });
        if (r.ok) setResultado({ texto: limpio, ...(await r.json()) });
      } catch {}
    }, 200);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [texto]);

  useEffect(() => {
    function fuera(evento) {
      if (contenedor.current && !contenedor.current.contains(evento.target)) setAbierto(false);
    }
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, []);

  const mostrar = abierto && resultado && texto.trim().length >= 2;

  return (
    <div className="buscador-envoltura" ref={contenedor}>
      <form action="/buscar" method="get" className="buscador" role="search">
        <input
          type="search"
          name="q"
          value={texto}
          onChange={e => {
            setTexto(e.target.value);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          placeholder={t.buscarPista}
          aria-label={t.buscarAria}
          autoComplete="off"
          enterKeyHint="search"
        />
        <button type="submit" className="boton-principal">{t.buscar}</button>
      </form>
      {mostrar && (
        <div className="sugerencias">
          {resultado.lista.length === 0 && (
            <p className="sugerencia-vacia">{t.nadaParecido(resultado.texto)}</p>
          )}
          {resultado.aproximado && resultado.lista.length > 0 && (
            <p className="sugerencia-vacia">{t.nadaExactoCorto}</p>
          )}
          {resultado.lista.length > 0 && (
            <ul>
              {resultado.lista.map(s => (
                <li key={`${s.tipo}-${s.id ?? s.nombre}`}>
                  <Link href={enlace(s)} className="sugerencia" onClick={() => setAbierto(false)}>
                    {s.tipo === 'caja' && (
                      <>
                        <span className="sugerencia-tipo">{t.caja}</span>
                        <span className="sugerencia-texto">
                          <strong>{s.codigo || s.nombre}</strong>
                          {s.codigo && s.nombre ? ` ${s.nombre}` : ''}
                          {s.llenado ? ` · ${t.llenado[s.llenado].toLowerCase()}` : ''}
                        </span>
                      </>
                    )}
                    {s.tipo === 'etiqueta' && (
                      <>
                        <span className="sugerencia-tipo">{t.etiqueta}</span>
                        <span className="sugerencia-texto"><strong>{s.nombre}</strong></span>
                        <span className="sugerencia-dato">{t.nArticulos(s.articulos)}</span>
                      </>
                    )}
                    {s.tipo === 'articulo' && (
                      <>
                        <span className="sugerencia-tipo">{t.articulo}</span>
                        <span className="sugerencia-texto"><strong>{s.nombre}</strong></span>
                        <span className="sugerencia-dato">{s.total}</span>
                      </>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
