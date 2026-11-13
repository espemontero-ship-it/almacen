'use client';

import { useState } from 'react';
import Link from 'next/link';
import { textos } from '../../lib/textos';

export default function FormularioRecuperar({ idioma }) {
  const t = textos(idioma);
  const [hecho, setHecho] = useState(false);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError('');
    setEnviando(true);
    const datos = new FormData(evento.currentTarget);
    try {
      const r = await fetch('/api/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: datos.get('correo') }),
      });
      if (r.ok) setHecho(true);
      else setError(t.sinConexion);
    } catch {
      setError(t.sinConexion);
    }
    setEnviando(false);
  }

  return (
    <main className="pantalla-entrada">
      <Link href="/login" className="enlace-volver">{t.volverEntrar}</Link>
      <h1 className="titulo-app">{t.recuperarTitulo}</h1>
      {hecho ? (
        <p className="aviso">{t.enlaceEnviado}</p>
      ) : (
        <form onSubmit={enviar} className="formulario">
          <p>{t.recuperarTexto}</p>
          <label>
            {t.correo}
            <input name="correo" type="email" autoComplete="email" autoCapitalize="none" required />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="boton-principal" disabled={enviando}>
            {t.enviarEnlace}
          </button>
        </form>
      )}
    </main>
  );
}
