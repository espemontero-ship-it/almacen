import { describe, it, expect, beforeAll } from 'vitest';
import { db, datos, sembrar } from './ayuda.js';

let d;
beforeAll(async () => { d = await sembrar(); });

describe('buscar', () => {
  it('1. encuentra un artículo por su nombre en español y suma todas sus cajas', async () => {
    const { articulos } = await datos().buscar('copa', 'es');
    expect(articulos.map(a => a.nombre)).toEqual(['Copa']);
    expect(articulos[0].total).toBe(15);
    expect(articulos[0].sitios.map(s => s.codigo).sort()).toEqual(['C1', 'P1']);
  });

  it('2. encuentra el mismo artículo por su nombre en inglés, y lo enseña en el idioma elegido', async () => {
    const es = await datos().buscar('cup', 'es');
    const en = await datos().buscar('cup', 'en');
    expect(es.articulos[0].nombre).toBe('Copa');
    expect(en.articulos[0].nombre).toBe('Cup');
  });

  it('3. buscar una etiqueta trae sus artículos', async () => {
    const { articulos } = await datos().buscar('atrezo', 'es');
    expect(articulos.map(a => a.nombre)).toEqual(['Espada']);
  });

  it('4. la ropa sale sumada por tallas, en orden de talla', async () => {
    const { articulos } = await datos().buscar('camiseta', 'es');
    expect(articulos[0].total).toBe(6);
    expect(articulos[0].tallas).toEqual([{ talla: 'S', cantidad: 2 }, { talla: 'M', cantidad: 4 }]);
  });

  it('5. el código de una caja lleva a esa caja', async () => {
    expect(await datos().sitioPorCodigo('P1')).toBe(d.p1);
    expect(await datos().sitioPorCodigo('Z99')).toBe(null);
  });

  it('6. las sugerencias traen cajas, etiquetas y artículos', async () => {
    const caja = await datos().sugerencias('latex', 'es');
    expect(caja.lista[0]).toMatchObject({ tipo: 'caja', codigo: 'P1', nombre: 'latex weapons' });
    const etiqueta = await datos().sugerencias('atrez', 'es');
    expect(etiqueta.lista.find(s => s.tipo === 'etiqueta')).toMatchObject({ nombre: 'Atrezo', articulos: 1 });
    const articulo = await datos().sugerencias('espa', 'es');
    expect(articulo.lista.find(s => s.tipo === 'articulo')).toMatchObject({ nombre: 'Espada', total: 10 });
  });

  it('7. con una errata, propone lo más parecido y avisa de que no es exacto', async () => {
    const r = await datos().buscar('espadda', 'es');
    expect(r.aproximado).toBe(true);
    expect(r.articulos.map(a => a.nombre)).toContain('Espada');
  });

  it('8. lo quitado de una caja no cuenta en la búsqueda', async () => {
    const id = await d.linea(d.c1, d.copa);
    await db().query('UPDATE contenido SET borrado = now() WHERE id = $1', [id]);
    const { articulos } = await datos().buscar('copa', 'es');
    expect(articulos[0].total).toBe(3);
    await db().query('UPDATE contenido SET borrado = NULL WHERE id = $1', [id]);
  });
});
