'use client';

import { useEffect, useRef, useState } from 'react';

const LADO = 1200;

function reducir(archivo) {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    const url = URL.createObjectURL(archivo);
    imagen.onload = () => {
      const escala = Math.min(1, LADO / Math.max(imagen.width, imagen.height));
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.round(imagen.width * escala);
      lienzo.height = Math.round(imagen.height * escala);
      lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
      URL.revokeObjectURL(url);
      lienzo.toBlob(b => (b ? resolver(b) : rechazar(new Error('No se ha podido leer la foto.'))), 'image/jpeg', 0.8);
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      rechazar(new Error('No se ha podido leer la foto.'));
    };
    imagen.src = url;
  });
}

export default function BotonFoto({ articuloId, onSubida, etiqueta }) {
  const entrada = useRef(null);
  const [estado, setEstado] = useState('');

  async function elegida(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!archivo) return;
    setEstado('…');
    try {
      const reducida = await reducir(archivo);
      const datos = new FormData();
      datos.append('articuloId', String(articuloId));
      datos.append('foto', reducida, 'foto.jpg');
      const r = await fetch('/api/foto', { method: 'POST', body: datos });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Error');
      setEstado('');
      onSubida(d.url);
    } catch (err) {
      setEstado(err.message || 'Error');
    }
  }

  return (
    <span className="boton-foto-envoltura">
      <button type="button" className="boton-foto" onClick={() => entrada.current?.click()} aria-label={etiqueta} title={etiqueta}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path
            d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      <input ref={entrada} type="file" accept="image/*" capture="environment" hidden onChange={elegida} />
      {estado && <span className="estado">{estado}</span>}
    </span>
  );
}

// Sube una foto ya elegida a un artículo (la misma reducción que el botón de cámara). Devuelve la dirección de la foto.
export async function subirFoto(articuloId, archivo) {
  const reducida = await reducir(archivo);
  const datos = new FormData();
  datos.append('articuloId', String(articuloId));
  datos.append('foto', reducida, 'foto.jpg');
  const r = await fetch('/api/foto', { method: 'POST', body: datos });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Error');
  return d.url;
}

// Crear artículo: el mismo botón de cámara, pero la foto se guarda hasta que el artículo existe.
// Enseña la foto elegida en pequeño; "Quitar" la descarta.
export function ElegirFoto({ archivo, onElegir, etiqueta, quitar }) {
  const entrada = useRef(null);
  const [vista, setVista] = useState('');
  useEffect(() => {
    if (!archivo) { setVista(''); return undefined; }
    const url = URL.createObjectURL(archivo);
    setVista(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);
  return (
    <span className="elegir-foto">
      {vista ? <img className="elegir-foto-vista" src={vista} alt="" /> : <span className="elegir-foto-vista elegir-foto-vacia" aria-hidden="true" />}
      <span className="boton-foto-envoltura">
        <button type="button" className="boton-foto" onClick={() => entrada.current?.click()} aria-label={etiqueta} title={etiqueta}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M4 7h3l2-2h6l2 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="12" cy="13" r="3.5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
        <input ref={entrada} type="file" accept="image/*" capture="environment" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onElegir(f); }} />
      </span>
      {archivo && <button type="button" className="boton-texto" onClick={() => onElegir(null)}>{quitar}</button>}
    </span>
  );
}
