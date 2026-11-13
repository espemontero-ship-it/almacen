import Link from 'next/link';
import Buscador from './Buscador';
import BotonIdioma from './BotonIdioma';
import { textos } from '../../lib/textos';
import { sesionActual } from '../../lib/sesionActual';

export default async function Cabecera({ busqueda = '', volver = false, idioma }) {
  const t = textos(idioma);
  const sesion = await sesionActual();
  return (
    <header className="cabecera">
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
  );
}
