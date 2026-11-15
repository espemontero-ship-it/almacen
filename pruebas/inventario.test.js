import { describe, it, expect, beforeAll } from 'vitest';
import { ed, db, datos, sembrar, ADMIN } from './ayuda.js';

let d;
beforeAll(async () => { d = await sembrar(); });

describe('inventario de una caja', () => {
  it('130. una caja sin revisar no tiene revisión; al revisarla se apunta quién y cuándo, y queda en el historial', async () => {
    expect(await ed().ultimaRevision(d.p1)).toBe(null);
    const r = await ed().revisarCaja(d.p1, ADMIN);
    expect(r.usuario_nombre).toBe('Admin de prueba');
    expect(r.siguiente).toBe(null);
    expect((await ed().ultimaRevision(d.p1)).usuario_nombre).toBe('Admin de prueba');
    expect((await ed().historial({ sitioId: d.p1, idioma: 'es' }))[0]).toMatchObject({ accion: 'revisada' });
  });

  it('131. si hay un inventario abierto que incluye la caja, cuenta para él y propone la siguiente sin revisar', async () => {
    const { query } = db();
    const inv = (await query("INSERT INTO inventarios (tipo) VALUES ('general') RETURNING id")).rows[0].id;
    await query('INSERT INTO inventario_cajas (inventario_id, sitio_id) VALUES ($1, $2), ($1, $3)', [inv, d.p1, d.c1]);
    expect(await ed().inventarioAbiertoDe(d.p1)).toBe(inv);
    const r = await ed().revisarCaja(d.p1, ADMIN);
    expect(r.siguiente).toBe(d.c1);
    const ultima = (await query('SELECT inventario_id FROM revisiones WHERE sitio_id = $1 ORDER BY id DESC LIMIT 1', [d.p1])).rows[0];
    expect(ultima.inventario_id).toBe(inv);
    expect((await ed().revisarCaja(d.c1, ADMIN)).siguiente).toBe(null);
  });

  it('132. un inventario cerrado ya no cuenta', async () => {
    const { query } = db();
    await query('UPDATE inventarios SET cerrado = now()');
    expect(await ed().inventarioAbiertoDe(d.p1)).toBe(null);
  });

  it('133. no se puede revisar una caja que no existe', async () => {
    await expect(ed().revisarCaja(999999, ADMIN)).rejects.toThrow('no existe');
  });
});

describe('borrar una caja', () => {
  it('134. borrarla la quita de Cajas, del inicio y de la búsqueda, y queda en el historial', async () => {
    const caja = (await ed().crearCaja({ letra: 'Z', numero: 1, nombre: 'para borrar' }, ADMIN)).id;
    const { articuloId } = await ed().crearArticulo({ es: 'Farolillo', en: 'Lantern', sitioId: caja, cantidad: 2 }, ADMIN);
    await ed().borrarCaja(caja, ADMIN);
    expect((await ed().listarCajas()).map(c => c.id)).not.toContain(caja);
    expect(await datos().obtenerSitio(caja, 'es')).toBe(null);
    expect((await datos().listarTodo('es')).some(f => f.sitio_id === caja)).toBe(false);
    expect((await datos().buscar('farolillo', 'es')).articulos).toEqual([]);
    expect(await datos().obtenerArticulo(articuloId, 'es')).toBe(null);
    const h = (await ed().historial({ idioma: 'es' }))[0];
    expect(h).toMatchObject({ accion: 'borrarCaja', detalle: { codigo: 'Z1' }, caja_recuperable: true, caja_borrada: true });
  });

  it('135. recuperarla la devuelve con todo lo que tenía y lo apunta', async () => {
    const caja = (await db().query("SELECT id FROM sitios WHERE codigo = 'Z1'")).rows[0].id;
    await ed().recuperarCaja(caja, ADMIN);
    expect((await ed().listarCajas()).map(c => c.id)).toContain(caja);
    expect((await datos().obtenerSitio(caja, 'es')).contenido.map(c => c.nombre)).toEqual(['Farolillo']);
    expect((await ed().historial({ idioma: 'es' }))[0]).toMatchObject({ accion: 'recuperarCaja', caja_borrada: false });
    await expect(ed().recuperarCaja(caja, ADMIN)).rejects.toThrow('ya no se puede recuperar');
  });

  it('136. pasados 30 días ya no se recupera y se borra del todo', async () => {
    const { query } = db();
    const caja = (await query("SELECT id FROM sitios WHERE codigo = 'Z1'")).rows[0].id;
    await ed().borrarCaja(caja, ADMIN);
    await query("UPDATE sitios SET borrado = now() - interval '31 days' WHERE id = $1", [caja]);
    await expect(ed().recuperarCaja(caja, ADMIN)).rejects.toThrow('ya no se puede recuperar');
    await ed().purgarCajas();
    expect((await query('SELECT id FROM sitios WHERE id = $1', [caja])).rows).toEqual([]);
    expect((await query('SELECT id FROM contenido WHERE sitio_id = $1', [caja])).rows).toEqual([]);
    expect((await ed().historial({ idioma: 'es' })).find(x => x.accion === 'borrarCaja' && x.sitio_id === caja)).toMatchObject({ caja_borrada: true, caja_recuperable: false });
  });

  it('137. no se puede crear una caja con el código de una borrada que aún se puede recuperar', async () => {
    const caja = (await ed().crearCaja({ letra: 'Z', numero: 2 }, ADMIN)).id;
    await ed().borrarCaja(caja, ADMIN);
    await expect(ed().crearCaja({ letra: 'Z', numero: 2 }, ADMIN)).rejects.toThrow('está borrada');
  });
});
