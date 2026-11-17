const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk').default;

// "Proponer con IA" al crear un artículo: nombre en inglés y sinónimos propuestos (la persona elige cuáles guarda).
const MODELO = 'claude-sonnet-5-5';

const SISTEMA = `Ayudas a catalogar el almacén de una asociación que organiza juegos de rol en vivo (larp): atrezo, vestuario, iluminación, cocina, oficina, colchones, armas de juguete o de látex, maquillaje, botiquín.
Recibes el nombre en español de un artículo nuevo. Devuelve:
- "en": su nombre en inglés, natural y breve.
- "sinonimos": otros nombres con los que alguien podría buscar exactamente ese mismo objeto, en español y en inglés.
Reglas:
- El nombre en español es el que se usa normalmente en España.
- Solo equivalentes exactos del mismo objeto: nada más general (categorías como "iluminación" o "mueble"), nada más concreto, nada parecido pero distinto.
- Sin marcas.
- Conserva tal cual tallas, medidas, números y códigos (XL, 10m, 20W, T.44).
- No repitas el nombre en español ni "en", ni variantes que solo cambien singular y plural o mayúsculas.
- Si no hay equivalentes exactos, deja "sinonimos" vacío.`;

const ESQUEMA = {
  type: 'object',
  properties: {
    en: { type: 'string' },
    sinonimos: { type: 'array', items: { type: 'string' } },
  },
  required: ['en', 'sinonimos'],
  additionalProperties: false,
};

function clave() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  // En este ordenador la clave está en .env.ia (no se sube).
  try {
    const linea = fs.readFileSync(path.join(process.cwd(), '.env.ia'), 'utf8').split(/\r?\n/).find(l => l.startsWith('ANTHROPIC_API_KEY='));
    return linea ? linea.slice('ANTHROPIC_API_KEY='.length).trim() : '';
  } catch {
    return '';
  }
}

const limpiar = s => String(s || '').replace(/\s+/g, ' ').trim();
const igual = s => limpiar(s).toLowerCase();

async function proponerNombres(es, { cliente } = {}) {
  const nombre = limpiar(es);
  if (!nombre) throw new Error('Falta el nombre.');
  let anthropic = cliente;
  if (!anthropic) {
    const k = clave();
    if (!k) throw new Error('La IA no está configurada.');
    anthropic = new Anthropic({ apiKey: k });
  }
  let respuesta;
  try {
    respuesta = await anthropic.beta.messages.create({
      model: MODELO,
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SISTEMA,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
      messages: [{ role: 'user', content: nombre }],
    });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) throw new Error('La IA está ocupada. Prueba en un momento.');
    if (error instanceof Anthropic.AuthenticationError) throw new Error('La IA no está configurada.');
    throw new Error('La IA no ha respondido. Prueba otra vez.');
  }
  if (respuesta.stop_reason === 'refusal') throw new Error('La IA no ha querido proponer nada para este nombre.');
  const texto = respuesta.content.filter(b => b.type === 'text').map(b => b.text).join('');
  let datos;
  try {
    datos = JSON.parse(texto);
  } catch {
    throw new Error('La IA no ha respondido bien. Prueba otra vez.');
  }
  const en = limpiar(datos.en) || nombre;
  const vistos = new Set([igual(nombre), igual(en)]);
  const sinonimos = [];
  for (const s of datos.sinonimos || []) {
    const t = limpiar(s);
    if (!t || vistos.has(igual(t))) continue;
    vistos.add(igual(t));
    sinonimos.push(t);
  }
  return { en, sinonimos };
}

module.exports = { proponerNombres, MODELO };
