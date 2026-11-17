const T = {
  es: {
    titulo: 'Historial',
    deCaja: c => `Historial de ${c}`,
    deArticulo: a => `Historial de «${a}»`,
    vacio: 'Todavía no hay cambios.',
    alguien: 'Alguien',
    talla: 'talla',
    cantidad: 'cantidad',
    rotas: 'rotas',
    comentario: 'comentario',
    comentarioBorrado: 'comentario borrado',
    quitado: 'Quitado',
    recuperado: 'Recuperado',
    anadido: 'Añadido',
    nuevoArticulo: 'Artículo nuevo',
    nuevoCatalogo: 'Artículo nuevo en el catálogo',
    nuevaCaja: 'Caja nueva',
    cajaBorrada: 'Caja borrada',
    cajaRecuperada: 'Caja recuperada',
    revisada: 'Caja revisada (inventario)',
    llenado: 'Llenado',
    valoresLlenado: { vacia: 'vacía', medias: 'a medias', llena: 'llena' },
    fotoNueva: 'foto nueva',
    nombreCambiado: i => (i === 'en' ? 'Nombre en inglés' : 'Nombre en español'),
    sinonimos: 'sinónimos',
    verHistorialCaja: 'Historial de esta caja',
    verHistorialArticulo: 'Historial de este artículo',
    papelera: 'Quitado de esta caja (últimos 30 días)',
    recuperar: 'Recuperar',
  },
  en: {
    titulo: 'History',
    deCaja: c => `History of ${c}`,
    deArticulo: a => `History of “${a}”`,
    vacio: 'No changes yet.',
    alguien: 'Someone',
    talla: 'size',
    cantidad: 'quantity',
    rotas: 'broken',
    comentario: 'comment',
    comentarioBorrado: 'comment removed',
    quitado: 'Removed',
    recuperado: 'Restored',
    anadido: 'Added',
    nuevoArticulo: 'New item',
    nuevoCatalogo: 'New item in the catalogue',
    nuevaCaja: 'New box',
    cajaBorrada: 'Box deleted',
    cajaRecuperada: 'Box restored',
    revisada: 'Box checked (inventory)',
    llenado: 'Fill',
    valoresLlenado: { vacia: 'empty', medias: 'half full', llena: 'full' },
    fotoNueva: 'new photo',
    nombreCambiado: i => (i === 'en' ? 'English name' : 'Spanish name'),
    sinonimos: 'synonyms',
    verHistorialCaja: 'History of this box',
    verHistorialArticulo: 'History of this item',
    papelera: 'Removed from this box (last 30 days)',
    recuperar: 'Restore',
  },
};

export function textosHistorial(idioma) {
  return T[idioma === 'en' ? 'en' : 'es'];
}

export function describir(h, idioma) {
  const t = textosHistorial(idioma);
  const d = h.detalle || {};
  const art = h.articulo ? `${h.articulo}${d.talla ? ` (${t.talla} ${d.talla})` : ''}` : '';
  switch (h.accion) {
    case 'cantidad':
      return `${art}: ${t.cantidad} ${d.antes} → ${d.despues}`;
    case 'rotos':
      return `${art}: ${t.rotas} ${d.antes} → ${d.despues}`;
    case 'comentarios':
      return d.despues ? `${art}: ${t.comentario} «${d.despues}»` : `${art}: ${t.comentarioBorrado}`;
    case 'quitar':
      return `${t.quitado}: ${art} ×${d.cantidad}`;
    case 'recuperar':
      return `${t.recuperado}: ${art} ×${d.cantidad}`;
    case 'anadir':
      return `${t.anadido}: ${art} ×${d.cantidad}`;
    case 'crearArticulo':
      return d.soloCatalogo ? `${t.nuevoCatalogo}: ${art}` : `${t.nuevoArticulo}: ${art} ×${d.cantidad}`;
    case 'crearCaja':
      return `${t.nuevaCaja}: ${d.codigo}${d.nombre ? ` ${d.nombre}` : ''}`;
    case 'borrarCaja':
      return `${t.cajaBorrada}: ${d.codigo || ''}${d.nombre ? ` ${d.nombre}` : ''}`;
    case 'recuperarCaja':
      return `${t.cajaRecuperada}: ${d.codigo || ''}${d.nombre ? ` ${d.nombre}` : ''}`;
    case 'revisada':
      return t.revisada;
    case 'llenado':
      return `${t.llenado}: ${d.antes ? t.valoresLlenado[d.antes] + ' → ' : ''}${t.valoresLlenado[d.despues] || d.despues}`;
    case 'foto':
      return `${art}: ${t.fotoNueva}`;
    case 'nombre':
      return `${t.nombreCambiado(d.idioma)}: «${d.antes}» → «${d.despues}»`;
    case 'sinonimos':
      return `${art}: ${t.sinonimos} ${d.despues && d.despues.length ? d.despues.join(', ') : '—'}`;
    default:
      return h.accion;
  }
}

export function fechaHora(fecha, idioma) {
  return new Intl.DateTimeFormat(idioma === 'en' ? 'en-GB' : 'es-ES', {
    timeZone: 'Europe/Madrid',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(fecha));
}
