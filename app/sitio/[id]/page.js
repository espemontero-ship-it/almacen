import { notFound } from 'next/navigation';
import Cabecera from '../../components/Cabecera';
import NombreSitio from '../../components/NombreSitio';
import { idiomaActual } from '../../../lib/idioma';
import { textos } from '../../../lib/textos';
import { sesionActual } from '../../../lib/sesionActual';
import Link from 'next/link';
import CajaEditable from './CajaEditable';
import Papelera from './Papelera';
import Llenado from './Llenado';
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
  const th = textosHistorial(idioma);  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido reducido pagina-caja">
        <div className="llenado-fila-titulo">
          <h1 className="sitio-titulo">
            <NombreSitio codigo={sitio.codigo} nombre={sitio.nombre} />
          </h1>
          <Llenado sitioId={sitio.id} llenado={sitio.llenado} idioma={idioma} soloVer={!puedeEditar} />
        </div>
        <p className="resumen-sitio">
          {t.nArticulos(lineas)} · {t.nUnidades(sitio.unidades)}
        </p>
        <CajaEditable sitioId={sitio.id} contenido={sitio.contenido} etiquetas={etiquetas} idioma={idioma} soloVer={!puedeEditar} />
        {puedeEditar && <Papelera lineas={papelera} titulo={th.papelera} textoRecuperar={th.recuperar} idioma={idioma} />}
        <p className="enlace-historial">
          <Link href={`/historial?caja=${sitio.id}`} className="enlace-volver">{th.verHistorialCaja}</Link>
        </p>
      </main>
    </>
  );
}
