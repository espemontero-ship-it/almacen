import Link from 'next/link';

export default function Cabecera({ busqueda = '', volver = false }) {
  return (
    <header className="cabecera">
      <div className="cabecera-fila">
        {volver ? (
          <Link href="/" className="enlace-volver">‹ Inicio</Link>
        ) : (
          <span className="titulo-app">Almacén</span>
        )}
        <form action="/api/logout" method="post">
          <button type="submit" className="boton-texto">Salir</button>
        </form>
      </div>
      <form action="/buscar" method="get" className="buscador" role="search">
        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          placeholder="Artículo, etiqueta o caja"
          aria-label="Buscar un artículo, una etiqueta o una caja"
          autoComplete="off"
          enterKeyHint="search"
        />
        <button type="submit" className="boton-principal">Buscar</button>
      </form>
    </header>
  );
}
