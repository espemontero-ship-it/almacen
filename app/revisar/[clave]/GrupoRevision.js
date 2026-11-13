'use client';

import { useState } from 'react';

async function enviar(cuerpo) {
  const r = await fetch('/api/revisar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error('No se ha podido guardar.');
}

function Linea({ clave, inicial }) {
  const [e, setE] = useState(inicial);
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  function abrir() {
    setBorrador({ es: e.es, en: e.en, otros: e.otros.join(', ') });
    setError('');
    setEditando(true);
  }

  async function guardar() {
    setGuardando(true);
    setError('');
    const otros = borrador.otros.split(',').map(t => t.trim()).filter(Boolean);
    try {
      await enviar({ clave, accion: 'guardar', elemento: { tipo: e.tipo, original: e.original, es: borrador.es, en: borrador.en, otros } });
      setE({ ...e, es: borrador.es.trim() || e.original, en: borrador.en.trim() || e.original, otros, corregido: true, generado: true });
      setEditando(false);
    } catch (err) {
      setError(err.message);
    }
    setGuardando(false);
  }

  if (editando) {
    return (
      <li className="revision-linea revision-editando">
        <p className="revision-original">{e.original}</p>
        <label>
          Español
          <input value={borrador.es} onChange={x => setBorrador({ ...borrador, es: x.target.value })} />
        </label>
        <label>
          Inglés
          <input value={borrador.en} onChange={x => setBorrador({ ...borrador, en: x.target.value })} />
        </label>
        <label>
          Sinónimos (separados por comas)
          <input value={borrador.otros} onChange={x => setBorrador({ ...borrador, otros: x.target.value })} />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="revision-botones">
          <button type="button" className="boton-principal" onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
          <button type="button" className="boton-secundario" onClick={() => setEditando(false)} disabled={guardando}>
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="revision-linea">
      <button type="button" className="revision-boton" onClick={abrir}>
        <span className="revision-nombres">
          <span className="revision-original">{e.original}</span>
          <span> → </span>
          <strong>{e.es}</strong>
          <span> · {e.en}</span>
        </span>
        {e.otros.length > 0 && <span className="revision-otros">{e.otros.join(', ')}</span>}
        {!e.generado && <span className="revision-marca">Sin traducir</span>}
        {e.corregido && <span className="revision-marca">Corregido</span>}
      </button>
    </li>
  );
}

export default function GrupoRevision({ clave, elementos, siguiente, revisado }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [hecho, setHecho] = useState(revisado);

  async function terminar() {
    setEnviando(true);
    setError('');
    try {
      await enviar({ clave, accion: 'grupo', elementos: elementos.map(({ tipo, original }) => ({ tipo, original })) });
      setHecho(true);
      if (siguiente) {
        window.location.href = siguiente;
        return;
      }
    } catch (err) {
      setError(err.message);
    }
    setEnviando(false);
  }

  return (
    <>
      <ul className="lista">
        {elementos.map(e => (
          <Linea key={`${e.tipo}-${e.original}`} clave={clave} inicial={e} />
        ))}
      </ul>
      {error && <p className="error">{error}</p>}
      <div className="revision-pie">
        {hecho && <p className="aviso">Este grupo ya está revisado.</p>}
        <button type="button" className="boton-principal revision-siguiente" onClick={terminar} disabled={enviando}>
          {enviando ? 'Guardando…' : siguiente ? 'Siguiente grupo' : 'Terminar'}
        </button>
      </div>
    </>
  );
}
