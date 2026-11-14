'use client';

import { useState } from 'react';
import Link from 'next/link';
import Buscador from './Buscador';
import BotonIdioma from './BotonIdioma';

// Cabecera del móvil (versión 1 elegida): "Almacén" (vuelve al inicio) y el botón "Menú",
// que despliega Historial, + Crear caja, Personas (solo administración), Salir o Entrar y ES / EN;
// debajo, el buscador.
export default function CabeceraMovil({ idioma, busqueda, textos: t, puedeEditar, esAdmin, haySesion }) {
  const en = idioma === 'en';
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="cabecera cm solo-movil">
      <div className="cm-fila">
        <Link href="/" className="cm-titulo">{t.titulo}</Link>
        <button type="button" className={abierto ? 'cm-boton-menu cm-boton-menu-activo' : 'cm-boton-menu'} aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
          {en ? 'Menu' : 'Menú'} {abierto ? '▴' : '▾'}
        </button>
      </div>
      {abierto && (
        <nav className="cm-desplegable">
          <Link href="/historial" className="cm-enlace">{en ? 'History' : 'Historial'}</Link>
          {puedeEditar && <Link href="/caja-nueva" className="cm-enlace">{en ? '+ New box' : '+ Crear caja'}</Link>}
          {esAdmin && <Link href="/personas" className="cm-enlace">{t.personas}</Link>}
          {haySesion ? (
            <form action="/api/logout" method="post" className="cm-form">
              <button type="submit" className="cm-enlace">{t.salir}</button>
            </form>
          ) : (
            <Link href="/login" className="cm-enlace">{t.entrar}</Link>
          )}
          <BotonIdioma idioma={idioma} />
        </nav>
      )}
      <Buscador key={busqueda} busqueda={busqueda} idioma={idioma} />
    </header>
  );
}
