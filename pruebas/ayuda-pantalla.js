import { vi } from 'vitest';

// Sustituye la red: cada petición se apunta y responde lo que diga `responder` (por defecto, ok).
export function redDeMentira(responder = () => ({ ok: true })) {
  const llamadas = [];
  const fetch = vi.fn(async (url, opciones = {}) => {
    const cuerpo = opciones.body ? JSON.parse(opciones.body) : null;
    llamadas.push({ url: String(url), cuerpo });
    const r = await responder(String(url), cuerpo);
    const estado = r && r.__estado ? r.__estado : 200;
    return { ok: estado < 400, status: estado, json: async () => r };
  });
  vi.stubGlobal('fetch', fetch);
  return llamadas;
}

// Filas como las que da listarTodo: espada en P1 (2 rotas), copa en C1 y P1, camiseta en P1 por tallas.
export const FILAS = [
  { id: 1, cantidad: 10, rotos: 2, talla: null, sitio_id: 1, codigo: 'P1', sitio_nombre: 'latex weapons', articulo_id: 1, nombre: 'Espada', sinonimos: [], foto_url: null, etiquetas: ['Atrezo'] },
  { id: 2, cantidad: 12, rotos: 0, talla: null, sitio_id: 2, codigo: 'C1', sitio_nombre: null, articulo_id: 2, nombre: 'Copa', sinonimos: [], foto_url: null, etiquetas: [] },
  { id: 3, cantidad: 3, rotos: 0, talla: null, sitio_id: 1, codigo: 'P1', sitio_nombre: 'latex weapons', articulo_id: 2, nombre: 'Copa', sinonimos: [], foto_url: null, etiquetas: [] },
  { id: 4, cantidad: 4, rotos: 0, talla: 'M', sitio_id: 1, codigo: 'P1', sitio_nombre: 'latex weapons', articulo_id: 3, nombre: 'Camiseta', sinonimos: [], foto_url: null, etiquetas: ['Ropa'] },
  { id: 5, cantidad: 2, rotos: 0, talla: 'S', sitio_id: 1, codigo: 'P1', sitio_nombre: 'latex weapons', articulo_id: 3, nombre: 'Camiseta', sinonimos: [], foto_url: null, etiquetas: ['Ropa'] },
];

// Contenido de una caja como el que da obtenerSitio.
export const CONTENIDO = [
  { id: 1, cantidad: 10, rotos: 2, comentarios: 'hoja mellada', talla: null, articulo_id: 1, nombre: 'Espada', sinonimos: [], foto_url: null, tallas: [], etiquetas: ['Atrezo'] },
  { id: 3, cantidad: 3, rotos: 0, comentarios: null, talla: null, articulo_id: 2, nombre: 'Copa', sinonimos: [], foto_url: null, tallas: [], etiquetas: [] },
];
