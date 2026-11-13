const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let pool;
function getPool() {
  if (!connectionString) {
    throw new Error('Falta DATABASE_URL.');
  }
  if (!pool) {
    const local = /@(127\.0\.0\.1|localhost)[:/]/.test(connectionString);
    pool = new Pool({
      connectionString,
      ssl: local || connectionString.includes('sslmode=') ? undefined : { rejectUnauthorized: false },
      max: local ? 1 : 10,
    });
  }
  return pool;
}

async function query(text, params) {
  return getPool().query(text, params);
}

module.exports = { query, getPool };
