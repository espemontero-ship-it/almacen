# Almacén — hoja de proyecto

Este documento es la fuente de verdad del proyecto: qué es, qué se ha decidido y por qué, y qué queda pendiente. Cada decisión nueva de producto, alcance o diseño se apunta aquí con fecha, en el Registro de decisiones del final.

## Regla de trabajo

Las normas para trabajar con ella están en `CLAUDE.md`, en esta misma carpeta (7 normas, 2026-11-15). Sustituyen a las que había aquí.

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
- **Ficha del artículo**: arriba la foto, el nombre (editable con doble clic), las etiquetas, "26 en total · U3, U5" y las rotas si las hay; en la ropa, botones de talla que filtran las cajas; debajo, cada caja en una tarjeta como las del inicio (código, nombre de la caja, talla, cantidad, rotas y comentario), que lleva a la caja.
- **Sugerencias al escribir**: desde la segunda letra salen debajo del buscador todos los artículos, etiquetas y cajas que coinciden. Al tocar una sugerencia se va directo a ella.
- **Inicio** (móvil y ordenador, el mismo diseño): arriba, una sola barra con Almacén (vuelve al inicio), el buscador, Historial, + Crear caja, Personas, Salir y ES / EN. Debajo, filtros de etiqueta, estado y "Con foto", y el botón Cuadrícula / Lista. Cuadrícula: tarjetas pequeñas con foto, nombre, etiquetas, tallas, total y cajas; el estado solo sale si hay algo roto; al pulsar una tarjeta se abre la ficha. Lista: tabla compacta (Artículo · Total · Cajas · Estado · Etiquetas) con desplegable por caja.
- **Búsqueda** (móvil y ordenador): los resultados salen con las mismas tarjetas y el mismo botón Cuadrícula / Lista que el inicio. En el móvil, las tarjetas van dos por fila y la Lista no enseña Estado ni Etiquetas, que no caben; los filtros van tras un botón "Filtros" (dice cuántos hay puestos) en la misma fila que Cuadrícula / Lista.
- **Resto de pantallas en el ordenador** (ficha, caja, historial, Personas, Crear caja, Entrar, Recuperar contraseña e invitación): la misma barra de arriba, la letra y los botones más pequeños y el contenido alineado a la izquierda, como el inicio.
- **Cabecera del móvil** (todas las pantallas): "Almacén" (vuelve al inicio) y el botón "Menú", que despliega Historial, + Crear caja, Personas, Salir o Entrar y ES / EN; debajo, el buscador. Filas de 44 de alto, mismos márgenes y separaciones.
- **Editar el nombre** (quien edita): doble clic (o doble toque) sobre el nombre de un artículo en cualquier pantalla. Se escribe sobre el propio texto; debajo aparecen sus sinónimos, que solo se ven mientras se edita. Se edita el nombre del idioma que se está viendo; los sinónimos son una sola lista para los dos idiomas. Cada uno se guarda al salir de él; Enter guarda y cierra; Esc cancela. Queda en el historial y el buscador encuentra el nombre nuevo.
- **Dos idiomas**: botón ES / EN arriba; cada móvil recuerda el suyo. Cambian las pantallas, los nombres de los artículos y las etiquetas. El buscador encuentra en los dos idiomas a la vez.
- **Entrar**: cada persona con su usuario (o su correo) y contraseña. Arriba, "Entrar"; con sesión, "Personas" (solo administración) y "Salir". Ver y buscar sigue abierto sin entrar.
- **Recuperar contraseña**: "¿Has olvidado tu contraseña?" → correo → enlace de 2 horas para elegir una nueva. Los correos salen por Gmail con SMTP_USER y SMTP_APP_PASSWORD (contraseña de aplicación de esa misma cuenta, que necesita la verificación en dos pasos activada).
- **Personas** (solo administración): lista del equipo con su acceso; invitar (nombre, usuario, correo, acceso: administración, edición o solo consulta) da un enlace de 7 días y lo manda por correo; "Nueva contraseña" da un enlace para mandárselo a mano.
- **Editar las cajas** (quien entra con acceso de edición o administración): arriba, en una sola línea, el código, el selector de llenado, "Revisada el … por …" o "Sin revisar", el recuento, "Añadir artículo", "Hacer inventario", Cuadrícula / Lista y el ✕ para borrar la caja. La Lista tiene el formato de la Lista del inicio (misma tabla, foto pequeña, nombre con doble clic, mismas letras y alto de fila), en dos columnas en el ordenador (un artículo a la izquierda y el siguiente a la derecha) y en una en el móvil; columnas Artículo · Total (− número +) · Rotas (− número +) · Comentario (casilla, sin texto de ayuda) · ✕. Los − +, el número y el ✕ van sin recuadro; la foto y el comentario, con él. La Cuadrícula tiene las tarjetas del inicio, con Cant. / Rotas / comentario a la misma altura en todas y el ✕ en un cuadrito montado sobre la esquina de arriba a la derecha de la tarjeta (fuera de la foto). En el móvil también hay Cuadrícula / Lista (iconos ▦ ☰). El ✕ de un artículo pide confirmación antes de quitarlo. "Añadir artículo" busca en el catálogo con sugerencias (cantidad y talla si es ropa) o crea uno nuevo (nombre en español e inglés, etiquetas, si es ropa y su talla).
- **Inventario de una caja** (quien edita): "Hacer inventario" en la caja. Mientras dura, en la línea de arriba pone "Quedan X de Y" en lugar del recuento y "Caja revisada"; debajo, la leyenda "Haz click para marcarlo como revisado o pulsa Caja revisada si la caja está correcta". Tocar un artículo fuera de la foto, los − +, el comentario y el ✕ lo marca: baja a "Revisados (n)" al final; tocarlo otra vez lo desmarca. Si no tiene foto, al marcarlo sale "Falta foto · cámara · Saltar". Es compartido: lo marcado se guarda en la base de datos al momento, cualquiera que abra la caja (en cualquier aparato) la ve en inventario con lo mismo marcado, la pantalla se actualiza sola cada 5 segundos (solo con la pantalla a la vista), en "Revisados" sale quién marcó cada artículo ("✓ Ana") y arriba "Ana también está revisando esta caja" mientras otra persona la tiene abierta en inventario. Si dos tocan el mismo artículo, vale el último toque. Con un inventario abierto que incluye la caja y aún no la tiene revisada, la caja entra sola en modo inventario. "Caja revisada" termina para todos (sin preguntar si hay alguien dentro); si quedan artículos sin marcar pregunta "Quedan N sin comprobar" con "Están bien" (los da por buenos), "Quitarlos" y "Volver". Al terminar se apunta la revisión (quién y cuándo, también en el historial) y sale "Caja revisada. Gracias."; si hay un inventario abierto con más cajas, "Siguiente caja sin revisar".
- **Inventario** (pantalla y enlace solo para administración; el enlace va junto a Historial y Cajas en la barra del ordenador y en el Menú del móvil): sin inventario abierto, "Abrir inventario" con tres formas (General: todas las cajas · Por tipo de caja, con casillas y cuántas cajas tiene cada tipo · Cajas individuales, con casillas) y "Abrir"; debajo, "Inventarios anteriores", y cada uno abre su resumen (revisadas con quién y cuándo, y las que quedaron sin revisar). Solo uno abierto a la vez. Con uno abierto: qué es y quién lo abrió, "32 de 171 revisadas", las revisadas con quién y cuándo (cada una lleva a su caja) y "Cerrar inventario", que pregunta cuántas quedan sin revisar y lleva al resumen. Mientras está abierto, sus cajas entran solas en modo inventario; al cerrarlo dejan de estarlo. Una caja creada con un inventario abierto no entra en él. Abrir y cerrar no se apuntan en el Historial.
- **Borrar una caja** (edición y administración): con el ✕ de la caja o el de su fila en Cajas, tras "¿Borrar la caja … y todo lo que tiene?". Desaparece de Cajas, del inicio y de las búsquedas; en el Historial queda "Caja borrada" con "Recuperar" durante 30 días (la devuelve con todo lo que tenía); pasados los 30 días se borra del todo. No se puede crear otra caja con el mismo código mientras se pueda recuperar.
- **Fotos**: una por artículo. Al editar una caja, cada artículo tiene un botón con icono de cámara: abre la cámara (o la galería), la app reduce la foto (lado máximo 1200 px, JPEG) y la sube a Cloudflare R2. Al tocar una foto se ve en grande. Miniatura en la tabla del inicio, y foto en la ficha y en la caja.
- **Llenado de la caja**: junto al título de cada caja, un selector que muestra lo marcado (Vacía · A medias · Llena); se guarda al elegir y queda en el historial. Las cajas sin marcar se marcaron como "Llena" (2026-11-15) y una caja sin valor sale como "Llena". Quien solo consulta ve la palabra. Sale también en las sugerencias del buscador ("P14 latex weapons · a medias").
- **Cajas** (barra de arriba y Menú del móvil, junto a Historial): todas las cajas en una lista por código; cada una lleva a la caja. Quien edita tiene en cada fila el selector de llenado y el ✕ para borrar la caja; quien solo consulta ve el llenado como texto. En gris, "Revisada el 15 nov" si la caja se ha revisado alguna vez (lo ve todo el mundo).
- **Crear caja** (desde el inicio, quien edita): tipo de caja, número propuesto (el siguiente libre) y nombre opcional.
- **Historial** (lo ve todo el mundo): cada cambio queda apuntado con quién, cuándo y qué (cantidades, rotas, comentarios, añadir, quitar, recuperar, artículo nuevo, caja nueva, caja revisada, caja borrada y recuperada, fotos, nombres y sinónimos). Botón "Historial" en el inicio con todos los cambios; "Historial de esta caja" al final de cada caja. El enlace "Historial de este artículo" se quitó. Empieza a contar desde el 2026-11-14.
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

- **Inventario (terminado el 2026-11-16).** Hecho y subido todo: inventario de una caja, compartido, borrar caja, pantalla "Inventario", enlace y "Revisada el …" en Cajas (ver "Lo que hace"). Decidido por ella:
  - Se abre cada caja, se mira qué hay, se añade lo que no está en la app y se quita lo que no está. Tiene que ser rápido y cómodo para quien lo hace.
  - Un inventario empieza y acaba. Puede ser general (todo el almacén) o parcial (por tipo de caja o eligiendo cajas una a una). Solo uno abierto a la vez. Lo abre y lo cierra administración. Se cierra aunque queden cajas sin revisar; el resumen dice cuáles.
  - Inventario suelto de una caja: quien edita puede hacerlo desde la propia caja. Si hay un inventario abierto que incluye esa caja, cuenta para él.
  - Al revisar: "✓ Está" artículo a artículo o "Todo está bien" para la caja entera, y se corrige lo distinto (− +, rotas, "No está", "Añadir artículo"). Si un artículo no tiene foto, la app la pide (se puede saltar).
  - Si falta una caja entera, se puede borrar: con confirmación, a una papelera de 30 días, y queda en el historial. Pueden edición y administración.
  - Junto al título de cada caja: "Revisada el … por …" o "Sin revisar". En Cajas, qué cajas están revisadas.
  - "Inventario" va como enlace propio junto a Historial y Cajas, en la barra del ordenador y en el Menú del móvil.
  - Forma de trabajo: una pantalla cada vez, describirla, hacerla con su sí, enseñarla y seguir.
- **Eventos (aparcado el 2026-11-15, para otro momento).** Todo lo hablado con ella:
  - **Cómo se trabaja hoy (lo contó ella):** para cada evento se hace una lista de recogida y cada cosa va asignada a una zona del evento. La gente recoge y monta las cajas por zona. Al volver, las cosas se suelen guardar en otras cajas para que no lleve tanto rato. A veces se llevan cajas enteras.
  - **Por qué lo pide:** poder quitar del almacén lo que se lleva cuando se carga y volver a meterlo al volver; saber si una caja está llena (hecho: llenado de la caja); y ver qué cajas se han ido enteras a un evento.
  - **Qué va en la lista:** artículos con su cantidad y cajas enteras.
  - **Evento:** solo nombre. Estado activo o antiguo, que se cambia a mano. Se puede borrar (papelera de 30 días, con Recuperar). El nombre se cambia con doble clic, solo desde la lista de eventos.
  - **Zonas:** se escriben en cada evento (no hay una lista fija). Se crean, se renombran y se quitan desde la lista de eventos, al desplegar cada evento.
  - **Entrada:** "Eventos" como enlace junto a Cajas, en la barra del ordenador y en el Menú del móvil. No es un botón en el inicio (se hizo así primero por un malentendido y se corrigió).
  - **Lista de eventos:** filtros Estado (Activos / Antiguos / Todos) y Buscar por nombre; la ve todo el mundo.
  - **Permisos:** administración crea eventos y zonas y marca objetos; edición (y administración) marca lo recogido y lo que vuelve; quien solo consulta, ve.
  - **Marcar objetos para un evento:**
    - Se hace desde el buscador principal (inicio y búsqueda), no en una pantalla aparte.
    - Elegido por ella, viéndolo descrito: forma B, un desplegable "Evento: …" en el inicio y en la búsqueda, solo con eventos activos y solo para administración, que activa una casilla en cada objeto. (La forma A, un botón "Añadir objetos" en el evento con un aviso "Añadiendo a…", quedó descartada.)
    - Al marcar se eligen las unidades con las que entra, y se pueden repartir entre zonas.
    - No se puede marcar más de lo que hay en el almacén.
    - Marcar no toca las cajas: las cosas no salen de las cajas hasta que se recogen, y se puede recoger distinto de lo marcado.
    - Cómo se eligen unidades y zonas al marcar (debajo de la tarjeta o en una ventana): ella quiere verlo antes de decidir.
  - **Hacer muchas cosas a la vez:** poner la misma zona a varias líneas; marcar varias como recogidas; y añadir muchas cosas de golpe de tres formas: con casillas en el inicio y la búsqueda, pegando una lista de texto (las líneas que no se encuentren se le enseñan para que elija; sin IA) o copiando la lista de otro evento.
  - **Ver los objetos por zonas:** cada objeto con cuántos se piden y la caja donde está ahora, para que quien recoge lo encuentre.
  - **Recoger:** al marcar "Recogido", quien recoge pone cuántas coge de cada caja (puede ser distinto de lo marcado y de otra caja), y eso se resta de esas cajas al momento y queda en el historial. Las cajas que se van enteras quedan marcadas "en el evento".
  - **Si quien recoge se equivoca:** corrige el número con − y +; la diferencia vuelve a esa caja o se resta. Lo pueden hacer los mismos que recogen. Con todo a 0, el objeto se puede desmarcar.
  - **Al volver:** de las dos formas: desde la lista del evento, eligiendo para cada cosa la caja donde se guarda (la que sea) y cuántas; y desde cada caja, con "Añadir artículo" como ahora. Lo que falte queda pendiente.
  - **Sin decidir todavía:** si lo añadido desde una caja descuenta de lo pendiente del evento; qué hacer con lo roto o perdido; cuándo se cierra un evento; qué se ve en una caja que se ha ido entera; de qué caja se coge cada cosa al añadir muchas a la vez cuando está en varias.
  - **Hecho y guardado sin subir** (en el ordenador, en git stash "eventos y cambios locales antes de revertir"): la pantalla de lista de eventos con lo anterior (filtros, crear, renombrar, estado, borrar y recuperar, zonas), el enlace "Eventos", sus datos y sus pruebas.
  - **Pendiente de esa pantalla:** ella dijo que los botones están desordenados (falta decidir el orden enseñándole opciones en la app) y no ha visto las filas.
  - **Lo que se hizo mal y se borró:** se construyeron todas las pantallas y las dos formas de marcar sin enseñarle ninguna, con datos de prueba y cambios de tamaño que no pidió; se borró todo.
  - **Forma de trabajo:** una pantalla cada vez; preguntar qué lleva y cómo se usa, describirla, hacerla con su sí, enseñarla en el panel y seguir.
- **Diseño (aparcado el 2026-11-15, para otro momento).**
  - **Guía única:** la guía de diseño tiene tres versiones que se contradicen (la primera con índigo y botones de 48; la versión 3 en negro; lo de la web). Hay que dejar una sola guía completa, que describa la web aprobada sin inventar nada: colores, letra, espacios y estructura, cada componente con sus estados, qué lleva cada pantalla, textos y lo que no se hace. Ella la lee antes de que entre en PROYECTO.md.
  - **Medidas:** ya se midió la web aprobada en ordenador y móvil (tamaños de letra y altos de cada elemento por pantalla); en el ordenador se midieron también colores, espacios y componentes. Falta el móvil completo.
  - **Lo que salió mal hoy:** se intentó igualar todas las pantallas al inicio con reglas que afectaban a varias pantallas a la vez; se miraron solo números y se subió; la caja quedó descuadrada al editar y se deshizo. Hay diferencias de tamaño entre pantallas (el comentario de la caja más pequeño, los formularios más altos…) que se quedan como están mientras ella no pida cambiarlas.
  - **Prueba de diseño:** se probó una prueba automática con un navegador de verdad (Playwright) que mide tamaños; se quitó con la vuelta atrás. Si se recupera, tiene que comprobar también que nada se descuadra, no solo los tamaños.
  - **Base de datos del ordenador:** se dañó con un corte; la dañada está apartada en la carpeta .pglite-danada y la actual es una copia de la web, más el usuario "prueba" vuelto a crear.
- **Listas de recogida para eventos**: plan aprobado el 2026-11-15, por partes. Hecha la parte 1 (llenado de la caja). Faltan: 2 eventos y lista con zonas, 3 añadir muchas cosas a la vez, 4 cargar (resta de las cajas), 5 volver. Cada parte se pregunta antes de hacerla.
- **Desarrollos posteriores**: permisos finos.
- **Datos definitivos**: cargarlos cuando termine la reorganización del almacén. La carga une la ropa por tallas y reutiliza los nombres ya revisados.
- **9 artículos sin traducir**: no se sabe qué son; tienen el nombre original en los dos idiomas.
- **Revisión de pantallas**: terminada el 2026-11-14 (inicio, búsqueda, caja, historial, Crear caja, Personas, Entrar, Recuperar y ficha del artículo).
- **Sinónimos**: la lista no tiene las palabras en inglés; se hizo mal. Aparcado por decisión suya.

## Pruebas automáticas

- 52 pruebas en la carpeta "pruebas", como las de punteo-trimestral. Usan una base de datos de prueba vacía que se crea y se borra sola, con datos inventados: no tocan ni la base del ordenador ni la de la web.
- **De lo que hace la app (29):** buscar (español, inglés, etiqueta, tallas, código de caja, sugerencias, erratas, lo quitado no cuenta); editar una caja (cantidad, rotas, comentario, quitar y recuperar, añadir, artículo nuevo, llenado, historial); cajas (número siguiente, sin repetir, orden de "Cajas"); nombres y sinónimos; usuarios (entrar, enlace de un solo uso, sesión manipulada) y permisos (consulta no edita, Personas solo administración).
- **De pantalla (23):** inicio y búsqueda (tarjetas, Lista, filtros, inglés), caja (sin usuario no hay botones; +, Quitar con confirmación, error vuelve al valor de antes), llenado, ficha (tallas), historial, menú del móvil y buscador.
- **No cubren** cómo se pintan las pantallas que leen directamente de la base de datos ("Cajas", Personas y la página de la caja entera); lo que hay detrás sí está probado.

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
- Revisión de toda la web con la versión 3: Personas, Crear caja, Entrar, Recuperar e invitación con la barra de arriba en el ordenador; contenido a la izquierda en todas las pantallas; en el historial el código de la caja va en la misma línea del cambio; tarjetas sin doble marco; "Almacén" del móvil del mismo tamaño que el resto; el nombre de las personas sin negrita.
- Caja rehecha tras varias versiones descartadas: información a la vista sin pulsar nada, cantidad y rotas con − número + (elegida entre casilla, − + y las dos), comentario en una casilla siempre visible sin botón Guardar, cámara en la esquina de la foto, Cuadrícula / Lista como en el inicio con la Lista en dos columnas, y todo alineado a la línea de arriba de la foto. El estado "Bueno" / "8 buenas · 2 rotas" ya no sale aparte: lo da la columna Rotas.
- Subido: revisión de pantallas y caja nueva.
- Historial, Crear caja, Personas, Entrar y Recuperar: aprobadas tal como quedaron. En Entrar, en el ordenador, no salen "‹ Inicio" ni el título porque ya están en la barra.
- Ficha del artículo: elegida la opción de cajas en tarjetas (entre cabecera con tabla y dos columnas), con las cajas también listadas junto al total.
- Subido: ficha del artículo nueva.
- Error de Claude: lo aprobado se aplicó solo al ordenador sin preguntar, cuando ella había dicho que no se dejara el móvil como estaba. Corregido: inicio y búsqueda en el móvil con el mismo diseño (tarjetas y Cuadrícula / Lista), y la caja de quien no ha entrado con el diseño nuevo, solo para ver.
- Subido: el móvil con el diseño aprobado.
- Móvil: los filtros y botones ocupaban media pantalla y el menú estaba repartido. Elegida la versión 1: "Almacén" y "Menú" arriba, buscador, y "Filtros" con Cuadrícula / Lista en una fila. Las opciones se enseñaron con enlaces separados, sin franjas amarillas, que ensuciaban la comparación.
- Subido: cabecera y filtros del móvil.
- Recuperar contraseña: si el correo no se puede enviar, ahora lo dice ("No se ha podido enviar el correo…") en vez de "No hay conexión". Borrados los 2 archivos de prueba de la carpeta "prueba/" de Cloudflare. Quitados de pendientes, por decisión suya, "Unidades en la caja" y la ficha en el móvil. Comprobado por ella: guardar sinónimos funciona.
- Listas de recogida para eventos (decidido por ella): en la lista van artículos con cantidad y caja, y cajas enteras; las zonas del evento se escriben en cada evento; el evento solo lleva nombre; al marcar cargado se resta de la caja y las cajas enteras quedan "en el evento"; de golpe: poner zona a varias líneas, marcar varias como cargadas y añadir muchas cosas (casillas en inicio y búsqueda, pegar texto, copiar de otro evento); al volver, desde la lista eligiendo caja o desde cada caja; administración crea listas y zonas, edición carga y devuelve.
- Llenado de la caja: tres valores puestos a mano (vacía, a medias, llena); sin elegir no se ve nada; se ve en la caja y en las sugerencias; pantalla "Cajas" con todas por código, sin grupos. Los tres botones grandes ocupaban mucho: se enseñaron 6 versiones (A–F) en la app y eligió la F, pequeños junto al título.
- Subido: llenado de la caja, pantalla "Cajas" y mensaje de error de Recuperar contraseña.
- Pruebas automáticas, a petición suya antes de seguir con los eventos ("en otra aplicación tenemos pruebas para asegurar que no rompemos nada"). Eligió todos los bloques y también pruebas de pantalla; se lanzan antes de cada subida. Se instalaron vitest, happy-dom y @testing-library/react con su permiso.
- Subido: las pruebas automáticas.
- Deshecha la subida "tamaños iguales al inicio y prueba de diseño" (447811f): la caja quedó descuadrada al editar, porque se cambiaron los tamaños mirando solo los números sin revisar cómo quedaba. Por decisión suya, la web vuelve a la versión anterior.
- Subido: vuelta a la versión anterior.
- Eventos y diseño aparcados para otro momento, con todo lo hablado apuntado en "Qué falta" (ella lo ha revisado: "Está todo"). Quitada de la regla de trabajo la línea "No se comprueba todo en cada cambio pequeño", que ella no había aprobado.
- Subido: apuntes de eventos y diseño.
- Inventario de una caja, tras muchas versiones: se marca tocando el artículo (no hay casilla); lo marcado baja a "Revisados"; "Todo está bien" se juntó en "Caja revisada", que pregunta por lo que quede sin marcar ("Están bien", "Quitarlos", "Volver"); quitar es un ✕. Parte de arriba de la caja en una línea (opción 2 de tres), sin leyenda salvo en el inventario. Llenado con selector; las cajas sin marcar, "Llena". "Añadir artículo" arriba, con el estilo de los demás botones; fuera "Añadir comentario" de las casillas.
- Lista de la caja con el formato de la Lista del inicio, con − + en Total y Rotas, sin la columna Cajas, con Comentario y ✕, en dos columnas en el ordenador. El ✕ de la Cuadrícula, elegido entre 7 sitios: la F, en la esquina de la tarjeta.
- Borrar caja: desde la caja y desde Cajas; se recupera desde el Historial durante 30 días (eligió el Historial en vez de una papelera de cajas).
- Error de Claude: estuvo horas haciendo cambios del inventario sin poder verlos (el panel no tenía sesión) y sin decirlo como lo principal. Con su permiso se creó una cuenta de prueba solo en la base local para revisar las pantallas.
- Subido: inventario de una caja, borrar caja, Lista de la caja nueva, ✕ en lugar de "Quitar", llenado con selector y cajas sin marcar como llenas (también en la web).
- Inventario compartido (decidido por ella): con un inventario abierto la caja entra sola en modo inventario; lo marcado se guarda en la base de datos para que varias personas trabajen a la vez ("no es aceptable" que se quede en el navegador); se actualiza cada 5 segundos (le pareció bien; con el plan gratis de Neon, 100 horas de cómputo al mes, un día de inventario gasta unas 2); se ve quién marcó cada artículo y "Ana también está revisando esta caja"; al pulsar "Caja revisada" no se pregunta si hay alguien dentro.
- Normas de trabajo: por decisión suya, solo las 7 de `CLAUDE.md` (esta carpeta); se quitaron las de este documento y las de la memoria de Claude.
- Subido: inventario compartido y `CLAUDE.md`.
- Pantalla "Inventario" (decidido por ella): solo administración; sin inventario abierto, el botón para abrir y los anteriores; abrir general, por tipo (con casillas) o cajas individuales (con casillas); con uno abierto, "32 de 171 revisadas" y las revisadas con quién y cuándo (sin lista de las que faltan); al cerrar, nada más que las que quedaron sin revisar. En Cajas, "Revisada el …" en cada caja revisada.
- Subido: pantalla "Inventario", enlace "Inventario" y "Revisada el …" en Cajas. Con esto el inventario queda terminado.
