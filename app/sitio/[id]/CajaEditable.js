'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Foto from '../../components/Foto';
import BotonFoto from '../../components/BotonFoto';
import NombreEditable from '../../components/NombreEditable';
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

const T2 = {
  es: { anadirComentario: 'Añadir comentario', cant: 'Cant.', comentario: 'Comentario', quitarCorto: 'Quitar', articulo: 'Artículo', etiquetas: 'Etiquetas', foto: 'Foto', sinComentario: 'Sin comentario', opciones: 'Caja (provisional):' },
  en: { anadirComentario: 'Add comment', cant: 'Qty', comentario: 'Comment', quitarCorto: 'Remove', articulo: 'Item', etiquetas: 'Tags', foto: 'Photo', sinComentario: 'No comment', opciones: 'Box (provisional):' },
};

// Foto con el botón de la cámara como icono pequeño en su esquina.
function FotoCamara({ c, x, actualizar }) {
  return (
    <span className="cx-foto">
      <Foto url={c.foto_url} nombre={c.nombre} />
      <span className="cx-camara">
        <BotonFoto articuloId={c.articulo_id} etiqueta={x.foto} onSubida={url => actualizar(c.id, { foto_url: url })} />
      </span>
    </span>
  );
}

// Títulos de columna de las tablas (versiones 1 y 2), una sola vez arriba.
function CabeceraTabla({ version, idioma }) {
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const y = T2[idioma === 'en' ? 'en' : 'es'];
  return (
    <li className={`cx-cab cx-cab-${version}`} aria-hidden="true">
      <span>{y.foto}</span>
      <span>{y.articulo}</span>
      <span className="cx-num">{x.cantidad}</span>
      <span className="cx-num">{x.rotas}</span>
      {version === '1' && <span>{y.comentario}</span>}
      {version === '1' && <span>{y.etiquetas}</span>}
      <span />
    </li>
  );
}

// Una línea de la caja: solo datos; cantidad, rotas y comentario se cambian con doble clic.
// version: '1' tabla compacta, '2' tabla con foto grande, '3' tarjeta.
// Cantidad y rotas: − número +. Cada pulsación se guarda al momento.
function Numero({ valor, min = 0, max, onCambio, etiqueta, className = '' }) {
  const limitar = n => Math.max(min, max != null ? Math.min(max, n) : n);
  return (
    <span className="num-pasos">
      <button type="button" className="num-boton" aria-label={`${etiqueta} −`} disabled={valor <= min} onClick={() => onCambio(limitar(valor - 1))}>−</button>
      <span className={`num-valor ${className}`}>{valor}</span>
      <button type="button" className="num-boton" aria-label={`${etiqueta} +`} disabled={max != null && valor >= max} onClick={() => onCambio(limitar(valor + 1))}>+</button>
    </span>
  );
}

// Comentario: casilla visible siempre; se guarda con Enter o al salir.
function CampoComentario({ valor, onGuardar, pista, etiqueta }) {
  const [texto, setTexto] = useState(valor || '');
  useEffect(() => setTexto(valor || ''), [valor]);
  function confirmar() {
    const t = texto.replace(/\s+/g, ' ').trim();
    if (t !== (valor || '')) onGuardar(t);
  }
  return (
    <input
      className="cx-coment-campo"
      value={texto}
      placeholder={pista}
      aria-label={etiqueta}
      onChange={e => setTexto(e.target.value)}
      onBlur={confirmar}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
        if (e.key === 'Escape') { e.preventDefault(); setTexto(valor || ''); }
      }}
    />
  );
}

function Linea({ c, idioma, version, actualizar, onQuitada }) {
  const t = textos(idioma);
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const y = T2[idioma === 'en' ? 'en' : 'es'];
  const [aviso, setAviso] = useState('');
  const [confirmar, setConfirmar] = useState(false);

  async function guardar(cuerpo, cambios) {
    const anterior = { ...c };
    actualizar(c.id, cambios);
    setAviso('');
    try {
      const { fila } = await editar(cuerpo);
      if (fila) actualizar(c.id, fila);
    } catch (err) {
      actualizar(c.id, anterior);
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

  const nombre = (
    <NombreEditable articuloId={c.articulo_id} nombre={c.nombre} sinonimos={c.sinonimos} idioma={idioma} puedeEditar className="nombre-articulo" />
  );
  const talla = c.talla ? `${t.talla} ${c.talla}` : null;
  const etiquetasTexto = c.etiquetas?.length ? c.etiquetas.join(' · ') : null;
  const cantidad = (
    <Numero
      valor={c.cantidad}
      etiqueta={x.cantidad}
      className="cx-cantidad"
      onCambio={n => guardar({ accion: 'cantidad', id: c.id, cantidad: n }, { cantidad: n, rotos: Math.min(c.rotos, n) })}
    />
  );
  const rotas = (
    <Numero
      valor={c.rotos}
      max={c.cantidad}
      etiqueta={x.rotas}
      className={c.rotos > 0 ? 'cx-rotas estado-roto' : 'cx-rotas'}
      onCambio={n => guardar({ accion: 'rotos', id: c.id, rotos: n }, { rotos: n })}
    />
  );
  const comentario = (
    <CampoComentario
      valor={c.comentarios || ''}
      pista={y.anadirComentario}
      etiqueta={x.comentarios}
      onGuardar={v => guardar({ accion: 'comentarios', id: c.id, comentarios: v }, { comentarios: v || null })}
    />
  );
  const botonQuitar = (
    <button type="button" className="cx-quitar" onClick={() => setConfirmar(true)}>{y.quitarCorto}</button>
  );
  const extras = (
    <>
      {aviso && <p className="aviso cx-aviso">{aviso}</p>}
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
    </>
  );

  if (version === 'tarjeta') {
    // Misma tarjeta que el inicio (Cuadrícula), con los datos editables con doble clic.
    return (
      <li>
        <div className="esc-tarjeta cx-tarjeta">
          <FotoCamara c={c} x={x} actualizar={actualizar} />
          <NombreEditable articuloId={c.articulo_id} nombre={c.nombre} sinonimos={c.sinonimos} idioma={idioma} puedeEditar className="esc-nombre" />
          {(talla || etiquetasTexto) && <span className="esc-gris">{[talla, etiquetasTexto].filter(Boolean).join(' · ')}</span>}
          <span className="esc-gris cx-pares"><span className="cx-par">{y.cant} {cantidad}</span><span className="cx-par">{x.rotas} {rotas}</span></span>
          <span className="esc-gris">{comentario}</span>
          <span>{botonQuitar}</span>
        </div>
        {extras}
      </li>
    );
  }

  return (
    <li className={`cx-t cx-t${version}`}>
      <FotoCamara c={c} x={x} actualizar={actualizar} />
      <div className="cx-datos">
        {nombre}
        {(version === '2' || talla) && (
          <span className="cx-meta cx-meta-movil">{[talla, etiquetasTexto].filter(Boolean).join(' · ')}</span>
        )}
        <span className={version === '2' ? 'cx-coment-linea' : 'cx-coment-linea cx-solo-movil'}>{comentario}</span>
      </div>
      <div className="cx-solo-movil cx-numeros-movil">
        <span className="cx-num-movil"><span className="cx-rotulo">{x.cantidad}</span>{cantidad}</span>
        <span className="cx-num-movil"><span className="cx-rotulo">{x.rotas}</span>{rotas}</span>
        {botonQuitar}
      </div>
      <span className="cx-num cx-col-cantidad cx-solo-escritorio">{cantidad}</span>
      <span className="cx-num cx-col-rotas cx-solo-escritorio">{rotas}</span>
      {version === '1' && <span className="cx-col-comentario cx-solo-escritorio">{comentario}</span>}
      {version === '1' && <span className="cx-col-etiquetas cx-solo-escritorio">{etiquetasTexto}</span>}
      <span className="cx-col-quitar cx-solo-escritorio">{botonQuitar}</span>
      {extras}
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

// Caja: igual que el inicio, con botón Cuadrícula / Lista en el ordenador.
// Lista: una fila por artículo (dos columnas en el ordenador). Cuadrícula: las tarjetas del inicio.
// En el móvil, solo la lista.
export default function CajaEditable({ sitioId, contenido, etiquetas, idioma }) {
  const router = useRouter();
  const en = idioma === 'en';
  const [lineas, setLineas] = useState(contenido);
  const [vista, setVista] = useState('lista');
  useEffect(() => setLineas(contenido), [contenido]);
  useEffect(() => {
    const guardada = window.localStorage.getItem('caja-vista');
    if (guardada === 'lista' || guardada === 'cuadricula') setVista(guardada);
  }, []);

  function elegir(v) {
    setVista(v);
    window.localStorage.setItem('caja-vista', v);
  }

  function actualizar(id, cambios) {
    setLineas(l => l.map(v => (v.id === id ? { ...v, ...cambios } : v)));
  }

  function quitada(id) {
    setLineas(l => l.filter(v => v.id !== id));
  }

  const comunes = { idioma, actualizar, onQuitada: quitada };

  return (
    <>
      <div className="esc solo-escritorio cx-barra-vistas">
        <span className="esc-vistas">
          <button type="button" className={vista === 'cuadricula' ? 'esc-vista-activa' : ''} onClick={() => elegir('cuadricula')}>{en ? 'Grid' : 'Cuadrícula'}</button>
          <button type="button" className={vista === 'lista' ? 'esc-vista-activa' : ''} onClick={() => elegir('lista')}>{en ? 'List' : 'Lista'}</button>
        </span>
      </div>
      {vista === 'cuadricula' && (
        <ul className="esc-cuadricula cx-cuadricula solo-escritorio">
          {lineas.map(c => <Linea key={c.id} c={c} version="tarjeta" {...comunes} />)}
        </ul>
      )}
      <ul className={vista === 'cuadricula' ? 'lista cx-lista cx-lista-2 solo-movil' : 'lista cx-lista cx-lista-2 cx-dos-columnas'}>
        <CabeceraTabla version="2" idioma={idioma} />
        <CabeceraTabla version="2" idioma={idioma} />
        {lineas.map(c => <Linea key={c.id} c={c} version="2" {...comunes} />)}
      </ul>
      <div className="pie-edicion">
        <AnadirArticulo sitioId={sitioId} etiquetas={etiquetas} idioma={idioma} onHecho={() => router.refresh()} />
      </div>
    </>
  );
}
