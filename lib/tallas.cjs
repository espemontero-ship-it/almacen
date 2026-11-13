const ORDEN_LETRAS = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'];
const TALLAS_LETRA = ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'];
const ETIQUETAS_ROPA = ['uniforms', 'rentals', 't shirts'];
const PALABRAS_ROPA = /\b(shirts?|t ?shirts?|jackets?|pants|trousers|overalls?|coats?|coveralls?|kurta|tabard|uniform|commander|leader|artist)\b/i;

function normalizarTalla(t) {
  const s = t.toUpperCase().replace(/\s+/g, '');
  if (s === 'XXL') return '2XL';
  if (s === 'XXXL') return '3XL';
  if (s === 'XL3') return '3XL';
  const n = s.match(/^([2-6])XL$/);
  if (n) return `${n[1]}XL`;
  return s;
}

function separarTalla(nombre) {
  const limpio = String(nombre || '').replace(/\s+/g, ' ').trim();
  const m = limpio.match(/^(.*?)(?:\s+T\.?\s*|\s+)((?:[2-6]X?L|XXXL|XXL|XL3|XL|XS|S|M|L)|[MW]?\d{2})$/i);
  if (!m || !m[1].trim()) return null;
  const base = m[1].replace(/[\s.\-–]+$/, '').trim();
  if (/\d$/.test(base) && /^[a-z]$/i.test(m[2])) return null;
  return { base, talla: normalizarTalla(m[2]) };
}

function esRopa(nombre, etiquetas) {
  const lista = (etiquetas || []).map(e => e.toLowerCase());
  return lista.some(e => ETIQUETAS_ROPA.includes(e)) || PALABRAS_ROPA.test(nombre);
}

function claveTalla(t) {
  const i = ORDEN_LETRAS.indexOf(t);
  if (i >= 0) return [0, i];
  const w = t.match(/^([MW])(\d+)$/);
  if (w) return [w[1] === 'W' ? 2 : 3, Number(w[2])];
  if (/^\d+$/.test(t)) return [1, Number(t)];
  return [4, 0];
}

function ordenarTallas(lista) {
  return [...new Set(lista)].sort((a, b) => {
    const x = claveTalla(a);
    const y = claveTalla(b);
    return x[0] - y[0] || x[1] - y[1];
  });
}

function tallasPosibles(existentes) {
  const conLetra = existentes.some(t => ORDEN_LETRAS.includes(t));
  return ordenarTallas(conLetra ? [...TALLAS_LETRA, ...existentes] : existentes);
}

module.exports = { separarTalla, esRopa, normalizarTalla, ordenarTallas, tallasPosibles };
