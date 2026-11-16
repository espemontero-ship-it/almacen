'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const T = {
  es: {
    cerrar: 'Cerrar inventario', si: 'Sí', no: 'No', error: 'No se ha podido cerrar.',
    pregunta: n => (n ? `¿Cerrar el inventario? ${n === 1 ? 'Queda 1 caja' : `Quedan ${n} cajas`} sin revisar.` : '¿Cerrar el inventario?'),
  },
  en: {
    cerrar: 'Close inventory', si: 'Yes', no: 'No', error: 'Could not be closed.',
    pregunta: n => (n ? `Close the inventory? ${n} ${n === 1 ? 'box is' : 'boxes are'} still unchecked.` : 'Close the inventory?'),
  },
};

// Cerrar el inventario abierto (se puede aunque queden cajas sin revisar); después se ve su resumen.
export default function CerrarInventario({ id, quedan, idioma }) {
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const router = useRouter();
  const [preguntar, setPreguntar] = useState(false);
  const [error, setError] = useState('');

  async function cerrar() {
    setError('');
    try {
      const r = await fetch('/api/editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'cerrarInventario', id }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || '');
      router.push(`/inventario?ver=${id}`);
    } catch (err) {
      setError(err.message || x.error);
    }
  }

  return (
    <>
      <button type="button" className="boton-secundario" onClick={() => setPreguntar(true)}>{x.cerrar}</button>
      {preguntar && (
        <div className="dialogo-fondo" role="dialog" aria-modal="true">
          <div className="dialogo">
            <p>{x.pregunta(quedan)}</p>
            <div className="revision-botones">
              <button type="button" className="boton-principal" onClick={cerrar}>{x.si}</button>
              <button type="button" className="boton-secundario" onClick={() => { setPreguntar(false); setError(''); }}>{x.no}</button>
            </div>
            {error && <p className="error">{error}</p>}
          </div>
        </div>
      )}
    </>
  );
}
