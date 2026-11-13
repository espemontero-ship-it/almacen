const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const { getPool } = require('../lib/db.cjs');
const { normalizar, leerContenedor } = require('../lib/normalizar.cjs');
const { aplicarNombresIA } = require('../lib/nombresIA.cjs');

function texto(valor) {
  if (valor == null) return '';
  if (typeof valor === 'object') {
    if (valor.richText) return valor.richText.map(t => t.text).join('').trim();
    return String(valor.text ?? valor.result ?? '').trim();
  }
  return String(valor).trim();
}

async function leerHoja(archivo) {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(archivo);
  const hoja = libro.worksheets[0];
  let cabecera = null;
  const filas = [];
  hoja.eachRow((fila, numero) => {
    const valores = fila.values;
    if (!cabecera) {
      const nombres = valores.map(texto);
      if (nombres.includes('Name') && nombres.includes('Container')) {
        cabecera = Object.fromEntries(nombres.map((n, i) => [n, i]).filter(([n]) => n));
      }
      return;
    }
    const nombre = texto(valores[cabecera.Name]).replace(/\s+/g, ' ');
    const contenedor = texto(valores[cabecera.Container]);
    if (!nombre || !contenedor) return;
    const cantidadBruta = valores[cabecera.Quantity];
    const cantidad = typeof cantidadBruta === 'number' ? Math.round(cantidadBruta) : 1;
    const etiquetas = texto(valores[cabecera.Tags]).split('|').map(t => t.trim()).filter(Boolean);
    const comentarios = texto(valores[cabecera.Description]) || null;
    filas.push({ numero, nombre, contenedor, cantidad, etiquetas, comentarios });
  });
  if (!cabecera) throw new Error('No encuentro la fila de cabecera (Name, Container…).');
  return filas;
}

async function importar(archivo) {
  const filas = await leerHoja(archivo);
  const cliente = await getPool().connect();
  try {
    await cliente.query('BEGIN');
    await cliente.query(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
    await cliente.query('TRUNCATE contenido, articulo_etiquetas, etiquetas, articulos, sitios RESTART IDENTITY');

    const sitios = new Map();
    const articulos = new Map();
    const etiquetas = new Map();

    for (const fila of filas) {
      const c = leerContenedor(fila.contenedor);
      let sitioId = sitios.get(c.clave);
      if (!sitioId) {
        const r = await cliente.query(
          'INSERT INTO sitios (clave, codigo, letra, numero, nombre) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [c.clave, c.codigo, c.letra, c.numero, c.nombre]
        );
        sitioId = r.rows[0].id;
        sitios.set(c.clave, sitioId);
      } else if (c.nombre && c.codigo) {
        await cliente.query('UPDATE sitios SET nombre = COALESCE(nombre, $2) WHERE id = $1', [sitioId, c.nombre]);
      }

      let articuloId = articulos.get(fila.nombre);
      if (!articuloId) {
        const r = await cliente.query(
          'INSERT INTO articulos (nombre, nombre_norm) VALUES ($1, $2) RETURNING id',
          [fila.nombre, normalizar(fila.nombre)]
        );
        articuloId = r.rows[0].id;
        articulos.set(fila.nombre, articuloId);
      }

      for (const etiqueta of fila.etiquetas) {
        let etiquetaId = etiquetas.get(etiqueta);
        if (!etiquetaId) {
          const r = await cliente.query('INSERT INTO etiquetas (nombre) VALUES ($1) RETURNING id', [etiqueta]);
          etiquetaId = r.rows[0].id;
          etiquetas.set(etiqueta, etiquetaId);
        }
        await cliente.query(
          'INSERT INTO articulo_etiquetas (articulo_id, etiqueta_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [articuloId, etiquetaId]
        );
      }

      await cliente.query(
        'INSERT INTO contenido (sitio_id, articulo_id, cantidad, estado, comentarios) VALUES ($1, $2, $3, $4, $5)',
        [sitioId, articuloId, fila.cantidad, 'bueno', fila.comentarios]
      );
    }

    await aplicarNombresIA(cliente);
    await cliente.query('COMMIT');
    const unidades = filas.reduce((suma, f) => suma + f.cantidad, 0);
    return { lineas: filas.length, sitios: sitios.size, articulos: articulos.size, etiquetas: etiquetas.size, unidades };
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

if (require.main === module) {
  const archivo = process.argv[2];
  if (!archivo) {
    console.error('Uso: node scripts/importar.cjs "ruta/a/la/hoja.xlsx"');
    process.exit(1);
  }
  importar(archivo)
    .then(resumen => {
      console.log(resumen);
      return getPool().end();
    })
    .catch(error => {
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = { importar, leerHoja };
