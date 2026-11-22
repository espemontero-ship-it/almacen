import { describe, it, expect, beforeAll } from 'vitest';
import { ed, db, datos, sembrar, ADMIN } from './ayuda.js';
import { createRequire } from 'module';

let d;
beforeAll(async () => { d = await sembrar(); });
const ultimo = async sitioId => (await ed().historial({ sitioId, idioma: 'es' }))[0];

describe('editar una caja', () => {
  it('10. cambiar la cantidad se guarda y queda en el historial; bajar a 0 saca el artículo de la caja a la papelera, y se recupera con 1', async () => {
    const id = await d.linea(d.p1, d.espada);
    expect((await ed().cambiarCantidad(id, 7, ADMIN)).cantidad).toBe(7);
    expect(await ultimo(d.p1)).toMatchObject({ accion: 'cantidad', detalle: { antes: 10, despues: 7 }, usuario_nombre: 'Admin de prueba' });
    expect(await ed().cambiarCantidad(id, -3, ADMIN)).toEqual({ id, quitada: true });
    expect(await ultimo(d.p1)).toMatchObject({ accion: 'quitar', detalle: { cantidad: 7 } });
    expect((await datos().obtenerSitio(d.p1, 'es')).contenido.map(c => c.nombre)).not.toContain('Espada');
    expect((await ed().quitados(d.p1)).map(q => q.id)).toContain(id);
    await ed().recuperar(id, ADMIN);
    expect((await datos().obtenerSitio(d.p1, 'es')).contenido.find(c => c.nombre === 'Espada').cantidad).toBe(1);
    await ed().cambiarCantidad(id, 10, ADMIN);
  });

  it('10b. "Añadir artículo" encuentra también los artículos que no están en ninguna caja (con 0); el buscador de arriba no', async () => {
    const { articuloId } = await ed().crearArticulo({ es: 'Linterna sin caja', en: 'Lonely torch', sitioId: d.c1, cantidad: 1 }, ADMIN);
    const { query } = db();
    const linea = (await query('SELECT id FROM contenido WHERE articulo_id = $1', [articuloId])).rows[0].id;
    await ed().cambiarCantidad(linea, 0, ADMIN);
    const catalogo = (await datos().sugerencias('linterna sin', 'es', { catalogo: true })).lista.find(x => x.id === articuloId);
    expect(catalogo).toMatchObject({ tipo: 'articulo', total: 0 });
    expect((await datos().sugerencias('linterna sin', 'es')).lista.find(x => x.id === articuloId)).toBe(undefined);
  });

  it('11. las rotas nunca pasan de la cantidad, y bajar la cantidad baja las rotas', async () => {
    const id = await d.linea(d.p1, d.espada);
    expect((await ed().cambiarRotos(id, 50, ADMIN)).rotos).toBe(10);
    expect(await ultimo(d.p1)).toMatchObject({ accion: 'rotos', detalle: { antes: 0, despues: 10 } });
    expect((await ed().cambiarCantidad(id, 4, ADMIN)).rotos).toBe(4);
    await ed().cambiarCantidad(id, 10, ADMIN);
    await ed().cambiarRotos(id, 0, ADMIN);
  });

  it('12. el comentario se guarda limpio, y vacío se borra', async () => {
    const id = await d.linea(d.p1, d.espada);
    expect((await ed().cambiarComentarios(id, '  hoja   mellada ', ADMIN)).comentarios).toBe('hoja mellada');
    expect((await ed().cambiarComentarios(id, '   ', ADMIN)).comentarios).toBe(null);
  });

  it('13. quitar lo saca de la caja y lo deja en la papelera; recuperar lo devuelve tal cual', async () => {
    const id = await d.linea(d.p1, d.espada);
    await ed().quitar(id, ADMIN);
    expect((await datos().obtenerSitio(d.p1, 'es')).contenido.map(c => c.nombre)).not.toContain('Espada');
    expect((await ed().quitados(d.p1)).map(q => q.id)).toEqual([id]);
    await ed().recuperar(id, ADMIN);
    const caja = await datos().obtenerSitio(d.p1, 'es');
    expect(caja.contenido.find(c => c.nombre === 'Espada').cantidad).toBe(10);
    expect(await ed().quitados(d.p1)).toEqual([]);
    expect(await ultimo(d.p1)).toMatchObject({ accion: 'recuperar' });
  });

  it('14. añadir algo que ya está en la caja (misma talla) suma; otra talla va en su línea', async () => {
    await ed().anadir({ sitioId: d.p1, articuloId: d.camiseta, cantidad: 1, talla: 'M' }, ADMIN);
    await ed().anadir({ sitioId: d.p1, articuloId: d.camiseta, cantidad: 2, talla: 'XL' }, ADMIN);
    const lineas = (await datos().obtenerSitio(d.p1, 'es')).contenido.filter(c => c.nombre === 'Camiseta');
    const porTalla = Object.fromEntries(lineas.map(c => [c.talla, c.cantidad]));
    expect(porTalla).toEqual({ S: 2, M: 5, XL: 2 });
  });

  it('15. crear un artículo nuevo lo mete en la caja; no deja repetir un nombre ni dejarlo vacío', async () => {
    const { articuloId } = await ed().crearArticulo({ es: 'Escudo', en: 'Shield', sitioId: d.c1, cantidad: 2 }, ADMIN);
    expect((await datos().buscar('shield', 'es')).articulos.map(a => a.id)).toEqual([articuloId]);
    await expect(ed().crearArticulo({ es: 'escudo', sitioId: d.c1 }, ADMIN)).rejects.toThrow('Ya existe');
    await expect(ed().crearArticulo({ es: '  ', sitioId: d.c1 }, ADMIN)).rejects.toThrow('Falta el nombre');
  });

  it('16. el llenado se guarda, queda en el historial, sale en las sugerencias y no admite otros valores', async () => {
    await ed().cambiarLlenado(d.c1, 'medias', ADMIN);
    expect((await datos().obtenerSitio(d.c1, 'es')).llenado).toBe('medias');
    expect(await ultimo(d.c1)).toMatchObject({ accion: 'llenado', detalle: { antes: null, despues: 'medias' } });
    await expect(ed().cambiarLlenado(d.c1, 'rebosando', ADMIN)).rejects.toThrow();
    const sug = await datos().sugerencias('C1', 'es');
    expect(sug.lista[0]).toMatchObject({ codigo: 'C1', llenado: 'medias' });
  });

  it('17. la caja cuenta las unidades sin lo quitado', async () => {
    const caja = await datos().obtenerSitio(d.c1, 'es');
    expect(caja.unidades).toBe(caja.contenido.reduce((s, c) => s + c.cantidad, 0));
  });
});

describe('crear un artículo solo en el catálogo', () => {
  it('10c. se guarda sin caja ni unidades, queda en el historial y sale en el catálogo', async () => {
    const { articuloId } = await ed().crearArticulo({ es: 'Lámpara de catálogo', en: 'Catalogue lamp', soloCatalogo: true }, ADMIN);
    const { query } = db();
    expect((await query('SELECT count(*)::int AS n FROM contenido WHERE articulo_id = $1', [articuloId])).rows[0].n).toBe(0);
    expect((await ed().historial({ articuloId, idioma: 'es' }))[0]).toMatchObject({ accion: 'crearArticulo', detalle: { soloCatalogo: true } });
    expect((await datos().listarCatalogo('es')).some(a => a.id === articuloId && a.nombre === 'Lámpara de catálogo')).toBe(true);
    await expect(ed().crearArticulo({ es: 'Otra sin caja' }, ADMIN)).rejects.toThrow('Elige la caja');
  });

  it('10d. los sinónimos elegidos al crear se guardan y se encuentra el artículo por ellos', async () => {
    const { articuloId } = await ed().crearArticulo({ es: 'Farol de prueba', en: 'Test lantern', soloCatalogo: true, sinonimos: [' Candil  viejo ', 'Hurricane lamp', ''] }, ADMIN);
    const { query } = db();
    expect((await query("SELECT otros FROM nombres_ia WHERE tipo = 'articulo' AND original = 'Farol de prueba'")).rows[0].otros).toEqual(['Candil viejo', 'Hurricane lamp']);
    expect((await datos().sugerencias('candil viejo', 'es', { catalogo: true })).lista.map(x => x.id)).toContain(articuloId);
    expect((await datos().sugerencias('hurricane', 'es', { catalogo: true })).lista.map(x => x.id)).toContain(articuloId);
  });
});

describe('Proponer con IA', () => {
  const { proponerNombres } = createRequire(import.meta.url)('../lib/proponerNombres.cjs');
  const falsa = (respuesta, guardar = {}) => ({
    beta: { messages: { create: async p => { guardar.p = p; return respuesta; } } },
  });
  const texto = obj => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(obj) }] });

  it('10e. devuelve el inglés y los sinónimos sin repetir el nombre ni duplicados, con Sonnet 5.5', async () => {
    const g = {};
    const r = await proponerNombres('  Linterna  frontal ', { cliente: falsa(texto({ en: 'Headlamp', sinonimos: ['Frontal', 'linterna frontal', 'headlamp', 'Head torch', ' Frontal ', ''] }), g) });
    expect(r).toEqual({ en: 'Headlamp', sinonimos: ['Frontal', 'Head torch'] });
    expect(g.p.model).toBe('claude-sonnet-5-5');
    expect(g.p.messages[0].content).toBe('Linterna frontal');
  });

  it('10f. sin nombre o si la IA se niega, da un error claro', async () => {
    await expect(proponerNombres('  ', { cliente: falsa(texto({})) })).rejects.toThrow('Falta el nombre');
    await expect(proponerNombres('Algo', { cliente: falsa({ stop_reason: 'refusal', content: [] }) })).rejects.toThrow('no ha querido');
  });
});

describe('mover artículos de una caja a otra', () => {
  it('10g. una parte resta aquí y suma allí; entero cambia de caja; si allí ya está, se suma; queda en el historial de las dos', async () => {
    const { query } = db();
    const nuevo = async (sitio, cantidad, rotos = 0) => {
      const { articuloId } = await ed().crearArticulo({ es: 'Sábana mover ' + Math.random(), sitioId: sitio, cantidad }, ADMIN);
      const id = (await query('SELECT id FROM contenido WHERE articulo_id = $1', [articuloId])).rows[0].id;
      if (rotos) await ed().cambiarRotos(id, rotos, ADMIN);
      return { articuloId, id };
    };
    const linea = async id => (await query('SELECT sitio_id, cantidad, rotos FROM contenido WHERE id = $1', [id])).rows[0];
    // Una parte: 3 de 10 (1 rota)
    const a = await nuevo(d.p1, 10, 2);
    const r = await ed().moverArticulos({ desdeSitioId: d.p1, haciaSitioId: d.c1, lineas: [{ contenidoId: a.id, cantidad: 3, rotos: 1 }] }, ADMIN);
    expect(r.movidos).toBe(1);
    expect(await linea(a.id)).toMatchObject({ sitio_id: d.p1, cantidad: 7, rotos: 1 });
    const alla = (await query('SELECT cantidad, rotos FROM contenido WHERE articulo_id = $1 AND sitio_id = $2', [a.articuloId, d.c1])).rows[0];
    expect(alla).toMatchObject({ cantidad: 3, rotos: 1 });
    // El resto, entero: se suma a la línea que ya está allí y desaparece de aquí (sin papelera)
    await ed().moverArticulos({ desdeSitioId: d.p1, haciaSitioId: d.c1, lineas: [{ contenidoId: a.id, cantidad: 7, rotos: 1 }] }, ADMIN);
    expect(await linea(a.id)).toBe(undefined);
    expect((await query('SELECT cantidad, rotos FROM contenido WHERE articulo_id = $1 AND sitio_id = $2', [a.articuloId, d.c1])).rows[0]).toMatchObject({ cantidad: 10, rotos: 2 });
    expect((await ed().quitados(d.p1)).some(q => q.articulo_id === a.articuloId)).toBe(false);
    // Entero sin nada allí: la línea cambia de caja
    const b = await nuevo(d.p1, 4);
    await ed().moverArticulos({ desdeSitioId: d.p1, haciaSitioId: d.c1, lineas: [{ contenidoId: b.id, cantidad: 4, rotos: 0 }] }, ADMIN);
    expect(await linea(b.id)).toMatchObject({ sitio_id: d.c1, cantidad: 4 });
    // Historial en las dos cajas
    expect((await ed().historial({ sitioId: d.p1, idioma: 'es' }))[0]).toMatchObject({ accion: 'mover' });
    expect((await ed().historial({ sitioId: d.c1, idioma: 'es' }))[0]).toMatchObject({ accion: 'mover' });
    // Sin caja, a la misma caja o sin nada elegido: error
    await expect(ed().moverArticulos({ desdeSitioId: d.c1, haciaSitioId: d.c1, lineas: [] }, ADMIN)).rejects.toThrow('otra caja');
    await expect(ed().moverArticulos({ desdeSitioId: d.c1, haciaSitioId: d.p1, lineas: [] }, ADMIN)).rejects.toThrow('Elige qué mover');
  });
});

describe('deshacer un movimiento', () => {
  it('10h. deshacer devuelve todo a su caja con las mismas unidades, una sola vez; queda en el historial y ya no se ofrece', async () => {
    const { query } = db();
    const { articuloId } = await ed().crearArticulo({ es: 'Farol deshacer', sitioId: d.p1, cantidad: 6 }, ADMIN);
    const id = (await query('SELECT id FROM contenido WHERE articulo_id = $1', [articuloId])).rows[0].id;
    const m = await ed().moverArticulos({ desdeSitioId: d.p1, haciaSitioId: d.c1, lineas: [{ contenidoId: id, cantidad: 4, rotos: 0 }] }, ADMIN);
    expect(m.grupo).toBeTruthy();
    const linea = sitio => query('SELECT cantidad FROM contenido WHERE articulo_id = $1 AND sitio_id = $2 AND borrado IS NULL', [articuloId, sitio]).then(r => r.rows[0]?.cantidad);
    expect(await linea(d.p1)).toBe(2);
    expect(await linea(d.c1)).toBe(4);
    expect((await ed().historial({ sitioId: d.c1, idioma: 'es' })).find(h => h.accion === 'mover').deshacible).toBe(true);
    await ed().deshacerMovimiento(m.grupo, ADMIN);
    expect(await linea(d.p1)).toBe(6);
    expect(await linea(d.c1)).toBe(undefined);
    expect((await ed().historial({ sitioId: d.p1, idioma: 'es' }))[0]).toMatchObject({ accion: 'deshacerMover' });
    expect((await ed().historial({ sitioId: d.c1, idioma: 'es' })).find(h => h.accion === 'mover').deshacible).toBe(false);
    await expect(ed().deshacerMovimiento(m.grupo, ADMIN)).rejects.toThrow('ya se deshizo');
  });
});
