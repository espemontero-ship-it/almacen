import Link from 'next/link';
import Foto from './Foto';
import NombreSitio from './NombreSitio';
import Etiquetas from './Etiquetas';
import { textos } from '../../lib/textos';

export default function FichaArticulo({ articulo: a, idioma }) {
  const t = textos(idioma);
  return (
    <li className="resultado">
      <div className="fila fila-articulo">
        <Foto url={a.foto_url} nombre={a.nombre} />
        <span className="fila-texto">
          <span className="nombre-articulo">{a.nombre}</span>
          <Etiquetas lista={a.etiquetas} />
          {a.rotos > 0 && <span className="estado estado-roto">{t.rotos(a.rotos)}</span>}
          {a.tallas && a.tallas.length > 0 && (
            <span className="detalle-tallas-ficha">{a.tallas.map(x => x.talla + " " + x.cantidad).join(" · ")}</span>
          )}
        </span>
        <span className="total">
          <span className="cantidad">{a.total}</span>
          <span className="etiqueta-total">{t.enTotal}</span>
        </span>
      </div>
      <ul className="desglose">
        {a.sitios.map((s, i) => (
          <li key={`${s.id}-${i}`}>
            <Link href={`/sitio/${s.id}`} className="fila fila-enlace fila-desglose">
              <span className="fila-texto">
                <NombreSitio codigo={s.codigo} nombre={s.nombre} />
                {s.talla && <span className="estado">{t.talla} {s.talla}</span>}
                <span className={s.estado === 'roto' ? 'estado estado-roto' : 'estado'}>
                  {s.estado === 'roto' ? t.roto : t.bueno}
                </span>
                {s.comentarios && <span className="comentarios">{s.comentarios}</span>}
              </span>
              <span className="fila-dato">{s.cantidad}</span>
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
