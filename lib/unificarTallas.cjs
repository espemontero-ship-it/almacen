const { separarTalla, esRopa, tallasPosibles } = require('./tallas.cjs');
const { normalizar } = require('./normalizar.cjs');

const ALIAS = {
  't shirts conscience': 't shirt concience black',
  'coat aleph plot': 'aleph coat',
};

function quitarTalla(texto) {
  const s = separarTalla(texto || '');
  return s ? s.base : texto;
}

async function unificarTallas(cliente) {
  const r = await cliente.query(`
    SELECT a.id, a.nombre,
           COALESCE(array_agg(DISTINCT e.nombre) FILTER (WHERE e.nombre IS NOT NULL), '{}') AS etiquetas,
           n.es, n.en, n.otros, n.corregido, n.revisado
    FROM articulos a
    LEFT JOIN articulo_etiquetas ae ON ae.articulo_id = a.id
    LEFT JOIN etiquetas e ON e.id = ae.etiqueta_id
    LEFT JOIN nombres_ia n ON n.tipo = 'articulo' AND n.original = a.nombre
    GROUP BY a.id, n.es, n.en, n.otros, n.corregido, n.revisado
  `);

  const grupos = new Map();
  for (const f of r.rows) {
    const s = separarTalla(f.nombre);
    if (!s || !esRopa(f.nombre, f.etiquetas)) continue;
    let clave = s.base.toLowerCase();
    clave = ALIAS[clave] || clave;
    if (!grupos.has(clave)) grupos.set(clave, { base: null, miembros: [] });
    const g = grupos.get(clave);
    if (!g.base && s.base.toLowerCase() === clave) g.base = s.base;
    g.miembros.push({ ...f, talla: s.talla, baseMiembro: s.base });
  }

  let prendas = 0;
  for (const g of grupos.values()) {
    const base = g.base || g.miembros[0].baseMiembro;
    const canonicos = g.miembros.filter(m => m.baseMiembro === base);
    const candidatos = canonicos.length ? canonicos : g.miembros;
    const ref = candidatos.find(m => m.corregido) || candidatos.find(m => m.es) || candidatos[0];
    const es = ref.es ? quitarTalla(ref.es) : base;
    const en = ref.en ? quitarTalla(ref.en) : base;
    const otros = [...new Set(g.miembros.flatMap(m => m.otros || []))];
    const revisado = g.miembros.every(m => m.revisado) ? new Date() : null;
    const corregido = g.miembros.some(m => m.corregido);
    const tallas = tallasPosibles(g.miembros.map(m => m.talla));

    const existente = await cliente.query('SELECT id FROM articulos WHERE nombre = $1', [base]);
    let destino = existente.rows[0]?.id;
    if (!destino) {
      const nuevo = await cliente.query(
        'INSERT INTO articulos (nombre, nombre_norm, tallas) VALUES ($1, $2, $3) RETURNING id',
        [base, normalizar(base), tallas]
      );
      destino = nuevo.rows[0].id;
    } else {
      await cliente.query('UPDATE articulos SET tallas = $2 WHERE id = $1', [destino, tallas]);
    }

    for (const m of g.miembros) {
      await cliente.query('UPDATE contenido SET articulo_id = $1, talla = $2 WHERE articulo_id = $3', [destino, m.talla, m.id]);
      await cliente.query(
        `INSERT INTO articulo_etiquetas (articulo_id, etiqueta_id)
         SELECT $1, etiqueta_id FROM articulo_etiquetas WHERE articulo_id = $2
         ON CONFLICT DO NOTHING`,
        [destino, m.id]
      );
      if (m.id !== destino) await cliente.query('DELETE FROM articulos WHERE id = $1', [m.id]);
    }

    await cliente.query(
      `INSERT INTO nombres_ia (tipo, original, es, en, otros, corregido, revisado)
       VALUES ('articulo', $1, $2, $3, $4, $5, $6)
       ON CONFLICT (tipo, original) DO UPDATE
       SET es = EXCLUDED.es, en = EXCLUDED.en, otros = EXCLUDED.otros, corregido = EXCLUDED.corregido, revisado = EXCLUDED.revisado`,
      [base, es, en, otros, corregido, revisado]
    );
    prendas++;
  }
  return { prendas, articulosUnidos: [...grupos.values()].reduce((s, g) => s + g.miembros.length, 0) };
}

module.exports = { unificarTallas };
