import { describe, it, expect, beforeAll } from 'vitest';
import { usuarios, auth, sembrar } from './ayuda.js';
import { POST as editar } from '../app/api/editar/route.js';
import { POST as personas } from '../app/api/personas/route.js';
import { POST as entrar } from '../app/api/login/route.js';

let d;
const ids = {};
beforeAll(async () => {
  d = await sembrar();
  const u = usuarios();
  for (const rol of ['admin', 'editor', 'consulta']) {
    ids[rol] = await u.crearUsuario({ usuario: `${rol}-prueba`, nombre: `Persona ${rol}`, correo: `${rol}@ejemplo.invalid`, rol });
    await u.usarInvitacion(await u.crearEnlace(ids[rol], 1), 'clave-de-prueba');
  }
});

async function peticion(rol, cuerpo) {
  const token = rol ? await auth().crearTokenSesion({ id: ids[rol], nombre: `Persona ${rol}`, rol }) : null;
  return {
    url: 'http://localhost/api',
    cookies: { get: () => (token ? { value: token } : undefined) },
    json: async () => cuerpo,
  };
}

describe('entrar', () => {
  it('30. se entra con el usuario o con el correo, y con la contraseña mal no', async () => {
    const u = usuarios();
    expect(await u.verificarUsuario('editor-prueba', 'clave-de-prueba')).toMatchObject({ rol: 'editor' });
    expect(await u.verificarUsuario('EDITOR@ejemplo.invalid', 'clave-de-prueba')).toMatchObject({ rol: 'editor' });
    expect(await u.verificarUsuario('editor-prueba', 'otra')).toBe(null);
    expect((await entrar(await peticion(null, { usuario: 'editor-prueba', password: 'otra' }))).status).toBe(401);
  });

  it('31. el enlace de invitación o de nueva contraseña sirve una sola vez', async () => {
    const u = usuarios();
    const token = await u.crearEnlace(ids.consulta, 2);
    expect(await u.leerInvitacion(token)).toMatchObject({ usuario: 'consulta-prueba' });
    expect(await u.usarInvitacion(token, 'nueva-clave')).toMatchObject({ usuario: 'consulta-prueba' });
    expect(await u.usarInvitacion(token, 'otra-mas')).toBe(null);
    expect(await u.verificarUsuario('consulta-prueba', 'nueva-clave')).toBeTruthy();
  });

  it('32. recuperar contraseña encuentra a la persona por su correo, sin importar mayúsculas', async () => {
    expect(await usuarios().buscarPorCorreo(' Admin@Ejemplo.invalid ')).toMatchObject({ usuario: 'admin-prueba' });
    expect(await usuarios().buscarPorCorreo('nadie@ejemplo.invalid')).toBe(null);
  });

  it('33. una sesión manipulada no vale', async () => {
    const token = await auth().crearTokenSesion({ id: 1, rol: 'consulta' });
    expect(await auth().leerSesion(token)).toMatchObject({ rol: 'consulta' });
    expect(await auth().leerSesion(token.replace('consulta', 'admin'))).toBe(null);
  });
});

describe('permisos', () => {
  it('34. sin entrar o con solo consulta no se puede editar nada', async () => {
    const cuerpo = { accion: 'cantidad', id: await d.linea(d.p1, d.espada), cantidad: 1 };
    expect((await editar(await peticion(null, cuerpo))).status).toBe(403);
    expect((await editar(await peticion('consulta', cuerpo))).status).toBe(403);
  });

  it('35. edición y administración sí pueden editar', async () => {
    const id = await d.linea(d.p1, d.espada);
    expect((await editar(await peticion('editor', { accion: 'cantidad', id, cantidad: 9 }))).status).toBe(200);
    expect((await editar(await peticion('admin', { accion: 'cantidad', id, cantidad: 10 }))).status).toBe(200);
  });

  it('36. Personas (invitar) solo para administración', async () => {
    const cuerpo = { accion: 'invitar', nombre: 'Nueva', usuario: 'nueva', rol: 'consulta' };
    expect((await personas(await peticion('editor', cuerpo))).status).toBe(403);
    expect((await personas(await peticion(null, cuerpo))).status).toBe(403);
    expect((await personas(await peticion('admin', cuerpo))).status).toBe(200);
  });
});
