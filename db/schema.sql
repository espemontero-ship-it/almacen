CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  usuario TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'editor', 'consulta')),
  password_hash TEXT,
  creado TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invitaciones (
  token TEXT PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS sitios (
  id SERIAL PRIMARY KEY,
  clave TEXT NOT NULL UNIQUE,
  codigo TEXT,
  letra TEXT,
  numero INTEGER,
  nombre TEXT
);

CREATE TABLE IF NOT EXISTS articulos (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  nombre_norm TEXT NOT NULL,
  foto_url TEXT
);

CREATE INDEX IF NOT EXISTS articulos_nombre_norm_trgm ON articulos USING gin (nombre_norm gin_trgm_ops);

CREATE TABLE IF NOT EXISTS etiquetas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS articulo_etiquetas (
  articulo_id INTEGER NOT NULL REFERENCES articulos(id) ON DELETE CASCADE,
  etiqueta_id INTEGER NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
  PRIMARY KEY (articulo_id, etiqueta_id)
);

CREATE TABLE IF NOT EXISTS contenido (
  id SERIAL PRIMARY KEY,
  sitio_id INTEGER NOT NULL REFERENCES sitios(id) ON DELETE CASCADE,
  articulo_id INTEGER NOT NULL REFERENCES articulos(id) ON DELETE CASCADE,
  cantidad INTEGER NOT NULL CHECK (cantidad >= 0),
  estado TEXT NOT NULL DEFAULT 'bueno' CHECK (estado IN ('bueno', 'roto')),
  comentarios TEXT
);

CREATE INDEX IF NOT EXISTS contenido_sitio ON contenido (sitio_id);
CREATE INDEX IF NOT EXISTS contenido_articulo ON contenido (articulo_id);
