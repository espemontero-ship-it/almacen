'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import BorrarCaja from '../components/BorrarCaja';
import Llenado from '../sitio/[id]/Llenado';
import { useOrden } from '../components/Ordenar';
import { textos } from '../../lib/textos';

const ORDEN_TIPOS = ['P', 'C', 'O', 'M', 'L', 'D', 'A', 'U', 'R', 'otros'];
const ORDEN_LLENADO = { vacia: 0, medias: 1, llena: 2 };

// Columnas que se ordenan tocando su título. "Caja" ordena por el orden de la app (P, C, O… y número).
const CLAVES = {
  caja: c => c.posicion,
  articulos: c => c.articulos,
  unidades: c => c.unidades,
  revisada: c => (c.revisada ? new Date(c.revisada).getTime() : null),
  llenado: c => ORDEN_LLENADO[c.llenado] ?? null,
};

const T = {
  es: {
    tipo: 'Tipo de caja', revision: 'Revisión', todas: 'Todas', nuncaRevisadas: 'Nunca revisadas', sinRevisarDesde: 'Sin revisar desde…', nCajas: n => `${n} ${n === 1 ? 'caja' : 'cajas'}`,
    caja: 'Caja', articulos: 'Artículos', unidades: 'Unidades', revisada: 'Revisada', llenado: 'Llenado', revisadaEl: d => `Revisada el ${d}`,
  },
  en: {
    tipo: 'Box type', revision: 'Check', todas: 'All', nuncaRevisadas: 'Never checked', sinRevisarDesde: 'Not checked since…', nCajas: n => `${n} ${n === 1 ? 'box' : 'boxes'}`,
    caja: 'Box', articulos: 'Items', unidades: 'Units', revisada: 'Checked', llenado: 'Fill', revisadaEl: d => `Checked on ${d}`,
  },
};

// Cajas: filtros (tipo de caja, sin revisar desde un día, sin revisar nunca) y una tabla con títulos que ordenan:
// caja, artículos, unidades, cuándo se revisó y llenado (para quien edita, el selector y el ✕ para borrarla).
export default function ListaCajas({ cajas, idioma, puedeEditar }) {
  const t = textos(idioma);
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const [tipo, setTipo] = useState('');
  const [desde, setDesde] = useState('');
  // Revisión (elegido por ella): un desplegable con Todas · Nunca revisadas · Sin revisar desde… (con su fecha).
  const [revision, setRevision] = useState('');
  const nunca = revision === 'nunca';

  const conPosicion = useMemo(() => cajas.map((c, i) => ({ ...c, posicion: i })), [cajas]);
  const tipos = useMemo(() => {
    const hay = new Set(cajas.map(c => c.letra || 'otros'));
    return ORDEN_TIPOS.filter(l => hay.has(l));
  }, [cajas]);

  const filtradas = useMemo(() => {
    const limite = revision === 'desde' && desde ? new Date(`${desde}T00:00:00`) : null;
    return conPosicion.filter(c => {
      if (tipo && (c.letra || 'otros') !== tipo) return false;
      if (nunca && c.revisada) return false;
      if (limite && c.revisada && new Date(c.revisada) >= limite) return false;
      return true;
    });
  }, [conPosicion, tipo, desde, nunca, revision]);
  const { ordenados: visibles, titulo } = useOrden(filtradas, CLAVES);

  const dia = f => new Intl.DateTimeFormat(idioma === 'en' ? 'en-GB' : 'es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short' }).format(new Date(f));

  return (
    <>
      <div className="esc esc-filtros cajas-filtros">
        <label>
          <span className="solo-escritorio">{x.tipo}</span><span className="solo-movil">{idioma === 'en' ? 'Type' : 'Tipo'}</span>
          <select value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="">{t.todos}</option>
            {tipos.map(l => <option key={l} value={l}>{t.tipos[l] || l}</option>)}
          </select>
        </label>
        <label>
          {x.revision}
          <select value={revision} onChange={e => setRevision(e.target.value)}>
            <option value="">{x.todas}</option>
            <option value="nunca">{x.nuncaRevisadas}</option>
            <option value="desde">{x.sinRevisarDesde}</option>
          </select>
        </label>
        {revision === 'desde' && (
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="cajas-fecha" aria-label={x.sinRevisarDesde} />
        )}
        <span className="esc-gris cajas-contador">{x.nCajas(visibles.length)}</span>
      </div>
      <ul className={puedeEditar ? 'lista-cajas cajas-tabla cajas-tabla-edicion' : 'lista-cajas cajas-tabla'}>
        <li className="cajas-cab">
          <span>{titulo('caja', x.caja)}</span>
          <span className="cajas-num">{titulo('articulos', x.articulos)}</span>
          <span className="cajas-num">{titulo('unidades', x.unidades)}</span>
          <span className="cajas-col-revisada">{titulo('revisada', x.revisada)}</span>
          <span>{titulo('llenado', x.llenado)}</span>
          {puedeEditar && <span />}
        </li>
        {visibles.map(c => (
          <li key={c.id} className="lista-cajas-fila">
            <Link href={`/sitio/${c.id}`} className="lista-cajas-nombre">
              <strong>{c.codigo || c.nombre}</strong>
              {c.codigo && c.nombre ? ` ${c.nombre}` : ''}
              {c.revisada && <span className="cajas-revisada-movil">{x.revisadaEl(dia(c.revisada))}</span>}
            </Link>
            <span className="cajas-num">{c.articulos}</span>
            <span className="cajas-num">{c.unidades}</span>
            <span className="lista-cajas-revisada cajas-col-revisada">{c.revisada ? dia(c.revisada) : ''}</span>
            {puedeEditar ? (
              <>
                <span><Llenado sitioId={c.id} llenado={c.llenado} idioma={idioma} soloVer={false} /></span>
                <span><BorrarCaja sitioId={c.id} codigo={c.codigo || c.nombre} idioma={idioma} /></span>
              </>
            ) : (
              <span className="lista-cajas-llenado">{c.llenado ? t.llenado[c.llenado] : ''}</span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
