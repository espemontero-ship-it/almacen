import { notFound } from 'next/navigation';
import Cabecera from '../../components/Cabecera';
import Foto from '../../components/Foto';
import NombreSitio from '../../components/NombreSitio';
import Etiquetas from '../../components/Etiquetas';
import { idiomaActual } from '../../../lib/idioma';
import { textos } from '../../../lib/textos';
import { sesionActual } from '../../../lib/sesionActual';
import Link from 'next/link';
import CajaEditable from './CajaEditable';
import Papelera from './Papelera';
import { textosHistorial } from '../../../lib/textosHistorial';
const { listarEtiquetas, quitados } = require('../../../lib/edicion.cjs');
const { obtenerSitio } = require('../../../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export default async function Sitio({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const idioma = await idiomaActual();
  const sitio = await obtenerSitio(Number(id), idioma);
  if (!sitio) notFound();
  const lineas = sitio.contenido.length;
  const t = textos(idioma);
  const sesion = await sesionActual();
  const puedeEditar = Boolean(sesion && ['admin', 'editor'].includes(sesion.rol));
  const etiquetas = puedeEditar ? await listarEtiquetas(idioma) : [];
  const papelera = puedeEditar ? await quitados(sitio.id) : [];
  const th = textosHistorial(idioma);
  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido reducido pagina-caja">
        <h1 className="sitio-titulo">
          <NombreSitio codigo={sitio.codigo} nombre={sitio.nombre} />
        </h1>
        <p className="resumen-sitio">
          {t.nArticulos(lineas)} · {t.nUnidades(sitio.unidades)}
        </p>
        {puedeEditar ? (
          <CajaEditable sitioId={sitio.id} contenido={sitio.contenido} etiquetas={etiquetas} idioma={idioma} />
        ) : (
        <ul className="lista">
          {sitio.contenido.map(c => (
            <li key={c.id} className="fila fila-articulo">
              <Foto url={c.foto_url} nombre={c.nombre} />
              <span className="fila-texto">
                <span className="nombre-articulo">{c.nombre}</span>
                {c.talla && <span className="estado">{t.talla} {c.talla}</span>}
                <span className={c.rotos > 0 ? 'estado estado-roto' : 'estado'}>
                  {c.rotos > 0 ? t.buenasRotas(c.cantidad - c.rotos, c.rotos) : t.bueno}
                </span>
                <Etiquetas lista={c.etiquetas} />
                {c.comentarios && <span className="comentarios">{c.comentarios}</span>}
              </span>
              <span className="cantidad">{c.cantidad}</span>
            </li>
          ))}
        </ul>
        )}
        {puedeEditar && <Papelera lineas={papelera} titulo={th.papelera} textoRecuperar={th.recuperar} idioma={idioma} />}
        <p className="enlace-historial">
          <Link href={`/historial?caja=${sitio.id}`} className="enlace-volver">{th.verHistorialCaja}</Link>
        </p>
      </main>
    </>
  );
}
