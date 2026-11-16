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

describe('inventario compartido de una caja', () => {
  const ANA = { id: 2, nombre: 'Ana' };

  it('138. lo marcado se guarda con quién lo marcó, lo ve todo el mundo y vale el último toque; se ve quién más está dentro', async () => {
    const { query } = db();
    const linea = (await query('SELECT id FROM contenido WHERE sitio_id = $1 AND borrado IS NULL ORDER BY id LIMIT 1', [d.p1])).rows[0].id;
    expect((await ed().estadoRevision(d.p1, ADMIN)).activa).toBe(false);
    await ed().empezarRevision(d.p1, ADMIN);
    await ed().marcarRevision(d.p1, linea, true, ANA);
    const visto = await ed().estadoRevision(d.p1, ADMIN);
    expect(visto.activa).toBe(true);
    expect(visto.marcas).toEqual([{ id: linea, nombre: 'Ana' }]);
    await ed().estadoRevision(d.p1, ANA);
    expect((await ed().estadoRevision(d.p1, ADMIN)).presentes).toEqual(['Ana']);
    expect((await ed().estadoRevision(d.p1, ANA)).presentes).toEqual(['Admin de prueba']);
    await ed().marcarRevision(d.p1, linea, false, ADMIN);
    expect((await ed().estadoRevision(d.p1, ANA)).marcas).toEqual([]);
    await ed().saltarFoto(d.p1, linea);
    expect((await ed().estadoRevision(d.p1, ANA)).saltadas).toEqual([linea]);
    await query("UPDATE revision_presentes SET visto = now() - interval '20 seconds' WHERE usuario_id = $1", [ANA.id]);
    expect((await ed().estadoRevision(d.p1, ADMIN)).presentes).toEqual([]);
  });

  it('139. "Están bien" marca el resto; "Caja revisada" termina para todos y borra lo marcado', async () => {
    await ed().marcarTodas(d.p1, ADMIN);
    const total = (await datos().obtenerSitio(d.p1, 'es')).contenido.length;
    expect((await ed().estadoRevision(d.p1, ADMIN)).marcas).toHaveLength(total);
    await ed().revisarCaja(d.p1, ADMIN);
    expect(await ed().estadoRevision(d.p1, ANA)).toEqual({ activa: false, marcas: [], saltadas: [], presentes: [] });
  });

  it('151. con un inventario abierto que incluye la caja entra sola; una vez revisada para ese inventario, ya no', async () => {
    const { query } = db();
    const inv = (await query("INSERT INTO inventarios (tipo) VALUES ('parcial') RETURNING id")).rows[0].id;
    await query('INSERT INTO inventario_cajas (inventario_id, sitio_id) VALUES ($1, $2)', [inv, d.c1]);
    expect((await ed().estadoRevision(d.c1, ADMIN)).activa).toBe(true);
    await ed().revisarCaja(d.c1, ADMIN);
    expect((await ed().estadoRevision(d.c1, ADMIN)).activa).toBe(false);
    await query('UPDATE inventarios SET cerrado = now() WHERE id = $1', [inv]);
  });

  it('152. no se puede marcar un artículo que no es de la caja', async () => {
    const { query } = db();
    const otra = (await query('SELECT id FROM contenido WHERE sitio_id = $1 AND borrado IS NULL LIMIT 1', [d.c1])).rows[0].id;
    await expect(ed().marcarRevision(d.p1, otra, true, ADMIN)).rejects.toThrow('ya no está en esta caja');
  });
});

describe('abrir y cerrar inventarios', () => {
  it('153. los tipos salen en el orden de la app con cuántas cajas tiene cada uno', async () => {
    const tipos = await ed().tiposDeCaja();
    expect(tipos.map(t => t.letra).slice(0, 2)).toEqual(['P', 'C']);
    expect(tipos.find(t => t.letra === 'P').cajas).toBeGreaterThan(0);
  });

  it('154. se abre por cajas sueltas; solo puede haber uno abierto; las cajas entran solas en inventario', async () => {
    const inv = await ed().abrirInventario({ forma: 'cajas', cajas: [d.p1] }, ADMIN);
    expect(inv.cajas).toBe(1);
    await expect(ed().abrirInventario({ forma: 'general' }, ADMIN)).rejects.toThrow('Ya hay un inventario abierto');
    const actual = await ed().inventarioActual();
    expect(actual).toMatchObject({ id: inv.id, total: 1, detalle: { forma: 'cajas' } });
    expect(actual.revisadas).toEqual([]);
    expect((await ed().estadoRevision(d.p1, ADMIN)).activa).toBe(true);
    expect((await ed().estadoRevision(d.c1, ADMIN)).activa).toBe(false);
  });

  it('155. al revisar una caja cuenta para el inventario, con quién y cuándo; Cajas sabe cuándo se revisó', async () => {
    await ed().revisarCaja(d.p1, ADMIN);
    const actual = await ed().inventarioActual();
    expect(actual.revisadas).toHaveLength(1);
    expect(actual.revisadas[0]).toMatchObject({ id: d.p1, usuario_nombre: 'Admin de prueba' });
    expect((await ed().listarCajas()).find(c => c.id === d.p1).revisada).toBeTruthy();
  });

  it('156. al cerrar sale el resumen, pasa a los anteriores y las cajas que entraron solas dejan de estar en revisión', async () => {
    const { query } = db();
    const inv = (await ed().inventarioActual()).id;
    await query('INSERT INTO inventario_cajas (inventario_id, sitio_id) VALUES ($1, $2)', [inv, d.c1]);
    expect((await ed().estadoRevision(d.c1, ADMIN)).activa).toBe(true);
    const cerrado = await ed().cerrarInventario(inv);
    expect(cerrado.revisadas.map(c => c.id)).toEqual([d.p1]);
    expect(cerrado.sinRevisar.map(c => c.id)).toEqual([d.c1]);
    expect(await ed().inventarioActual()).toBe(null);
    expect((await ed().estadoRevision(d.c1, ADMIN)).activa).toBe(false);
    expect((await ed().inventariosAnteriores())[0]).toMatchObject({ id: inv, total: 2, revisadas: 1 });
    await expect(ed().cerrarInventario(inv)).rejects.toThrow('ya está cerrado');
  });

  it('157. por tipo coge las cajas de esos tipos; sin elegir nada no se abre', async () => {
    await expect(ed().abrirInventario({ forma: 'tipos', letras: [] }, ADMIN)).rejects.toThrow('Elige al menos una caja');
    const inv = await ed().abrirInventario({ forma: 'tipos', letras: ['C'] }, ADMIN);
    const actual = await ed().inventarioActual();
    expect(actual.detalle).toEqual({ forma: 'tipos', letras: ['C'] });
    expect(actual.sinRevisar.every(c => c.codigo.startsWith('C'))).toBe(true);
    await ed().cerrarInventario(inv.id);
  });
});
