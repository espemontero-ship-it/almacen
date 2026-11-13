'use client';

import { useMemo, useState } from 'react';
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

  const etiquetas = useMemo(
    () => [...new Set(filas.flatMap(f => f.etiquetas))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
    [filas]
  );

  const visibles = useMemo(
    () =>
      filas.filter(f => {
        if (tipo && (tipo === 'otros' ? f.letra : f.letra !== tipo)) return false;
        if (etiqueta && !f.etiquetas.includes(etiqueta)) return false;
        if (estado && f.estado !== estado) return false;
        return true;
      }),
    [filas, tipo, etiqueta, estado]
  );

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
      <p className="aviso">{visibles.length} {visibles.length === 1 ? 'fila' : 'filas'}</p>
      <table className="tabla">
        <thead>
          <tr>
            <th>Caja</th>
            <th>Artículo</th>
            <th className="numero">Cantidad</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map(f => (
            <tr key={f.id}>
              <td>
                <Link href={`/sitio/${f.sitio_id}`} className="enlace-celda codigo">
                  {f.codigo || f.sitio_nombre}
                </Link>
              </td>
              <td>
                <Link href={`/articulo/${f.articulo_id}`} className="enlace-celda">
                  {f.nombre}
                  {f.estado === 'roto' && <span className="estado-roto"> · Roto</span>}
                </Link>
              </td>
              <td className="numero">{f.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
