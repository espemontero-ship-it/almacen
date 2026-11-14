'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { textos } from '../../lib/textos';
import { ordenarTallas } from '../../lib/tallas.cjs';
import NombreEditable from './NombreEditable';

function agrupar(filas) {
  const porId = new Map();
  for (const f of filas) {
    let a = porId.get(f.articulo_id);
    if (!a) {
      a = { id: f.articulo_id, nombre: f.nombre, sinonimos: f.sinonimos || [], foto_url: f.foto_url, etiquetas: f.etiquetas, total: 0, rotos: 0, cajas: [], porTalla: {} };
      porId.set(f.articulo_id, a);
    }
    a.total += f.cantidad;
    a.rotos += f.rotos;
    a.cajas.push({ fila: f.id, id: f.sitio_id, texto: f.codigo || f.sitio_nombre, cantidad: f.cantidad, rotos: f.rotos, talla: f.talla });
    if (f.talla) a.porTalla[f.talla] = (a.porTalla[f.talla] || 0) + f.cantidad;
  }
  return [...porId.values()]
    .map(a => ({ ...a, tallas: ordenarTallas(Object.keys(a.porTalla)), textoCajas: [...new Set(a.cajas.map(c => c.texto))].join(', ') }))
    .sort((x, y) => x.nombre.localeCompare(y.nombre, 'es', { sensitivity: 'base', ignorePunctuation: true }));
}

function Img({ url, nombre, clase }) {
  return url ? (
    <span className={`esc-foto ${clase || ''}`}>
      <img src={url} alt={nombre} loading="lazy" />
    </span>
  ) : (
    <span className={`esc-foto esc-foto-vacia ${clase || ''}`} aria-hidden="true" />
  );
}

export default function Escritorio({ filas, idioma, conFiltros = true, orden = null, aviso = null, puedeEditar = false }) {
  const t = textos(idioma);
  const en = idioma === 'en';
  const [etiqueta, setEtiqueta] = useState('');
  const [estado, setEstado] = useState('');
  const [conFoto, setConFoto] = useState(false);
  const [vista, setVista] = useState('cuadricula');  const [abiertos, setAbiertos] = useState(() => new Set());

  const todos = useMemo(() => {
    const lista = agrupar(filas);
    if (!orden) return lista;
    const pos = new Map(orden.map((id, i) => [id, i]));
    return lista.sort((x, y) => (pos.get(x.id) ?? 1e9) - (pos.get(y.id) ?? 1e9));
  }, [filas, orden]);
  const etiquetas = useMemo(
    () => [...new Set(filas.flatMap(f => f.etiquetas))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
    [filas]
  );
  const articulos = todos.filter(a => {
    if (etiqueta && !a.etiquetas.includes(etiqueta)) return false;
    if (estado === 'roto' && !(a.rotos > 0)) return false;
    if (estado === 'bueno' && !(a.rotos < a.total)) return false;
    if (conFoto && !a.foto_url) return false;
    return true;
  });

  const estadoTexto = a => (a.rotos > 0 ? t.buenasRotas(a.total - a.rotos, a.rotos) : t.bueno);
  const tallasTexto = a => (a.tallas.length ? a.tallas.map(s => `${s} ${a.porTalla[s]}`).join(' · ') : null);

  function alternar(id) {
    setAbiertos(p => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <div className="esc">
      <main className="esc-main">
        {aviso && <p className="esc-aviso">{aviso}</p>}
        <div className="esc-filtros">
          {conFiltros && (<>
          <label>
            {t.etiqueta}
            <select value={etiqueta} onChange={e => setEtiqueta(e.target.value)}>
              <option value="">{t.todas}</option>
              {etiquetas.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </label>
          <label>
            {t.estado}
            <select value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="">{t.todos}</option>
              <option value="bueno">{t.bueno}</option>
              <option value="roto">{t.roto}</option>
            </select>
          </label>
          <label className="esc-tick">
            <input type="checkbox" checked={conFoto} onChange={e => setConFoto(e.target.checked)} />
            {t.conFoto}
          </label>
          </>)}
          <span className="esc-contador">{t.nArticulos(articulos.length)}</span>
          <span className="esc-vistas">
            <button type="button" className={vista === 'cuadricula' ? 'esc-vista-activa' : ''} onClick={() => setVista('cuadricula')}>{en ? 'Grid' : 'Cuadrícula'}</button>
            <button type="button" className={vista === 'lista' ? 'esc-vista-activa' : ''} onClick={() => setVista('lista')}>{en ? 'List' : 'Lista'}</button>
          </span>
        </div>

        {vista === 'cuadricula' ? (
          <ul className="esc-cuadricula">
            {articulos.map(a => (
              <li key={a.id}>
                <Link href={`/articulo/${a.id}`} className="esc-tarjeta">
                  <Img url={a.foto_url} nombre={a.nombre} clase="esc-foto-cuadrada" />
                  <NombreEditable articuloId={a.id} nombre={a.nombre} sinonimos={a.sinonimos} idioma={idioma} puedeEditar={puedeEditar} className="esc-nombre" enlace={`/articulo/${a.id}`} />
                  <span className="esc-gris">{a.etiquetas.join(' · ')}</span>
                  {a.rotos > 0 && <span className="estado-roto">{estadoTexto(a)}</span>}
                  {tallasTexto(a) && <span className="esc-gris">{tallasTexto(a)}</span>}
                  <span><strong>{a.total}</strong> <span className="esc-gris">{t.enTotal} · {a.textoCajas}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <table className="esc-tabla esc-lista-B">
            <thead>
              <tr>
                <th className="esc-c-foto" />
                <th>{t.articulo}</th>
                <th className="esc-num">{t.total}</th>
                <th>{t.cajas}</th>
                <th>{t.estado}</th>
                <th>{t.etiquetas}</th>
              </tr>
            </thead>
            <tbody>
              {articulos.map(a => {
                const desplegable = a.cajas.length > 1 || a.tallas.length > 1;
                const abierto = abiertos.has(a.id);
                return (
                  <Fragment key={a.id}>
                    <tr className={desplegable ? 'esc-fila-desplegable' : undefined} onClick={desplegable ? () => alternar(a.id) : undefined}>
                      <td className="esc-c-foto"><Img url={a.foto_url} nombre={a.nombre} clase="esc-foto-40" /></td>
                      <td>
                        <span className="esc-flecha">{desplegable ? (abierto ? '▾' : '▸') : ''}</span>
                        {puedeEditar ? (
                          <NombreEditable articuloId={a.id} nombre={a.nombre} sinonimos={a.sinonimos} idioma={idioma} puedeEditar className="esc-nombre" enlace={`/articulo/${a.id}`} />
                        ) : (
                          <Link href={`/articulo/${a.id}`} className="esc-nombre" onClick={e => e.stopPropagation()}>{a.nombre}</Link>
                        )}
                        {tallasTexto(a) && <span className="esc-sub">{tallasTexto(a)}</span>}
                      </td>
                      <td className="esc-num"><strong>{a.total}</strong></td>
                      <td className="esc-gris">{a.textoCajas}</td>
                      <td className={a.rotos > 0 ? 'estado-roto' : 'esc-gris'}>{estadoTexto(a)}</td>
                      <td className="esc-gris">{a.etiquetas.join(' · ')}</td>
                    </tr>
                    {desplegable && abierto && (
                      <tr className="esc-detalle">
                        <td />
                        <td colSpan={5}>
                          {a.cajas.map(c => (
                            <Link key={c.fila} href={`/sitio/${c.id}`} className="esc-caja-linea">
                              <strong>{c.texto}</strong>
                              {c.talla && <span> · {t.talla} {c.talla}</span>}
                              <span> · {c.cantidad}</span>
                              {c.rotos > 0 && <span className="estado-roto"> · {t.rotos(c.rotos)}</span>}
                            </Link>
                          ))}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
