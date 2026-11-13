import { notFound } from 'next/navigation';
import Link from 'next/link';
import GrupoRevision from './GrupoRevision';
const { grupos } = require('../../../lib/revision.cjs');

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Revisar nombres', robots: { index: false, follow: false } };

export default async function Revisar({ params, searchParams }) {
  const { clave } = await params;
  if (!process.env.CLAVE_REVISION || clave !== process.env.CLAVE_REVISION) notFound();
  const { g } = await searchParams;
  const lista = await grupos();
  const pendiente = lista.findIndex(x => !x.revisado);
  const pedido = Number.parseInt(g, 10);
  const indice = Number.isInteger(pedido) && pedido >= 1 && pedido <= lista.length
    ? pedido - 1
    : pendiente === -1 ? lista.length - 1 : pendiente;
  const grupo = lista[indice];
  const hechos = lista.filter(x => x.revisado).length;
  const base = `/revisar/${clave}`;

  return (
    <main className="contenido revision">
      <header className="revision-cabecera">
        <p className="revision-avance">
          Grupo {indice + 1} de {lista.length} · {hechos} {hechos === 1 ? 'revisado' : 'revisados'}
        </p>
        <h1 className="sitio-titulo">{grupo.titulo}</h1>
        <nav className="revision-nav">
          {indice > 0 ? <Link href={`${base}?g=${indice}`} className="enlace-volver">‹ Anterior</Link> : <span />}
          {indice < lista.length - 1 ? <Link href={`${base}?g=${indice + 2}`} className="enlace-volver">Siguiente ›</Link> : <span />}
        </nav>
      </header>
      <GrupoRevision
        key={indice}
        clave={clave}
        elementos={grupo.elementos}
        siguiente={indice < lista.length - 1 ? `${base}?g=${indice + 2}` : null}
        revisado={grupo.revisado}
      />
    </main>
  );
}
