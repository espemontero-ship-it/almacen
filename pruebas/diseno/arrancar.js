import { spawn, execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { createRequire } from 'module';
import { arrancarBaseLocal } from '../baseLocal.js';

const raiz = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const PUERTO = 3107;

// Antes de la prueba de diseño: base de datos de prueba con datos inventados y la app arrancada contra ella.
export default async function arrancar({ provide }) {
  const base = await arrancarBaseLocal();
  process.env.DATABASE_URL = base.url;
  delete process.env.POSTGRES_URL;
  const requerir = createRequire(import.meta.url);
  const { sembrar, ADMIN } = await import('../ayuda.js');
  const d = await sembrar();
  const ed = requerir('../../lib/edicion.cjs');
  const u = requerir('../../lib/usuarios.cjs');
  await ed.cambiarRotos(await d.linea(d.p1, d.espada), 2, ADMIN);
  await ed.cambiarComentarios(await d.linea(d.p1, d.espada), 'hoja mellada', ADMIN);
  await ed.cambiarLlenado(d.p1, 'medias', ADMIN);
  const id = await u.crearUsuario({ usuario: 'admin-diseno', nombre: 'Admin diseno', rol: 'admin' });
  await u.usarInvitacion(await u.crearEnlace(id, 1), 'clave-diseno');
  await requerir('../../lib/db.cjs').getPool().end();

  const app = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', String(PUERTO)], {
    cwd: raiz,
    env: { ...process.env, DATABASE_URL: base.url, NEXT_TELEMETRY_DISABLED: '1', CARPETA_NEXT: '.next-diseno', NODE_ENV: 'development', AUTH_SECRET: 'clave-solo-para-la-prueba-de-diseno-0123456789' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let salida = '';
  app.stdout.on('data', t => { salida += t; });
  app.stderr.on('data', t => { salida += t; });
  const registro = () => { try { writeFileSync(`${raiz}/.next-diseno/registro-prueba.log`, salida); } catch {} };
  app.stdout.on('data', registro);
  app.stderr.on('data', registro);

  const url = `http://localhost:${PUERTO}`;
  const limite = Date.now() + 240000;
  for (;;) {
    try {
      const r = await fetch(`${url}/login`);
      if (r.ok) break;
    } catch {}
    if (Date.now() > limite || app.exitCode !== null) {
      throw new Error('La app no ha arrancado para la prueba de diseño:\n' + salida.slice(-2000));
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  provide('url', url);
  provide('ids', { p1: d.p1, camiseta: d.camiseta });

  return async () => {
    try { execSync(`taskkill /pid ${app.pid} /T /F`, { stdio: 'ignore' }); } catch { app.kill(); }
    await base.parar();
  };
}
