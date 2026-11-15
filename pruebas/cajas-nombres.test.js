import { describe, it, expect, beforeAll } from 'vitest';
import { ed, datos, sembrar, ADMIN } from './ayuda.js';

let d;
beforeAll(async () => { d = await sembrar(); });

describe('cajas', () => {
  it('20. el número propuesto es el siguiente libre de esa letra', async () => {
    expect(await ed().siguienteNumero('P')).toBe(2);
    expect(await ed().siguienteNumero('O')).toBe(1);
  });

  it('21. crear caja: no repite un código y solo admite una letra', async () => {
    await expect(ed().crearCaja({ letra: 'P', numero: 1 }, ADMIN)).rejects.toThrow('ya existe');
    await expect(ed().crearCaja({ letra: 'PP', numero: 3 }, ADMIN)).rejects.toThrow('Letra');
    const { id } = await ed().crearCaja({ letra: 'p', numero: 2, nombre: ' cascos ' }, ADMIN);
    expect(await datos().obtenerSitio(id, 'es')).toMatchObject({ codigo: 'P2', nombre: 'cascos' });
    expect((await ed().historial({ sitioId: id, idioma: 'es' }))[0]).toMatchObject({ accion: 'crearCaja' });
  });

  it('22. la lista "Cajas" trae todas, en el orden de la app (P antes que C) y con su llenado', async () => {
    await ed().cambiarLlenado(d.c1, 'llena', ADMIN);
    const lista = await ed().listarCajas();
    expect(lista.map(c => c.codigo)).toEqual(['P1', 'P2', 'C1']);
    expect(lista.find(c => c.codigo === 'C1').llenado).toBe('llena');
    expect(lista.find(c => c.codigo === 'P1').llenado).toBe(null);
  });
});

describe('nombres y sinónimos', () => {
  it('23. cambiar el nombre en inglés lo cambia solo en inglés y el buscador lo encuentra', async () => {
    await ed().cambiarNombres(d.espada, { idioma: 'en', nombre: 'Long sword' }, ADMIN);
    expect((await datos().buscar('long sword', 'en')).articulos.map(a => a.nombre)).toEqual(['Long sword']);
    expect((await datos().buscar('espada', 'es')).articulos[0].nombre).toBe('Espada');
  });

  it('24. los sinónimos se guardan sin repetir y el buscador los encuentra en los dos idiomas', async () => {
    const r = await ed().cambiarNombres(d.espada, { sinonimos: ['sable', ' sable ', 'blade'] }, ADMIN);
    expect(r.otros).toEqual(['sable', 'blade']);
    expect((await datos().buscar('sable', 'es')).articulos.map(a => a.nombre)).toEqual(['Espada']);
    expect((await datos().buscar('blade', 'en')).articulos.map(a => a.nombre)).toEqual(['Long sword']);
  });

  it('25. el nombre no puede quedar vacío, y cada cambio queda en el historial', async () => {
    await expect(ed().cambiarNombres(d.espada, { idioma: 'es', nombre: ' ' }, ADMIN)).rejects.toThrow('vacío');
    const h = await ed().historial({ articuloId: d.espada, idioma: 'es' });
    expect(h.slice(0, 2).map(x => x.accion)).toEqual(['sinonimos', 'nombre']);
  });
});
