const crypto = require('crypto');
const { query, getPool } = require('../lib/db.cjs');

async function invitar({ usuario, nombre, rol }) {
  const u = await query(
    `INSERT INTO usuarios (usuario, nombre, rol) VALUES ($1, $2, $3)
     ON CONFLICT (usuario) DO UPDATE SET nombre = EXCLUDED.nombre, rol = EXCLUDED.rol
     RETURNING id`,
    [usuario.toLowerCase(), nombre, rol]
  );
  const token = crypto.randomBytes(24).toString('hex');
  await query("INSERT INTO invitaciones (token, usuario_id, expira) VALUES ($1, $2, now() + interval '7 days')", [token, u.rows[0].id]);
  return token;
}

if (require.main === module) {
  const [usuario, nombre, rol = 'consulta', base = 'http://localhost:3000'] = process.argv.slice(2);
  if (!usuario || !nombre) {
    console.error('Uso: node scripts/invitar.cjs <usuario> "<nombre>" [admin|editor|consulta] [url base]');
    process.exit(1);
  }
  invitar({ usuario, nombre, rol })
    .then(token => {
      console.log(`${base}/invitacion/${token}`);
      return getPool().end();
    })
    .catch(error => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { invitar };
