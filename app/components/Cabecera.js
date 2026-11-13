import Link from 'next/link';
import Buscador from './Buscador';

export default function Cabecera({ busqueda = '', volver = false }) {
  return (
    <header className="cabecera">
      <div className="cabecera-fila">
        {volver ? (
          <Link href="/" className="enlace-volver">‹ Inicio</Link>
        ) : (
          <span className="titulo-app">Almacén</span>
        )}
      </div>
      <Buscador key={busqueda} busqueda={busqueda} />
    </header>
  );
}
