export default function NombreSitio({ codigo, nombre }) {
  if (!codigo) return <span className="codigo">{nombre}</span>;
  return (
    <>
      <span className="codigo">{codigo}</span>
      {nombre && <span className="nombre-sitio">{nombre}</span>}
    </>
  );
}
