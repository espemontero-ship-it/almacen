import Link from 'next/link';
import { redirect } from 'next/navigation';
import Cabecera from '../components/Cabecera';
import Foto from '../components/Foto';
import NombreSitio from '../components/NombreSitio';
import Etiquetas from '../components/Etiquetas';
const { buscar, sitioPorCodigo } = require('../../lib/datos.cjs');

export const dynamic = 'force-dynamic';

export default async function Buscar({ searchParams }) {
  const { q = '' } = await searchParams;
  const texto = String(q).trim();
  if (!texto) redirect('/');
  const sitioId = await sitioPorCodigo(texto);
  if (sitioId) redirect(`/sitio/${sitioId}`);
  const { articulos, aproximado } = await buscar(texto);
  return (
    <>
      <Cabecera busqueda={texto} volver />
      <main className="contenido">
        {!articulos.length && <p className="aviso">No hay nada que se parezca a «{texto}».</p>}
        {aproximado && articulos.length > 0 && (
          <p className="aviso">No hay nada que se llame exactamente «{texto}». Esto es lo más parecido:</p>
        )}
        <ul className="lista">
          {articulos.map(a => (
            <li key={a.id} className="resultado">
              <div className="fila fila-articulo">
                <Foto url={a.foto_url} nombre={a.nombre} />
                <span className="fila-texto">
                  <span className="nombre-articulo">{a.nombre}</span>
                  <Etiquetas lista={a.etiquetas} />
                  {a.rotos > 0 && <span className="estado estado-roto">{a.rotos} rotos</span>}
                </span>
                <span className="total">
                  <span className="cantidad">{a.total}</span>
                  <span className="etiqueta-total">en total</span>
                </span>
              </div>
              <ul className="desglose">
                {a.sitios.map((s, i) => (
                  <li key={`${s.id}-${i}`}>
                    <Link href={`/sitio/${s.id}`} className="fila fila-enlace fila-desglose">
                      <span className="fila-texto">
                        <NombreSitio codigo={s.codigo} nombre={s.nombre} />
                        <span className={s.estado === 'roto' ? 'estado estado-roto' : 'estado'}>
                          {s.estado === 'roto' ? 'Roto' : 'Bueno'}
                        </span>
                        {s.comentarios && <span className="comentarios">{s.comentarios}</span>}
                      </span>
                      <span className="fila-dato">{s.cantidad}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
