'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import Foto from '../../components/Foto';
import BotonFoto, { ElegirFoto, subirFoto } from '../../components/BotonFoto';
import NombreEditable from '../../components/NombreEditable';
import BorrarCaja from '../../components/BorrarCaja';
import CamaraEsquina from '../../components/CamaraEsquina';
import { useOrden } from '../../components/Ordenar';

// Lista de la caja: columnas que se ordenan tocando su título.
const CLAVES_CAJA = {
  articulo: c => c.nombre,
  total: c => c.cantidad,
  rotas: c => c.rotos,
  comentario: c => c.comentarios || '',
};
import { textos } from '../../../lib/textos';
import { ordenarTallas } from '../../../lib/tallas.cjs';
import { trozosBusqueda, normalizar as normalizarTexto } from '../../../lib/normalizar.cjs';

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
    anadir: 'Añadir artículo', catalogoBuscar: 'Buscar en el catálogo', etiquetaTodas: 'Etiqueta: todas', crearNuevo: 'Crear artículo nuevo', fotoNueva: 'Foto', quitarFoto: 'Quitar', fotoNoSubida: 'El artículo se ha creado, pero la foto no se ha podido subir. Súbela desde su tarjeta.', proponerIA: 'Proponer con IA', proponiendo: 'Proponiendo…', sinonimos: 'Sinónimos', sinonimosAyuda: 'Marca los que quieras guardar.', sinonimosNinguno: 'La IA no ha encontrado sinónimos exactos.', sinonimosPropios: 'Añadir otros (separados por comas)', crearYAnadir: c => (c ? `Crear y añadir a ${c}` : 'Crear y añadir a la caja'), crearCatalogo: 'Crear solo en el catálogo', creadoCatalogo: n => `«${n}» creado en el catálogo.`, volverCatalogo: '‹ Volver al catálogo', anadirA: c => (c ? `Añadir a ${c}` : 'Añadir'), anadidoA: c => `Añadido a ${c}.`, cargando: 'Cargando…', nadaCatalogo: 'No hay ningún artículo así.', nArt: n => `${n} ${n === 1 ? 'artículo' : 'artículos'}`,
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
    anadir: 'Add item', catalogoBuscar: 'Search the catalogue', etiquetaTodas: 'Tag: all', crearNuevo: 'Create new item', fotoNueva: 'Photo', quitarFoto: 'Remove', fotoNoSubida: 'The item was created, but the photo could not be uploaded. Upload it from its card.', proponerIA: 'Suggest with AI', proponiendo: 'Suggesting…', sinonimos: 'Synonyms', sinonimosAyuda: 'Tick the ones you want to keep.', sinonimosNinguno: 'The AI found no exact synonyms.', sinonimosPropios: 'Add others (separated by commas)', crearYAnadir: c => (c ? `Create and add to ${c}` : 'Create and add to the box'), crearCatalogo: 'Create in the catalogue only', creadoCatalogo: n => `“${n}” created in the catalogue.`, volverCatalogo: '‹ Back to the catalogue', anadirA: c => (c ? `Add to ${c}` : 'Add'), anadidoA: c => `Added to ${c}.`, cargando: 'Loading…', nadaCatalogo: 'No item like that.', nArt: n => `${n} ${n === 1 ? 'item' : 'items'}`,
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
function FotoCamara({ c, x, actualizar, soloVer, check = null }) {
  return (
    <span className="cx-foto">
      <Foto url={c.foto_url} nombre={c.nombre} />
      {/* Inventario en el móvil: ✓ en la esquina de abajo a la izquierda (la cámara va en la otra) */}
      {check && <span className="cx-check-esquina">{check}</span>}
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
    hacer: 'Hacer inventario', revisando: (c, n, t) => `Revisando ${c} · Quedan ${t - n} de ${t}`, todoBien: 'Todo está bien', leyenda: 'Haz click para marcarlo como revisado o pulsa Caja revisada si la caja está correcta', tambien: nombres => `${nombres} también ${nombres.includes(' y ') ? 'están' : 'está'} revisando esta caja`, estanBien: 'Están bien',
    esta: '✓ Está', comprobado: '✓ Comprobado', noEsta: 'No está', faltaFoto: 'Falta foto', hacerFoto: 'Hacer foto', saltar: 'Saltar',
    comoEsta: '¿Cómo está la caja?', revisada: 'Caja revisada', quedan: n => `Quedan ${n} sin comprobar.`, quitarlos: 'Quitarlos', volver: 'Volver',
    hecha: 'Caja revisada. Gracias.', siguiente: 'Siguiente caja sin revisar', visto: '✓ Visto', marcarVisto: 'Marcar visto', revisandoSolo: c => `Revisando ${c}`, revisadosTitulo: n => `Revisados (${n})`, quitar: 'Quitar', comentario: '+ Comentario', porRevisarTitulo: n => `Por revisar (${n})`, verRevisados: n => `Ver revisados (${n})`, ocultarRevisados: n => `Ocultar revisados (${n})`,
  },
  en: {
    hacer: 'Take inventory', revisando: (c, n, t) => `Checking ${c} · ${t - n} of ${t} left`, todoBien: 'All is fine', leyenda: 'Click an item to mark it as checked, or press Box checked if the box is correct', tambien: nombres => `${nombres} ${nombres.includes(' and ') ? 'are' : 'is'} also checking this box`, estanBien: 'They are fine',
    esta: '✓ It is here', comprobado: '✓ Checked', noEsta: 'Not here', faltaFoto: 'Missing photo', hacerFoto: 'Take photo', saltar: 'Skip',
    comoEsta: 'How full is the box?', revisada: 'Box checked', quedan: n => `${n} still unchecked.`, quitarlos: 'Remove them', volver: 'Back',
    hecha: 'Box checked. Thanks.', siguiente: 'Next unchecked box', visto: '✓ Seen', marcarVisto: 'Mark as seen', revisandoSolo: c => `Checking ${c}`, revisadosTitulo: n => `Checked (${n})`, quitar: 'Remove', comentario: '+ Comment', porRevisarTitulo: n => `To check (${n})`, verRevisados: n => `Show checked (${n})`, ocultarRevisados: n => `Hide checked (${n})`,
  },
};

// Inventario: el ✕ para quitar, "Falta foto · Hacer foto · Saltar" al marcar un artículo sin foto.
function Aspa({ c, r, onClick }) {
  return <button type="button" className="inv-aspa" aria-label={`${r.quitar}: ${c.nombre}`} title={r.quitar} onClick={onClick}>✕</button>;
}

function mapaMarcas(d) {
  return new Map((d?.marcas || []).map(m => [m.id, m.nombre ?? null]));
}

function unirNombres(nombres, en) {
  if (nombres.length < 2) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} ${en ? 'and' : 'y'} ${nombres[nombres.length - 1]}`;
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

function Linea({ c, idioma, version, actualizar, onQuitada, soloVer = false, revision = null, mover = null }) {
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
      // Al bajar a 0, el artículo sale de la caja (queda en la papelera).
      if (fila?.quitada) onQuitada(c.id);
      else if (fila) actualizar(c.id, fila);
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
  const marcadoPor = revision && !soloVer && revision.comprobados.has(c.id) ? revision.comprobados.get(c.id) : null;
  const enRevision = revision && !soloVer ? (
    <>
      {marcadoPor !== null && <span className="inv-marcado-por">✓ {marcadoPor || '—'}</span>}
      <PideFoto c={c} r={r} revision={revision} actualizar={actualizar} />
    </>
  ) : null;
  // Inventario (A): se marca tocando el artículo en una zona libre (no foto, números, comentario, botones ni campos).
  // Mover: mientras se eligen qué mover, tocar el artículo (o su casilla) lo elige o lo quita.
  const elegido = mover ? mover.elegidos.has(c.id) : false;
  const casillaMover = mover ? (
    <input type="checkbox" className="cx-mover-casilla" checked={elegido} onChange={() => mover.alternar(c.id)} aria-label={(idioma === 'en' ? 'Move ' : 'Mover ') + c.nombre} />
  ) : null;
  const tocar = mover ? e => {
    if (e.target.closest('button, input, textarea, select, a, [contenteditable]')) return;
    mover.alternar(c.id);
  } : revision && !soloVer ? e => {
    // El nombre tampoco marca: con doble toque se edita, también durante el inventario.
    if (e.target.closest('button, input, textarea, select, a, label, .cx-foto, .boton-foto-envoltura, .esc-nombre, .nombre-articulo, .nombre-zona, [contenteditable]')) return;
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

  if (mover) {
    const foto = c.foto_url
      ? <span className="esc-foto esc-foto-40"><img src={c.foto_url} alt={c.nombre} loading="lazy" /></span>
      : <span className="esc-foto esc-foto-vacia esc-foto-40" aria-hidden="true" />;
    const eleccion = mover.elegidos.get(c.id);
    const cuantos = eleccion ? (
      <span className="cx-mover-elegir">
        <Contador etiqueta={idioma === 'en' ? 'Units' : 'Unidades'} valor={eleccion.cantidad} min={1} max={c.cantidad} onCambio={n => mover.poner(c.id, 'cantidad', n)} />
        {c.rotos > 0 && (
          <span className="cx-mover-rotas">
            {idioma === 'en' ? 'broken' : 'rotas'}
            <Contador etiqueta={idioma === 'en' ? 'Broken' : 'Rotas'} valor={Math.min(eleccion.rotos, eleccion.cantidad)} min={0} max={Math.min(c.rotos, eleccion.cantidad)} onCambio={n => mover.poner(c.id, 'rotos', n)} />
          </span>
        )}
      </span>
    ) : <span className="cx-mover-cuantos">×{c.cantidad}{c.rotos > 0 ? (idioma === 'en' ? ` · ${c.rotos} broken` : ` · ${c.rotos} rotas`) : ''}</span>;
    if (version === 'fila') {
      return (
        <tr className="cx-mover-fila" onClick={tocar}>
          <td className="esc-c-foto">{casillaMover}{foto}</td>
          <td colSpan={5}><span className="cx-mover-linea"><span><span className="esc-nombre">{c.nombre}</span>{talla && <span className="esc-sub"> · {talla}</span>}</span>{cuantos}</span></td>
        </tr>
      );
    }
    return (
      <li>
        <div className="esc-tarjeta cx-tarjeta cx-mover-tarjeta" onClick={tocar}>
          <span className="cx-mover-esquina">{casillaMover}</span>
          <span className="cx-foto"><Foto url={c.foto_url} nombre={c.nombre} /></span>
          <span className="esc-nombre">{c.nombre}</span>
          {talla && <span className="esc-gris">{talla}</span>}
          {cuantos}
        </div>
      </li>
    );
  }

  if (version === 'fila') {
    // Igual que una fila de la Lista del inicio (Escritorio.js), con − + en Total y Rotas, Comentario y ✕.
    return (
      <tr className={[tocar ? 'inv-tocable' : '', elegido ? 'cx-elegido' : ''].filter(Boolean).join(' ') || undefined} onClick={tocar}>
        <td className="esc-c-foto">
          {casillaMover}
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
        <div className={['esc-tarjeta cx-tarjeta tarjeta-con-aspa', tocar ? 'inv-tocable' : '', elegido ? 'cx-elegido' : ''].filter(Boolean).join(' ')} onClick={tocar}>
          {casillaMover && <span className="cx-mover-esquina">{casillaMover}</span>}
          {/* ✕ en la esquina de la tarjeta, montado sobre su borde (fuera de la foto) */}
          {aspa && <span className="aspa-esquina-tarjeta">{aspa}</span>}
          <FotoCamara
            c={c}
            x={x}
            actualizar={actualizar}
            soloVer={soloVer}
            check={revision && !soloVer ? (
              <button
                type="button"
                className={marcadoPor !== null ? 'cx-check cx-check-hecho' : 'cx-check'}
                aria-pressed={marcadoPor !== null}
                aria-label={idioma === 'en' ? 'Checked' : 'Revisado'}
                onClick={() => revision.alternar(c.id)}
              >✓</button>
            ) : null}
          />
          <NombreEditable articuloId={c.articulo_id} nombre={c.nombre} sinonimos={c.sinonimos} idioma={idioma} puedeEditar={!soloVer} className="esc-nombre" />
          {/* En el móvil la etiqueta de categoría no sale, para que la tarjeta sea más corta (la talla sí) */}
          {talla && <span className="esc-gris">{talla}{etiquetasTexto && <span className="cx-etq-tarjeta"> · {etiquetasTexto}</span>}</span>}
          {!talla && etiquetasTexto && <span className="esc-gris cx-etq-tarjeta">{etiquetasTexto}</span>}
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

// "Añadir artículo". En la caja va con su caja; en el inicio se abre ya desplegado, con el selector de caja
// arriba (antesDelBuscador) y alCerrar para volver al botón.
export function AnadirArticulo({ sitioId, etiquetas, idioma, onHecho, abiertoInicial = false, alCerrar = null, antesDelBuscador = null, nombreCaja = '' }) {
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const [abierto, setAbierto] = useState(abiertoInicial);
  const [texto, setTexto] = useState('');
  const [catalogo, setCatalogo] = useState(null);
  const [etiquetaFiltro, setEtiquetaFiltro] = useState('');
  const [vistaCatalogo, setVistaCatalogo] = useState('cuadricula');
  const [hecho, setHecho] = useState('');
  const [elegido, setElegido] = useState(null);
  const [creando, setCreando] = useState(false);
  const [cantidad, setCantidad] = useState(1);
  const [talla, setTalla] = useState('');
  const [nuevo, setNuevo] = useState({ es: '', en: '', etiquetas: [], ropa: false });
  const [error, setError] = useState('');
  // "Proponer con IA": sinónimos propuestos (salen sin marcar), los marcados y los escritos a mano.
  const [propuestos, setPropuestos] = useState(null);
  const [marcados, setMarcados] = useState([]);
  const [propios, setPropios] = useState('');
  const [proponiendo, setProponiendo] = useState(false);
  // Foto elegida al crear el artículo: se sube cuando el artículo ya existe.
  const [fotoNueva, setFotoNueva] = useState(null);

  function limpiarSinonimos() {
    setPropuestos(null);
    setMarcados([]);
    setPropios('');
  }

  async function proponer() {
    setError('');
    setProponiendo(true);
    try {
      const r = await fetch('/api/proponer-nombres', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ es: nuevo.es }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || x.error);
      setNuevo(nv => ({ ...nv, en: d.en }));
      setPropuestos(d.sinonimos || []);
      setMarcados([]);
    } catch (err) {
      setError(err.message || x.error);
    } finally {
      setProponiendo(false);
    }
  }

  useEffect(() => {
    if (!abierto || catalogo) return;
    let vivo = true;
    fetch('/api/catalogo').then(r => (r.ok ? r.json() : { articulos: [] })).then(d => { if (vivo) setCatalogo(d.articulos || []); }).catch(() => { if (vivo) setCatalogo([]); });
    return () => { vivo = false; };
  }, [abierto, catalogo]);

  const etiquetasCatalogo = useMemo(
    () => [...new Set((catalogo || []).flatMap(a => a.etiquetas))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
    [catalogo]
  );
  const visibles = useMemo(() => {
    const trozos = trozosBusqueda(texto);
    return (catalogo || []).filter(a => {
      if (etiquetaFiltro && !a.etiquetas.includes(etiquetaFiltro)) return false;
      if (!trozos.length) return true;
      const donde = normalizarTexto(`${a.nombre} ${a.buscable || ''}`);
      return trozos.every(t => donde.includes(t));
    });
  }, [catalogo, texto, etiquetaFiltro]);

  function reiniciar() {
    setTexto('');
    setEtiquetaFiltro('');
    setHecho('');
    setElegido(null);
    setCreando(false);
    setCantidad(1);
    setTalla('');
    setNuevo({ es: '', en: '', etiquetas: [], ropa: false });
    setError('');
    limpiarSinonimos();
    setFotoNueva(null);
  }

  async function anadir() {
    setError('');
    if (!sitioId) { setError(idioma === 'en' ? 'Choose the box.' : 'Elige la caja.'); return; }
    try {
      await editar({ accion: 'anadir', sitioId, articuloId: elegido.id, cantidad, talla });
      // Se queda en el catálogo para seguir añadiendo.
      setHecho(x.anadidoA(nombreCaja || ''));
      setElegido(null);
      setCantidad(1);
      setTalla('');
      onHecho();
    } catch (err) {
      setError(err.message || x.error);
    }
  }

  async function crear(soloCatalogo = false) {
    setError('');
    if (!soloCatalogo && !sitioId) { setError(idioma === 'en' ? 'Choose the box.' : 'Elige la caja.'); return; }
    try {
      const sinonimos = [...marcados, ...propios.split(',')].map(s => s.trim()).filter(Boolean);
      const creado = await editar({ accion: 'crearArticulo', sitioId: soloCatalogo ? null : sitioId, cantidad, talla, soloCatalogo, ...nuevo, sinonimos });
      // La foto elegida se sube en cuanto el artículo existe.
      let fotoFallida = false;
      if (fotoNueva && creado.articuloId) {
        try { await subirFoto(creado.articuloId, fotoNueva); } catch { fotoFallida = true; }
      }
      setFotoNueva(null);
      // Desde una caja, "Crear y añadir" vuelve a la caja (salvo que la foto falle, para poder avisar).
      if (!soloCatalogo && !antesDelBuscador && !fotoFallida) {
        reiniciar();
        setAbierto(false);
        setCatalogo(null);
        onHecho();
        return;
      }
      setHecho(fotoFallida ? x.fotoNoSubida : soloCatalogo ? x.creadoCatalogo(nuevo.es.trim()) : x.anadidoA(nombreCaja || ''));
      setCreando(false);
      setNuevo({ es: '', en: '', etiquetas: [], ropa: false });
      limpiarSinonimos();
      setCantidad(1);
      setTalla('');
      setCatalogo(null);
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

  const fotoCatalogo = (art, clase) => (art.foto_url
    ? <span className={`esc-foto ${clase}`}><img src={art.foto_url} alt={art.nombre} loading="lazy" /></span>
    : <span className={`esc-foto esc-foto-vacia ${clase}`} aria-hidden="true" />);

  if (typeof document === 'undefined') return null;
  return createPortal((
    <div className="catalogo" role="dialog" aria-modal="true" aria-label={x.anadir}>
      <div className="catalogo-cabecera esc">
        <div className="catalogo-fila">
          <h2 className="grupo-titulo">{x.anadir}</h2>
          <button type="button" className="boton-texto catalogo-cerrar" onClick={() => { reiniciar(); setAbierto(false); if (alCerrar) alCerrar(); }}>{x.cerrar}</button>
        </div>
        {antesDelBuscador}
        {!creando && (
          <div className="catalogo-fila catalogo-filtros">
            <input className="catalogo-buscar" value={texto} onChange={e => setTexto(e.target.value)} placeholder={x.catalogoBuscar} autoComplete="off" />
            <select className="catalogo-etiqueta" aria-label={x.etiquetas} value={etiquetaFiltro} onChange={e => setEtiquetaFiltro(e.target.value)}>
              <option value="">{x.etiquetaTodas}</option>
              {etiquetasCatalogo.map(et => <option key={et} value={et}>{et}</option>)}
            </select>
            <span className="esc-vistas">
              <button type="button" className={vistaCatalogo === 'cuadricula' ? 'esc-vista-activa' : ''} onClick={() => setVistaCatalogo('cuadricula')}>{idioma === 'en' ? 'Grid' : 'Cuadrícula'}</button>
              <button type="button" className={vistaCatalogo === 'lista' ? 'esc-vista-activa' : ''} onClick={() => setVistaCatalogo('lista')}>{idioma === 'en' ? 'List' : 'Lista'}</button>
            </span>
            <span className="esc-gris">{catalogo ? x.nArt(visibles.length) : ''}</span>
            <button type="button" className="boton-secundario catalogo-crear" onClick={() => { setCreando(true); setElegido(null); setNuevo(nv => ({ ...nv, es: texto.trim() })); }}>{x.crearNuevo}</button>
          </div>
        )}
        {hecho && <p className="aviso catalogo-hecho">{hecho}</p>}
      </div>
      <div className="catalogo-cuerpo">
        {!creando && !catalogo && <p className="aviso">{x.cargando}</p>}
        {!creando && catalogo && visibles.length === 0 && <p className="aviso">{x.nadaCatalogo}</p>}
        {!creando && catalogo && vistaCatalogo === 'cuadricula' && (
          <ul className="esc-cuadricula catalogo-cuadricula">
            {visibles.map(art => (
              <li key={art.id} className="tarjeta-con-camara">
                <span className="tarjeta-camara"><CamaraEsquina articuloId={art.id} idioma={idioma} alSubir={url => setCatalogo(cs => cs.map(z => (z.id === art.id ? { ...z, foto_url: url } : z)))} /></span>
                <button type="button" className={elegido?.id === art.id ? 'esc-tarjeta catalogo-tarjeta catalogo-elegido' : 'esc-tarjeta catalogo-tarjeta'} aria-pressed={elegido?.id === art.id} onClick={() => { setElegido(art); setTalla(''); setCantidad(1); setHecho(''); }}>
                  {fotoCatalogo(art, 'esc-foto-cuadrada')}
                  <span className="esc-nombre">{art.nombre}</span>
                  <span className="esc-gris esc-etq-tarjeta">{art.etiquetas.join(' · ')}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {!creando && catalogo && vistaCatalogo === 'lista' && (
          <table className="esc-tabla esc-lista-B catalogo-tabla">
            <thead>
              <tr><th className="esc-c-foto" /><th>{idioma === 'en' ? 'Item' : 'Artículo'}</th><th>{x.etiquetas}</th></tr>
            </thead>
            <tbody>
              {visibles.map(art => (
                <tr key={art.id} className={elegido?.id === art.id ? 'catalogo-elegido' : undefined} onClick={() => { setElegido(art); setTalla(''); setCantidad(1); setHecho(''); }}>
                  <td className="esc-c-foto">{fotoCatalogo(art, 'esc-foto-40')}</td>
                  <td><span className="esc-nombre">{art.nombre}</span></td>
                  <td className="esc-gris">{art.etiquetas.join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {creando && (
        <div className="formulario">
          <button type="button" className="boton-texto" onClick={() => setCreando(false)}>{x.volverCatalogo}</button>
          <div className="crear-foto">
            <span className="crear-foto-titulo">{x.fotoNueva}</span>
            <ElegirFoto archivo={fotoNueva} onElegir={setFotoNueva} etiqueta={x.fotoNueva} quitar={x.quitarFoto} />
          </div>
          <div className="crear-nombre-ia">
            <label>
              {x.nombreEs}
              <input value={nuevo.es} onChange={e => setNuevo({ ...nuevo, es: e.target.value })} />
            </label>
            <button type="button" className="boton-secundario" onClick={proponer} disabled={!nuevo.es.trim() || proponiendo}>
              {proponiendo ? x.proponiendo : x.proponerIA}
            </button>
          </div>
          <label>
            {x.nombreEn}
            <input value={nuevo.en} onChange={e => setNuevo({ ...nuevo, en: e.target.value })} />
          </label>
          <fieldset className="etiquetas-elegir crear-sinonimos">
            <legend>{x.sinonimos}</legend>
            {propuestos && propuestos.length > 0 && <p className="esc-gris">{x.sinonimosAyuda}</p>}
            {propuestos && propuestos.length === 0 && <p className="esc-gris">{x.sinonimosNinguno}</p>}
            {(propuestos || []).map(s => (
              <label key={s} className="casilla">
                <input
                  type="checkbox"
                  checked={marcados.includes(s)}
                  onChange={ev => setMarcados(m => (ev.target.checked ? [...m, s] : m.filter(z => z !== s)))}
                />
                {s}
              </label>
            ))}
            <label className="crear-sinonimos-propios">
              {x.sinonimosPropios}
              <input value={propios} onChange={e => setPropios(e.target.value)} />
            </label>
          </fieldset>
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
          <div className="catalogo-crear-botones">
            <button type="button" className="boton-principal" onClick={() => crear(false)} disabled={!nuevo.es.trim() || (nuevo.ropa && !talla)}>
              {x.crearYAnadir(nombreCaja)}
            </button>
            <button type="button" className="boton-secundario" onClick={() => crear(true)} disabled={!nuevo.es.trim()}>
              {x.crearCatalogo}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
        </div>
        )}
      </div>
      {elegido && !creando && (
        <div className="catalogo-pie">
          <strong className="catalogo-pie-nombre">{elegido.nombre}</strong>
          {tallasElegido.length > 0 && selectorTalla(tallasElegido)}
          <Contador etiqueta={x.cantidad} valor={cantidad} min={1} onCambio={setCantidad} />
          <button type="button" className="boton-principal" onClick={anadir} disabled={tallasElegido.length > 0 && !talla}>
            {x.anadirA(nombreCaja)}
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  ), document.body);
}

// Caja: igual que el inicio, con botón Cuadrícula / Lista en el ordenador.
// Lista: una fila por artículo (dos columnas en el ordenador). Cuadrícula: las tarjetas del inicio.
// En el móvil, solo la lista.
// Mover: barra de abajo ("3 elegidos · Cancelar · Elegir caja") y ventana con cuántos de cada uno (− +, también las
// rotas si las hay) y la caja de destino (buscador de cajas).
function MoverBarra({ sitioId, idioma, lineas, alCancelar, alMover }) {
  const en = idioma === 'en';
  const [abierto, setAbierto] = useState(false);
  const [cuantos, setCuantos] = useState({});
  const [texto, setTexto] = useState('');
  const [cajas, setCajas] = useState([]);
  const [destino, setDestino] = useState(null);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  // Todas las cajas se cargan una vez; se filtran desde la primera letra (código que empieza así o nombre que lo lleva).
  const [todasCajas, setTodasCajas] = useState(null);
  useEffect(() => {
    let vivo = true;
    fetch('/api/lista-cajas').then(r => (r.ok ? r.json() : { cajas: [] })).then(d => { if (vivo) setTodasCajas(d.cajas || []); }).catch(() => { if (vivo) setTodasCajas([]); });
    return () => { vivo = false; };
  }, []);
  useEffect(() => {
    const q = normalizarTexto(texto.trim());
    if (!q || !todasCajas) { setCajas([]); return; }
    const sinEsta = todasCajas.filter(c => c.id !== sitioId);
    const porCodigo = sinEsta.filter(c => normalizarTexto(c.codigo || '').startsWith(q));
    const porNombre = sinEsta.filter(c => !porCodigo.includes(c) && normalizarTexto([c.codigo, c.nombre].filter(Boolean).join(' ')).includes(q));
    setCajas([...porCodigo, ...porNombre].slice(0, 30));
  }, [texto, sitioId, todasCajas]);

  const valor = (l, campo) => {
    const v = cuantos[l.id]?.[campo];
    return v === undefined ? (campo === 'cantidad' ? l.cantidad : l.rotos) : v;
  };
  const poner = (l, campo, n) => setCuantos(c => {
    const actual = { cantidad: valor(l, 'cantidad'), rotos: valor(l, 'rotos'), ...(c[l.id] || {}), [campo]: n };
    if (actual.rotos > actual.cantidad) actual.rotos = actual.cantidad;
    return { ...c, [l.id]: actual };
  });

  async function mover() {
    setError('');
    setEnviando(true);
    try {
      const d = await editar({
        accion: 'moverArticulos',
        desdeSitioId: sitioId,
        haciaSitioId: destino.id,
        lineas: lineas.map(l => ({ contenidoId: l.id, cantidad: l.mover.cantidad, rotos: Math.min(l.mover.rotos, l.mover.cantidad) })),
      });
      alMover(d);
    } catch (err) {
      setError(err.message || (en ? 'Could not be moved.' : 'No se ha podido mover.'));
    }
    setEnviando(false);
  }

  const nombreDestino = c => [c.codigo, c.nombre].filter(Boolean).join(' ');
  const n = lineas.length;
  // La caja de destino se elige en la misma barra de abajo (pedido por ella: sin otra pantalla).
  return (
    <div className="mover-barra">
      {!destino && cajas.length > 0 && (
        <ul className="mover-cajas mover-cajas-flotantes">
          {cajas.map(c => (
            <li key={c.id}><button type="button" onClick={() => setDestino(c)}>{nombreDestino(c)}</button></li>
          ))}
        </ul>
      )}
      <div className="mover-barra-fila">
        <span className="mover-barra-cuantos">{en ? n + ' chosen' : n + (n === 1 ? ' elegido' : ' elegidos')}</span>
        <button type="button" className="boton-secundario" onClick={alCancelar}>{en ? 'Cancel' : 'Cancelar'}</button>
      </div>
      <div className="mover-barra-fila">
        <input
          className="mover-barra-buscar"
          value={destino ? nombreDestino(destino) : texto}
          onChange={e => { setDestino(null); setTexto(e.target.value); }}
          placeholder={en ? 'To which box' : 'A qué caja'}
          aria-label={en ? 'To which box' : 'A qué caja'}
          autoComplete="off"
        />
        <button type="button" className="boton-principal" disabled={!n || !destino || enviando} onClick={mover}>
          {destino ? (en ? 'Move to ' : 'Mover a ') + destino.codigo : (en ? 'Move' : 'Mover')}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default function CajaEditable({ sitioId, contenido, etiquetas, idioma, soloVer = false, codigo = '', llenado = null, titulo = null, resumen = '', revisionInicial = null, infoCorta = '' }) {
  const router = useRouter();
  const en = idioma === 'en';
  const r = R[en ? 'en' : 'es'];
  const [lineas, setLineas] = useState(contenido);
  const [vista, setVista] = useState('lista');
  // Inventario de la caja, compartido: lo marcado (y quién) está en el servidor y se vuelve a leer cada 5 segundos.
  const [revisando, setRevisando] = useState(Boolean(revisionInicial?.activa));
  const [comprobados, setComprobados] = useState(() => mapaMarcas(revisionInicial));
  const [saltadas, setSaltadas] = useState(() => new Set(revisionInicial?.saltadas || []));
  const [presentes, setPresentes] = useState(() => revisionInicial?.presentes || []);
  const [quedanPorQuitar, setQuedanPorQuitar] = useState(null);
  const [terminada, setTerminada] = useState(null);
  const [errorRevision, setErrorRevision] = useState('');
  const yo = revisionInicial?.yo ?? null;
  // Mover: "Mover" (arriba) → se eligen los artículos → "Elegir caja" → cuántos de cada uno y a qué caja.
  const [moviendo, setMoviendo] = useState(false);
  const [elegidos, setElegidos] = useState(() => new Map());
  const [avisoMover, setAvisoMover] = useState('');
  useEffect(() => setLineas(contenido), [contenido]);
  useEffect(() => {
    const guardada = window.localStorage.getItem('caja-vista');
    if (guardada === 'lista' || guardada === 'cuadricula') setVista(guardada);
  }, []);

  function aplicarEstado(d) {
    if (!d) return;
    if (!d.activa) {
      // Otra persona ha terminado la revisión: la caja vuelve a verse normal.
      if (revisandoRef.current) router.refresh();
      setRevisando(false);
      setComprobados(new Map());
      setSaltadas(new Set());
      setPresentes([]);
      return;
    }
    setRevisando(true);
    setComprobados(mapaMarcas(d));
    setSaltadas(new Set(d.saltadas || []));
    setPresentes(d.presentes || []);
  }

  // Cada 5 segundos, mientras la caja está en revisión y la pantalla a la vista.
  const revisandoRef = useRef(revisando);
  revisandoRef.current = revisando;
  useEffect(() => {
    if (soloVer || !revisando) return undefined;
    let vivo = true;
    async function leer() {
      if (document.visibilityState !== 'visible') return;
      try {
        const d = await editar({ accion: 'estadoRevision', sitioId });
        if (vivo) aplicarEstado(d);
      } catch {}
    }
    const t = setInterval(leer, 5000);
    document.addEventListener('visibilitychange', leer);
    return () => { vivo = false; clearInterval(t); document.removeEventListener('visibilitychange', leer); };
  }, [revisando, soloVer, sitioId]);

  async function empezar() {
    setErrorRevision('');
    setTerminada(null);
    try {
      aplicarEstado(await editar({ accion: 'empezarRevision', sitioId }));
    } catch (err) {
      setErrorRevision(err.message || T[en ? 'en' : 'es'].error);
    }
  }

  async function alternar(id) {
    const marcar = !comprobados.has(id);
    const antes = comprobados;
    const n = new Map(comprobados);
    if (marcar) n.set(id, yo);
    else n.delete(id);
    setComprobados(n);
    try {
      await editar({ accion: 'marcarRevision', sitioId, id, marcado: marcar });
    } catch (err) {
      setComprobados(antes);
      setErrorRevision(err.message || T[en ? 'en' : 'es'].error);
    }
  }

  // "Están bien": marca lo que quede sin marcar y termina el inventario de la caja.
  async function todoBien() {
    setErrorRevision('');
    try {
      await editar({ accion: 'marcarTodas', sitioId });
      await terminar();
    } catch (err) {
      setErrorRevision(err.message || T[en ? 'en' : 'es'].error);
    }
  }

  async function saltar(id) {
    setSaltadas(s => new Set([...s, id]));
    try { await editar({ accion: 'saltarFoto', sitioId, id }); } catch {}
  }

  async function terminar() {
    setErrorRevision('');
    try {
      const d = await editar({ accion: 'revisarCaja', sitioId });
      setRevisando(false);
      setComprobados(new Map());
      setSaltadas(new Set());
      setPresentes([]);
      setQuedanPorQuitar(null);
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
  const { ordenados, titulo: tituloOrden } = useOrden(lineas, CLAVES_CAJA);
  const pendientes = revisando ? ordenados.filter(l => !comprobados.has(l.id)) : ordenados;
  const revisados = revisando ? ordenados.filter(l => comprobados.has(l.id)) : [];
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
    // Recuento de arriba y papelera al día.
    router.refresh();
  }

  const alternarMover = id => setElegidos(m => {
    const n = new Map(m);
    if (n.has(id)) n.delete(id);
    else {
      const l = lineas.find(x => x.id === id);
      n.set(id, { cantidad: l ? l.cantidad : 1, rotos: l ? l.rotos : 0 });
    }
    return n;
  });
  const ponerMover = (id, campo, v) => setElegidos(m => {
    const n = new Map(m);
    const e = { ...(n.get(id) || {}), [campo]: v };
    if (e.rotos > e.cantidad) e.rotos = e.cantidad;
    n.set(id, e);
    return n;
  });
  const mover = moviendo ? { elegidos, alternar: alternarMover, poner: ponerMover } : null;
  // "Todo": marca todos los artículos de la caja con todas sus unidades (o los desmarca si ya estaban todos).
  const todosElegidos = lineas.length > 0 && lineas.every(l => elegidos.has(l.id));
  const elegirTodos = () => setElegidos(todosElegidos ? new Map() : new Map(lineas.map(l => [l.id, { cantidad: l.cantidad, rotos: l.rotos }])));
  const comunes = { idioma, actualizar, onQuitada: quitada, soloVer, revision, mover };

  return (
    <>
      <div className="cx-barra-caja cab-barra cab-op2">
        <span className={'cab-linea cab-izq' + (revisando ? ' cab-inv' : '')}>{titulo}<span className="cab-gris">{resumenVisto}</span></span>
        {!soloVer && <AnadirArticulo sitioId={sitioId} etiquetas={etiquetas} idioma={idioma} onHecho={() => router.refresh()} nombreCaja={codigo} />}
        {!soloVer && lineas.length > 0 && (
          <button type="button" className="boton-secundario" onClick={() => { setMoviendo(!moviendo); setElegidos(new Map()); setAvisoMover(''); }}>
            {en ? 'Move' : 'Mover'}
          </button>
        )}
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
        {!soloVer && <span className="cx-borrar-caja"><BorrarCaja sitioId={sitioId} codigo={codigo} idioma={idioma} alBorrar="/cajas" conTexto /></span>}
      </div>
      {!soloVer && revisando && presentes.length > 0 && <p className="inv-tambien cx-leyenda-caja">{r.tambien(unirNombres(presentes, en))}</p>}
      {!soloVer && terminada && <p className="inv-leyenda cx-leyenda-caja">{r.hecha}</p>}
      {errorRevision && <p className="error cx-leyenda-caja">{errorRevision}</p>}
      {/* Móvil: revisión y recuento en una línea, debajo de los botones y encima de la lista */}
      <p className="cx-info-movil solo-movil">{revisando ? resumenVisto : infoCorta}</p>
      {avisoMover && <p className="aviso cx-leyenda-caja">{avisoMover}</p>}
      {moviendo && (
        <span className="cx-mover-todos">
          <input type="checkbox" className="cx-mover-casilla" checked={todosElegidos} onChange={elegirTodos} aria-label={en ? 'Choose all' : 'Elegir todos'} />
        </span>
      )}
      {moviendo && (
        <MoverBarra
          sitioId={sitioId}
          idioma={idioma}
          lineas={lineas.filter(l => elegidos.has(l.id)).map(l => ({ ...l, mover: elegidos.get(l.id) }))}
          alCancelar={() => { setMoviendo(false); setElegidos(new Map()); }}
          alMover={d => { setMoviendo(false); setElegidos(new Map()); router.push('/sitio/' + d.hacia.id); }}
        />
      )}
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
                              <th>{tituloOrden('articulo', en ? 'Item' : 'Artículo')}</th>
                              <th className="esc-num">{tituloOrden('total', 'Total')}</th>
                              <th className="esc-num">{tituloOrden('rotas', en ? 'Broken' : 'Rotas')}</th>
                              <th>{tituloOrden('comentario', en ? 'Comment' : 'Comentario')}</th>
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
