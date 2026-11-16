'use client';

import { useMemo, useState } from 'react';

// Ordenar una tabla tocando el título de la columna: la primera vez de menor a mayor (A→Z), la segunda al revés,
// con ▲ / ▼ junto al título. Sin tocar nada, el orden de siempre. `claves`: columna → función que da el valor.
function comparar(a, b) {
  const vacioA = a === null || a === undefined || a === '';
  const vacioB = b === null || b === undefined || b === '';
  if (vacioA || vacioB) return vacioA === vacioB ? 0 : vacioA ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'es', { sensitivity: 'base', numeric: true, ignorePunctuation: true });
}

export function useOrden(lista, claves) {
  const [orden, setOrden] = useState(null);
  const ordenados = useMemo(() => {
    if (!orden || !claves[orden.col]) return lista;
    const valor = claves[orden.col];
    const signo = orden.dir === 'asc' ? 1 : -1;
    return [...lista].sort((x, y) => {
      const vx = valor(x);
      const vy = valor(y);
      const vacio = v => v === null || v === undefined || v === '';
      if (vacio(vx) || vacio(vy)) return comparar(vx, vy);
      return signo * comparar(vx, vy);
    });
  }, [lista, orden, claves]);

  function alternar(col) {
    setOrden(o => (o && o.col === col ? { col, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' }));
  }

  // Título de columna que ordena al tocarlo.
  function titulo(col, children) {
    const activo = orden && orden.col === col;
    return (
      <button type="button" className={activo ? 'orden-titulo orden-activo' : 'orden-titulo'} aria-sort={activo ? (orden.dir === 'asc' ? 'ascending' : 'descending') : undefined} onClick={() => alternar(col)}>
        {children}
        <span className="orden-flecha" aria-hidden="true">{activo ? (orden.dir === 'asc' ? ' ▲' : ' ▼') : ''}</span>
      </button>
    );
  }

  return { ordenados, titulo, orden };
}
