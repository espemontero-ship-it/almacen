'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Foto from '../../components/Foto';
import BotonFoto from '../../components/BotonFoto';
import { textos } from '../../../lib/textos';
import { ordenarTallas } from '../../../lib/tallas.cjs';

const TALLAS_LETRA = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'];

const T = {
  es: {
    rotas: 'Rotas',
    comentarios: 'Comentarios',
    guardar: 'Guardar',
    guardado: 'Guardado',
    quitar: 'Quitar de la caja',
    confirmarQuitar: n => `¿Quitar «${n}» de esta caja?`,
    si: 'Sí, quitar',
    no: 'Cancelar',
    anadir: 'Añadir artículo',
    buscarArticulo: 'Escribe el artículo',
    cantidad: 'Cantidad',
    talla: 'Talla',
    otraTalla: 'Otra talla',
    anadirBoton: 'Añadir',
    crear: q => `Crear «${q}»`,
    nombreEs: 'Nombre en español',
    nombreEn: 'Nombre en inglés',
    etiquetas: 'Etiquetas',
    esRopa: 'Es ropa (tiene tallas)',
    crearBoton: 'Crear y añadir',
    cerrar: 'Cerrar',
    foto: 'Hacer foto',
    error: 'No se ha podido guardar.',
  },
  en: {
    rotas: 'Broken',
    comentarios: 'Comments',
    guardar: 'Save',
    guardado: 'Saved',
    quitar: 'Remove from box',
    confirmarQuitar: n => `Remove “${n}” from this box?`,
    si: 'Yes, remove',
    no: 'Cancel',
    anadir: 'Add item',
    buscarArticulo: 'Type the item',
    cantidad: 'Quantity',
    talla: 'Size',
    otraTalla: 'Other size',
    anadirBoton: 'Add',
    crear: q => `Create “${q}”`,
    nombreEs: 'Name in Spanish',
    nombreEn: 'Name in English',
    etiquetas: 'Tags',
    esRopa: 'It is clothing (has sizes)',
    crearBoton: 'Create and add',
    cerrar: 'Close',
    foto: 'Take photo',
    error: 'Could not be saved.',
  },
};

async function editar(cuerpo) {
  const r = await fetch('/api/editar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || '');
  return datos;
}

function Contador({ valor, onCambio, etiqueta, min = 0, max }) {
  return (
    <span className="contador" role="group" aria-label={etiqueta}>
      <button type="button" className="contador-boton" onClick={() => onCambio(Math.max(min, valor - 1))} disabled={valor <= min} aria-label="−">−</button>
      <input
        className="contador-valor"
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={valor}
        onChange={e => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onCambio(Math.max(min, max != null ? Math.min(max, n) : n));
        }}
      />
      <button type="button" className="contador-boton" onClick={() => onCambio(max != null ? Math.min(max, valor + 1) : valor + 1)} disabled={max != null && valor >= max} aria-label="+">+</button>
    </span>
  );
}

function Linea({ inicial, idioma, onQuitada }) {
  const t = textos(idioma);
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const [c, setC] = useState(inicial);
  const [abierta, setAbierta] = useState(false);
  const [comentario, setComentario] = useState(inicial.comentarios || '');
  const [aviso, setAviso] = useState('');
  const [confirmar, setConfirmar] = useState(false);

  async function guardar(cuerpo, siguiente) {
    const anterior = c;
    setC(siguiente);
    setAviso('');
    try {
      const { fila } = await editar(cuerpo);
      if (fila) setC(v => ({ ...v, ...fila }));
    } catch (err) {
      setC(anterior);
      setAviso(err.message || x.error);
    }
  }

  async function guardarComentario() {
    setAviso('');
    try {
      await editar({ accion: 'comentarios', id: c.id, comentarios: comentario });
      setC(v => ({ ...v, comentarios: comentario.trim() || null }));
      setAviso(x.guardado);
    } catch (err) {
      setAviso(err.message || x.error);
    }
  }

  async function quitar() {
    try {
      await editar({ accion: 'quitar', id: c.id });
      onQuitada(c.id);
    } catch (err) {
      setConfirmar(false);
      setAviso(err.message || x.error);
    }
  }

  return (
    <li className="fila-editable">
      <div className="fila fila-articulo">
        <span className="foto-columna">
          <Foto url={c.foto_url} nombre={c.nombre} />
          <BotonFoto articuloId={c.articulo_id} etiqueta={x.foto} onSubida={url => setC(v => ({ ...v, foto_url: url }))} />
        </span>
        <button type="button" className="fila-texto boton-nombre" onClick={() => setAbierta(!abierta)} aria-expanded={abierta}>
          <span className="nombre-articulo">{c.nombre}</span>
          {c.talla && <span className="estado">{t.talla} {c.talla}</span>}
          <span className={c.rotos > 0 ? 'estado estado-roto' : 'estado'}>
            {c.rotos > 0 ? t.buenasRotas(c.cantidad - c.rotos, c.rotos) : t.bueno}
          </span>
          {c.comentarios && !abierta && <span className="comentarios">{c.comentarios}</span>}
        </button>
        <Contador
          etiqueta={x.cantidad}
          valor={c.cantidad}
          onCambio={n => guardar({ accion: 'cantidad', id: c.id, cantidad: n }, { ...c, cantidad: n, rotos: Math.min(c.rotos, n) })}
        />
      </div>
      {abierta && (
        <div className="fila-detalle">
          <label className="detalle-campo">
            {x.rotas}
            <Contador
              etiqueta={x.rotas}
              valor={c.rotos}
              max={c.cantidad}
              onCambio={n => guardar({ accion: 'rotos', id: c.id, rotos: n }, { ...c, rotos: n })}
            />
          </label>
          <label className="detalle-campo detalle-columna">
            {x.comentarios}
            <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={2} />
          </label>
          <div className="revision-botones">
            <button type="button" className="boton-secundario" onClick={guardarComentario}>{x.guardar}</button>
            <button type="button" className="boton-secundario" onClick={() => setConfirmar(true)}>{x.quitar}</button>
          </div>
        </div>
      )}
      {aviso && <p className="aviso">{aviso}</p>}
      {confirmar && (
        <div className="dialogo-fondo" role="dialog" aria-modal="true">
          <div className="dialogo">
            <p>{x.confirmarQuitar(c.nombre)}</p>
            <div className="revision-botones">
              <button type="button" className="boton-principal" onClick={quitar}>{x.si}</button>
              <button type="button" className="boton-secundario" onClick={() => setConfirmar(false)}>{x.no}</button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function AnadirArticulo({ sitioId, etiquetas, idioma, onHecho }) {
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [elegido, setElegido] = useState(null);
  const [creando, setCreando] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [talla, setTalla] = useState('');
  const [nuevo, setNuevo] = useState({ es: '', en: '', etiquetas: [], ropa: false });
  const [error, setError] = useState('');

  async function buscar(q) {
    setTexto(q);
    setElegido(null);
    setCreando(false);
    if (q.trim().length < 2) {
      setSugerencias([]);
      return;
    }
    const r = await fetch(`/api/sugerencias?q=${encodeURIComponent(q.trim())}`);
    if (r.ok) {
      const d = await r.json();
      setSugerencias(d.lista.filter(s => s.tipo === 'articulo'));
    }
  }

  function reiniciar() {
    setTexto('');
    setSugerencias([]);
    setElegido(null);
    setCreando(false);
    setCantidad(1);
    setTalla('');
    setNuevo({ es: '', en: '', etiquetas: [], ropa: false });
    setError('');
  }

  async function anadir() {
    setError('');
    try {
      await editar({ accion: 'anadir', sitioId, articuloId: elegido.id, cantidad, talla });
      reiniciar();
      onHecho();
    } catch (err) {
      setError(err.message || x.error);
    }
  }

  async function crear() {
    setError('');
    try {
      await editar({ accion: 'crearArticulo', sitioId, cantidad, talla, ...nuevo });
      reiniciar();
      onHecho();
    } catch (err) {
      setError(err.message || x.error);
    }
  }

  if (!abierto) {
    return (
      <button type="button" className="boton-principal boton-ancho" onClick={() => setAbierto(true)}>
        {x.anadir}
      </button>
    );
  }

  const tallasElegido = elegido ? ordenarTallas([...(elegido.tallas || [])]) : [];

  const selectorTalla = lista => (
    <label className="detalle-campo detalle-columna">
      {x.talla}
      <select value={talla} onChange={e => setTalla(e.target.value)}>
        <option value="">—</option>
        {lista.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <input placeholder={x.otraTalla} value={lista.includes(talla) ? '' : talla} onChange={e => setTalla(e.target.value.toUpperCase())} />
    </label>
  );

  return (
    <div className="anadir">
      <div className="anadir-cabecera">
        <h2 className="grupo-titulo">{x.anadir}</h2>
        <button type="button" className="boton-texto" onClick={() => { reiniciar(); setAbierto(false); }}>{x.cerrar}</button>
      </div>
      <input value={texto} onChange={e => buscar(e.target.value)} placeholder={x.buscarArticulo} autoComplete="off" />
      {!elegido && !creando && texto.trim().length >= 2 && (
        <ul className="lista">
          {sugerencias.map(s => (
            <li key={s.id}>
              <button type="button" className="sugerencia boton-ancho-texto" onClick={() => { setElegido(s); setSugerencias([]); }}>
                <span className="sugerencia-texto"><strong>{s.nombre}</strong></span>
                <span className="sugerencia-dato">{s.total}</span>
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="sugerencia boton-ancho-texto"
              onClick={() => { setCreando(true); setNuevo(n => ({ ...n, es: texto.trim() })); }}
            >
              <strong>{x.crear(texto.trim())}</strong>
            </button>
          </li>
        </ul>
      )}
      {elegido && (
        <div className="formulario">
          <p><strong>{elegido.nombre}</strong></p>
          {tallasElegido.length > 0 && selectorTalla(tallasElegido)}
          <label className="detalle-campo">
            {x.cantidad}
            <Contador etiqueta={x.cantidad} valor={cantidad} min={1} onCambio={setCantidad} />
          </label>
          <button type="button" className="boton-principal" onClick={anadir} disabled={tallasElegido.length > 0 && !talla}>
            {x.anadirBoton}
          </button>
        </div>
      )}
      {creando && (
        <div className="formulario">
          <label>
            {x.nombreEs}
            <input value={nuevo.es} onChange={e => setNuevo({ ...nuevo, es: e.target.value })} />
          </label>
          <label>
            {x.nombreEn}
            <input value={nuevo.en} onChange={e => setNuevo({ ...nuevo, en: e.target.value })} />
          </label>
          <fieldset className="etiquetas-elegir">
            <legend>{x.etiquetas}</legend>
            {etiquetas.map(e => (
              <label key={e.id} className="casilla">
                <input
                  type="checkbox"
                  checked={nuevo.etiquetas.includes(e.id)}
                  onChange={ev =>
                    setNuevo({
                      ...nuevo,
                      etiquetas: ev.target.checked ? [...nuevo.etiquetas, e.id] : nuevo.etiquetas.filter(i => i !== e.id),
                    })
                  }
                />
                {e.nombre}
              </label>
            ))}
          </fieldset>
          <label className="casilla">
            <input type="checkbox" checked={nuevo.ropa} onChange={e => setNuevo({ ...nuevo, ropa: e.target.checked })} />
            {x.esRopa}
          </label>
          {nuevo.ropa && selectorTalla(TALLAS_LETRA)}
          <label className="detalle-campo">
            {x.cantidad}
            <Contador etiqueta={x.cantidad} valor={cantidad} min={1} onCambio={setCantidad} />
          </label>
          <button type="button" className="boton-principal" onClick={crear} disabled={!nuevo.es.trim() || (nuevo.ropa && !talla)}>
            {x.crearBoton}
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default function CajaEditable({ sitioId, contenido, etiquetas, idioma }) {
  const router = useRouter();
  const [lineas, setLineas] = useState(contenido);
  useEffect(() => setLineas(contenido), [contenido]);
  return (
    <>
      <ul className="lista">
        {lineas.map(c => (
          <Linea key={c.id} inicial={c} idioma={idioma} onQuitada={id => setLineas(l => l.filter(v => v.id !== id))} />
        ))}
      </ul>
      <div className="pie-edicion">
        <AnadirArticulo sitioId={sitioId} etiquetas={etiquetas} idioma={idioma} onHecho={() => router.refresh()} />
      </div>
    </>
  );
}
