'use client';

import { useState } from 'react';
import { textos } from '../../lib/textos';

const T = {
  es: { titulo: 'Crear caja', letra: 'Tipo de caja', numero: 'Número', nombre: 'Nombre (opcional)', crear: 'Crear caja', error: 'No se ha podido crear.' },
  en: { titulo: 'New box', letra: 'Box type', numero: 'Number', nombre: 'Name (optional)', crear: 'Create box', error: 'Could not be created.' },
};

export default function FormularioCaja({ letras, siguientes, idioma }) {
  const t = textos(idioma);
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const [letra, setLetra] = useState(letras[0]);
  const [numero, setNumero] = useState(siguientes[letras[0]]);
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function crear(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    try {
      const r = await fetch('/api/editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'crearCaja', letra, numero, nombre }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || x.error);
      window.location.href = `/sitio/${d.caja.id}`;
      return;
    } catch (err) {
      setError(err.message || x.error);
    }
    setEnviando(false);
  }

  return (
    <form onSubmit={crear} className="formulario">
      <h1 className="sitio-titulo">{x.titulo}</h1>
      <label>
        {x.letra}
        <select
          value={letra}
          onChange={e => {
            setLetra(e.target.value);
            setNumero(siguientes[e.target.value]);
          }}
        >
          {letras.map(l => <option key={l} value={l}>{t.tipos[l]}</option>)}
        </select>
      </label>
      <label>
        {x.numero}
        <input type="number" inputMode="numeric" min={1} value={numero} onChange={e => setNumero(e.target.value)} required />
      </label>
      <p className="codigo">{letra}{numero}</p>
      <label>
        {x.nombre}
        <input value={nombre} onChange={e => setNombre(e.target.value)} />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="boton-principal" disabled={enviando}>{x.crear}</button>
    </form>
  );
}
