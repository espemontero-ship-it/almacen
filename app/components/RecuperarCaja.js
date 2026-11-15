'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Historial: "Recuperar" en la línea "Caja borrada" mientras no pasen 30 días.
export default function RecuperarCaja({ sitioId, texto, idioma }) {
  const router = useRouter();
  const [error, setError] = useState('');

  async function recuperar() {
    setError('');
    const r = await fetch('/api/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'recuperarCaja', sitioId }),
    });
    if (r.ok) router.refresh();
    else setError(idioma === 'en' ? 'Could not be restored.' : 'No se ha podido recuperar.');
  }

  return (
    <>
      {' '}
      <button type="button" className="boton-secundario historial-recuperar" onClick={recuperar}>{texto}</button>
      {error && <span className="error"> {error}</span>}
    </>
  );
}
