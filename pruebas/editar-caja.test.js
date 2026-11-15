import { describe, it, expect, beforeAll } from 'vitest';
import { ed, datos, sembrar, ADMIN } from './ayuda.js';

let d;
beforeAll(async () => { d = await sembrar(); });
const ultimo = async sitioId => (await ed().historial({ sitioId, idioma: 'es' }))[0];

describe('editar una caja', () => {
  it('10. cambiar la cantidad se guarda y queda en el historial; nunca baja de 0', async () => {
    const id = await d.linea(d.p1, d.espada);
    expect((await ed().cambiarCantidad(id, 7, ADMIN)).cantidad).toBe(7);
    expect(await ultimo(d.p1)).toMatchObject({ accion: 'cantidad', detalle: { antes: 10, despues: 7 }, usuario_nombre: 'Admin de prueba' });
    expect((await ed().cambiarCantidad(id, -3, ADMIN)).cantidad).toBe(0);
    await ed().cambiarCantidad(id, 10, ADMIN);
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
