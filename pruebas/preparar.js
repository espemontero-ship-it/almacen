import { createRequire } from 'module';
import { afterAll } from 'vitest';
import { arrancarBaseLocal } from './baseLocal.js';

// Nunca contra la base de verdad: siempre una base nueva en memoria.
const base = await arrancarBaseLocal();
process.env.DATABASE_URL = base.url;
delete process.env.POSTGRES_URL;
process.env.AUTH_SECRET = 'clave-solo-para-pruebas-0123456789abcdef';
delete process.env.SMTP_USER;
delete process.env.SMTP_APP_PASSWORD;
delete process.env.R2_ACCOUNT_ID;

const requerir = createRequire(import.meta.url);
afterAll(async () => {
  try { await requerir('../lib/db.cjs').getPool().end(); } catch {}
  await base.parar();
});
