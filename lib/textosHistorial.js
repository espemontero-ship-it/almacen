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
    nuevaCaja: 'Caja nueva',
    fotoNueva: 'foto nueva',
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
    nuevaCaja: 'New box',
    fotoNueva: 'new photo',
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
      return `${t.nuevoArticulo}: ${art} ×${d.cantidad}`;
    case 'crearCaja':
      return `${t.nuevaCaja}: ${d.codigo}${d.nombre ? ` ${d.nombre}` : ''}`;
    case 'foto':
      return `${art}: ${t.fotoNueva}`;
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
