import fs from 'fs';
import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const raiz = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

// Base de datos vacía en memoria, con el esquema de la app. No toca ni la base de tu ordenador ni la de la web.
export async function arrancarBaseLocal() {
  const db = await PGlite.create({ extensions: { pg_trgm } });
  await db.exec(fs.readFileSync(`${raiz}/db/schema.sql`, 'utf8'));
  const servidor = new PGLiteSocketServer({ db, port: 0, host: '127.0.0.1', maxConnections: 10 });
  await servidor.start();
  const puerto = servidor.server.address().port;
  return {
    url: `postgres://postgres:postgres@127.0.0.1:${puerto}/postgres?sslmode=disable`,
    parar: async () => {
      await servidor.stop();
      await db.close();
    },
  };
}
