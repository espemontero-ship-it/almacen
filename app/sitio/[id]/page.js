import { notFound } from 'next/navigation';
import Cabecera from '../../components/Cabecera';
import Foto from '../../components/Foto';
import NombreSitio from '../../components/NombreSitio';
import Etiquetas from '../../components/Etiquetas';
const { obtenerSitio } = require('../../../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export default async function Sitio({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const sitio = await obtenerSitio(Number(id));
  if (!sitio) notFound();
  const lineas = sitio.contenido.length;
  return (
    <>
      <Cabecera volver />
      <main className="contenido">
        <h1 className="sitio-titulo">
          <NombreSitio codigo={sitio.codigo} nombre={sitio.nombre} />
        </h1>
        <p className="resumen-sitio">
          {lineas} {lineas === 1 ? 'artículo' : 'artículos'} · {sitio.unidades} {sitio.unidades === 1 ? 'unidad' : 'unidades'}
        </p>
        <ul className="lista">
          {sitio.contenido.map(c => (
            <li key={c.id} className="fila fila-articulo">
              <Foto url={c.foto_url} nombre={c.nombre} />
              <span className="fila-texto">
                <span className="nombre-articulo">{c.nombre}</span>
                <span className={c.estado === 'roto' ? 'estado estado-roto' : 'estado'}>
                  {c.estado === 'roto' ? 'Roto' : 'Bueno'}
                </span>
                <Etiquetas lista={c.etiquetas} />
                {c.comentarios && <span className="comentarios">{c.comentarios}</span>}
              </span>
              <span className="cantidad">{c.cantidad}</span>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
