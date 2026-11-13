const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { query, getPool } = require('./db.cjs');

async function verificarUsuario(usuario, password) {
  const r = await query(
    'SELECT id, usuario, nombre, rol, password_hash FROM usuarios WHERE usuario = $1 OR lower(correo) = $1',
    [String(usuario || '').trim().toLowerCase()]
  );
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
      'DELETE FROM invitaciones WHERE token = $1 AND expira > now() RETURNING usuario_id',
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
    await cliente.query('DELETE FROM invitaciones WHERE usuario_id = $1', [r.rows[0].usuario_id]);
    await cliente.query('COMMIT');
    return u.rows[0];
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function crearEnlace(usuarioId, horas) {
  const token = crypto.randomBytes(24).toString('hex');
  await query(
    'INSERT INTO invitaciones (token, usuario_id, expira) VALUES ($1, $2, now() + make_interval(hours => $3))',
    [token, usuarioId, horas]
  );
  return token;
}

async function buscarPorCorreo(correo) {
  const r = await query('SELECT id, usuario, nombre, correo FROM usuarios WHERE lower(correo) = lower($1)', [
    String(correo || '').trim(),
  ]);
  return r.rows[0] || null;
}

async function listarUsuarios() {
  const r = await query(
    'SELECT id, usuario, nombre, correo, rol, password_hash IS NOT NULL AS activo FROM usuarios ORDER BY lower(nombre)'
  );
  return r.rows;
}

async function crearUsuario({ usuario, nombre, correo, rol }) {
  const r = await query(
    'INSERT INTO usuarios (usuario, nombre, correo, rol) VALUES ($1, $2, $3, $4) RETURNING id',
    [String(usuario).trim().toLowerCase(), String(nombre).trim(), String(correo || '').trim() || null, rol]
  );
  return r.rows[0].id;
}

async function obtenerUsuario(id) {
  const r = await query('SELECT id, usuario, nombre, correo, rol FROM usuarios WHERE id = $1', [id]);
  return r.rows[0] || null;
}

module.exports = {
  verificarUsuario,
  leerInvitacion,
  usarInvitacion,
  crearEnlace,
  buscarPorCorreo,
  listarUsuarios,
  crearUsuario,
  obtenerUsuario,
};
