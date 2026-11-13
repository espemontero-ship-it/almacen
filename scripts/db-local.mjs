import { PGlite } from '@electric-sql/pglite';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const db = await PGlite.create('./.pglite', { extensions: { pg_trgm } });
const server = new PGLiteSocketServer({ db, port: 5433, host: '127.0.0.1', maxConnections: 10 });
await server.start();
console.log('Base de datos local en postgres://postgres@127.0.0.1:5433/postgres');

process.on('SIGINT', async () => {
  await server.stop();
  await db.close();
  process.exit(0);
});
