'use client';

import { useState } from 'react';
import { textos } from '../../../lib/textos';

const VALORES = ['vacia', 'medias', 'llena'];

// Llenado de la caja, junto al título (versión F): quien edita elige Vacía · A medias · Llena
// con botones pequeños (se guarda al pulsar); quien solo consulta ve el texto, y nada si nadie lo ha elegido.
export default function Llenado({ sitioId, llenado, idioma, soloVer }) {
  const t = textos(idioma);
  const [valor, setValor] = useState(llenado || null);
  const [error, setError] = useState('');

  if (soloVer) return valor ? <span className="llenado-texto">{t.llenado[valor]}</span> : null;

  async function elegir(v) {
    if (v === valor) return;
    const antes = valor;
    setValor(v);
    setError('');
    try {
      const r = await fetch('/api/editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'llenado', sitioId, llenado: v }),
      });
      if (!r.ok) throw new Error();
    } catch {
      setValor(antes);
      setError(t.errorServidor);
    }
  }

  return (
    <div className="esc llenado">
      <span className="esc-vistas" role="group" aria-label={idioma === 'en' ? 'Fill' : 'Llenado'}>
        {VALORES.map(v => (
          <button key={v} type="button" aria-pressed={valor === v} className={valor === v ? 'esc-vista-activa' : ''} onClick={() => elegir(v)}>
            {t.llenado[v]}
          </button>
        ))}
      </span>
      {error && <span className="error llenado-error">{error}</span>}
    </div>
  );
}
