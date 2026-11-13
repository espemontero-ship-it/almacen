'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';
import { textos } from '../../lib/textos';
import { ordenarTallas } from '../../lib/tallas.cjs';

const ORDEN_TIPOS = ['P', 'C', 'O', 'M', 'L', 'D', 'A', 'U', 'R', 'otros'];

export default function TablaTodo({ filas, idioma }) {
  const t = textos(idioma);
  const [tipo, setTipo] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [estado, setEstado] = useState('');
  const [abiertos, setAbiertos] = useState(() => new Set());

  const etiquetas = useMemo(
    () => [...new Set(filas.flatMap(f => f.etiquetas))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
    [filas]
  );

  const articulos = useMemo(() => {
    const porId = new Map();
    for (const f of filas) {
      if (tipo && (tipo === 'otros' ? f.letra : f.letra !== tipo)) continue;
      if (etiqueta && !f.etiquetas.includes(etiqueta)) continue;
      if (estado === 'roto' && !(f.rotos > 0)) continue;
      if (estado === 'bueno' && !(f.rotos < f.cantidad)) continue;
      let a = porId.get(f.articulo_id);
      if (!a) {
        a = { id: f.articulo_id, nombre: f.nombre, etiquetas: f.etiquetas, total: 0, rotos: 0, cajas: [], porTalla: {} };
        porId.set(f.articulo_id, a);
      }
      a.total += f.cantidad;
      a.rotos += f.rotos;
      a.cajas.push({ fila: f.id, id: f.sitio_id, texto: f.codigo || f.sitio_nombre, cantidad: f.cantidad, rotos: f.rotos, talla: f.talla });
      if (f.talla) a.porTalla[f.talla] = (a.porTalla[f.talla] || 0) + f.cantidad;
    }
    return [...porId.values()].map(a => {
      const tallas = ordenarTallas(Object.keys(a.porTalla));
      const orden = new Map(tallas.map((x, i) => [x, i]));
      const cajas = [...a.cajas].sort((x, y) => (orden.get(x.talla) ?? -1) - (orden.get(y.talla) ?? -1));
      return { ...a, tallas, cajas, textoCajas: [...new Set(a.cajas.map(c => c.texto))].join(', ') };
    }).sort((x, y) => x.nombre.localeCompare(y.nombre, 'es', { sensitivity: 'base', ignorePunctuation: true }));
  }, [filas, tipo, etiqueta, estado]);

  function alternar(id) {
    setAbiertos(previo => {
      const nuevo = new Set(previo);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  return (
    <section className="todo">
      <div className="filtros">
        <label>
          {t.tipoCaja}
          <select value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="">{t.todos}</option>
            {ORDEN_TIPOS.map(valor => (
              <option key={valor} value={valor}>{t.tipos[valor]}</option>
            ))}
          </select>
        </label>
        <label>
          {t.etiqueta}
          <select value={etiqueta} onChange={e => setEtiqueta(e.target.value)}>
            <option value="">{t.todas}</option>
            {etiquetas.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
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
      </div>
      <p className="aviso">{t.nArticulos(articulos.length)}</p>
      <table className="tabla">
        <thead>
          <tr>
            <th>
              <div className="rejilla">
                <span className="col-articulo">{t.articulo}</span>
                <span className="col-etiquetas">{t.etiquetas}</span>
                <span className="col-estado">{t.estado}</span>
                <span className="col-total">{t.total}</span>
                <span className="col-cajas">{t.cajas}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {articulos.map(a => {
            const abierto = abiertos.has(a.id);
            const desplegable = a.cajas.length > 1 || a.tallas.length > 1;
            const contenido = (
              <>
                <span className="col-articulo">
                  <span className="flecha" aria-hidden="true">{desplegable ? (abierto ? '▾' : '▸') : ''}</span>
                  <span className="nombre-y-extra">
                    <span className="nombre-tabla">{a.nombre}</span>
                    <span className="extra-movil">
                      <span className="etiquetas-tabla">
                        {a.etiquetas.length > 0 && `${a.etiquetas.join(' · ')} · `}
                        {a.rotos > 0 ? <span className="estado-roto">{t.rotos(a.rotos)}</span> : t.bueno}
                      </span>
                    </span>
                  </span>
                </span>
                <span className="col-etiquetas">{a.etiquetas.join(' · ')}</span>
                <span className={a.rotos > 0 ? 'col-estado estado-roto' : 'col-estado'}>
                  {a.rotos > 0 ? t.rotos(a.rotos) : t.bueno}
                </span>
                <span className="col-total">{a.total}</span>
                <span className="col-cajas">{a.textoCajas}</span>
              </>
            );
            return (
              <Fragment key={a.id}>
                <tr className={abierto ? 'fila-abierta' : undefined}>
                  <td>
                    {desplegable ? (
                      <button
                        type="button"
                        className="rejilla boton-fila"
                        aria-expanded={abierto}
                        onClick={() => alternar(a.id)}
                      >
                        {contenido}
                      </button>
                    ) : (
                      <div className="rejilla boton-fila fila-fija">{contenido}</div>
                    )}
                  </td>
                </tr>
                {desplegable && abierto && (
                  <tr className="detalle">
                    <td>
                      {a.tallas.length > 0 && (
                        <p className="detalle-tallas">{a.tallas.map(x => `${x} ${a.porTalla[x]}`).join(' · ')}</p>
                      )}
                      <ul className="detalle-cajas">
                        {a.cajas.map(c => (
                          <li key={c.fila}>
                            <Link href={`/sitio/${c.id}`} className="fila fila-enlace">
                              <span className="fila-texto">
                                <span className="codigo">{c.texto}</span>
                                {c.talla && <span className="estado">{t.talla} {c.talla}</span>}
                                <span className={c.rotos > 0 ? 'estado estado-roto' : 'estado'}>
                                  {c.rotos > 0 ? t.buenasRotas(c.cantidad - c.rotos, c.rotos) : t.bueno}
                                </span>
                              </span>
                              <span className="fila-dato">{c.cantidad}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
