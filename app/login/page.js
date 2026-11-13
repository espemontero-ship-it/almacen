'use client';

import { useState } from 'react';

export default function Login() {
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function entrar(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    const datos = new FormData(evento.currentTarget);
    try {
      const r = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: datos.get('usuario'), password: datos.get('password') }),
      });
      if (r.ok) {
        window.location.href = '/';
        return;
      }
      const cuerpo = await r.json().catch(() => ({}));
      setError(cuerpo.error || 'No se ha podido entrar.');
    } catch {
      setError('No hay conexión. Prueba otra vez.');
    }
    setEnviando(false);
  }

  return (
    <main className="pantalla-entrada">
      <h1 className="titulo-app">Almacén</h1>
      <form onSubmit={entrar} className="formulario">
        <label>
          Usuario
          <input name="usuario" autoComplete="username" autoCapitalize="none" required />
        </label>
        <label>
          Contraseña
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="boton-principal" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
