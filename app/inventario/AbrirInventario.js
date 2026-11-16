'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const T = {
  es: {
    abrir: 'Abrir inventario', abrirlo: 'Abrir', cancelar: 'Cancelar',
    general: 'General: todas las cajas', tipos: 'Por tipo de caja', sueltas: 'Cajas individuales',
    otros: 'Otros sitios', error: 'No se ha podido abrir.',
  },
  en: {
    abrir: 'Open inventory', abrirlo: 'Open', cancelar: 'Cancel',
    general: 'General: all boxes', tipos: 'By box type', sueltas: 'Single boxes',
    otros: 'Other places', error: 'Could not be opened.',
  },
};

// Abrir un inventario: general, por tipos (casillas con cuántas cajas tiene cada tipo) o eligiendo cajas con su casilla.
export default function AbrirInventario({ idioma, tipos, cajas }) {
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [forma, setForma] = useState('general');
  const [letras, setLetras] = useState(() => new Set());
  const [elegidas, setElegidas] = useState(() => new Set());
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const alternar = (conjunto, poner) => v => {
    const n = new Set(conjunto);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    poner(n);
  };

  async function abrir() {
    setError('');
    setEnviando(true);
    try {
      const r = await fetch('/api/editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'abrirInventario', forma, letras: [...letras], cajas: [...elegidas] }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || '');
      router.refresh();
    } catch (err) {
      setError(err.message || x.error);
    } finally {
      setEnviando(false);
    }
  }

  if (!abierto) {
    return <button type="button" className="boton-secundario" onClick={() => setAbierto(true)}>{x.abrir}</button>;
  }

  const listo = forma === 'general' || (forma === 'tipos' && letras.size) || (forma === 'cajas' && elegidas.size);
  return (
    <div className="inv-abrir">
      {[['general', x.general], ['tipos', x.tipos], ['cajas', x.sueltas]].map(([v, texto]) => (
        <label key={v} className="casilla">
          <input type="radio" name="forma" value={v} checked={forma === v} onChange={() => setForma(v)} />
          {texto}
        </label>
      ))}
      {forma === 'tipos' && (
        <div className="inv-opciones">
          {tipos.map(tp => (
            <label key={tp.letra} className="casilla">
              <input type="checkbox" checked={letras.has(tp.letra)} onChange={() => alternar(letras, setLetras)(tp.letra)} />
              {tp.letra === 'otros' ? x.otros : tp.texto} · {tp.cajas}
            </label>
          ))}
        </div>
      )}
      {forma === 'cajas' && (
        <div className="inv-opciones inv-opciones-cajas">
          {cajas.map(c => (
            <label key={c.id} className="casilla">
              <input type="checkbox" checked={elegidas.has(c.id)} onChange={() => alternar(elegidas, setElegidas)(c.id)} />
              {c.texto}
            </label>
          ))}
        </div>
      )}
      <div className="inv-abrir-botones">
        <button type="button" className="boton-principal" disabled={!listo || enviando} onClick={abrir}>{x.abrirlo}</button>
        <button type="button" className="boton-secundario" onClick={() => setAbierto(false)}>{x.cancelar}</button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
