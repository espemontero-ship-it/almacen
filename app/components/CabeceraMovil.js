'use client';

import { useState } from 'react';
import Link from 'next/link';
import Buscador from './Buscador';
import BotonIdioma from './BotonIdioma';

// Cabecera del móvil (versión 1 elegida): "Almacén" (vuelve al inicio) y el botón "Menú",
// que despliega Artículos, Cajas, Inventario y Usuarios (solo administración), Historial, Salir o Entrar y ES / EN;
// debajo, el buscador.
export default function CabeceraMovil({ idioma, busqueda, textos: t, puedeEditar, esAdmin, haySesion }) {
  const en = idioma === 'en';
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="cabecera cm solo-movil">
      {/* Una sola fila: Almacén, el buscador con Buscar y Menú */}
      <div className="cm-fila cm-una-fila">
        <Link href="/" className="cm-titulo">{t.titulo}</Link>
        <Buscador key={busqueda} busqueda={busqueda} idioma={idioma} />
        <button type="button" className={abierto ? 'cm-boton-menu cm-boton-menu-activo' : 'cm-boton-menu'} aria-expanded={abierto} onClick={() => setAbierto(!abierto)}>
          {en ? 'Menu' : 'Menú'} {abierto ? '▴' : '▾'}
        </button>
      </div>
      {abierto && (
        <nav className="cm-desplegable">
          <Link href="/" className="cm-enlace">{en ? 'Items' : 'Artículos'}</Link>
          <Link href="/cajas" className="cm-enlace">{t.cajas}</Link>
          {esAdmin && <Link href="/inventario" className="cm-enlace">{en ? 'Inventory' : 'Inventario'}</Link>}
          <Link href="/historial" className="cm-enlace">{en ? 'History' : 'Historial'}</Link>
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
    </header>
  );
}
