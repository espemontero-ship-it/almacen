import { redirect } from 'next/navigation';
import Cabecera from '../components/Cabecera';
import FichaArticulo from '../components/FichaArticulo';
import Escritorio from '../components/Escritorio';
import { idiomaActual } from '../../lib/idioma';
import { textos } from '../../lib/textos';
import { sesionActual } from '../../lib/sesionActual';
const { buscar, sitioPorCodigo, listarTodo } = require('../../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export default async function Buscar({ searchParams }) {
  const { q = '' } = await searchParams;
  const texto = String(q).trim();
  if (!texto) redirect('/');
  const sitioId = await sitioPorCodigo(texto);
  if (sitioId) redirect(`/sitio/${sitioId}`);
  const idioma = await idiomaActual();
  const t = textos(idioma);
  const { articulos, aproximado } = await buscar(texto, idioma);
  const ids = articulos.map(a => a.id);
  const encontrados = new Set(ids);
  const filas = (await listarTodo(idioma)).filter(f => encontrados.has(f.articulo_id));
  const aviso = !articulos.length ? t.nadaParecido(texto) : aproximado ? t.nadaExacto(texto) : null;
  const sesion = await sesionActual();
  const puedeEditar = Boolean(sesion && ['admin', 'editor'].includes(sesion.rol));
  return (
    <>
      <Cabecera busqueda={texto} volver idioma={idioma} />
      <div className="solo-escritorio">
        <Escritorio filas={filas} idioma={idioma} conFiltros={false} orden={ids} aviso={aviso} puedeEditar={puedeEditar} />
      </div>
      <main className="contenido solo-movil">
        {aviso && <p className="aviso">{aviso}</p>}
        <ul className="lista">
          {articulos.map(a => (
            <FichaArticulo key={a.id} articulo={a} idioma={idioma} puedeEditar={puedeEditar} />
          ))}
        </ul>
      </main>
    </>
  );
}
