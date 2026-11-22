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
    anadirCaja: 'Añadir caja',
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
    anadirCaja: 'Add box',
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

  return (
    <div className="inv-cajas">
      <p className="inv-acciones">
        {progreso && <strong className="inv-progreso">{progreso}</strong>}
        {puedeEditar && <Link href="/caja-nueva?inventario=1" className="boton-secundario">{x.anadirCaja}</Link>}
        {cerrar}
      </p>
      {error && <p className="error">{error}</p>}
      <h2 className="grupo-titulo inv-subtitulo">{x.pendientes(pendientes.length)}</h2>
      {pendientes.length === 0 && <p className="aviso">{x.ninguna}</p>}
      <ul className="lista inv-lista-cajas">
        {pendientes.map(c => (
          <li key={c.id} className="inv-caja">
            <span className="inv-caja-datos">
              <Link href={`/sitio/${c.id}`} className="inv-caja-nombre">{nombreCaja(c)}</Link>
              <span className="esc-gris inv-caja-sub">
                {c.ultima_cuando ? x.ultima(fecha(c.ultima_cuando, idioma), c.ultima_por) : x.nunca}
                {c.en_curso && <> · <strong className="inv-en-curso">{x.enCurso}</strong></>}
              </span>
            </span>
            {puedeEditar && (
              <span className="inv-caja-botones">
                <button type="button" className="boton-secundario" disabled={marcando !== null} onClick={() => marcar(c.id)}>
                  {marcando === c.id ? x.marcando : x.marcar}
                </button>
                <BorrarCaja sitioId={c.id} codigo={c.codigo} idioma={idioma} />
              </span>
            )}
          </li>
        ))}
      </ul>
      {revisadas.length > 0 && (
        <>
          <h2 className="grupo-titulo inv-subtitulo">{x.revisadas(revisadas.length)}</h2>
          <ul className="lista inv-lista-cajas">
            {revisadas.map(c => (
              <li key={c.id} className="inv-caja">
                <span className="inv-caja-datos">
                  <Link href={`/sitio/${c.id}`} className="inv-caja-nombre">{nombreCaja(c)}</Link>
                  <span className="esc-gris inv-caja-sub">{x.revisadaPor(fecha(c.cuando, idioma), c.usuario_nombre)}</span>
                </span>
                {puedeEditar && (
                  <span className="inv-caja-botones">
                    <BorrarCaja sitioId={c.id} codigo={c.codigo} idioma={idioma} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
