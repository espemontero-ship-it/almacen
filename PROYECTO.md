# Almacén — hoja de proyecto

Este documento es la fuente de verdad del proyecto: qué es, qué se ha decidido y por qué, y qué queda pendiente. Cada decisión nueva de producto, alcance o diseño se apunta aquí con fecha, en el Registro de decisiones del final.

## Qué es y para quién

App para el almacén de la asociación. Hay más de 150 cajas y miles de items.

La usan **varias personas a la vez**, **desde el móvil**, **dentro del almacén**, donde hay señal.

## Lo que hace

- **Cajas** nombradas con letra + número (P01, C12…). La letra dice qué tipo de cosas contiene:
  - **P** props
  - **C** cocina
  - **O** oficina
  - **M** matress
  - **L** lighting
  - **D** drawer (cajones)
  - **A** zonas del almacén ("Area 14" y A14 son lo mismo)
  - **U** uniformes
  - **R** rental (alquiler). U y R se unificarán más adelante; de momento se cargan tal cual.
- Las cajas **pueden llevar un nombre o no**, además del código (por ejemplo, P14 "latex weapons").
- También hay **sitios que no son cajas**, y la app los admite: casas (Espe House…) y sitios con nombre propio (MK1, Safety, "Lost- para buscar"…).
- **Etiquetas**: cada artículo puede llevar varias (Props, rentals, Uniforms, Electrical…), como en la hoja actual.
- **Ver una caja**: cada item con su cantidad, foto, estado (bueno / roto) y comentarios.
- **Buscar un item**: el total que hay sumando todas las cajas y, debajo, en qué cajas está y cuántos hay en cada una.
- **Crear y editar** desde la app: cajas, items, cantidades, estado, comentarios y fotos hechas con el móvil. Se empieza solo con ver.
- **Permisos por persona**: administración (gestiona usuarios), edición (crea y edita) y solo consulta.
- **Historial de cambios**: quién cambió qué y cuándo.
- **Papelera**: lo borrado se puede recuperar durante un tiempo.

## Cómo se organizan los datos

- **Tipos**: P, C, O, M, L, D, A, U y R.
- **Cajas y sitios**: un código cada una (P01…), con nombre opcional. El tipo sale de la letra. Los sitios que no son cajas se identifican por su nombre.
- **Etiquetas**: varias por artículo.
- **Catálogo de artículos**: cada artículo existe una sola vez, con **una foto por artículo**, que se ve en todas las cajas donde está.
- **Contenido**: qué artículo hay en qué caja, con cantidad, estado y comentarios.

El catálogo existe para que los totales salgan bien. Si cada caja tuviera su propio texto libre, "Silla plegable" y "sillas plegables" contarían como dos cosas distintas.

La búsqueda no distingue mayúsculas, tildes ni plurales, y tolera alguna errata.

## Dónde vive (y por qué)

**Dirección de la app (entorno de prueba):** https://almacen-nu-eosin.vercel.app — proyecto almacen en Vercel, base de datos Neon almacen-db (plan gratuito, Frankfurt).

| Pieza | Dónde | Coste |
|---|---|---|
| App | Vercel, en la misma cuenta que punteo-trimestral y loose-ends | 0 € |
| Base de datos | Neon (PostgreSQL), proyecto nuevo y propio | 0 € |
| Fotos | Cloudflare R2 | 0 € dentro del plan gratis |
| Código | Repositorio privado en GitHub | 0 € |

Alternativas descartadas, con su motivo:

- **Hoja de cálculo como base de datos**: no sirve para varias personas editando a la vez con miles de items.
- **Supabase**: su plan gratuito ya está al límite de 2 proyectos con otras apps.
- **Cualquier opción con cuota mensual**: la asociación no asume ese coste.
- **Vercel Blob para las fotos**: su plan gratis se comparte entre todos los proyectos de la cuenta. Tiene 1 GB, 2.000 subidas al mes y 10.000 lecturas sin caché. La carga inicial de miles de fotos lo superaría, y Vercel bloquearía Blob 30 días **para todos los proyectos**, punteo-trimestral incluido.

**Sobre R2**, aceptado sabiéndolo:
- Pide tarjeta para activarse.
- **No tiene tope de gasto**: lo que pase del plan gratis se cobra.
- Plan gratis: 10 GB, 1.000.000 de subidas y 10.000.000 de lecturas al mes, sin coste por descargas.
- Con 6.000 fotos de unos 150 KB, el almacén usaría menos del 10 %.
- La app limita el tamaño de cada foto.

**Sobre Neon**: el plan gratis da 1 GB por proyecto, y miles de items en texto ocupan unos pocos MB.

## Carga de la hoja de cálculo actual

1. Se lee la hoja sin modificarla.
2. Informe con:
   - cuántas cajas y artículos hay;
   - filas con errores;
   - nombres que parecen el mismo artículo escrito de formas distintas.
3. Ella decide qué se une y qué no. No se unifica nada por cuenta propia.
4. Carga en el entorno de prueba y revisión en el móvil.
5. Carga en el entorno real.

**Hoja actual** (Warehouse items - Organization - Not Only Larp.xlsx, revisada el 2026-11-13): 949 líneas, 824 artículos distintos, 6.032 unidades y 175 sitios. Columnas: nombre, cantidad, descripción, contenedor, etiquetas y foto.

Cómo se carga en el entorno de prueba:
- **Sin unir nada.** Los artículos escritos de formas distintas (cushion / Cushions…) se cargan tal cual.
- **Códigos de caja en mayúscula**, así l18 y L18 son la misma caja.
- **Descripción** pasa a comentarios.
- **Etiquetas** pasan tal cual.
- **Estado**: todo empieza como "bueno", porque la hoja no lo tiene.
- **Las 4 líneas sin cantidad** pasan con cantidad 1.
- **"Area N"** se carga como la zona **AN** (Area 14 → A14).
- **Fotos**: existen, pero no vienen en la exportación. Aparcadas de momento.

## Fases

Cada fase se sube a prueba con dos listas: lo que se va a ver y dónde, y lo que se ha tocado y no se ve. Ella lo mira en su móvil, y solo con su sí pasa al entorno real.

- **Fase 0, preparación**:
  - carpeta y repositorio;
  - este documento;
  - informe de la hoja;
  - cuenta de R2.
- **Fase 1, consultar**:
  - entrada con usuario y contraseña;
  - inicio con buscador y cajas por tipo;
  - pantalla de caja;
  - búsqueda con total y desglose por caja;
  - datos reales importados.
- **Fase 2, editar**:
  - crear cajas;
  - añadir y editar items, buscando primero en el catálogo para no duplicar;
  - fotos con la cámara;
  - quitar, con confirmación;
  - permisos, historial y papelera.
- **Fase 3, puesta en marcha**:
  - alta de voluntarios;
  - copia de seguridad con una restauración probada;
  - guía de una página para voluntarios.

## Guía de diseño

Es propia de esta app. La de punteo-trimestral no aplica, porque está pensada para tablas en la pantalla de un ordenador.

**Para quién y dónde:** voluntarios de pie en el almacén, con el móvil en una mano y a veces una caja en la otra.

- **Fondo blanco.** Sin tema oscuro.
- **Letra**: la propia de cada móvil.
- **Letra grande**, que se lea a un brazo de distancia.
- **Contraste alto**: nada de grises claros para información importante.
- **Todo lo que se toca** tiene como mínimo el tamaño de la yema de un dedo.
- **Lo que se puede tocar se ve siempre como tal.** No hay nada que aparezca "al pasar el ratón".
- **Lo que más se usa** queda al alcance del pulgar, en la mitad de abajo de la pantalla.
- **El buscador** está siempre arriba y visible, en todas las pantallas.
- **Listas**: una fila por artículo, sin recuadros ni tarjetas, separadas por una línea fina. En cada fila se ve la foto pequeña, el nombre y la cantidad. La foto se amplía al tocarla.
- **Color**: un solo color de acento, índigo `#4e4f74` (de momento), y solo para lo principal. Nada más lleva color.
- **"Roto"** se marca con texto en negrita, no con rojo.
- **Borrar** siempre pide confirmación con una ventana propia de la app.
- **Una sola forma de cada cosa**: un único tamaño de botón y siempre los mismos espacios de separación.

## Qué falta (para recordárselo cuando pregunte)

- **Otros nombres de cada artículo, generados con IA**: Claude genera solo, sin que nadie escriba nada, nombres alternativos en español y en inglés para cada artículo ("cushion" → cojín, almohadón, pillow), y el buscador los usa. Coste estimado: 1 a 2 € en total por todos los artículos, una sola vez, y menos de un céntimo por cada artículo nuevo. Se cobra en la cuenta de Anthropic que ya usa punteo-trimestral (comprobar antes que sigue activa). Se hará más adelante, sobre los datos definitivos.
- **Ver todos los artículos**: hace falta en algunos momentos, para acciones futuras. Una lista de 844 artículos no sirve en el móvil; hay que pensar la forma cuando toque.
- **Fotos**: aparcadas. Existen, pero no vienen en la exportación. La cuenta de Cloudflare R2 se crea cuando se retomen.
- **Entrada con usuario y contraseña**: se decide más adelante. Mientras no haya entrada, cualquiera con el enlace podría ver el inventario.

## Pendiente de decidir

- **Cómo se ven las unidades rotas**: dos líneas ("8 bueno" y "2 roto") o una ("8 buenas · 2 rotas"). Se decide viendo las pantallas, no antes.
- **Separar caja, zona, cajón y otros sitios** como cosas distintas en la app: probablemente más adelante, no ahora.
- **Unificar U y R**: más adelante.

## Registro de decisiones

**2026-11-13**
- App de almacén nueva, en carpeta y repositorio propios.
- Varias personas, en el móvil, dentro del almacén. Hay señal, así que no hace falta que funcione sin conexión.
- Datos iniciales desde la hoja de cálculo actual.
- Se empieza solo con ver; crear y editar llegan después.
- Estado bueno / roto, más comentarios.
- Descartadas la hoja de cálculo como base de datos y cualquier cuota mensual.
- Misma infraestructura que punteo-trimestral (Vercel + Neon), con las fotos en Cloudflare R2 en vez de Vercel Blob, por los límites compartidos. R2 aceptado sabiendo que pide tarjeta y no tiene tope de gasto.
- Una foto por artículo, no por caja.
- Sí a permisos por persona, historial de cambios y papelera.
- Guía de diseño nueva, para el móvil. Color de acento índigo, de momento. Letra propia de cada móvil.
- La forma de mostrar las unidades rotas se decide viendo las pantallas.
- Revisada la hoja actual. A son zonas del almacén y D son drawers (cajones). Se admiten sitios que no son cajas. Las cajas pueden llevar nombre o no. Las etiquetas pasan a la app.
- Carga de prueba sin unir ningún artículo: es un entorno de pruebas. Códigos de caja en mayúscula, descripción a comentarios, todo empieza como "bueno" y las 4 líneas sin cantidad pasan con 1.
- Las fotos se aparcan de momento. Se está reorganizando el almacén, así que hasta que esté acabado todo es entorno de prueba: los datos actuales no son definitivos.
- U son uniformes y R rental; se unificarán más adelante, ahora se cargan tal cual. "Area N" y AN son la misma zona. Separar caja, zona, cajón y otros sitios queda para más adelante.
- Pantallas de la Fase 1, tras preguntarle cómo se usa (buscar, guardar lo que vuelve, revisar una caja, hacer inventario; lo usan todos): el inicio es solo el buscador. El buscador entiende un artículo, una etiqueta o el código de una caja, que abre la caja. Cada resultado muestra foto, nombre, etiquetas, total y rotos, y debajo cada sitio con cantidad, estado y comentarios. La caja muestra código, nombre, artículos y unidades, y de cada cosa foto, nombre, cantidad, estado, comentarios y etiquetas. Se rechazó un resumen por tipos en el inicio. Ella avisa de que se acabará cambiando.
- Guardar lo que vuelve y hacer inventario necesitan editar: van en la Fase 2.
- Cada cosa se llama de mil maneras, así que buscar solo por el nombre no basta. Se rechaza que la gente añada sinónimos a mano. Los otros nombres se generarán con IA más adelante (1 a 2 € en total).
- Fase 1 publicada en Vercel con la hoja cargada en Neon. Cuenta de administración para Espe, que elige su contraseña con un enlace de invitación.
