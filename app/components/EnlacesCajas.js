'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Códigos de caja ("L1, L2, L13"), cada uno lleva a su caja. Dentro de otro enlace (la tarjeta del artículo)
// no se puede poner un enlace, así que el código abre la caja al tocarlo sin abrir también el artículo.
export default function EnlacesCajas({ cajas, dentroDeEnlace = false }) {
  const router = useRouter();
  const vistas = new Set();
  const unicas = cajas.filter(c => c.id && !vistas.has(c.id) && vistas.add(c.id));
  return (
    <>
      {unicas.map((c, i) => (
        <span key={c.id}>
          {i > 0 && ', '}
          {dentroDeEnlace ? (
            <span
              role="link"
              tabIndex={0}
              className="enlace-caja"
              onClick={e => { e.preventDefault(); e.stopPropagation(); router.push(`/sitio/${c.id}`); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); router.push(`/sitio/${c.id}`); } }}
            >
              {c.texto}
            </span>
          ) : (
            <Link href={`/sitio/${c.id}`} className="enlace-caja" onClick={e => e.stopPropagation()}>{c.texto}</Link>
          )}
        </span>
      ))}
    </>
  );
}
