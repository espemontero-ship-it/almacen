import Link from 'next/link';
import Buscador from './Buscador';
import BotonIdioma from './BotonIdioma';
import BarraOpciones from './BarraOpciones';
import CabeceraMovil from './CabeceraMovil';
import { textos } from '../../lib/textos';
import { sesionActual } from '../../lib/sesionActual';

export default async function Cabecera({ busqueda = '', volver = false, idioma, sinBarraEscritorio = false, soloEscritorio = false }) {
  const t = textos(idioma);
  const en = idioma === 'en';
  const sesion = await sesionActual();
  const puedeEditar = Boolean(sesion && ['admin', 'editor'].includes(sesion.rol));
  return (
    <>
      {!soloEscritorio && (
        <CabeceraMovil idioma={idioma} busqueda={busqueda} textos={{ titulo: t.titulo, personas: t.personas, salir: t.salir, entrar: t.entrar, cajas: t.cajasTitulo }} puedeEditar={puedeEditar} esAdmin={sesion?.rol === 'admin'} haySesion={Boolean(sesion)} />
      )}
      {!sinBarraEscritorio && <BarraOpciones>
        <header className="esc-barra">
          <Link href="/" className="esc-titulo">{t.titulo}</Link>
          <div className="esc-buscador"><Buscador key={busqueda} busqueda={busqueda} idioma={idioma} /></div>
          <nav className="esc-nav">
            {/* Orden: Artículos (el inicio) · Cajas · Inventario · Historial · Usuarios · Salir / Entrar; después ES / EN */}
            <Link href="/" className="esc-accion">{en ? 'Items' : 'Artículos'}</Link>
            <Link href="/cajas" className="esc-accion">{t.cajasTitulo}</Link>
            {sesion && <Link href="/inventario" className="esc-accion">{en ? 'Inventory' : 'Inventario'}</Link>}
            <Link href="/historial" className="esc-accion">{en ? 'History' : 'Historial'}</Link>
            {sesion?.rol === 'admin' && <Link href="/personas" className="esc-accion">{t.personas}</Link>}
            {sesion ? (
              <form action="/api/logout" method="post">
                <button type="submit" className="esc-accion">{t.salir}</button>
              </form>
            ) : (
              <Link href="/login" className="esc-accion">{t.entrar}</Link>
            )}
          </nav>
          <div className="esc-idioma"><BotonIdioma idioma={idioma} /></div>
        </header>
      </BarraOpciones>}
    </>
  );
}
