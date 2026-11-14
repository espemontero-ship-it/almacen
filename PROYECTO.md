# Almacén — hoja de proyecto

Este documento es la fuente de verdad del proyecto: qué es, qué se ha decidido y por qué, y qué queda pendiente. Cada decisión nueva de producto, alcance o diseño se apunta aquí con fecha, en el Registro de decisiones del final.

## Regla de trabajo

- **Solo se hace exactamente lo que ella pide.** Nada más: ni quitar, ni añadir, ni cambiar nada que no haya pedido, aunque parezca que va con lo pedido. Si algo de lo pedido obliga a tocar otra cosa, se le pregunta antes.
- **No se mete nada sin preguntar. Ante cualquier duda, las decisiones las toma ella, no Claude.**
- **Antes de subir nada** (commit, push o publicar en Vercel) se le pregunta. Subir a GitHub publica solo en la app.
- **No se comprueba todo** en cada cambio pequeño: basta con compilar y echar un vistazo. Lo que no se haya comprobado se dice.
- **Cada vez que se sube algo, se apunta aquí en ese mismo momento**: en "Lo que hace" si cambia lo que la app hace, y siempre en el Registro de decisiones.

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
- **Sugerencias al escribir**: desde la segunda letra salen debajo del buscador todos los artículos, etiquetas y cajas que coinciden. Al tocar una sugerencia se va directo a ella.
- **Inicio en el móvil**: el buscador y debajo la tabla de todos los artículos (Artículo · Total · Cajas), con filtros de etiqueta, estado y la casilla "Con foto". Al tocar una fila se despliega por caja (y por talla en la ropa).
- **Inicio en el ordenador** (pantallas de 900 px o más): arriba, una sola barra con Almacén (vuelve al inicio), el buscador, Historial, + Crear caja, Personas, Salir y ES / EN. Debajo, filtros de etiqueta, estado y "Con foto", y el botón Cuadrícula / Lista. Cuadrícula: tarjetas pequeñas con foto, nombre, etiquetas, tallas, total y cajas; el estado solo sale si hay algo roto; al pulsar una tarjeta se abre la ficha. Lista: tabla compacta (Artículo · Total · Cajas · Estado · Etiquetas) con desplegable por caja.
- **Búsqueda en el ordenador**: los resultados salen con las mismas tarjetas y el mismo botón Cuadrícula / Lista que el inicio.
- **Ficha del artículo, caja e historial en el ordenador**: la misma barra de arriba y la letra y los botones más pequeños. Personas y Crear caja siguen como en el móvil.
- **Editar el nombre** (quien edita): doble clic (o doble toque) sobre el nombre de un artículo en cualquier pantalla. Se escribe sobre el propio texto; debajo aparecen sus sinónimos, que solo se ven mientras se edita. Se edita el nombre del idioma que se está viendo; los sinónimos son una sola lista para los dos idiomas. Cada uno se guarda al salir de él; Enter guarda y cierra; Esc cancela. Queda en el historial y el buscador encuentra el nombre nuevo.
- **Dos idiomas**: botón ES / EN arriba; cada móvil recuerda el suyo. Cambian las pantallas, los nombres de los artículos y las etiquetas. El buscador encuentra en los dos idiomas a la vez.
- **Entrar**: cada persona con su usuario (o su correo) y contraseña. Arriba, "Entrar"; con sesión, "Personas" (solo administración) y "Salir". Ver y buscar sigue abierto sin entrar.
- **Recuperar contraseña**: "¿Has olvidado tu contraseña?" → correo → enlace de 2 horas para elegir una nueva. Los correos salen por Gmail con SMTP_USER y SMTP_APP_PASSWORD (contraseña de aplicación de esa misma cuenta, que necesita la verificación en dos pasos activada).
- **Personas** (solo administración): lista del equipo con su acceso; invitar (nombre, usuario, correo, acceso: administración, edición o solo consulta) da un enlace de 7 días y lo manda por correo; "Nueva contraseña" da un enlace para mandárselo a mano.
- **Editar las cajas** (quien entra con acceso de edición o administración): al entrar en una caja, cada artículo tiene la cantidad con [−] [+] que se guarda al momento. Al tocar el nombre se abren: rotas con [−] [+] (se ve "8 buenas · 2 rotas"), comentarios con botón Guardar y "Quitar de la caja" con confirmación. Abajo, "Añadir artículo": busca en el catálogo con sugerencias (cantidad y talla si es ropa) o crea uno nuevo (nombre en español e inglés, etiquetas, si es ropa y su talla).
- **Fotos**: una por artículo. Al editar una caja, cada artículo tiene un botón con icono de cámara: abre la cámara (o la galería), la app reduce la foto (lado máximo 1200 px, JPEG) y la sube a Cloudflare R2. Al tocar una foto se ve en grande. Miniatura en la tabla del inicio, y foto en la ficha y en la caja.
- **Crear caja** (desde el inicio, quien edita): tipo de caja, número propuesto (el siguiente libre) y nombre opcional.
- **Historial** (lo ve todo el mundo): cada cambio queda apuntado con quién, cuándo y qué (cantidades, rotas, comentarios, añadir, quitar, recuperar, artículo nuevo, caja nueva, fotos, nombres y sinónimos). Botón "Historial" en el inicio con todos los cambios; "Historial de esta caja" al final de cada caja. El enlace "Historial de este artículo" se quitó. Empieza a contar desde el 2026-11-14.
- **Papelera** (quien edita): al final de cada caja, "Quitado de esta caja (últimos 30 días)", con botón Recuperar que lo devuelve tal como estaba.
- **Ropa con tallas**: cada prenda es un solo artículo, con la cantidad de cada talla. Al buscarla, las tallas salen como botones con su total (S 9 · M 19…); al tocar uno salen las cajas de esa talla. XXL = 2XL, XXXL = 3XL; W es mujer y M hombre.
- **Crear y editar** desde la app: cajas, items, cantidades, estado, comentarios y fotos hechas con el móvil. Se empieza solo con ver.
- **Permisos por persona**: administración (gestiona usuarios), edición (crea y edita) y solo consulta.
- **Historial de cambios**: quién cambió qué y cuándo.
- **Papelera**: lo borrado se puede recuperar durante un tiempo.

## Cómo se organizan los datos

- **Tipos**: P, C, O, M, L, D, A, U y R.
- **Cajas y sitios**: un código cada una (P01…), con nombre opcional. El tipo sale de la letra. Los sitios que no son cajas se identifican por su nombre.
- **Etiquetas**: varias por artículo.
- **Catálogo de artículos**: cada artículo existe una sola vez, con **una foto por artículo**, que se ve en todas las cajas donde está.
- **Contenido**: qué artículo hay en qué caja, con cantidad, cuántas están rotas, comentarios y talla (solo en ropa). Lo quitado queda marcado como borrado, no se elimina (para la papelera).
- **Tallas posibles de cada prenda**: guardadas para elegirlas de una lista al añadir ropa (letras S–6XL; números y W/M + número, los que existen en la hoja).
- **Nombres en español e inglés** de cada artículo y etiqueta, guardados aparte unidos al nombre original de la hoja. Al recargar la hoja no se pierden ni hay que volver a hacerlos.

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

### Identidad visual del sitio: versión 3 (elegida el 2026-11-14)

Elegida entre varias versiones para el ordenador. Es la identidad visual del sitio.

- **Letra**: la del sistema, a 13 px en la barra de arriba y los filtros. **Sin negritas**: título, enlaces, rótulos, contador y botones con grosor normal.
- **Bordes**: siempre finos (1 px) y gris claro (`#d6d6d6`). Nada de líneas gruesas.
- **Esquinas rectas**: buscador, desplegables, botones, grupos de botones y tarjetas.
- **Sin fondos grises ni sombreados**: todo sobre blanco.
- **Lo elegido** (ES / EN, Cuadrícula / Lista) y el botón **Buscar**: relleno negro con letra blanca.
- **Mismo alto** para buscador, Buscar, desplegables y grupos de botones: 34 px.
- **Barra de arriba (forma G)**: una sola fila compacta con Almacén, el buscador, los enlaces como texto (sin subrayar y sin recuadro) y ES / EN.
- **Tarjetas**: borde fino gris claro, sin fondo, esquinas rectas.
- **Se aplica a todo el sitio**: móvil, ordenador y todas las pantallas (decisión suya, 2026-11-14). Donde choca con las reglas de arriba, mandan estas:
  - **Sin morado**: todos los botones principales (Buscar, Guardar, Añadir, Entrar…) en negro. El color de acento pasa a ser negro.
  - **Letra**: 16 en el móvil (más grande que en el ordenador, para leer en el almacén) y 13 en el ordenador.
  - **Negrita solo** en nombres de artículo, totales y rotas. Todo lo demás, con grosor normal.
  - **Botones en el móvil**: siguen del tamaño de un dedo (48 de alto), con el estilo de la versión 3.
  - **Enlaces** como texto, sin subrayar.

## Qué falta (para recordárselo cuando pregunte)

- **Desarrollos posteriores**: guardar lo que vuelve, pickup lists (listas de salida a eventos) y permisos finos.
- **Mensaje de error en Recuperar contraseña**: si el envío del correo falla, la pantalla dice "No hay conexión"; debería decir que no se ha podido enviar el correo.
- **Datos definitivos**: cargarlos cuando termine la reorganización del almacén. La carga une la ropa por tallas y reutiliza los nombres ya revisados.
- **9 artículos sin traducir**: no se sabe qué son; tienen el nombre original en los dos idiomas.
- **Revisar todas las pantallas una a una**, con opciones, empezando por: la ficha del artículo en el ordenador (diseño antiguo) y la barra de arriba (se ve enorme comparada con lo demás).
- **Unidades en la caja** ("14 artículos · 74 unidades"): preguntó qué pintan; sin resolver.
- **En el móvil**, a la ficha del artículo solo se llega desde las sugerencias del buscador.
- **Sinónimos**: la lista no tiene las palabras en inglés; se hizo mal. Aparcado por decisión suya.
- **Borrar 2 archivos de prueba** de la carpeta "prueba/" de las fotos en Cloudflare.

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
- Su contraseña no funcionaba al entrar, y pidió quitar la contraseña de momento. La app queda abierta a quien tenga el enlace.
- Echaba de menos ver la lista de todo y filtrarla. En el inicio, debajo del buscador, va una tabla por artículo (Artículo · Total · Cajas), de la A a la Z, con filtros de tipo de caja, etiqueta y estado. Al tocar una fila se despliega cuántos hay en cada caja. Rechazado: una tabla caja por caja, porque busca objetos, no cajas.
- Regla: preguntar antes de subir cualquier cosa, y no comprobarlo todo en cada cambio pequeño.
- Tabla del inicio: etiquetas y estado. En el móvil van debajo del nombre; en pantallas anchas, como columnas propias (Artículo · Etiquetas · Estado · Total · Cajas). Los artículos de una sola unidad no tienen desplegable.
- Subido: sugerencias al escribir en el buscador (artículos, etiquetas y cajas), todas las que coincidan, en una lista que se desliza.
- Subido: botón ES / EN con las pantallas en los dos idiomas.
- Nombres en español e inglés generados con IA (Claude, unos 1 $): el resultado fue malo (categorías como traducción, marcas como sinónimos) y se paró en 800 de 863. Ella no se fía de que la IA invente; los 863 los repasó Claude a mano con reglas estrictas (nombre normal en España; sinónimos solo equivalentes exactos, sin marcas ni categorías) y los que no sabía qué eran se le preguntaron.
- Revisión de nombres: página privada por grupos, todo dado por bueno y solo se toca lo que está mal. Ella corrigió 20 y se dieron todos por revisados. El Excel de 863 filas no servía para revisar.
- Ropa: cada prenda pasa a ser un solo artículo con la cantidad por talla (129 artículos → 29 prendas). "Camisetas Conscience" y "Camiseta Conscience negra" son la misma prenda; "Abrigo Aleph plot" y "Abrigo Aleph" también.
- Subido: ropa unida por tallas y nombres en el idioma elegido.
- En el buscador, las tallas de cada prenda salen como botones con su total; al tocar uno se ven las cajas de esa talla. Rechazado: una línea por caja y talla, y una línea por talla desplegable ("un follón").
- La tabla del inicio solo tiene desplegable si el artículo está en más de una caja o tiene varias tallas.
- Regla: cada vez que se sube algo, se apunta en este documento en ese momento.
- Fase 2 planificada: 2a usuarios (con recuperar contraseña), 2b editar las cajas al entrar en ellas (cantidad, rotas como "8 buenas · 2 rotas", comentarios, quitar, añadir, icono de cámara para la foto, crear caja), 2c fotos con R2, 2d historial y papelera. Fuera: guardar lo que vuelve, pickup lists y permisos finos.
- Subido 2a: entrar, recuperar contraseña por correo y pantalla Personas. Su contraseña nunca llegó a guardarse: el enlace de invitación no se usó.
- Fotos: se queda Cloudflare R2 aunque con ~744 artículos cabría en Vercel Blob, para no compartir límites con punteo-trimestral (decisión suya).
- Subido 2b: editar las cajas al entrar en ellas (cantidad, rotas, comentarios, quitar, añadir o crear artículo) y crear caja. Las rotas pasan a ser un número por línea en vez de un estado.
- Pendiente: el envío de correos de recuperación falla (Gmail rechaza las credenciales); aparcado.
- Subido 2c: fotos con Cloudflare R2. El bucket almacen-fotos está en la jurisdicción europea, así que la dirección lleva .eu. (con la normal da Access Denied). Las fotos no son públicas: se enseñan con enlaces temporales de 6 horas. Claves en Vercel: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.
- Subido 2d: historial (lo ve todo el mundo, con sección general además de por caja y por artículo) y papelera de 30 días en cada caja. Con esto queda terminada la Fase 2.
- 2026-11-14: el correo de recuperación funciona y ha llegado. El fallo eran las credenciales de Gmail en Vercel (contraseña de aplicación).

**2026-11-14 (rediseño de ordenador)**
- En el ordenador todo era enorme y desordenado, no se veían las fotos y los filtros no tenían sentido. Se enseñaron 6 diseños completos en la app y eligió el 2 (catálogo de fotos con Cuadrícula / Lista), con la tarjeta más pequeña (C) y sin "Bueno" en las tarjetas: el estado solo sale si hay algo roto.
- Filtros: buscador, etiqueta, estado y casilla "Con foto". "Tipo de caja" se quita en todas partes, también en el móvil.
- La Lista del ordenador se hace compacta, con las columnas en orden nombre, unidades, caja y estado (Etiquetas queda al final) y sin hueco en el nombre.
- Búsqueda en el ordenador con las mismas tarjetas. Ficha, caja e historial con la barra de arriba y tamaño más pequeño.
- "Historial de este artículo" se quita de todas partes: no tenía sentido.
- Editar nombres con doble clic sobre el nombre, en cualquier pantalla, sin botones nuevos. Los sinónimos solo se ven mientras se edita. Sustituye a la decisión de no dejar añadir sinónimos a mano.
- Reglas nuevas: solo se hace exactamente lo que ella pide; no se mete nada sin preguntar y, ante cualquier duda, decide ella; antes de proponer nada se relee este documento.
- Subido: todo lo anterior.
- Barra de arriba del ordenador: elegida la forma G (una fila compacta, enlaces como texto) entre 8 opciones. Se ve el EN entero.
- Identidad visual: elegida la versión 3 entre varias (letra 13 sin negritas, bordes finos gris claro, esquinas rectas, sin fondos grises, elegido y Buscar en negro, alto 34). Se aplica a todo el sitio, también al móvil: sin morado, letra 16 en el móvil, negrita solo en nombres, totales y rotas, botones del móvil del tamaño de un dedo, enlaces sin subrayar. Detalle en la Guía de diseño.
- Sinónimos: 528 de los 745 artículos no tienen ninguno; queda para más adelante.
- Subido: barra G e identidad visual versión 3 en todo el sitio.
