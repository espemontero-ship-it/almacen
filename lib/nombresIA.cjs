const { normalizar } = require('./normalizar.cjs');

function textoBuscable(partes) {
  return [...new Set(partes.filter(Boolean).map(normalizar).filter(Boolean))].join(' ');
}

async function aplicarNombresIA(cliente) {
  for (const tipo of ['articulo', 'etiqueta']) {
    const tabla = tipo === 'articulo' ? 'articulos' : 'etiquetas';
    const r = await cliente.query(
      `SELECT t.id, t.nombre, n.es, n.en, n.otros
       FROM ${tabla} t
       LEFT JOIN nombres_ia n ON n.tipo = $1 AND n.original = t.nombre`,
      [tipo]
    );
    const ids = [];
    const es = [];
    const en = [];
    const buscable = [];
    for (const f of r.rows) {
      ids.push(f.id);
      es.push(f.es || f.nombre);
      en.push(f.en || f.nombre);
      buscable.push(textoBuscable([f.nombre, f.es, f.en, ...(f.otros || [])]));
    }
    await cliente.query(
      `UPDATE ${tabla} t
       SET nombre_es = v.es, nombre_en = v.en, buscable = v.buscable
       FROM unnest($1::int[], $2::text[], $3::text[], $4::text[]) AS v(id, es, en, buscable)
       WHERE t.id = v.id`,
      [ids, es, en, buscable]
    );
  }
}

module.exports = { aplicarNombresIA, textoBuscable };
