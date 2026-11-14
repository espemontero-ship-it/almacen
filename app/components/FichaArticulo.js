import Link from 'next/link';
import Foto from './Foto';
import NombreSitio from './NombreSitio';
import Etiquetas from './Etiquetas';
import { textos } from '../../lib/textos';
import TallasArticulo from './TallasArticulo';
import NombreEditable from './NombreEditable';

export default function FichaArticulo({ articulo: a, idioma, puedeEditar = false }) {
  const t = textos(idioma);
  return (
    <li className="resultado">
      <div className="fila fila-articulo">
        <Foto url={a.foto_url} nombre={a.nombre} />
        <span className="fila-texto">
          <NombreEditable articuloId={a.id} nombre={a.nombre} sinonimos={a.sinonimos} idioma={idioma} puedeEditar={puedeEditar} className="nombre-articulo" />
          <Etiquetas lista={a.etiquetas} />
          {a.rotos > 0 && <span className="estado estado-roto">{t.rotos(a.rotos)}</span>}
        </span>
        <span className="total">
          <span className="cantidad">{a.total}</span>
          <span className="etiqueta-total">{t.enTotal}</span>
        </span>
      </div>
      {a.tallas && a.tallas.length > 0 ? (
        <TallasArticulo tallas={a.tallas} sitios={a.sitios} idioma={idioma} />
      ) : (
      <ul className="desglose">
        {a.sitios.map((s, i) => (
          <li key={`${s.id}-${i}`}>
            <Link href={`/sitio/${s.id}`} className="fila fila-enlace fila-desglose">
              <span className="fila-texto">
                <NombreSitio codigo={s.codigo} nombre={s.nombre} />
                {s.talla && <span className="estado">{t.talla} {s.talla}</span>}
                <span className={s.rotos > 0 ? 'estado estado-roto' : 'estado'}>
                  {s.rotos > 0 ? t.buenasRotas(s.cantidad - s.rotos, s.rotos) : t.bueno}
                </span>
                {s.comentarios && <span className="comentarios">{s.comentarios}</span>}
              </span>
              <span className="fila-dato">{s.cantidad}</span>
            </Link>
          </li>
        ))}
      </ul>
      )}
    </li>
  );
}
