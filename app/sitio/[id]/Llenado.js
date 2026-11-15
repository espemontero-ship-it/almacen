'use client';

import { useEffect, useState } from 'react';
import { textos } from '../../../lib/textos';

const VALORES = ['vacia', 'medias', 'llena'];

// Llenado de la caja, junto al título: quien edita ve lo marcado en un selector (Vacía · A medias · Llena)
// y se guarda al elegir; quien solo consulta ve el texto, y nada si nadie lo ha elegido.
export default function Llenado({ sitioId, llenado, idioma, soloVer, alCambiar }) {
  const t = textos(idioma);
  const [valor, setValor] = useState(llenado || null);
  const [error, setError] = useState('');
  useEffect(() => setValor(llenado || null), [llenado]);

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
      if (alCambiar) alCambiar(v);
    } catch {
      setValor(antes);
      setError(t.errorServidor);
    }
  }

  return (
    <div className="esc llenado">
      <span className="esc-filtros llenado-selector">
        <select aria-label={idioma === 'en' ? 'Fill' : 'Llenado'} value={valor || 'llena'} onChange={e => elegir(e.target.value)}>
          {VALORES.map(v => <option key={v} value={v}>{t.llenado[v]}</option>)}
        </select>
      </span>
      {error && <span className="error llenado-error">{error}</span>}
    </div>
  );
}
