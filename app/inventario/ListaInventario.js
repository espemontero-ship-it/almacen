'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BorrarCaja from '../components/BorrarCaja';

const T = {
  es: {
    pendientes: n => `Pendientes (${n})`,
    revisadas: n => `Revisadas (${n})`,
    ninguna: 'No queda ninguna pendiente.',
    marcar: 'Revisada',
    marcando: 'Marcando…',
    ultima: (f, q) => `Última: ${f}${q ? ` · ${q}` : ''}`,
    nunca: 'Nunca',
    enCurso: 'En revisión',
    revisadaPor: (f, q) => `${f}${q ? ` · ${q}` : ''}`,
    anadirCaja: 'Añadir caja', colCaja: 'Caja', colFecha: 'Última revisión', colAcciones: 'Acciones',
    error: 'No se ha podido marcar.',
  },
  en: {
    pendientes: n => `Pending (${n})`,
    revisadas: n => `Checked (${n})`,
    ninguna: 'Nothing pending.',
    marcar: 'Checked',
    marcando: 'Marking…',
    ultima: (f, q) => `Last: ${f}${q ? ` · ${q}` : ''}`,
    nunca: 'Never',
    enCurso: 'Being checked',
    revisadaPor: (f, q) => `${f}${q ? ` · ${q}` : ''}`,
    anadirCaja: 'Add box', colCaja: 'Box', colFecha: 'Last check', colAcciones: 'Actions',
    error: 'Could not be marked.',
  },
};

function fecha(f, idioma) {
  return new Intl.DateTimeFormat(idioma === 'en' ? 'en-GB' : 'es-ES', {
    timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(f));
}

const nombreCaja = c => [c.codigo, c.nombre].filter(Boolean).join(' ');

// Inventario abierto: todas sus cajas, primero las pendientes. Cada caja se abre tocándola; quien edita puede
// marcarla revisada con un toque (como "Caja revisada" con todo bien) o borrarla con su ✕. "Añadir caja" crea
// una caja que entra en este inventario.
export default function ListaInventario({ pendientes, revisadas, idioma, puedeEditar, cerrar = null, progreso = '' }) {
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const router = useRouter();
  const [marcando, setMarcando] = useState(null);
  const [error, setError] = useState('');

  async function marcar(id) {
    setError('');
    setMarcando(id);
    try {
      const r = await fetch('/api/editar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'revisarCaja', sitioId: id }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || '');
      router.refresh();
    } catch (err) {
      setError(err.message || x.error);
    } finally {
      setMarcando(null);
    }
  }

  // Ordenar tocando el título (Caja o Última revisión): ▲ y luego ▼; lo vacío ("Nunca") siempre al final.
  // El mismo orden vale para Pendientes y Revisadas.
  const [orden, setOrden] = useState(null);
  const alternar = col => setOrden(o => (o && o.col === col ? { col, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' }));
  const ordenar = (lista, fechaDe) => {
    if (!orden) return lista;
    const signo = orden.dir === 'asc' ? 1 : -1;
    const valor = c => (orden.col === 'caja' ? nombreCaja(c) : fechaDe(c) ? new Date(fechaDe(c)).getTime() : null);
    return [...lista].sort((a, b) => {
      const va = valor(a);
      const vb = valor(b);
      if (va === null || vb === null) return va === vb ? 0 : va === null ? 1 : -1;
      if (typeof va === 'number') return signo * (va - vb);
      return signo * String(va).localeCompare(String(vb), 'es', { numeric: true, sensitivity: 'base' });
    });
  };
  const titulo = (col, texto) => {
    const activo = orden && orden.col === col;
    return (
      <button type="button" className={activo ? 'orden-titulo orden-activo' : 'orden-titulo'} aria-sort={activo ? (orden.dir === 'asc' ? 'ascending' : 'descending') : undefined} onClick={() => alternar(col)}>
        {texto}<span className="orden-flecha" aria-hidden="true">{activo ? (orden.dir === 'asc' ? ' ▲' : ' ▼') : ''}</span>
      </button>
    );
  };

  const tabla = (lista, fechaDe, porDe, esPendiente) => (
    <table className="inv-tabla">
      <thead>
        <tr>
          <th>{titulo('caja', x.colCaja)}</th>
          <th>{titulo('fecha', x.colFecha)}</th>
          {puedeEditar && <th aria-label={x.colAcciones} />}
        </tr>
      </thead>
      <tbody>
        {ordenar(lista, fechaDe).map(c => (
          <tr key={c.id}>
            <td>
              <Link href={`/sitio/${c.id}`} className="inv-caja-nombre">{nombreCaja(c)}</Link>
              {esPendiente && c.en_curso && <span className="inv-en-curso"> · {x.enCurso}</span>}
            </td>
            <td className="inv-col-fecha">
              {fechaDe(c) ? (
                <>
                  {fecha(fechaDe(c), idioma)}
                  {porDe(c) && <span className="esc-gris inv-caja-sub">{porDe(c)}</span>}
                </>
              ) : <span className="esc-gris">{x.nunca}</span>}
            </td>
            {puedeEditar && (
              <td className="inv-col-botones">
                <span className="inv-caja-botones">
                  {esPendiente && (
                    <button type="button" className="boton-secundario" disabled={marcando !== null} onClick={() => marcar(c.id)}>
                      {marcando === c.id ? x.marcando : x.marcar}
                    </button>
                  )}
                  <BorrarCaja sitioId={c.id} codigo={c.codigo} idioma={idioma} />
                </span>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="inv-cajas">
      <p className="inv-acciones">
        {progreso && <strong className="inv-progreso">{progreso}</strong>}
        {puedeEditar && <Link href="/caja-nueva?inventario=1" className="boton-secundario">{x.anadirCaja}</Link>}
        {cerrar}
      </p>
      {error && <p className="error">{error}</p>}
      <h2 className="grupo-titulo inv-subtitulo">{x.pendientes(pendientes.length)}</h2>
      {pendientes.length === 0 ? <p className="aviso">{x.ninguna}</p> : tabla(pendientes, c => c.ultima_cuando, c => c.ultima_por, true)}
      {revisadas.length > 0 && (
        <>
          <h2 className="grupo-titulo inv-subtitulo">{x.revisadas(revisadas.length)}</h2>
          {tabla(revisadas, c => c.cuando, c => c.usuario_nombre, false)}
        </>
      )}
    </div>
  );
}
