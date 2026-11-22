'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Historial: "Deshacer" en un "Movido" (durante 30 días): todo lo de ese movimiento vuelve a su caja.
export default function DeshacerMovimiento({ grupo, texto, idioma }) {
  const router = useRouter();
  const [error, setError] = useState('');

  async function deshacer() {
    setError('');
    const r = await fetch('/api/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'deshacerMovimiento', grupo }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) router.refresh();
    else setError(d.error || (idioma === 'en' ? 'Could not be undone.' : 'No se ha podido deshacer.'));
  }

  return (
    <>
      {' '}
      <button type="button" className="boton-secundario historial-recuperar" onClick={deshacer}>{texto}</button>
      {error && <span className="error"> {error}</span>}
    </>
  );
}
