'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import BorrarCaja from '../components/BorrarCaja';
import Llenado from '../sitio/[id]/Llenado';
import { textos } from '../../lib/textos';

const ORDEN_TIPOS = ['P', 'C', 'O', 'M', 'L', 'D', 'A', 'U', 'R', 'otros'];

const T = {
  es: { tipo: 'Tipo de caja', sinRevisarDesde: 'Sin revisar desde', sinRevisar: 'Sin revisar', nCajas: n => `${n} ${n === 1 ? 'caja' : 'cajas'}`, revisadaEl: d => `Revisada el ${d}` },
  en: { tipo: 'Box type', sinRevisarDesde: 'Not checked since', sinRevisar: 'Not checked', nCajas: n => `${n} ${n === 1 ? 'box' : 'boxes'}`, revisadaEl: d => `Checked on ${d}` },
};

// Cajas: filtros (tipo de caja, sin revisar desde un día, sin revisar nunca) y una fila por caja con su resumen
// de artículos, cuándo se revisó, y para quien edita el selector de llenado y el ✕ para borrarla.
export default function ListaCajas({ cajas, idioma, puedeEditar }) {
  const t = textos(idioma);
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const [tipo, setTipo] = useState('');
  const [desde, setDesde] = useState('');
  const [nunca, setNunca] = useState(false);

  const tipos = useMemo(() => {
    const hay = new Set(cajas.map(c => c.letra || 'otros'));
    return ORDEN_TIPOS.filter(l => hay.has(l));
  }, [cajas]);

  const visibles = useMemo(() => {
    const limite = desde ? new Date(`${desde}T00:00:00`) : null;
    return cajas.filter(c => {
      if (tipo && (c.letra || 'otros') !== tipo) return false;
      if (nunca && c.revisada) return false;
      if (limite && c.revisada && new Date(c.revisada) >= limite) return false;
      return true;
    });
  }, [cajas, tipo, desde, nunca]);

  const dia = f => new Intl.DateTimeFormat(idioma === 'en' ? 'en-GB' : 'es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short' }).format(new Date(f));

  return (
    <>
      <div className="esc esc-filtros cajas-filtros">
        <label>
          {x.tipo}
          <select value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="">{t.todos}</option>
            {tipos.map(l => <option key={l} value={l}>{t.tipos[l] || l}</option>)}
          </select>
        </label>
        <label>
          {x.sinRevisarDesde}
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="cajas-fecha" />
        </label>
        <label className="cajas-tick">
          <input type="checkbox" checked={nunca} onChange={e => setNunca(e.target.checked)} />
          {x.sinRevisar}
        </label>
        <span className="esc-gris cajas-contador">{x.nCajas(visibles.length)}</span>
      </div>
      <ul className="lista-cajas">
        {visibles.map(c => (
          <li key={c.id} className="lista-cajas-fila">
            <Link href={`/sitio/${c.id}`} className="lista-cajas-nombre">
              <strong>{c.codigo || c.nombre}</strong>
              {c.codigo && c.nombre ? ` ${c.nombre}` : ''}
              <span className="lista-cajas-resumen">{t.nArticulos(c.articulos)} · {t.nUnidades(c.unidades)}</span>
            </Link>
            {c.revisada && <span className="lista-cajas-revisada">{x.revisadaEl(dia(c.revisada))}</span>}
            {puedeEditar ? (
              <span className="lista-cajas-acciones">
                <Llenado sitioId={c.id} llenado={c.llenado} idioma={idioma} soloVer={false} />
                <BorrarCaja sitioId={c.id} codigo={c.codigo || c.nombre} idioma={idioma} />
              </span>
            ) : (
              <span className="lista-cajas-llenado">{c.llenado ? t.llenado[c.llenado] : ''}</span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
