import { createRequire } from 'module';

const requerir = createRequire(import.meta.url);
export const db = () => requerir('../lib/db.cjs');
export const ed = () => requerir('../lib/edicion.cjs');
export const datos = () => requerir('../lib/datos.cjs');
export const usuarios = () => requerir('../lib/usuarios.cjs');
export const auth = () => requerir('../lib/auth.cjs');
export const nombresIA = () => requerir('../lib/nombresIA.cjs');

export const ADMIN = { id: 1, nombre: 'Admin de prueba' };

// Datos inventados: cajas P1 "latex weapons" y C1, etiqueta Atrezo, una copa, una espada y una camiseta por tallas.
export async function sembrar() {
  const { query } = db();
  const e = ed();
  const p1 = (await e.crearCaja({ letra: 'P', numero: 1, nombre: 'latex weapons' }, ADMIN)).id;
  const c1 = (await e.crearCaja({ letra: 'C', numero: 1 }, ADMIN)).id;
  const etq = (await query("INSERT INTO etiquetas (nombre, nombre_es, nombre_en, buscable) VALUES ('Props', 'Atrezo', 'Props', 'atrezo props') RETURNING id")).rows[0].id;
  const espada = (await e.crearArticulo({ es: 'Espada', en: 'Sword', etiquetas: [etq], sitioId: p1, cantidad: 10 }, ADMIN)).articuloId;
  const copa = (await e.crearArticulo({ es: 'Copa', en: 'Cup', sitioId: c1, cantidad: 12 }, ADMIN)).articuloId;
  await e.anadir({ sitioId: p1, articuloId: copa, cantidad: 3 }, ADMIN);
  const camiseta = (await e.crearArticulo({ es: 'Camiseta', en: 'T-shirt', ropa: true, talla: 'M', sitioId: p1, cantidad: 4 }, ADMIN)).articuloId;
  await e.anadir({ sitioId: p1, articuloId: camiseta, cantidad: 2, talla: 'S' }, ADMIN);
  const linea = async (sitioId, articuloId, talla = null) =>
    (await query('SELECT id FROM contenido WHERE sitio_id = $1 AND articulo_id = $2 AND talla IS NOT DISTINCT FROM $3 AND borrado IS NULL', [sitioId, articuloId, talla])).rows[0].id;
  return { p1, c1, etq, espada, copa, camiseta, linea };
}
