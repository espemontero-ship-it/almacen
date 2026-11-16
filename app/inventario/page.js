import { notFound } from 'next/navigation';
import Link from 'next/link';
import Cabecera from '../components/Cabecera';
import AbrirInventario from './AbrirInventario';
import CerrarInventario from './CerrarInventario';
import { idiomaActual } from '../../lib/idioma';
import { textos } from '../../lib/textos';
import { sesionActual } from '../../lib/sesionActual';
const { listarCajas, tiposDeCaja, inventarioActual, inventarioPorId, inventariosAnteriores } = require('../../lib/edicion.cjs');

export const dynamic = 'force-dynamic';

const T = {
  es: {
    titulo: 'Inventario',
    anteriores: 'Inventarios anteriores',
    ninguno: 'Todavía no hay inventarios cerrados.',
    general: 'General',
    porTipos: letras => `Por tipo: ${letras}`,
    sueltas: 'Cajas individuales',
    abiertoEl: (que, fecha, quien) => `${que} · abierto el ${fecha}${quien ? ` por ${quien}` : ''}`,
    nDeM: (n, m) => `${n} de ${m} revisadas`,
    revisadas: 'Revisadas',
    sinRevisar: n => `Quedaron sin revisar (${n})`,
    todasRevisadas: 'Se revisaron todas.',
    volver: '‹ Inventario',
    fechas: (a, b) => `${a} – ${b}`,
  },
  en: {
    titulo: 'Inventory',
    anteriores: 'Previous inventories',
    ninguno: 'No closed inventories yet.',
    general: 'General',
    porTipos: letras => `By type: ${letras}`,
    sueltas: 'Single boxes',
    abiertoEl: (que, fecha, quien) => `${que} · opened on ${fecha}${quien ? ` by ${quien}` : ''}`,
    nDeM: (n, m) => `${n} of ${m} checked`,
    revisadas: 'Checked',
    sinRevisar: n => `Left unchecked (${n})`,
    todasRevisadas: 'All were checked.',
    volver: '‹ Inventory',
    fechas: (a, b) => `${a} – ${b}`,
  },
};

function fecha(f, idioma, conHora = false) {
  return new Intl.DateTimeFormat(idioma === 'en' ? 'en-GB' : 'es-ES', {
    timeZone: 'Europe/Madrid', day: 'numeric', month: 'short', ...(conHora ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(new Date(f));
}

function queEs(inv, x) {
  const d = inv.detalle || {};
  if (d.forma === 'tipos') return x.porTipos((d.letras || []).map(l => (l === 'otros' ? (x === T.en ? 'others' : 'otros') : l)).join(', '));
  if (d.forma === 'cajas') return x.sueltas;
  return x.general;
}

function nombreCaja(c) {
  return [c.codigo, c.nombre].filter(Boolean).join(' ');
}

// Cajas revisadas: código, quién y cuándo; cada una lleva a su caja.
function ListaRevisadas({ cajas, idioma }) {
  return (
    <ul className="lista inv-lista">
      {cajas.map(c => (
        <li key={c.id} className="historial-linea">
          <p className="historial-que">
            <Link href={`/sitio/${c.id}`} className="historial-caja">{nombreCaja(c)}</Link>
            <span className="esc-gris"> · {c.usuario_nombre || '—'} · {fecha(c.cuando, idioma, true)}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

// Inventario (solo administración): abrir uno (general, por tipos o cajas sueltas), seguir el abierto y cerrarlo,
// y consultar los anteriores.
export default async function Inventario({ searchParams }) {
  const sesion = await sesionActual();
  if (!sesion || sesion.rol !== 'admin') notFound();
  const idioma = await idiomaActual();
  const x = T[idioma === 'en' ? 'en' : 'es'];
  const t = textos(idioma);
  const { ver } = await searchParams;

  // Resumen de un inventario anterior
  if (/^\d+$/.test(ver || '')) {
    const inv = await inventarioPorId(Number(ver));
    if (!inv || !inv.cerrado) notFound();
    return (
      <>
        <Cabecera volver idioma={idioma} />
        <main className="contenido reducido">
          <p><Link href="/inventario" className="enlace-volver">{x.volver}</Link></p>
          <h1 className="sitio-titulo">{queEs(inv, x)} · {x.fechas(fecha(inv.abierto, idioma), fecha(inv.cerrado, idioma))}</h1>
          <p className="resumen-sitio">{x.nDeM(inv.revisadas.length, inv.total)}</p>
          <h2 className="grupo-titulo inv-subtitulo">{x.revisadas}</h2>
          <ListaRevisadas cajas={inv.revisadas} idioma={idioma} />
          <h2 className="grupo-titulo inv-subtitulo">{x.sinRevisar(inv.sinRevisar.length)}</h2>
          {inv.sinRevisar.length ? (
            <p className="inv-sin-revisar">{inv.sinRevisar.map(nombreCaja).join(' · ')}</p>
          ) : (
            <p className="aviso">{x.todasRevisadas}</p>
          )}
        </main>
      </>
    );
  }

  const actual = await inventarioActual();
  const anteriores = actual ? [] : await inventariosAnteriores();
  const cajas = actual ? [] : await listarCajas();
  const tipos = actual ? [] : await tiposDeCaja();
  return (
    <>
      <Cabecera volver idioma={idioma} />
      <main className="contenido reducido">
        <h1 className="sitio-titulo">{x.titulo}</h1>
        {actual ? (
          <>
            <p className="resumen-sitio">{x.abiertoEl(queEs(actual, x), fecha(actual.abierto, idioma), actual.abierto_por)}</p>
            <p className="inv-progreso">{x.nDeM(actual.revisadas.length, actual.total)}</p>
            <CerrarInventario id={actual.id} quedan={actual.sinRevisar.length} idioma={idioma} />
            {actual.revisadas.length > 0 && (
              <>
                <h2 className="grupo-titulo inv-subtitulo">{x.revisadas}</h2>
                <ListaRevisadas cajas={actual.revisadas} idioma={idioma} />
              </>
            )}
          </>
        ) : (
          <>
            <AbrirInventario
              idioma={idioma}
              tipos={tipos.map(tp => ({ letra: tp.letra, texto: t.tipos[tp.letra] || tp.letra, cajas: tp.cajas }))}
              cajas={cajas.map(c => ({ id: c.id, texto: nombreCaja(c) }))}
            />
            <h2 className="grupo-titulo inv-subtitulo">{x.anteriores}</h2>
            {anteriores.length ? (
              <ul className="lista inv-lista">
                {anteriores.map(i => (
                  <li key={i.id} className="historial-linea">
                    <Link href={`/inventario?ver=${i.id}`} className="historial-que inv-anterior">
                      {queEs(i, x)} · {x.fechas(fecha(i.abierto, idioma), fecha(i.cerrado, idioma))} · {x.nDeM(i.revisadas, i.total)}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="aviso">{x.ninguno}</p>
            )}
          </>
        )}
      </main>
    </>
  );
}
