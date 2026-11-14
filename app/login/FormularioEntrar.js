'use client';

import { useState } from 'react';
import Link from 'next/link';
import { textos } from '../../lib/textos';

export default function FormularioEntrar({ idioma }) {
  const t = textos(idioma);
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
      setError(t.errorEntrar);
    } catch {
      setError(t.sinConexion);
    }
    setEnviando(false);
  }

  return (
    <main className="pantalla-entrada pantalla-entrar">
      <Link href="/" className="enlace-volver">{t.inicio}</Link>
      <h1 className="titulo-app">{t.titulo}</h1>
      <form onSubmit={entrar} className="formulario">
        <label>
          {t.usuario}
          <input name="usuario" autoComplete="username" autoCapitalize="none" required />
        </label>
        <label>
          {t.contrasena}
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="boton-principal" disabled={enviando}>
          {t.entrar}
        </button>
        <Link href="/recuperar" className="enlace-volver">{t.olvidada}</Link>
      </form>
    </main>
  );
}
