const bcrypt = require('bcryptjs');
const { query, getPool } = require('./db.cjs');

async function verificarUsuario(usuario, password) {
  const r = await query('SELECT id, usuario, nombre, rol, password_hash FROM usuarios WHERE usuario = $1', [
    String(usuario || '').trim().toLowerCase(),
  ]);
  const u = r.rows[0];
  if (!u || !u.password_hash) return null;
  const ok = await bcrypt.compare(password || '', u.password_hash);
  return ok ? { id: u.id, usuario: u.usuario, nombre: u.nombre, rol: u.rol } : null;
}

async function leerInvitacion(token) {
  const r = await query(
    `SELECT u.id, u.usuario, u.nombre, u.rol FROM invitaciones i
     JOIN usuarios u ON u.id = i.usuario_id
     WHERE i.token = $1 AND i.expira > now()`,
    [token]
  );
  return r.rows[0] || null;
}

async function usarInvitacion(token, password) {
  const cliente = await getPool().connect();
  try {
    await cliente.query('BEGIN');
    const r = await cliente.query(
      `DELETE FROM invitaciones WHERE token = $1 AND expira > now() RETURNING usuario_id`,
      [token]
    );
    if (!r.rows.length) {
      await cliente.query('ROLLBACK');
      return null;
    }
    const hash = await bcrypt.hash(password, 10);
    const u = await cliente.query(
      'UPDATE usuarios SET password_hash = $2 WHERE id = $1 RETURNING id, usuario, nombre, rol',
      [r.rows[0].usuario_id, hash]
    );
    await cliente.query('COMMIT');
    return u.rows[0];
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

module.exports = { verificarUsuario, leerInvitacion, usarInvitacion };
