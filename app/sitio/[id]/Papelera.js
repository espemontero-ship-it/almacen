'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Papelera({ lineas, titulo, textoRecuperar, idioma }) {
  const router = useRouter();
  const [error, setError] = useState('');
  if (!lineas.length) return null;

  async function recuperar(id) {
    setError('');
    const r = await fetch('/api/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'recuperar', id }),
    });
    if (r.ok) router.refresh();
    else setError(idioma === 'en' ? 'Could not be restored.' : 'No se ha podido recuperar.');
  }

  return (
    <section className="papelera">
      <h2 className="grupo-titulo">{titulo}</h2>
      <ul className="lista">
        {lineas.map(l => (
          <li key={l.id} className="fila">
            <span className="fila-texto">
              <span className="nombre-articulo">{idioma === 'en' ? l.nombre_en || l.nombre : l.nombre_es || l.nombre}</span>
              {l.talla && <span className="estado">{l.talla}</span>}
              <span className="estado">×{l.cantidad}</span>
            </span>
            <button type="button" className="boton-secundario" onClick={() => recuperar(l.id)}>{textoRecuperar}</button>
          </li>
        ))}
      </ul>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
