'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Aspa ✕ para borrar una caja entera (edición y administración). Pregunta antes; la caja queda 30 días
// en el Historial con "Recuperar". alBorrar: a dónde ir después (si no, se recarga la pantalla).
export default function BorrarCaja({ sitioId, codigo, idioma, alBorrar = null }) {
  const router = useRouter();
  const en = idioma === 'en';
  const [preguntar, setPreguntar] = useState(false);
  const [error, setError] = useState('');

  async function borrar() {
    setError('');
    try {
      const r = await fetch('/api/editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'borrarCaja', sitioId }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || '');
      setPreguntar(false);
      if (alBorrar) router.push(alBorrar);
      else router.refresh();
    } catch (err) {
      setError(err.message || (en ? 'Could not be deleted.' : 'No se ha podido borrar.'));
    }
  }

  return (
    <>
      <button type="button" className="inv-aspa" aria-label={en ? `Delete box ${codigo}` : `Borrar la caja ${codigo}`} title={en ? 'Delete box' : 'Borrar caja'} onClick={() => setPreguntar(true)}>✕</button>
      {preguntar && (
        <div className="dialogo-fondo" role="dialog" aria-modal="true">
          <div className="dialogo">
            <p>{en ? `Delete box ${codigo} and everything in it?` : `¿Borrar la caja ${codigo} y todo lo que tiene?`}</p>
            <div className="revision-botones">
              <button type="button" className="boton-principal" onClick={borrar}>{en ? 'Yes' : 'Sí'}</button>
              <button type="button" className="boton-secundario" onClick={() => { setPreguntar(false); setError(''); }}>{en ? 'No' : 'No'}</button>
            </div>
            {error && <p className="error">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
