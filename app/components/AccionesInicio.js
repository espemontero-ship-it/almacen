'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnadirArticulo } from '../sitio/[id]/CajaEditable';

const T = {
  es: { anadirArticulo: 'Añadir artículo', anadirCaja: 'Añadir caja', caja: 'Caja', elige: 'Elige la caja', hecho: c => `Añadido a ${c}.` },
  en: { anadirArticulo: 'Add item', anadirCaja: 'Add box', caja: 'Box', elige: 'Choose the box', hecho: c => `Added to ${c}.` },
};

// Inicio (quien edita): "Añadir artículo" (el mismo formulario de la caja, con un selector de caja arriba)
// y "Añadir caja" (la pantalla de crear caja).
export function BotonesInicio({ idioma, alAnadir }) {
  const x = T[idioma === 'en' ? 'en' : 'es'];
  return (
    <span className="inicio-acciones">
      <button type="button" className="boton-secundario" onClick={alAnadir}>{x.anadirArticulo}</button>
      <Link href="/caja-nueva" className="boton-secundario">{x.anadirCaja}</Link>
    </span>
  );
}

export function AnadirDesdeInicio({ idioma, cajas, etiquetas, alCerrar }) {
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const router = useRouter();
  const [sitioId, setSitioId] = useState('');
  const [hecho, setHecho] = useState('');
  const nombre = id => cajas.find(c => String(c.id) === String(id))?.texto || '';
  return (
    <div className="inicio-anadir">
      <AnadirArticulo
        sitioId={sitioId ? Number(sitioId) : null}
        etiquetas={etiquetas}
        idioma={idioma}
        abiertoInicial
        alCerrar={alCerrar}
        onHecho={() => { setHecho(x.hecho(nombre(sitioId))); router.refresh(); }}
        antesDelBuscador={(
          <label className="detalle-campo detalle-columna">
            {x.caja}
            <select value={sitioId} onChange={e => { setSitioId(e.target.value); setHecho(''); }}>
              <option value="">{x.elige}</option>
              {cajas.map(c => <option key={c.id} value={c.id}>{c.texto}</option>)}
            </select>
          </label>
        )}
      />
      {hecho && <p className="aviso">{hecho}</p>}
    </div>
  );
}
