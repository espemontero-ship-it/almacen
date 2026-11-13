const fs = require('fs');
const path = require('path');
const { getPool } = require('../lib/db.cjs');
const { unificarTallas } = require('../lib/unificarTallas.cjs');
const { aplicarNombresIA } = require('../lib/nombresIA.cjs');

(async () => {
  const cliente = await getPool().connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
    const resumen = await unificarTallas(cliente);
    await aplicarNombresIA(cliente);
    await cliente.query('COMMIT');
    console.log(resumen);
  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    cliente.release();
    await getPool().end();
  }
})();
