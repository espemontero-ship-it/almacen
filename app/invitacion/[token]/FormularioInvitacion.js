'use client';

import { useState } from 'react';

export default function FormularioInvitacion({ token, nombre, usuario }) {
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function guardar(evento) {
    evento.preventDefault();
    setError('');
    const datos = new FormData(evento.currentTarget);
    const password = datos.get('password');
    if (password !== datos.get('repetir')) {
      setError('Las dos contraseñas no coinciden.');
      return;
    }
    setEnviando(true);
    try {
      const r = await fetch('/api/invitacion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (r.ok) {
        window.location.href = '/';
        return;
      }
      const cuerpo = await r.json().catch(() => ({}));
      setError(cuerpo.error || 'No se ha podido guardar.');
    } catch {
      setError('No hay conexión. Prueba otra vez.');
    }
    setEnviando(false);
  }

  return (
    <form onSubmit={guardar} className="formulario">
      <p>Hola, {nombre}. Tu usuario es <strong>{usuario}</strong>. Elige tu contraseña.</p>
      <input type="text" name="usuario" value={usuario} autoComplete="username" readOnly hidden />
      <label>
        Contraseña
        <input name="password" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      <label>
        Repite la contraseña
        <input name="repetir" type="password" autoComplete="new-password" minLength={8} required />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" className="boton-principal" disabled={enviando}>
        {enviando ? 'Guardando…' : 'Guardar y entrar'}
      </button>
    </form>
  );
}
