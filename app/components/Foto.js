'use client';

import { useState } from 'react';

export default function Foto({ url, nombre, pequena = false }) {
  const [grande, setGrande] = useState(false);
  const clase = pequena ? 'foto foto-pequena' : 'foto';
  if (!url) return <span className={`${clase} foto-vacia`} aria-hidden="true" />;
  if (pequena) {
    return (
      <span className={clase}>
        <img src={url} alt="" loading="lazy" />
      </span>
    );
  }
  return (
    <>
      <button
        type="button"
        className={`${clase} foto-boton`}
        onClick={e => {
          e.stopPropagation();
          setGrande(true);
        }}
        aria-label={nombre}
      >
        <img src={url} alt={nombre} loading="lazy" />
      </button>
      {grande && (
        <div className="foto-ampliada" role="dialog" aria-modal="true" onClick={() => setGrande(false)}>
          <img src={url} alt={nombre} />
          <button type="button" className="foto-cerrar" onClick={() => setGrande(false)} aria-label="✕">✕</button>
        </div>
      )}
    </>
  );
}
