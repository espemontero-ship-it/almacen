import Link from 'next/link';
import Buscador from './Buscador';
import BotonIdioma from './BotonIdioma';
import BarraOpciones from './BarraOpciones';
import { textos } from '../../lib/textos';
import { sesionActual } from '../../lib/sesionActual';

export default async function Cabecera({ busqueda = '', volver = false, idioma, sinBarraEscritorio = false }) {
  const t = textos(idioma);
  const en = idioma === 'en';
  const sesion = await sesionActual();
  const puedeEditar = Boolean(sesion && ['admin', 'editor'].includes(sesion.rol));
  return (
    <>
      <header className={sinBarraEscritorio ? 'cabecera' : 'cabecera solo-movil'}>
        <div className="cabecera-fila">
          {volver ? (
            <Link href="/" className="enlace-volver">{t.inicio}</Link>
          ) : (
            <span className="titulo-app">{t.titulo}</span>
          )}
          <div className="cabecera-acciones">
            {sesion ? (
              <>
                {sesion.rol === 'admin' && <Link href="/personas" className="enlace-volver">{t.personas}</Link>}
                <form action="/api/logout" method="post">
                  <button type="submit" className="boton-texto">{t.salir}</button>
                </form>
              </>
            ) : (
              <Link href="/login" className="enlace-volver">{t.entrar}</Link>
            )}
            <BotonIdioma idioma={idioma} />
          </div>
        </div>
        <Buscador key={busqueda} busqueda={busqueda} idioma={idioma} />
      </header>
      {!sinBarraEscritorio && <BarraOpciones>
        <header className="esc-barra">
          <Link href="/" className="esc-titulo">{t.titulo}</Link>
          <div className="esc-buscador"><Buscador key={busqueda} busqueda={busqueda} idioma={idioma} /></div>
          <nav className="esc-nav">
            <Link href="/historial" className="esc-accion">{en ? 'History' : 'Historial'}</Link>
            {puedeEditar && <Link href="/caja-nueva" className="esc-accion esc-accion-crear">{en ? '+ New box' : '+ Crear caja'}</Link>}
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
