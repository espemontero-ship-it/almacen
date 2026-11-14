import Cabecera from '../components/Cabecera';
import ListaHistorial from '../components/ListaHistorial';
import { idiomaActual } from '../../lib/idioma';
import { textosHistorial } from '../../lib/textosHistorial';
const { historial } = require('../../lib/edicion.cjs');
const { query } = require('../../lib/db.cjs');

export const dynamic = 'force-dynamic';

export default async function Historial({ searchParams }) {
  const { caja, articulo } = await searchParams;
  const idioma = await idiomaActual();
  const t = textosHistorial(idioma);
  const sitioId = /^\d+$/.test(caja || '') ? Number(caja) : null;
  const articuloId = /^\d+$/.test(articulo || '') ? Number(articulo) : null;

  let titulo = t.titulo;
  if (sitioId) {
    const s = await query('SELECT codigo, nombre FROM sitios WHERE id = $1', [sitioId]);
    if (s.rows[0]) titulo = t.deCaja([s.rows[0].codigo, s.rows[0].nombre].filter(Boolean).join(' '));
  } else if (articuloId) {
    const col = idioma === 'en' ? 'COALESCE(nombre_en, nombre)' : 'COALESCE(nombre_es, nombre)';
    const a = await query(`SELECT ${col} AS nombre FROM articulos WHERE id = $1`, [articuloId]);
    if (a.rows[0]) titulo = t.deArticulo(a.rows[0].nombre);
  }

  const cambios = await historial({ sitioId, articuloId, idioma });
  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido reducido">
        <h1 className="sitio-titulo">{titulo}</h1>
        <ListaHistorial cambios={cambios} idioma={idioma} mostrarCaja={!sitioId} />
      </main>
    </>
  );
}
