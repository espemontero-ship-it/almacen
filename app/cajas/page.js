import Link from 'next/link';
import Cabecera from '../components/Cabecera';
import { idiomaActual } from '../../lib/idioma';
import { textos } from '../../lib/textos';
const { listarCajas } = require('../../lib/edicion.cjs');

export const dynamic = 'force-dynamic';

// Todas las cajas por código, cada una con su llenado si alguien lo ha elegido.
export default async function Cajas() {
  const idioma = await idiomaActual();
  const t = textos(idioma);
  const cajas = await listarCajas();
  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido reducido">
        <h1 className="sitio-titulo">{t.cajasTitulo}</h1>
        <ul className="lista-cajas">
          {cajas.map(c => (
            <li key={c.id}>
              <Link href={`/sitio/${c.id}`} className="lista-cajas-fila">
                <span className="lista-cajas-nombre">
                  <strong>{c.codigo || c.nombre}</strong>
                  {c.codigo && c.nombre ? ` ${c.nombre}` : ''}
                </span>
                <span className="lista-cajas-llenado">{c.llenado ? t.llenado[c.llenado] : ''}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
