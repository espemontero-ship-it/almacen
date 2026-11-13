'use client';

import { Fragment, useMemo, useState } from 'react';
import Link from 'next/link';

const TIPOS = [
  ['P', 'P · Props'],
  ['C', 'C · Cocina'],
  ['O', 'O · Oficina'],
  ['M', 'M · Matress'],
  ['L', 'L · Lighting'],
  ['D', 'D · Drawer'],
  ['A', 'A · Zonas'],
  ['U', 'U · Uniformes'],
  ['R', 'R · Rental'],
  ['otros', 'Otros sitios'],
];

export default function TablaTodo({ filas }) {
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
      if (estado && f.estado !== estado) continue;
      let a = porId.get(f.articulo_id);
      if (!a) {
        a = { id: f.articulo_id, nombre: f.nombre, total: 0, cajas: [] };
        porId.set(f.articulo_id, a);
      }
      a.total += f.cantidad;
      a.cajas.push({ fila: f.id, id: f.sitio_id, texto: f.codigo || f.sitio_nombre, cantidad: f.cantidad, estado: f.estado });
    }
    return [...porId.values()].sort((x, y) => x.nombre.localeCompare(y.nombre, 'es', { sensitivity: 'base', ignorePunctuation: true }));
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
          Tipo de caja
          <select value={tipo} onChange={e => setTipo(e.target.value)}>
            <option value="">Todos</option>
            {TIPOS.map(([valor, texto]) => (
              <option key={valor} value={valor}>{texto}</option>
            ))}
          </select>
        </label>
        <label>
          Etiqueta
          <select value={etiqueta} onChange={e => setEtiqueta(e.target.value)}>
            <option value="">Todas</option>
            {etiquetas.map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </label>
        <label>
          Estado
          <select value={estado} onChange={e => setEstado(e.target.value)}>
            <option value="">Todos</option>
            <option value="bueno">Bueno</option>
            <option value="roto">Roto</option>
          </select>
        </label>
      </div>
      <p className="aviso">{articulos.length} {articulos.length === 1 ? 'artículo' : 'artículos'}</p>
      <table className="tabla">
        <thead>
          <tr>
            <th>Artículo</th>
            <th className="numero">Total</th>
            <th>Cajas</th>
          </tr>
        </thead>
        <tbody>
          {articulos.map(a => {
            const abierto = abiertos.has(a.id);
            if (a.total === 1) {
              return (
                <tr key={a.id}>
                  <td colSpan={3}>
                    <div className="boton-fila fila-fija">
                      <span className="col-articulo">
                        <span className="flecha" aria-hidden="true" />
                        {a.nombre}
                      </span>
                      <span className="col-total">{a.total}</span>
                      <span className="col-cajas">{a.cajas.map(c => c.texto).join(', ')}</span>
                    </div>
                  </td>
                </tr>
              );
            }
            return (
              <Fragment key={a.id}>
                <tr className={abierto ? 'fila-abierta' : undefined}>
                  <td colSpan={3} className="celda-boton">
                    <button
                      type="button"
                      className="boton-fila"
                      aria-expanded={abierto}
                      onClick={() => alternar(a.id)}
                    >
                      <span className="col-articulo">
                        <span className="flecha" aria-hidden="true">{abierto ? '▾' : '▸'}</span>
                        {a.nombre}
                      </span>
                      <span className="col-total">{a.total}</span>
                      <span className="col-cajas">{a.cajas.map(c => c.texto).join(', ')}</span>
                    </button>
                  </td>
                </tr>
                {abierto && (
                  <tr className="detalle">
                    <td colSpan={3}>
                      <ul className="detalle-cajas">
                        {a.cajas.map(c => (
                          <li key={c.fila}>
                            <Link href={`/sitio/${c.id}`} className="fila fila-enlace">
                              <span className="fila-texto">
                                <span className="codigo">{c.texto}</span>
                                {c.estado === 'roto' && <span className="estado estado-roto">Roto</span>}
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
