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

CREATE TABLE IF NOT EXISTS nombres_ia (
  tipo TEXT NOT NULL CHECK (tipo IN ('articulo', 'etiqueta')),
  original TEXT NOT NULL,
  es TEXT NOT NULL,
  en TEXT NOT NULL,
  otros TEXT[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (tipo, original)
);

ALTER TABLE articulos ADD COLUMN IF NOT EXISTS nombre_es TEXT;
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS nombre_en TEXT;
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS buscable TEXT;
ALTER TABLE etiquetas ADD COLUMN IF NOT EXISTS nombre_es TEXT;
ALTER TABLE etiquetas ADD COLUMN IF NOT EXISTS nombre_en TEXT;
ALTER TABLE etiquetas ADD COLUMN IF NOT EXISTS buscable TEXT;

CREATE INDEX IF NOT EXISTS articulos_buscable_trgm ON articulos USING gin (buscable gin_trgm_ops);

ALTER TABLE nombres_ia ADD COLUMN IF NOT EXISTS revisado TIMESTAMPTZ;
ALTER TABLE nombres_ia ADD COLUMN IF NOT EXISTS corregido BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE contenido ADD COLUMN IF NOT EXISTS talla TEXT;
ALTER TABLE articulos ADD COLUMN IF NOT EXISTS tallas TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS correo TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_correo ON usuarios (lower(correo));

ALTER TABLE contenido ADD COLUMN IF NOT EXISTS rotos INTEGER NOT NULL DEFAULT 0;
ALTER TABLE contenido ADD COLUMN IF NOT EXISTS borrado TIMESTAMPTZ;
UPDATE contenido SET rotos = cantidad, estado = 'bueno' WHERE estado = 'roto';

ALTER TABLE articulos ADD COLUMN IF NOT EXISTS foto_clave TEXT;

CREATE TABLE IF NOT EXISTS cambios (
  id SERIAL PRIMARY KEY,
  cuando TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_id INTEGER,
  usuario_nombre TEXT,
  sitio_id INTEGER,
  articulo_id INTEGER,
  contenido_id INTEGER,
  accion TEXT NOT NULL,
  detalle JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS cambios_cuando ON cambios (cuando DESC);
CREATE INDEX IF NOT EXISTS cambios_sitio ON cambios (sitio_id, cuando DESC);
CREATE INDEX IF NOT EXISTS cambios_articulo ON cambios (articulo_id, cuando DESC);

ALTER TABLE sitios ADD COLUMN IF NOT EXISTS llenado TEXT CHECK (llenado IN ('vacia', 'medias', 'llena'));

CREATE TABLE IF NOT EXISTS inventarios (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('general', 'parcial')),
  abierto TIMESTAMPTZ NOT NULL DEFAULT now(),
  cerrado TIMESTAMPTZ,
  abierto_por TEXT
);

CREATE TABLE IF NOT EXISTS inventario_cajas (
  inventario_id INTEGER NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
  sitio_id INTEGER NOT NULL REFERENCES sitios(id) ON DELETE CASCADE,
  PRIMARY KEY (inventario_id, sitio_id)
);

CREATE TABLE IF NOT EXISTS revisiones (
  id SERIAL PRIMARY KEY,
  sitio_id INTEGER NOT NULL REFERENCES sitios(id) ON DELETE CASCADE,
  inventario_id INTEGER REFERENCES inventarios(id) ON DELETE SET NULL,
  usuario_id INTEGER,
  usuario_nombre TEXT,
  cuando TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS revisiones_sitio ON revisiones (sitio_id, cuando DESC);

-- Borrar caja: queda 30 días en el Historial con "Recuperar"; después se borra del todo.
ALTER TABLE sitios ADD COLUMN IF NOT EXISTS borrado TIMESTAMPTZ;

-- Inventario de una caja compartido: la revisión en curso, lo marcado (y quién), las fotos saltadas
-- y quién tiene la caja abierta en modo inventario (se ve unos segundos después de su último aviso).
CREATE TABLE IF NOT EXISTS revision_curso (
  sitio_id INTEGER PRIMARY KEY REFERENCES sitios(id) ON DELETE CASCADE,
  empezada TIMESTAMPTZ NOT NULL DEFAULT now(),
  empezada_por TEXT
);

CREATE TABLE IF NOT EXISTS revision_marcas (
  sitio_id INTEGER NOT NULL REFERENCES sitios(id) ON DELETE CASCADE,
  contenido_id INTEGER NOT NULL REFERENCES contenido(id) ON DELETE CASCADE,
  usuario_nombre TEXT,
  cuando TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sitio_id, contenido_id)
);

CREATE TABLE IF NOT EXISTS revision_saltadas (
  sitio_id INTEGER NOT NULL REFERENCES sitios(id) ON DELETE CASCADE,
  contenido_id INTEGER NOT NULL REFERENCES contenido(id) ON DELETE CASCADE,
  PRIMARY KEY (sitio_id, contenido_id)
);

CREATE TABLE IF NOT EXISTS revision_presentes (
  sitio_id INTEGER NOT NULL REFERENCES sitios(id) ON DELETE CASCADE,
  usuario_id INTEGER NOT NULL,
  usuario_nombre TEXT,
  visto TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (sitio_id, usuario_id)
);
