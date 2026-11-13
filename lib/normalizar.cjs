function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();
}

function raiz(palabra) {
  if (palabra.length <= 3) return palabra;
  if (palabra.endsWith('es') && palabra.length > 4) return palabra.slice(0, -2);
  if (palabra.endsWith('s')) return palabra.slice(0, -1);
  return palabra;
}

function trozosBusqueda(texto) {
  return normalizar(texto).split(' ').filter(Boolean).map(raiz);
}

const LETRAS = {
  P: 'Props',
  C: 'Cocina',
  O: 'Oficina',
  M: 'Matress',
  L: 'Lighting',
  D: 'Drawer',
  A: 'Zonas',
  U: 'Uniformes',
  R: 'Rental',
};

function leerContenedor(texto) {
  const limpio = String(texto || '').replace(/\s+/g, ' ').trim();
  const zona = limpio.match(/^area\s+(\d+)$/i);
  if (zona) {
    const numero = Number(zona[1]);
    return { clave: `A${numero}`, codigo: `A${numero}`, letra: 'A', numero, nombre: null };
  }
  const caja = limpio.match(/^([A-Za-z])\s*0*(\d+)(?:\s+(.+))?$/);
  if (caja && !(caja[3] && /\b[A-Za-z]\d+\b/.test(caja[3]))) {
    const letra = caja[1].toUpperCase();
    const numero = Number(caja[2]);
    const codigo = `${letra}${numero}`;
    return { clave: codigo, codigo, letra, numero, nombre: caja[3] || null };
  }
  return { clave: limpio, codigo: null, letra: null, numero: null, nombre: limpio };
}

module.exports = { normalizar, raiz, trozosBusqueda, leerContenedor, LETRAS };
