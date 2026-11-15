'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Foto from '../../components/Foto';
import BotonFoto from '../../components/BotonFoto';
import NombreEditable from '../../components/NombreEditable';
import BorrarCaja from '../../components/BorrarCaja';
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
function FotoCamara({ c, x, actualizar, soloVer }) {
  return (
    <span className="cx-foto">
      <Foto url={c.foto_url} nombre={c.nombre} />
      <span className="cx-camara">
        {!soloVer && <BotonFoto articuloId={c.articulo_id} etiqueta={x.foto} onSubida={url => actualizar(c.id, { foto_url: url })} />}
      </span>
    </span>
  );
}

// Títulos de columna de las tablas (versiones 1 y 2), una sola vez arriba.
// version: 'fila' (Lista, como la del inicio) o 'tarjeta' (Cuadrícula).
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

// Inventario: lo que se añade a cada artículo mientras se revisa la caja.
const R = {
  es: {
    hacer: 'Hacer inventario', revisando: (c, n, t) => `Revisando ${c} · Quedan ${t - n} de ${t}`, todoBien: 'Todo está bien', leyenda: 'Haz click para marcarlo como revisado o pulsa Caja revisada si la caja está correcta', estanBien: 'Están bien',
    esta: '✓ Está', comprobado: '✓ Comprobado', noEsta: 'No está', faltaFoto: 'Falta foto', hacerFoto: 'Hacer foto', saltar: 'Saltar',
    comoEsta: '¿Cómo está la caja?', revisada: 'Caja revisada', quedan: n => `Quedan ${n} sin comprobar.`, quitarlos: 'Quitarlos', volver: 'Volver',
    hecha: 'Caja revisada. Gracias.', siguiente: 'Siguiente caja sin revisar', visto: '✓ Visto', marcarVisto: 'Marcar visto', revisandoSolo: c => `Revisando ${c}`, revisadosTitulo: n => `Revisados (${n})`, quitar: 'Quitar', comentario: '+ Comentario', porRevisarTitulo: n => `Por revisar (${n})`, verRevisados: n => `Ver revisados (${n})`, ocultarRevisados: n => `Ocultar revisados (${n})`,
  },
  en: {
    hacer: 'Take inventory', revisando: (c, n, t) => `Checking ${c} · ${t - n} of ${t} left`, todoBien: 'All is fine', leyenda: 'Click an item to mark it as checked, or press Box checked if the box is correct', estanBien: 'They are fine',
    esta: '✓ It is here', comprobado: '✓ Checked', noEsta: 'Not here', faltaFoto: 'Missing photo', hacerFoto: 'Take photo', saltar: 'Skip',
    comoEsta: 'How full is the box?', revisada: 'Box checked', quedan: n => `${n} still unchecked.`, quitarlos: 'Remove them', volver: 'Back',
    hecha: 'Box checked. Thanks.', siguiente: 'Next unchecked box', visto: '✓ Seen', marcarVisto: 'Mark as seen', revisandoSolo: c => `Checking ${c}`, revisadosTitulo: n => `Checked (${n})`, quitar: 'Remove', comentario: '+ Comment', porRevisarTitulo: n => `To check (${n})`, verRevisados: n => `Show checked (${n})`, ocultarRevisados: n => `Hide checked (${n})`,
  },
};

// Inventario: el ✕ para quitar, "Falta foto · Hacer foto · Saltar" al marcar un artículo sin foto.
function Aspa({ c, r, onClick }) {
  return <button type="button" className="inv-aspa" aria-label={`${r.quitar}: ${c.nombre}`} title={r.quitar} onClick={onClick}>✕</button>;
}

function PideFoto({ c, r, revision, actualizar }) {
  if (!revision.comprobados.has(c.id) || c.foto_url || revision.saltadas.has(c.id)) return null;
  return (
    <span className="inv-pide-foto">
      <span>{r.faltaFoto}</span>
      <span className="inv-pide-foto-camara"><BotonFoto articuloId={c.articulo_id} etiqueta={r.hacerFoto} onSubida={url => actualizar(c.id, { foto_url: url })} /></span>
      <button type="button" className="boton-texto" onClick={() => revision.saltar(c.id)}>{r.saltar}</button>
    </span>
  );
}

function Linea({ c, idioma, version, actualizar, onQuitada, soloVer = false, revision = null }) {
  const r = R[idioma === 'en' ? 'en' : 'es'];
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
    <NombreEditable articuloId={c.articulo_id} nombre={c.nombre} sinonimos={c.sinonimos} idioma={idioma} puedeEditar={!soloVer} className="nombre-articulo" />
  );
  const talla = c.talla ? `${t.talla} ${c.talla}` : null;
  const etiquetasTexto = c.etiquetas?.length ? c.etiquetas.join(' · ') : null;
  const cantidad = soloVer ? <span className="cx-valor-solo cx-cantidad">{c.cantidad}</span> : (
    <Numero
      valor={c.cantidad}
      etiqueta={x.cantidad}
      className="cx-cantidad"
      onCambio={n => guardar({ accion: 'cantidad', id: c.id, cantidad: n }, { cantidad: n, rotos: Math.min(c.rotos, n) })}
    />
  );
  const rotas = soloVer ? <span className={c.rotos > 0 ? 'cx-valor-solo estado-roto' : 'cx-valor-solo'}>{c.rotos}</span> : (
    <Numero
      valor={c.rotos}
      max={c.cantidad}
      etiqueta={x.rotas}
      className={c.rotos > 0 ? 'cx-rotas estado-roto' : 'cx-rotas'}
      onCambio={n => guardar({ accion: 'rotos', id: c.id, rotos: n }, { rotos: n })}
    />
  );
  const comentario = soloVer ? (c.comentarios ? <span className="cx-comentario-solo">{c.comentarios}</span> : null) : (
    <CampoComentario
      valor={c.comentarios || ''}
      pista={y.anadirComentario}
      etiqueta={x.comentarios}
      onGuardar={v => guardar({ accion: 'comentarios', id: c.id, comentarios: v }, { comentarios: v || null })}
    />
  );
  const botonQuitar = soloVer ? null : (
    <button type="button" className="cx-quitar" onClick={() => setConfirmar(true)}>{y.quitarCorto}</button>
  );
  const enRevision = revision && !soloVer ? <PideFoto c={c} r={r} revision={revision} actualizar={actualizar} /> : null;
  // Inventario (A): se marca tocando el artículo en una zona libre (no foto, números, comentario, botones ni campos).
  const tocar = revision && !soloVer ? e => {
    if (e.target.closest('button, input, textarea, select, a, label, .cx-foto, .boton-foto-envoltura')) return;
    revision.alternar(c.id);
  } : undefined;
  // Quitar: aspa arriba a la derecha del artículo, siempre (con y sin inventario), en lugar del "Quitar" de antes.
  const aspa = !soloVer ? <Aspa c={c} r={r} onClick={() => setConfirmar(true)} /> : null;
  const quitarOAspa = aspa ? null : botonQuitar;
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

  if (version === 'fila') {
    // Igual que una fila de la Lista del inicio (Escritorio.js), con − + en Total y Rotas, Comentario y ✕.
    return (
      <tr className={tocar ? 'inv-tocable' : undefined} onClick={tocar}>
        <td className="esc-c-foto">
          {c.foto_url ? (
            <span className="esc-foto esc-foto-40"><img src={c.foto_url} alt={c.nombre} loading="lazy" /></span>
          ) : (
            <span className="esc-foto esc-foto-vacia esc-foto-40" aria-hidden="true" />
          )}
        </td>
        <td>
          <span className="esc-flecha" />
          <NombreEditable articuloId={c.articulo_id} nombre={c.nombre} sinonimos={c.sinonimos} idioma={idioma} puedeEditar={!soloVer} className="esc-nombre" />
          {talla && <span className="esc-sub">{talla}</span>}
          {enRevision}
          {extras}
        </td>
        <td className="esc-num">{cantidad}</td>
        <td className="esc-num">{rotas}</td>
        <td className="esc-gris">{comentario}</td>
        <td className="cx-td-aspa">{aspa}</td>
      </tr>
    );
  }

  if (version === 'tarjeta') {
    // Misma tarjeta que el inicio (Cuadrícula), con los datos editables con doble clic.
    return (
      <li>
        <div className={tocar ? 'esc-tarjeta cx-tarjeta tarjeta-con-aspa inv-tocable' : 'esc-tarjeta cx-tarjeta tarjeta-con-aspa'} onClick={tocar}>
          {/* ✕ en la esquina de la tarjeta, montado sobre su borde (fuera de la foto) */}
          {aspa && <span className="aspa-esquina-tarjeta">{aspa}</span>}
          <FotoCamara c={c} x={x} actualizar={actualizar} soloVer={soloVer} />
          <NombreEditable articuloId={c.articulo_id} nombre={c.nombre} sinonimos={c.sinonimos} idioma={idioma} puedeEditar={!soloVer} className="esc-nombre" />
          {(talla || etiquetasTexto) && <span className="esc-gris">{[talla, etiquetasTexto].filter(Boolean).join(' · ')}</span>}
          <span className="esc-gris cx-pares"><span className="cx-par">{y.cant} {cantidad}</span><span className="cx-par">{x.rotas} {rotas}</span></span>
          <span className="esc-gris">{comentario}</span>
          {enRevision}
          {quitarOAspa && <span>{quitarOAspa}</span>}
        </div>
        {extras}
      </li>
    );
  }

  return null;
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
      <button type="button" className="boton-secundario" onClick={() => setAbierto(true)}>
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
export default function CajaEditable({ sitioId, contenido, etiquetas, idioma, soloVer = false, codigo = '', llenado = null, titulo = null, resumen = '' }) {
  const router = useRouter();
  const en = idioma === 'en';
  const r = R[en ? 'en' : 'es'];
  const [lineas, setLineas] = useState(contenido);
  const [vista, setVista] = useState('lista');
  // Inventario de la caja: se guarda en este navegador para no perder lo comprobado si se recarga.
  const claveRevision = `revision-caja-${sitioId}`;
  const [revisando, setRevisando] = useState(false);
  const [comprobados, setComprobados] = useState(() => new Set());
  const [saltadas, setSaltadas] = useState(() => new Set());
  const [quedanPorQuitar, setQuedanPorQuitar] = useState(null);
  const [terminada, setTerminada] = useState(null);
  const [errorRevision, setErrorRevision] = useState('');
  useEffect(() => setLineas(contenido), [contenido]);
  useEffect(() => {
    const guardada = window.localStorage.getItem('caja-vista');
    if (guardada === 'lista' || guardada === 'cuadricula') setVista(guardada);
    try {
      const r0 = JSON.parse(window.localStorage.getItem(claveRevision) || 'null');
      if (r0 && r0.activo) {
        setRevisando(true);
        setComprobados(new Set(r0.comprobados || []));
        setSaltadas(new Set(r0.saltadas || []));
      }
    } catch {}
  }, [claveRevision]);

  function guardarRevision(activo, comp, salt) {
    if (activo) window.localStorage.setItem(claveRevision, JSON.stringify({ activo: true, comprobados: [...comp], saltadas: [...salt] }));
    else window.localStorage.removeItem(claveRevision);
  }

  function empezar() {
    setRevisando(true);
    setTerminada(null);
    setComprobados(new Set());
    setSaltadas(new Set());
    guardarRevision(true, new Set(), new Set());
  }

  function alternar(id) {
    const n = new Set(comprobados);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setComprobados(n);
    guardarRevision(true, n, saltadas);
  }

  // "Todo está bien": marca todos los artículos como revisados y termina el inventario de la caja (lo guarda).
  function todoBien() {
    const n = new Set(lineas.map(l => l.id));
    setComprobados(n);
    guardarRevision(true, n, saltadas);
    terminar();
  }

  function saltar(id) {
    const n = new Set(saltadas);
    n.add(id);
    setSaltadas(n);
    guardarRevision(true, comprobados, n);
  }

  async function terminar() {
    setErrorRevision('');
    try {
      const d = await editar({ accion: 'revisarCaja', sitioId });
      setRevisando(false);
      setQuedanPorQuitar(null);
      guardarRevision(false);
      setTerminada({ siguiente: d.siguiente || null });
      router.refresh();
    } catch (err) {
      setErrorRevision(err.message || T[en ? 'en' : 'es'].error);
    }
  }

  function cajaRevisada() {
    const sinComprobar = lineas.filter(l => !comprobados.has(l.id));
    if (sinComprobar.length) setQuedanPorQuitar(sinComprobar);
    else terminar();
  }

  async function quitarSinComprobar() {
    setErrorRevision('');
    try {
      for (const l of quedanPorQuitar) await editar({ accion: 'quitar', id: l.id });
      const ids = new Set(quedanPorQuitar.map(l => l.id));
      setLineas(ls => ls.filter(l => !ids.has(l.id)));
      await terminar();
    } catch (err) {
      setQuedanPorQuitar(null);
      setErrorRevision(err.message || T[en ? 'en' : 'es'].error);
    }
  }

  const revision = revisando ? { comprobados, saltadas, alternar, saltar } : null;
  const pendientes = revisando ? lineas.filter(l => !comprobados.has(l.id)) : lineas;
  const revisados = revisando ? lineas.filter(l => comprobados.has(l.id)) : [];
  // Durante el inventario, en lugar del estado de revisión y el recuento: "Quedan X de Y".
  const quedanN = lineas.filter(l => !comprobados.has(l.id)).length;
  const resumenVisto = revisando ? (en ? `${quedanN} of ${lineas.length} left` : `Quedan ${quedanN} de ${lineas.length}`) : resumen;

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

  const comunes = { idioma, actualizar, onQuitada: quitada, soloVer, revision };

  return (
    <>
      <div className="cx-barra-caja cab-barra cab-op2">
        <span className={'cab-linea cab-izq' + (revisando ? ' cab-inv' : '')}>{titulo}<span className="cab-gris">{resumenVisto}</span></span>
        {!soloVer && <AnadirArticulo sitioId={sitioId} etiquetas={etiquetas} idioma={idioma} onHecho={() => router.refresh()} />}
        {!soloVer && !revisando && !terminada && <button type="button" className="boton-secundario" onClick={empezar}>{r.hacer}</button>}
        {!soloVer && revisando && <button type="button" className="boton-secundario" onClick={cajaRevisada}>{r.revisada}</button>}
        {!soloVer && terminada?.siguiente && <a href={`/sitio/${terminada.siguiente}`} className="boton-secundario">{r.siguiente}</a>}
        <span className="esc solo-escritorio cx-barra-vistas">
          <span className="esc-vistas">
            <button type="button" className={vista === 'cuadricula' ? 'esc-vista-activa' : ''} onClick={() => elegir('cuadricula')}>{en ? 'Grid' : 'Cuadrícula'}</button>
            <button type="button" className={vista === 'lista' ? 'esc-vista-activa' : ''} onClick={() => elegir('lista')}>{en ? 'List' : 'Lista'}</button>
          </span>
        </span>
        {(
          <span className="esc solo-movil cx-vistas-movil">
            <span className="esc-vistas">
              <button type="button" aria-label={en ? 'Grid' : 'Cuadrícula'} className={vista === 'cuadricula' ? 'esc-vista-activa' : ''} onClick={() => elegir('cuadricula')}>▦</button>
              <button type="button" aria-label={en ? 'List' : 'Lista'} className={vista === 'lista' ? 'esc-vista-activa' : ''} onClick={() => elegir('lista')}>☰</button>
            </span>
          </span>
        )}
        {!soloVer && <span className="cx-borrar-caja"><BorrarCaja sitioId={sitioId} codigo={codigo} idioma={idioma} alBorrar="/cajas" /></span>}
      </div>
      {!soloVer && revisando && <p className="inv-leyenda cx-leyenda-caja">{r.leyenda}</p>}
      {!soloVer && terminada && <p className="inv-leyenda cx-leyenda-caja">{r.hecha}</p>}
      {errorRevision && <p className="error cx-leyenda-caja">{errorRevision}</p>}
      {[{ grupo: pendientes, titulo: null }, ...(revisados.length ? [{ grupo: revisados, titulo: r.revisadosTitulo(revisados.length), esRevisados: true }] : [])].map(({ grupo, titulo, esRevisados }) => {
        return (
          <div key={esRevisados ? 'revisados' : 'pendientes'} className={esRevisados ? 'inv-bloque-revisados' : undefined}>
            {titulo && <h2 className="inv-apartado">{titulo}</h2>}
            {vista === 'cuadricula' ? (
                <ul className="esc-cuadricula cx-cuadricula cx-cuadricula-siempre">
                  {grupo.map(c => <Linea key={c.id} c={c} version="tarjeta" {...comunes} />)}
                </ul>
              ) : (
                <div className="esc cx-tabla-envoltura">
                  {[
                    { clase: 'solo-escritorio cx-tabla-dos', partes: [grupo.filter((_, k) => k % 2 === 0), grupo.filter((_, k) => k % 2 === 1)] },
                    { clase: 'solo-movil', partes: [grupo] },
                  ].map(({ clase, partes }) => (
                    <div key={clase} className={clase}>
                      {partes.filter(parte => parte.length).map((parte, k) => (
                        <table key={k} className="esc-tabla esc-lista-B cx-tabla-caja">
                          <thead>
                            <tr>
                              <th className="esc-c-foto" />
                              <th>{en ? 'Item' : 'Artículo'}</th>
                              <th className="esc-num">{en ? 'Total' : 'Total'}</th>
                              <th className="esc-num">{en ? 'Broken' : 'Rotas'}</th>
                              <th>{en ? 'Comment' : 'Comentario'}</th>
                              <th className="cx-td-aspa" />
                            </tr>
                          </thead>
                          <tbody>
                            {parte.map(c => <Linea key={c.id} c={c} version="fila" {...comunes} />)}
                          </tbody>
                        </table>
                      ))}
                    </div>
                  ))}
                </div>
              )
            }
          </div>
        );
      })}
      {quedanPorQuitar && (
        <div className="dialogo-fondo" role="dialog" aria-modal="true">
          <div className="dialogo">
            <p>{r.quedan(quedanPorQuitar.length)}</p>
            <div className="revision-botones">
              <button type="button" className="boton-secundario" onClick={() => { setQuedanPorQuitar(null); todoBien(); }}>{r.estanBien}</button>
              <button type="button" className="boton-principal" onClick={quitarSinComprobar}>{r.quitarlos}</button>
              <button type="button" className="boton-secundario" onClick={() => setQuedanPorQuitar(null)}>{r.volver}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
