'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

// Nombre de un artículo. Quien puede editar hace doble clic sobre él y se vuelven editables, en el mismo sitio,
// el nombre (del idioma que se ve) y debajo sus sinónimos (una sola lista, la misma en los dos idiomas).
// Los sinónimos solo se ven mientras se edita. Cada uno se guarda al salir de él; Enter guarda y cierra todo;
// Esc cancela; pulsar fuera de los dos cierra.
export default function NombreEditable({ articuloId, nombre, sinonimos = [], idioma, puedeEditar, className, enlace }) {
  const router = useRouter();
  const en = idioma === 'en';
  const [valor, setValor] = useState(nombre);
  const [lista, setLista] = useState(sinonimos || []);
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState('');
  const temporizador = useRef(null);
  const zona = useRef(null);
  const cajaNombre = useRef(null);
  const cajaSinonimos = useRef(null);
  const terminado = useRef(false);

  useEffect(() => {
    if (!editando || !cajaNombre.current) return;
    const el = cajaNombre.current;
    el.focus();
    const rango = document.createRange();
    rango.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(rango);
  }, [editando]);

  if (!puedeEditar) return <span className={className}>{valor}</span>;

  async function enviar(cuerpo) {
    const r = await fetch('/api/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: articuloId, ...cuerpo }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || '');
    return d;
  }

  async function guardarNombre() {
    if (!cajaNombre.current) return true;
    const nuevo = cajaNombre.current.textContent.replace(/\s+/g, ' ').trim();
    if (!nuevo || nuevo === valor) return true;
    try {
      await enviar({ accion: 'nombre', idioma, nombre: nuevo });
      setValor(nuevo);
      return true;
    } catch (err) {
      setError(err.message || (en ? 'Could not be saved.' : 'No se ha podido guardar.'));
      return false;
    }
  }

  async function guardarSinonimos() {
    if (!cajaSinonimos.current) return true;
    const nueva = [...new Set(cajaSinonimos.current.textContent.split(',').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean))];
    if (nueva.join('|') === lista.join('|')) return true;
    try {
      const d = await enviar({ accion: 'sinonimos', sinonimos: nueva });
      setLista(d.nombres?.otros || nueva);
      return true;
    } catch (err) {
      setError(err.message || (en ? 'Could not be saved.' : 'No se ha podido guardar.'));
      return false;
    }
  }

  async function cerrar() {
    if (terminado.current) return;
    terminado.current = true;
    const a = await guardarNombre();
    const b = await guardarSinonimos();
    setEditando(false);
    if (a && b) router.refresh();
  }

  function cancelar() {
    terminado.current = true;
    setError('');
    setEditando(false);
  }

  function alClic(e) {
    if (editando) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (!enlace) return;
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => router.push(enlace), 250);
  }

  function alDobleClic(e) {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(temporizador.current);
    if (editando) return;
    terminado.current = false;
    setError('');
    setEditando(true);
  }

  const teclas = e => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); cerrar(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelar(); }
  };

  if (!editando) {
    return (
      <span className={className} onClick={alClic} onDoubleClick={alDobleClic}>
        {valor}
        {error && <span className="nombre-error"> {error}</span>}
      </span>
    );
  }

  return (
    <span
      ref={zona}
      className={`${className || ''} nombre-zona`}
      onClick={alClic}
      onDoubleClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onBlur={e => {
        if (terminado.current) return;
        if (zona.current && zona.current.contains(e.relatedTarget)) {
          if (e.target === cajaNombre.current) guardarNombre();
          return;
        }
        cerrar();
      }}
    >
      <span
        ref={cajaNombre}
        className="nombre-editando"
        contentEditable
        suppressContentEditableWarning
        onKeyDown={teclas}
      >
        {valor}
      </span>
      <span className="sinonimos-editando">
        {en ? 'Synonyms' : 'Sinónimos'}:{' '}
        <span
          ref={cajaSinonimos}
          className="nombre-editando"
          contentEditable
          suppressContentEditableWarning
          onKeyDown={teclas}
        >
          {lista.join(', ')}
        </span>
      </span>
      {error && <span className="nombre-error">{error}</span>}
    </span>
  );
}
