import Link from 'next/link';
import Buscador from './Buscador';
import BotonIdioma from './BotonIdioma';
import { textos } from '../../lib/textos';

export default function Cabecera({ busqueda = '', volver = false, idioma }) {
  const t = textos(idioma);
  return (
    <header className="cabecera">
      <div className="cabecera-fila">
        {volver ? (
          <Link href="/" className="enlace-volver">{t.inicio}</Link>
        ) : (
          <span className="titulo-app">{t.titulo}</span>
        )}
        <BotonIdioma idioma={idioma} />
      </div>
      <Buscador key={busqueda} busqueda={busqueda} idioma={idioma} />
    </header>
  );
}
