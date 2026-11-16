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
const { listarEtiquetas, quitados, ultimaRevision, estadoRevision } = require('../../../lib/edicion.cjs');
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
  // Inventario compartido: lo que lleva marcado la caja (y quién), y si ha de entrar sola en modo inventario.
  const revisionInicial = puedeEditar
    ? { ...(await estadoRevision(sitio.id, { id: sesion.id, nombre: sesion.nombre })), yo: sesion.nombre ?? null }
    : null;
  const th = textosHistorial(idioma);
  // Inventario: junto al título, cuándo se revisó la caja por última vez y quién.
  const revisada = await ultimaRevision(sitio.id);
  const en = idioma === 'en';
  const fecha = revisada
    ? new Intl.DateTimeFormat(en ? 'en-GB' : 'es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'short' }).format(new Date(revisada.cuando))
    : null;
  const quien = revisada?.usuario_nombre ? (en ? ` by ${revisada.usuario_nombre}` : ` por ${revisada.usuario_nombre}`) : '';
  const textoRevision = revisada ? (en ? `Checked on ${fecha}${quien}` : `Revisada el ${fecha}${quien}`) : (en ? 'Not checked' : 'Sin revisar');
  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido reducido pagina-caja">
        <CajaEditable sitioId={sitio.id} contenido={sitio.contenido} etiquetas={etiquetas} idioma={idioma} soloVer={!puedeEditar} codigo={sitio.codigo || sitio.nombre} llenado={sitio.llenado} revisionInicial={revisionInicial}
          titulo={(
            <>
              <h1 className="sitio-titulo"><NombreSitio codigo={sitio.codigo} nombre={sitio.nombre} /></h1>
              <Llenado sitioId={sitio.id} llenado={sitio.llenado} idioma={idioma} soloVer={!puedeEditar} />
              <span className="revision-texto">{textoRevision}</span>
            </>
          )}
          resumen={`${t.nArticulos(lineas)} · ${t.nUnidades(sitio.unidades)}`} />
        {puedeEditar && <Papelera lineas={papelera} titulo={th.papelera} textoRecuperar={th.recuperar} idioma={idioma} />}
        <p className="enlace-historial">
          <Link href={`/historial?caja=${sitio.id}`} className="enlace-volver">{th.verHistorialCaja}</Link>
        </p>
      </main>
    </>
  );
}
