# US-03 — Summary and payment

| Campo | Valor |
|---|---|
| Estado | Approved (2026-11-22, G2) |
| Versión | 0.2 |
| Autor | Requirements Analyst (subagente) |
| Aprobador | Humano (G2) |
| ADRs relacionados | Pendientes (G3): estrategia multipaís (D3), persistencia en `sessionStorage` (D6), pasarela de pago simulada (D9), regla de precio (D8), modelo de contenido (`docs/architecture/content-model.md`, aún no existe) |
| Decisiones relacionadas | D3, D4, D6, D7, D8, D9, D10 · G2-1, G2-2, G2-5, G2-6, G2-8, G2-9, G2-10, G2-11, G2-12, G2-13 |
| Specs relacionadas | `specs/US-01/spec.md` y `specs/US-02/spec.md` (dependencias en la sección 6.3) |
| Revisión relacionada | `reviews/000-G2-specs-cross-consistency.md` (F-00.1, F-00.3, F-00.4, F-00.5) |

> **Cómo leer esta spec.** Todas las `Q` quedaron resueltas en G2 (`docs/decision-log.md`, sección "G2"). Un `REQ` con origen `Q-03.n → G2-n` deriva de la respuesta aprobada en esa decisión. Los nombres de content types, campos, rutas y claves de almacenamiento que aparecen aquí son descriptivos; los nombres reales los fija el Software Architect en G3.

## 1. Historia (literal del PDF)

> As a person who chose a plan, I want to review a summary of my quote and pay, so that I become insured.

**Contexto (literal):** Before paying, the person must confirm their data and accept the terms and conditions, whose text varies by country and is managed by the business team from Strapi. Payment is simulated for this test.

**Reglas de negocio (literales):**

1. The summary shows the policyholder's data, the vehicle's data and the chosen plan with its final price.
2. The document number is shown partially masked.
3. From the summary the person can go back to edit their data or change the plan.
4. The pay button is enabled only after accepting the terms and conditions.
5. The payment cannot be submitted twice.
6. On successful payment, a confirmation with a simulated quote number is shown.

**Reglas de alcance del PDF que aplican (literales):**

- "Payment is simulated: a button that leads to a confirmation screen or a mock gateway. Do not integrate real payment gateways or use real card data."
- "Use fictitious data only."
- "Use a front-end strategy to persist the data; a database is not required."
- Accessibility: "The wizard can be completed using only the keyboard, and fields have accessible labels".
- Responsive: "Works on mobile and desktop".

## 2. Alcance

- **Incluido:**
  - Paso 3 del wizard (resumen): datos del asegurado y del vehículo, plan elegido y precio final, documento enmascarado.
  - Términos y condiciones por país desde Strapi y casilla de aceptación.
  - Acciones "editar datos" (paso 1) y "cambiar plan" (paso 2) desde el resumen.
  - Pasarela de pago simulada dentro del paso 3, con resultado elegido (aprobado/rechazado) y sin campos de tarjeta (D9, G2-12).
  - Pantalla de confirmación con número de cotización simulado (D7: 3 pasos + confirmación).
  - Protección contra doble envío, mensaje de rechazo y reintento.
  - Estados de carga, vacío y error de las llamadas que necesita el resumen; accesibilidad y responsive del paso 3 y de la confirmación.
  - Comportamiento de los datos persistidos (D6) al entrar al resumen, tras un rechazo y tras un pago exitoso.
- **Fuera de alcance:**
  - Pasarelas reales, datos de tarjeta o bancarios (PDF, D9).
  - Registrar la cotización o el pago en Strapi o en cualquier backend: el rol público solo lee y el proxy solo deja pasar `GET` (D4).
  - Emisión real de póliza, envío de correos, descarga de PDF.
  - Definición de la regla de precio (US-02, D8, G2-8): US-03 la **consume**.
  - Validaciones del formulario del paso 1 (US-01): US-03 usa el indicador `isComplete` que expone US-01 (G2-10).

## 3. Requisitos

Columna **Config**: `Strapi` = lo cambia el negocio sin despliegue; `Código` = fijo en el frontend; `Strapi + Código` = el contenido viene de Strapi y la lógica o el formato están en código.

### 3.1 Resumen de datos y plan

| ID | Requisito verificable | Origen | Config | Verificación |
|---|---|---|---|---|
| REQ-03.1 | El resumen muestra todos los datos del paso 1 (asegurado y vehículo) del país de la URL, tomados del resultado del paso 1 que expone US-01 (REQ-01.27) a partir del estado persistido para ese país. | PDF regla 1; AC del PDF "Complete summary"; D6 | Strapi + Código (qué campos hay: Strapi; lectura del estado: código) | Unit · E2E |
| REQ-03.2 | Cada dato se muestra con el **label** configurado en Strapi para su campo (nunca la clave técnica), agrupado en las secciones `policyholder` y `vehicle` en ese orden fijo, con la leyenda de cada sección desde Strapi, y dentro de cada sección en el orden configurado. | PDF regla 1; Q-03.3 → G2-6 | Strapi (label, sección del campo, leyenda, orden) + Código (catálogo y orden de secciones) | Unit |
| REQ-03.3 | Los valores se muestran legibles según su tipo: `select` muestra el label de la opción (el valor visible de REQ-01.27, no el valor interno); `checkbox` muestra el texto de sí/no configurado; `date` se muestra con el formato del locale del país sin desplazar el día por zona horaria; `number` con el formato numérico del locale; un campo opcional vacío se muestra como "—". | Q-03.4 → G2-13 | Strapi + Código (labels y textos: Strapi; formateo `Intl`: código) | Unit |
| REQ-03.4 | El resumen muestra el plan elegido con su nombre, descripción corta, coberturas, beneficios y **precio final** en la moneda y el formato del país (COP y CLP sin decimales), sin desglose entre precio base y ajuste. | PDF regla 1; US-02 regla "price in the country's currency"; Q-03.5 → G2-13 | Strapi + Código (plan, moneda y locale: Strapi; formato `Intl`: código) | Unit · E2E |
| REQ-03.5 | El precio final del resumen se recalcula al cargar el resumen a partir del **id del plan guardado** (único dato del plan que se persiste), con la **misma función pura** que usa el paso 2 (D8, G2-8: `Math.round(basePrice × Π multiplicadores)`), los datos del paso 1 y el plan y los factores vigentes en Strapi. Para los mismos datos y la misma configuración, paso 2 y resumen muestran el mismo valor. | D8; PDF regla 1; Q-03.6 → G2-9; G2-8 | Strapi + Código (factores: Strapi; función: código) | Unit |

### 3.2 Documento enmascarado

| ID | Requisito verificable | Origen | Config | Verificación |
|---|---|---|---|---|
| REQ-03.6 | Los campos con **rol `documentNumber`** (rol asignado en Strapi según el catálogo de US-01, REQ-01.28) se muestran parcialmente enmascarados en el resumen y en cualquier pantalla posterior. Si varios campos tienen ese rol, se enmascaran todos. El tipo de documento (campo distinto, sin ese rol) se muestra en claro. El valor completo no aparece en el DOM de esas pantallas (ni en texto, ni en atributos, ni en nombres accesibles). Si no hay ningún campo con ese rol, el formulario de US-01 ya está "no disponible" (G2-5) y no se llega al resumen. | PDF regla 2; Q-03.1 → G2-1; G2-5; F-00.1 | Strapi + Código (rol del campo: Strapi; catálogo de roles y enmascarado: código) | Unit · E2E |
| REQ-03.7 | El enmascarado lo hace una función pura con esta regla: se cuentan solo los caracteres alfanuméricos; quedan visibles los últimos `min(4, floor(n/2))`; el resto de alfanuméricos se sustituye por `*`; los separadores (`.`, `-`, espacio) se conservan. Misma regla en CO y CL. | Q-03.2 → G2-13 | Código | Unit |
| REQ-03.8 | El enmascarado es solo de presentación: el estado del wizard conserva el valor completo para que "editar datos" lo muestre completo en el paso 1. | PDF regla 3; AC del PDF de US-01 "Keep data when going back"; Q-03.23 → G2-13 | Código | Unit · E2E |

### 3.3 Volver a editar, cambiar de plan y guardas

| ID | Requisito verificable | Origen | Config | Verificación |
|---|---|---|---|---|
| REQ-03.9 | Desde el resumen hay una acción "editar datos" que lleva al paso 1 del mismo país con todos los datos precargados. | PDF regla 3 | Código (navegación); Strapi (texto) | E2E |
| REQ-03.10 | Desde el resumen hay una acción "cambiar plan" que lleva al paso 2 con el plan actual marcado como elegido. | PDF regla 3; AC del PDF de US-02 "Plan selection" | Código (navegación); Strapi (texto) | E2E |
| REQ-03.11 | Al volver al resumen tras editar datos o cambiar de plan, el resumen muestra los valores nuevos y el precio final recalculado. Editar datos conserva el plan elegido si sigue disponible. Desde el paso 1 editado se continúa por el paso 2 (con el plan preseleccionado) antes de volver al resumen. | PDF reglas 1 y 3; Q-03.9 → G2-13 | Código | Unit · E2E |
| REQ-03.12 | La aceptación de términos **no se persiste**: la casilla empieza desmarcada cada vez que se entra al resumen (incluidas la recarga y la vuelta desde el paso 1 o 2). Se conserva marcada tras un pago rechazado mientras se permanece en el resumen. | Q-03.9 → G2-13; Q-03.21 → G2-13 | Código | Unit · E2E |
| REQ-03.13 | Guardas de acceso al resumen (al entrar por navegación, por URL directa o al recargar): si el `isComplete` del paso 1 que expone US-01 (REQ-01.27), **calculado con la configuración vigente**, es falso, la app redirige al paso 1 del mismo país con los datos conservados; si es verdadero pero no hay plan guardado, redirige al paso 2. No se persiste ninguna señal de "paso completado". | Q-03.8 → G2-10; Q-03.7 → G2-10; F-00.5 | Código | Unit · E2E |
| REQ-03.14 | Al cargar el resumen se comprueba el plan guardado contra la lista vigente de Strapi: si ya no está publicado y activo, o su moneda no es la del país, la app redirige al paso 2, donde la selección se descarta y se muestra el aviso anunciado de US-02 (REQ-02.17); no es posible pagar ese plan. Los valores persistidos de campos que ya no existen en la configuración no se muestran (US-01 los descarta). No se vuelve a comprobar justo antes de pagar. | analysis.md §1 (datos persistidos vs. plan inactivo); Skill §3; Q-03.7 → G2-11 y G2-13 | Código (comprobación); Strapi (estado de planes y campos) | Unit · E2E |

### 3.4 Términos y condiciones

| ID | Requisito verificable | Origen | Config | Verificación |
|---|---|---|---|---|
| REQ-03.15 | El resumen muestra los términos y condiciones del país de la URL, obtenidos de Strapi. El texto no está en el código: si el negocio lo edita y publica, el cambio se ve al recargar. | PDF contexto; AC del PDF "Terms by country"; D3 | Strapi | Unit · E2E |
| REQ-03.16 | El texto de los términos se presenta sin ejecutar ni insertar HTML o scripts arbitrarios que vengan en el contenido, inline en el resumen, dentro de una región de altura máxima, legible, enfocable y desplazable con teclado. No se obliga a desplazarse hasta el final para aceptar. El formato del texto (plano, Markdown o rich text) lo decide el Software Architect en G3 y debe admitir párrafos y listas. | CLAUDE.md §6 (seguridad); Q-03.11 → G2-13; Q-03.13 → G2-13 | Código (render); Strapi (texto) | Unit · Manual |
| REQ-03.17 | Hay una casilla de aceptación con `<label>` asociado (texto desde Strapi), desmarcada por defecto. Marcarla es condición para habilitar el pago; desmarcarla vuelve a deshabilitarlo. | PDF regla 4; AC del PDF "Terms by country"; PDF Accessibility | Strapi (texto) + Código | Unit · E2E |
| REQ-03.18 | Si para el país no hay términos publicados, el texto está vacío o llega más de un registro, se muestra un estado "términos no disponibles"; la casilla y el pago quedan deshabilitados; los datos y el plan siguen visibles. | Skill §3 (vacíos/nulos, varios elementos); Q-03.12 → G2-13 | Código (comportamiento); Strapi (texto del aviso) | Unit |
| REQ-03.19 | El botón de pago está habilitado **si y solo si**: los datos y el plan están cargados y son válidos, los términos están cargados y aceptados, y no hay un pago en curso. | PDF reglas 4 y 5; Q-03.7 → G2-10 y G2-11; Q-03.12 → G2-13 | Código | Unit · E2E |

### 3.5 Pago simulado

| ID | Requisito verificable | Origen | Config | Verificación |
|---|---|---|---|---|
| REQ-03.20 | El pago se simula en el navegador: no hay campos de tarjeta ni bancarios y no se hace ninguna petición distinta de `GET` (ni a Strapi ni a terceros). | PDF reglas de alcance; D4; D9 | Código | Unit · E2E |
| REQ-03.21 | El resultado del pago simulado lo elige el usuario en un bloque "pasarela simulada" **dentro del paso 3** (sin pantalla aparte, D7), con dos opciones visibles: aprobado (seleccionada por defecto) y rechazado. No hay parámetros de URL, flags ocultos ni aleatoriedad: el e2e elige la opción como un usuario. | D9; analysis.md §1 (rechazo determinista); Q-03.15 → G2-12 | Código (mecanismo); Strapi (textos, G2-2) | Unit · E2E |
| REQ-03.22 | Al pulsar pagar, el botón queda bloqueado e indica que el pago se procesa durante toda la operación; la casilla de términos, el selector de resultado y las acciones "editar datos" y "cambiar plan" quedan inhabilitados hasta que termina. Si la persona abandona la pantalla durante el proceso, el resultado pendiente se descarta y no se muestra confirmación. | PDF regla 5; AC del PDF "Successful payment"; Q-03.16 → G2-13 | Código | Unit · E2E |
| REQ-03.23 | Cada activación válida produce **un único** intento de pago aunque haya doble clic, Enter mantenido o combinación de Enter y clic. La protección está en el estado de la aplicación, no solo en el atributo `disabled`. Limitación aceptada y documentada en el README: sin backend (D4) no se impide pagar en una pestaña duplicada. | PDF regla 5; Q-03.17 → G2-13 | Código | Unit · E2E |
| REQ-03.24 | La duración simulada del procesamiento es fija (1500 ms), está definida en código y es inyectable en los tests. | Q-03.16 → G2-13 | Código | Unit |
| REQ-03.25 | Con resultado aprobado, la app navega a la pantalla de confirmación (D7) que muestra el número de cotización simulado. | PDF regla 6; AC del PDF "Successful payment"; D7 | Código; Strapi (textos) | E2E |
| REQ-03.26 | El número de cotización tiene el formato `<CC>-<YYYYMMDD>-<XXXXXX>`: código de país en mayúsculas, fecha UTC del pago y 6 caracteres del alfabeto `A-H J-N P-Z 2-9` (sin `0`, `O`, `1`, `I`), generados con una fuente aleatoria criptográfica del navegador. Unicidad solo probabilística (no hay registro central, D4). El reloj y la fuente aleatoria son inyectables en los tests. | Q-03.18 → G2-13 | Código | Unit |
| REQ-03.27 | La confirmación muestra el número de cotización, el nombre del plan y el precio final pagado (copiados en el momento del pago), sin datos personales ni documento, y ofrece una acción "nueva cotización" que lleva al paso 1 vacío del mismo país. | Q-03.20 → G2-13 | Strapi (textos) + Código | E2E |
| REQ-03.28 | Tras un pago exitoso se borra el estado del wizard del país en `sessionStorage` y solo se guarda una confirmación mínima (número, nombre del plan, precio final, moneda, fecha; **sin documento ni datos personales**). Recargar la confirmación la vuelve a mostrar. Volver atrás con el navegador no permite pagar de nuevo esa cotización: el resumen redirige al paso 1 vacío. "Nueva cotización" borra también la confirmación guardada. | PDF regla 5; D6; Q-03.19 → G2-13 | Código | Unit · E2E |
| REQ-03.29 | Si se accede a la confirmación sin un pago exitoso en la sesión de ese país, la app redirige al paso 1. | Q-03.19 → G2-13 | Código | Unit |
| REQ-03.30 | Con resultado rechazado, se muestra un mensaje de error claro (texto de Strapi, sin detalles técnicos) junto al botón de pago; el usuario permanece en el resumen con sus datos, el plan, el precio y la aceptación de términos intactos; el botón se rehabilita para reintentar; el mensaje se retira al iniciar un nuevo intento; no hay límite de reintentos. | AC del PDF "Rejected payment"; Q-03.21 → G2-13 | Strapi (mensaje) + Código | Unit · E2E |

### 3.6 Carga, error, país, textos, accesibilidad y responsive

| ID | Requisito verificable | Origen | Config | Verificación |
|---|---|---|---|---|
| REQ-03.31 | Mientras se cargan los datos que necesita el resumen (configuración del formulario, planes y factores de precio, términos, textos de UI), se muestra el indicador "cargando" en la sección afectada y el pago está deshabilitado. | CLAUDE.md §8 (estados explícitos); PDF criterio "loading and error state handling"; G2-2 | Código (texto fijo "cargando", G2-2) | Unit |
| REQ-03.32 | Si una de esas llamadas falla, se muestra el mensaje "error de carga" en la sección afectada con la acción "reintentar"; el pago queda deshabilitado y los datos persistidos no se pierden. | CLAUDE.md §8; PDF criterio "loading and error state handling"; Q-03.14 → G2-2 | Código (textos fijos "error de carga" y "reintentar", G2-2) | Unit · Manual |
| REQ-03.33 | Al entrar al resumen y a la confirmación, el foco se mueve al encabezado principal de la pantalla. | CLAUDE.md §8 (foco al cambiar de paso) | Código | Unit · E2E |
| REQ-03.34 | El paso 3 y la confirmación se completan solo con teclado, con un orden de foco lógico: Tab/Shift+Tab entre controles, Espacio en la casilla, flechas en el selector de resultado, Enter o Espacio en los botones; la región de términos es enfocable y desplazable con teclado. | PDF Accessibility | Código | E2E · Manual (G5) |
| REQ-03.35 | Anuncios y foco del pago: el estado "procesando" se anuncia en una región `aria-live="polite"`; el rechazo se anuncia como alerta (`role="alert"`); el foco no se pierde (no pasa a `body`) al bloquear el botón (la técnica la decide el Angular Developer); el botón deshabilitado está asociado por `aria-describedby` al texto que explica que hay que aceptar los términos. El documento enmascarado se lee tal cual, sin texto accesible alternativo. | PDF Accessibility; CLAUDE.md §8; Q-03.22 → G2-13 | Código; Strapi (textos) | Unit · Manual (G5) |
| REQ-03.36 | Resumen, pago y confirmación funcionan de 320 px a escritorio sin desplazamiento horizontal de la página; en móvil el resumen va en una columna; los controles interactivos tienen un área de al menos 24×24 px CSS. | PDF Responsive; Q-03.24 → G2-13 | Código | E2E (viewport) · Manual (G5) |
| REQ-03.37 | El resumen y la confirmación solo leen y escriben el estado del país de la URL: los datos, el plan y la confirmación de un país no aparecen en el otro. | D3; D6 | Código | Unit · E2E |
| REQ-03.38 | Los textos visibles del paso 3 y de la confirmación (acciones, label de la casilla, sí/no, leyendas de sección, avisos, opciones y título de la pasarela simulada, mensaje de rechazo, títulos y el **mensaje de error genérico del país**) proceden de Strapi por país. Los únicos textos fijos en código, en español, son "cargando", "error de carga", "reintentar" y "país no disponible". Si falta en Strapi un texto obligatorio de una sección, se trata como error de configuración: esa sección muestra el mensaje de error genérico del país (configurado en Strapi, como en US-01 REQ-01.13) y el pago queda deshabilitado. Si falta también ese mensaje genérico, la sección muestra los textos fijos "error de carga" y "reintentar". No hay otros textos por defecto en código. Un fallo de red o de contrato sigue el REQ-03.32. | CLAUDE.md §11 (excepción G2-2); Q-03.14 → G2-2; F-00.3; F-00.4; F-00.7; US-01 REQ-01.13 | Strapi (textos, incluido el mensaje genérico); Código (solo los 4 textos fijos) | Unit |

### 3.7 Cobertura del PDF

| Elemento del PDF | REQ | AC |
|---|---|---|
| Regla 1 (datos, vehículo, plan, precio final) | REQ-03.1 a REQ-03.5 | AC-03.1, AC-03.8, AC-03.9 |
| Regla 2 (documento enmascarado) | REQ-03.6, REQ-03.7, REQ-03.8 | AC-03.5, AC-03.6, AC-03.7 |
| Regla 3 (editar datos, cambiar plan) | REQ-03.9, REQ-03.10, REQ-03.11 | AC-03.10, AC-03.11 |
| Regla 4 (pagar solo tras aceptar términos) | REQ-03.17, REQ-03.19 | AC-03.2, AC-03.12 |
| Regla 5 (sin doble envío) | REQ-03.22, REQ-03.23, REQ-03.28 | AC-03.3, AC-03.22, AC-03.29 |
| Regla 6 (confirmación con número simulado) | REQ-03.25, REQ-03.26 | AC-03.3, AC-03.27 |
| Contexto: confirmar datos | Q-03.10 → G2-13 (revisar el resumen y pagar es la confirmación) | AC-03.1 |
| Contexto: términos por país desde Strapi | REQ-03.15 | AC-03.2, AC-03.15 |
| Contexto y alcance: pago simulado, sin tarjetas | REQ-03.20, REQ-03.21 | AC-03.24, AC-03.25 |
| Escenario "Complete summary" | REQ-03.1, REQ-03.4 | AC-03.1 |
| Escenario "Terms by country" | REQ-03.15, REQ-03.17 | AC-03.2 |
| Escenario "Successful payment" | REQ-03.22, REQ-03.25 | AC-03.3 |
| Escenario "Rejected payment" | REQ-03.30 | AC-03.4 |
| Accessibility / Responsive | REQ-03.33 a REQ-03.36 | AC-03.33, AC-03.34, AC-03.35 |

## 4. Criterios de aceptación

### Escenarios del PDF (literales)

```gherkin
# AC-03.1 — origen: PDF
Scenario: Complete summary
  Given I chose a plan
  When I reach the summary
  Then I see my data, my vehicle's data and the chosen plan with its final price

# AC-03.2 — origen: PDF
Scenario: Terms by country
  Given I am on the summary
  When I view the terms and conditions
  Then the text matches the one configured in Strapi for my country
  And the pay button is disabled until I accept them

# AC-03.3 — origen: PDF
Scenario: Successful payment
  Given I accepted the terms
  When I click pay
  Then the button is locked while the payment is processed
  And I see the confirmation with the quote number

# AC-03.4 — origen: PDF
Scenario: Rejected payment
  Given the simulated payment fails
  When I click pay
  Then I see a clear error message
  And I can try again without losing my information
```

### Escenarios añadidos por la spec

Los nombres de campos y rutas son descriptivos; los reales los fija G3.

```gherkin
# AC-03.5 — origen: PDF regla 2, Q-03.1 → G2-1, Q-03.2 → G2-13
Scenario: Documento colombiano parcialmente enmascarado
  Given estoy en /co y el campo con rol "documentNumber" vale "1234567890"
  When llego al resumen
  Then veo el documento como "******7890"
  And el tipo de documento elegido se muestra en claro
  And el texto "1234567890" no aparece en el DOM del resumen

# AC-03.6 — origen: PDF regla 2, Q-03.1 → G2-1, Q-03.2 → G2-13
Scenario: RUT chileno enmascarado conservando separadores
  Given estoy en /cl y el campo con rol "documentNumber" vale "12.345.678-5"
  When llego al resumen
  Then veo el documento como "**.***.678-5"
  And el texto "12.345.678-5" no aparece en el DOM del resumen

# AC-03.7 — origen: Q-03.2 → G2-13 (test unitario de la función pura)
Scenario Outline: Regla de enmascarado
  Given el valor del documento es "<valor>"
  When se aplica la función de enmascarado
  Then el resultado es "<resultado>"

  Examples:
    | valor        | resultado    |
    | 1234567890   | ******7890   |
    | 12.345.678-5 | **.***.678-5 |
    | E-123456     | *-***456     |
    | 12345        | ***45        |
    | 1234         | **34         |
    | 7            | *            |

# AC-03.8 — origen: PDF regla 1, Q-03.3 → G2-6, Q-03.4 → G2-13
Scenario: Datos legibles con labels de Strapi
  Given en Strapi hay un campo select con una opción de valor "mazda" y label "Mazda" que elegí en el paso 1
  And marqué un campo checkbox
  And un campo de fecha vale "1990-05-07"
  And un campo opcional quedó vacío
  When llego al resumen
  Then veo primero la sección "policyholder" y después la sección "vehicle", cada una con su leyenda configurada en Strapi
  And cada dato aparece con el label configurado en Strapi, en su sección y en el orden configurado
  And el select muestra "Mazda" y no "mazda"
  And el checkbox muestra el texto de "sí" configurado en Strapi para mi país
  And la fecha muestra el día 7 de mayo de 1990 con el formato del locale de mi país
  And el campo opcional vacío muestra "—"

# AC-03.9 — origen: D8, Q-03.6 → G2-9, G2-8
Scenario: Precio final recalculado desde el id del plan guardado
  Given en el paso 2 elegí un plan cuyo precio final mostrado fue P
  And en sessionStorage solo está guardado el id de ese plan, sin precio
  When llego al resumen sin que cambien mis datos ni la configuración
  Then el resumen muestra el precio final P en la moneda y el formato de mi país
  When vuelvo al paso 1, cambio un dato que usa la regla de precio y regreso al resumen
  Then el precio final del resumen es el que calcula la función de precio con el dato nuevo
  And coincide con el que muestra el paso 2 para ese plan

# AC-03.10 — origen: PDF regla 3, Q-03.9 → G2-13
Scenario: Editar datos desde el resumen
  Given estoy en el resumen con los términos aceptados
  When elijo "editar datos"
  Then veo el paso 1 con todos mis datos, incluido el documento completo sin enmascarar
  When cambio un dato y continúo
  Then paso por el paso 2 con mi plan preseleccionado
  When continúo al resumen
  Then el resumen muestra el dato nuevo y el mismo plan
  And la casilla de términos está desmarcada y el botón de pago deshabilitado

# AC-03.11 — origen: PDF regla 3, Q-03.9 → G2-13
Scenario: Cambiar de plan desde el resumen
  Given estoy en el resumen con el plan A elegido
  When elijo "cambiar plan"
  Then veo el paso 2 con el plan A marcado como elegido
  When elijo el plan B y continúo
  Then el resumen muestra el plan B con su precio final
  And mis datos del paso 1 no han cambiado

# AC-03.12 — origen: PDF regla 4
Scenario: Retirar la aceptación de términos
  Given acepté los términos y el botón de pago está habilitado
  When desmarco la casilla
  Then el botón de pago vuelve a estar deshabilitado

# AC-03.13 — origen: Q-03.12 → G2-13 (estado vacío)
Scenario Outline: Términos no disponibles para el país
  Given para mi país <situación>
  When llego al resumen
  Then veo un aviso de que los términos no están disponibles
  And la casilla de aceptación y el botón de pago están deshabilitados
  And mis datos y el plan siguen visibles

  Examples:
    | situación                                  |
    | no hay términos publicados                 |
    | los términos publicados tienen texto vacío |
    | llega más de un registro de términos       |

# AC-03.14 — origen: CLAUDE.md §6, Q-03.11 → G2-13
Scenario: Términos con marcado no seguro
  Given el texto de términos de mi país contiene "<img src=x onerror=alert(1)>"
  When se muestran los términos
  Then no se ejecuta ningún script
  And no se inserta en el DOM ningún elemento que venga del contenido sin sanear

# AC-03.15 — origen: PDF contexto
Scenario: Cambio de términos sin despliegue
  Given el negocio edita y publica en Strapi los términos de Chile
  When recargo el resumen en /cl
  Then veo el texto nuevo sin cambios de código

# AC-03.16 — origen: CLAUDE.md §8 (estado de carga), G2-2
Scenario: Resumen mientras se carga el contenido
  Given las respuestas de Strapi que necesita el resumen todavía no han llegado
  When llego al resumen
  Then veo el indicador "cargando" en cada sección pendiente
  And el botón de pago está deshabilitado

# AC-03.17 — origen: CLAUDE.md §8 (estado de error), Q-03.14 → G2-2
Scenario: Error al cargar los términos y reintento
  Given la petición de términos falla
  When llego al resumen
  Then veo el mensaje "error de carga" en la sección de términos con la acción "reintentar"
  And el botón de pago está deshabilitado
  And mis datos persistidos no se pierden
  When reintento y la petición responde correctamente
  Then veo los términos y puedo aceptarlos

# AC-03.18 — origen: Q-03.8 → G2-10
Scenario Outline: Acceso directo al resumen con el wizard incompleto
  Given en la sesión de /co <estado>
  When abro directamente la URL del resumen de /co
  Then se me lleva a <destino>

  Examples:
    | estado                                                          | destino   |
    | no hay datos del paso 1 (isComplete es falso)                   | el paso 1 |
    | el paso 1 es completo (isComplete verdadero) pero no hay plan guardado | el paso 2 |

# AC-03.19 — origen: analysis.md §1, Q-03.7 → G2-11
Scenario Outline: El plan elegido dejó de estar disponible
  Given elegí un plan y después el negocio <cambio> en Strapi
  When llego al resumen o lo recargo
  Then se me lleva al paso 2 de mi país
  And veo el aviso anunciado de que el plan elegido ya no está disponible
  And ningún plan aparece como elegido

  Examples:
    | cambio                                           |
    | lo desactivó                                     |
    | lo despublicó                                    |
    | le puso una moneda distinta a la de mi país      |

# AC-03.20 — origen: analysis.md §1, Q-03.7 → G2-10, F-00.5
Scenario Outline: Datos persistidos que ya no cumplen la configuración actual
  Given completé el paso 1 y después el negocio <cambio> en Strapi
  When llego al resumen o lo recargo
  Then isComplete, calculado con la configuración vigente, es falso
  And se me lleva al paso 1 con mis datos conservados
  When intento avanzar
  Then el campo afectado muestra su mensaje de error configurado

  Examples:
    | cambio                                                                 |
    | añadió un campo obligatorio nuevo                                      |
    | retiró la opción de un select obligatorio que yo había elegido         |

# AC-03.21 — origen: Q-03.7 → G2-13
Scenario: Campo eliminado de la configuración
  Given completé el paso 1 y después el negocio eliminó o despublicó un campo opcional en Strapi
  When llego al resumen
  Then ese campo no aparece en el resumen
  And el resto de mis datos se muestra normalmente

# AC-03.22 — origen: PDF regla 5, Q-03.17 → G2-13
Scenario Outline: Un único intento de pago ante entradas repetidas
  Given acepté los términos
  When <acción>
  Then la pasarela simulada recibe exactamente un intento de pago

  Examples:
    | acción                                                                      |
    | hago doble clic en el botón de pago                                         |
    | mantengo pulsado Enter con el foco en el botón de pago                      |
    | pulso Enter y hago clic en el botón de pago antes de que termine el proceso |

# AC-03.23 — origen: PDF regla 5, Q-03.16 → G2-13
Scenario: Controles bloqueados durante el procesamiento
  Given pulsé pagar y el pago está en proceso
  Then el botón de pago indica que el pago se está procesando y no acepta nuevas activaciones
  And la casilla de términos, el selector de resultado y las acciones "editar datos" y "cambiar plan" están inhabilitados
  When termina la duración simulada
  Then los controles salen del estado de procesamiento

# AC-03.24 — origen: PDF alcance, D4, D9
Scenario: Pago simulado sin datos de tarjeta ni escrituras
  Given estoy en el resumen
  Then no hay campos de tarjeta ni de datos bancarios
  When completo un pago con resultado aprobado o rechazado
  Then el navegador no ha realizado ninguna petición distinta de GET

# AC-03.25 — origen: D9, Q-03.15 → G2-12
Scenario Outline: Resultado del pago elegido de forma determinista
  Given acepté los términos
  And en el bloque "pasarela simulada" del paso 3 la opción "aprobado" está seleccionada por defecto
  When elijo la opción "<resultado>" y pulso pagar
  Then <efecto>

  Examples:
    | resultado | efecto                                          |
    | aprobado  | veo la confirmación con el número de cotización |
    | rechazado | veo el mensaje de rechazo y sigo en el resumen  |

# AC-03.26 — origen: AC del PDF "Rejected payment", Q-03.21 → G2-13
Scenario: Rechazo y reintento sin perder información
  Given acepté los términos y elegí el resultado "rechazado"
  When pulso pagar
  Then veo junto al botón de pago el mensaje de rechazo configurado en Strapi para mi país
  And el mensaje se anuncia como alerta
  And sigo en el resumen con mis datos, el plan, el precio final y la aceptación de términos intactos
  And el botón de pago vuelve a estar habilitado
  When elijo el resultado "aprobado" y pulso pagar de nuevo
  Then el mensaje de rechazo desaparece al iniciar el intento
  And veo la confirmación con el número de cotización

# AC-03.27 — origen: PDF regla 6, Q-03.18 → G2-13 (test unitario)
Scenario: Formato del número de cotización
  Given el reloj inyectado marca 2026-11-22T10:00:00Z y la fuente aleatoria es fija
  When se genera el número de cotización para Colombia
  Then el número cumple el patrón "^CO-20261122-[A-HJ-NP-Z2-9]{6}$"
  And con la misma fuente aleatoria el resultado es siempre el mismo

# AC-03.28 — origen: Q-03.19 → G2-13
Scenario: Recargar la confirmación
  Given pagué con éxito y veo la confirmación con el número N
  When recargo la página
  Then veo la misma confirmación con el número N
  And el documento no está guardado en sessionStorage

# AC-03.29 — origen: PDF regla 5, Q-03.19 → G2-13
Scenario: Volver atrás tras un pago exitoso no permite pagar de nuevo
  Given pagué con éxito y veo la confirmación
  When uso la acción "atrás" del navegador
  Then no veo un resumen con el botón de pago para esa cotización
  And se me lleva al paso 1 vacío de mi país

# AC-03.30 — origen: Q-03.19 → G2-13
Scenario: Acceso directo a la confirmación sin pago
  Given no he pagado con éxito en la sesión de /cl
  When abro directamente la URL de confirmación de /cl
  Then se me lleva al paso 1 de /cl

# AC-03.31 — origen: Q-03.20 → G2-13
Scenario: Contenido de la confirmación y nueva cotización
  Given pagué con éxito
  Then la confirmación muestra el número de cotización, el nombre del plan y el precio final pagado
  And no muestra datos personales ni el documento
  When elijo "nueva cotización"
  Then veo el paso 1 de mi país vacío

# AC-03.32 — origen: D3, D6
Scenario: Datos y términos separados por país
  Given en /co completé el paso 1 y elegí un plan
  When abro en la misma pestaña la URL del resumen de /cl sin haber completado Chile
  Then se me lleva al paso 1 de /cl sin datos de Colombia
  And cuando llego al resumen de /cl veo los términos de Chile y no los de Colombia

# AC-03.33 — origen: PDF Accessibility
Scenario: Resumen y pago solo con teclado
  Given llegué al resumen usando solo el teclado
  When recorro la pantalla con Tab y Shift+Tab
  Then el foco recorre en orden lógico las acciones de edición, la región de términos, la casilla de aceptación, el selector de resultado y el botón de pago
  And puedo desplazar los términos con el teclado, marcar la casilla con Espacio, elegir el resultado con las flechas y pagar con Enter
  And llego a la confirmación sin usar el ratón

# AC-03.34 — origen: CLAUDE.md §8, Q-03.22 → G2-13
Scenario: Foco y anuncios en el paso 3
  When llego al resumen
  Then el foco está en el encabezado principal del resumen
  And la casilla de términos tiene un nombre accesible igual a su label
  And el botón de pago deshabilitado está asociado por aria-describedby al texto que pide aceptar los términos
  When pulso pagar
  Then el estado "procesando" se anuncia en una región aria-live
  And el foco no pasa a body mientras el pago se procesa
  When el pago se rechaza
  Then el mensaje se anuncia como alerta
  When reintento y el pago se aprueba
  Then el foco está en el encabezado de la confirmación y el número de cotización es legible por lector de pantalla

# AC-03.35 — origen: PDF Responsive, Q-03.24 → G2-13
Scenario Outline: Resumen y pago en móvil y escritorio
  Given un viewport de <ancho> px de ancho
  When completo el resumen y el pago
  Then la página no tiene desplazamiento horizontal
  And los términos se pueden leer y desplazar
  And la casilla y los botones tienen un área de al menos 24×24 px CSS

  Examples:
    | ancho |
    | 320   |
    | 375   |
    | 1280  |

# AC-03.36 — origen: Q-03.14 → G2-2, F-00.4, F-00.7
Scenario Outline: Texto de interfaz ausente en Strapi
  Given en Strapi falta para mi país <texto ausente>
  When llego al resumen
  Then la sección afectada muestra <lo que veo>
  And no aparece ningún otro texto por defecto escrito en el código
  And el botón de pago está deshabilitado

  Examples:
    | texto ausente                                                            | lo que veo                                                   |
    | el label de la casilla de términos                                       | el mensaje de error genérico configurado en Strapi para mi país |
    | el mensaje de rechazo                                                    | el mensaje de error genérico configurado en Strapi para mi país |
    | el label de la casilla de términos y también el mensaje de error genérico | los textos fijos "error de carga" y "reintentar"             |
```

| AC | Escenario | REQ cubiertos |
|---|---|---|
| AC-03.1 | Complete summary (PDF) | REQ-03.1, REQ-03.4 |
| AC-03.2 | Terms by country (PDF) | REQ-03.15, REQ-03.17, REQ-03.19 |
| AC-03.3 | Successful payment (PDF) | REQ-03.22, REQ-03.25 |
| AC-03.4 | Rejected payment (PDF) | REQ-03.30 |
| AC-03.5 | Documento colombiano enmascarado | REQ-03.6, REQ-03.7 |
| AC-03.6 | RUT enmascarado con separadores | REQ-03.6, REQ-03.7 |
| AC-03.7 | Regla de enmascarado (unit) | REQ-03.7 |
| AC-03.8 | Datos legibles con labels y secciones de Strapi | REQ-03.1, REQ-03.2, REQ-03.3, REQ-03.38 |
| AC-03.9 | Precio recalculado desde el id del plan | REQ-03.4, REQ-03.5, REQ-03.11 |
| AC-03.10 | Editar datos desde el resumen | REQ-03.8, REQ-03.9, REQ-03.11, REQ-03.12 |
| AC-03.11 | Cambiar de plan desde el resumen | REQ-03.10, REQ-03.11 |
| AC-03.12 | Retirar la aceptación de términos | REQ-03.17, REQ-03.19 |
| AC-03.13 | Términos no disponibles | REQ-03.18, REQ-03.19 |
| AC-03.14 | Términos con marcado no seguro | REQ-03.16 |
| AC-03.15 | Cambio de términos sin despliegue | REQ-03.15 |
| AC-03.16 | Estado de carga | REQ-03.19, REQ-03.31 |
| AC-03.17 | Error al cargar términos y reintento | REQ-03.19, REQ-03.32 |
| AC-03.18 | Acceso directo al resumen incompleto | REQ-03.13 |
| AC-03.19 | Plan ya no disponible | REQ-03.14 |
| AC-03.20 | Datos persistidos inválidos | REQ-03.13 |
| AC-03.21 | Campo eliminado de la configuración | REQ-03.14 |
| AC-03.22 | Un único intento de pago | REQ-03.23 |
| AC-03.23 | Controles bloqueados durante el proceso | REQ-03.22, REQ-03.24 |
| AC-03.24 | Sin tarjeta ni escrituras | REQ-03.20 |
| AC-03.25 | Resultado determinista | REQ-03.21 |
| AC-03.26 | Rechazo y reintento | REQ-03.12, REQ-03.30, REQ-03.38 |
| AC-03.27 | Formato del número de cotización | REQ-03.26 |
| AC-03.28 | Recargar la confirmación | REQ-03.28 |
| AC-03.29 | Atrás tras el pago | REQ-03.28 |
| AC-03.30 | Confirmación sin pago | REQ-03.29 |
| AC-03.31 | Contenido de la confirmación | REQ-03.27 |
| AC-03.32 | Separación por país | REQ-03.15, REQ-03.37 |
| AC-03.33 | Teclado | REQ-03.16, REQ-03.34 |
| AC-03.34 | Foco y anuncios | REQ-03.17, REQ-03.33, REQ-03.35 |
| AC-03.35 | Responsive | REQ-03.36 |
| AC-03.36 | Texto de interfaz ausente en Strapi | REQ-03.19, REQ-03.38 |

## 5. Preguntas abiertas y huecos

Todas resueltas en G2 (2026-11-22, `docs/decision-log.md`, motivo literal del humano: "Apruebo todo"). La columna "Respuesta aprobada" es la propuesta original de la spec salvo donde una decisión G2 la sustituye o la precisa (se indica).

| ID | Pregunta | Respuesta aprobada | Estado | Resuelto por |
|---|---|---|---|---|
| Q-03.1 | ¿Qué campo es "el documento" y cómo lo identifica la app? En CO hay tipo de documento (CC o CE) y número; en CL, RUT. El negocio puede renombrar o reordenar campos (US-01), así que no se puede depender de la clave técnica. (analysis.md §1) | **Sustituida por G2-1 (F-00.1):** el documento se identifica por el **rol** de campo `documentNumber` del catálogo de US-01 (REQ-01.28), asignado en Strapi; no hay booleano `masked`. Solo se enmascara el número; el tipo de documento se muestra en claro. Varios campos con ese rol → se enmascaran todos. Ninguno → el formulario de US-01 está "no disponible" (G2-5) y no se llega al resumen. | Resuelta | G2-1 (y G2-5) |
| Q-03.2 | ¿Cuántos caracteres se muestran, con qué carácter se enmascara y es igual en CO y CL? ¿Qué pasa con valores cortos y con separadores del RUT? (analysis.md §1) | Misma regla en CO y CL, fija en código (no configurable en Strapi): se cuentan solo alfanuméricos; visibles los últimos `min(4, floor(n/2))` (nunca se muestra más de la mitad); carácter `*`; se conservan `.`, `-` y espacios. Ejemplos en AC-03.7. La regla se aplica sobre el valor tal como lo guarda US-01. | Resuelta | G2-13 |
| Q-03.3 | ¿Cómo se agrupan y ordenan los datos en el resumen? El PDF distingue "policyholder's data" y "vehicle's data", pero la agrupación depende de la configuración de US-01. | **Precisada por G2-6:** se usa el atributo de sección de cada campo de US-01, con catálogo cerrado `policyholder` · `vehicle`, en ese orden fijo; la leyenda de cada sección viene de Strapi; dentro de cada sección, el orden configurado. El resumen no define un tratamiento propio para secciones no válidas: muestra lo que expone US-01 (REQ-01.27). | Resuelta | G2-6 |
| Q-03.4 | ¿Cómo se muestran los valores de cada tipo (select, checkbox, date, number) y los opcionales vacíos? | `select`: label de la opción vigente (valor visible de REQ-01.27); `checkbox`: textos de sí/no desde Strapi por país; `date`: `Intl.DateTimeFormat` con el locale del país, tratando la fecha como solo-fecha (sin desplazamiento por zona horaria); `number`: `Intl.NumberFormat` con el locale del país; opcional vacío: "—". | Resuelta | G2-13 |
| Q-03.5 | ¿Qué datos del plan se muestran en el resumen? El PDF solo exige "the chosen plan with its final price". | Nombre y precio final (obligatorios por el PDF) más descripción corta, coberturas y beneficios, para que la persona confirme qué compra. Sin desglose base/ajuste (la regla está documentada en D8 / US-02). | Resuelta | G2-13 |
| Q-03.6 | ¿El precio final del resumen se recalcula o se usa el que se guardó en el paso 2? | **Confirmada por G2-9:** solo se persiste el id del plan; el resumen recalcula al cargar con la misma función pura que el paso 2 (G2-8), los datos del paso 1 y el plan y los factores vigentes en Strapi. Si el negocio cambió precios, se muestra el nuevo sin aviso adicional. | Resuelta | G2-9 |
| Q-03.7 | ¿Qué pasa si los datos persistidos ya no coinciden con la configuración actual (plan desactivado o despublicado, campo nuevo obligatorio, opción retirada, campo eliminado)? (analysis.md §1; Skill §3) | **Sustituida en parte por G2-10 y G2-11:** plan no disponible (inactivo, despublicado o con moneda distinta a la del país) → redirección al paso 2, donde se descarta la selección y se muestra el aviso de US-02 (REQ-02.17), en lugar de quedarse en el resumen con el pago bloqueado; datos del paso 1 que ya no cumplen → `isComplete` falso (calculado con la configuración vigente) → paso 1 con datos conservados. Se mantiene de la propuesta (G2-13): campo eliminado → no se muestra; no se revalida otra vez justo antes de pagar (riesgo aceptado). | Resuelta | G2-10, G2-11, G2-13 |
| Q-03.8 | ¿Qué ocurre si se abre la URL del resumen directamente o se recarga? | **Precisada por G2-10 (F-00.5):** con `isComplete` verdadero y plan guardado se reconstruye el resumen desde `sessionStorage` (D6), con la casilla de términos desmarcada. `isComplete` falso → paso 1; `isComplete` verdadero sin plan → paso 2. `isComplete` se calcula siempre con la configuración vigente; no se persiste ninguna señal de "paso completado". | Resuelta | G2-10 |
| Q-03.9 | Al volver a editar datos o cambiar de plan, ¿qué se conserva? ¿Se conserva la aceptación de términos? Tras editar el paso 1, ¿se vuelve directo al resumen o se pasa por el paso 2? | Se conservan los datos del paso 1 y el plan (D6). Editar datos conserva el plan si sigue disponible y se recalcula el precio. Tras editar el paso 1 se pasa por el paso 2 con el plan preseleccionado. La aceptación de términos no se persiste y se reinicia al salir del resumen o recargar. | Resuelta | G2-13 |
| Q-03.10 | El contexto dice "the person must confirm their data". ¿Hace falta una confirmación explícita (otra casilla o botón) además de aceptar los términos? | No: revisar el resumen y pulsar pagar constituye la confirmación. Las reglas de negocio solo condicionan el pago a aceptar los términos. | Resuelta | G2-13 |
| Q-03.11 | ¿En qué formato llega el texto de términos (texto plano, Markdown, rich text "blocks" de Strapi 5) y cómo se pinta de forma segura? | Decisión técnica del Software Architect (G3). Requisito funcional: que permita párrafos y listas, y que el render no inserte HTML crudo del contenido (REQ-03.16, AC-03.14). | Resuelta (formato concreto: G3) | G2-13 |
| Q-03.12 | ¿Qué pasa si no hay términos para el país, el texto está vacío o hay más de un registro? | Estado "términos no disponibles" con aviso (texto desde Strapi) y pago bloqueado en los tres casos (REQ-03.18). Con varios registros no se elige uno. El modelo de contenido (G3) debería impedir más de un registro por país. | Resuelta | G2-13 |
| Q-03.13 | ¿Hay que obligar a leer o desplazarse hasta el final de los términos antes de aceptarlos? ¿Se muestran inline o en un modal? | No se obliga a desplazarse. Se muestran inline en el resumen, en una región con altura máxima, desplazable y enfocable con teclado. | Resuelta | G2-13 |
| Q-03.14 | ¿De dónde salen los textos de UI del paso 3 y de la confirmación? CLAUDE.md §11 dice que los textos visibles vienen de Strapi, pero si Strapi no responde, el mensaje de error no puede venir de Strapi. | **Precisada por G2-2 (F-00.3, F-00.4; excepción en `CLAUDE.md` §11):** todos los textos vienen de Strapi por país, incluido el mensaje de error genérico del país, salvo cuatro textos fijos en código, en español: "cargando", "error de carga", "reintentar" y "país no disponible". **Alineado con US-01 REQ-01.13 (F-00.7):** si falta en Strapi un texto obligatorio de una sección, es un error de configuración y esa sección muestra el mensaje de error genérico del país; si falta también ese mensaje, se usan los textos fijos "error de carga" y "reintentar". Un fallo de red o de contrato muestra siempre los textos fijos (REQ-03.32). No hay otros textos por defecto en código. | Resuelta | G2-2 |
| Q-03.15 | ¿Cómo se elige el resultado del pago simulado (D9) y cómo se fuerza un rechazo determinista en el e2e? (analysis.md §1) | **Confirmada por G2-12:** opciones visibles aprobado (por defecto) / rechazado dentro del paso 3, en un bloque "pasarela simulada". Sin parámetros de URL, flags ocultos ni aleatoriedad; respeta D7 (sin pantalla aparte). Sus textos siguen G2-2. | Resuelta | G2-12 |
| Q-03.16 | ¿Cuánto dura el procesamiento simulado y qué se puede hacer mientras tanto? | Duración fija de 1500 ms definida en código e inyectable en tests. Durante el proceso se bloquean la casilla, el selector de resultado y las acciones de edición. Si la persona abandona la pantalla durante el proceso, el resultado pendiente se descarta y no se muestra confirmación. | Resuelta | G2-13 |
| Q-03.17 | ¿Qué cubre "cannot be submitted twice"? | (a) Doble clic, Enter mantenido y Enter+clic → un único intento, con guardia en el estado además del bloqueo visual. (b) Tras un éxito, volver atrás o recargar no permite pagar otra vez (Q-03.19). (c) Limitación aceptada: sin backend (D4), no se impide pagar en una pestaña duplicada; se documenta en el README. | Resuelta | G2-13 |
| Q-03.18 | ¿Qué formato y qué unicidad tiene el número de cotización simulado? | `<CC>-<YYYYMMDD>-<XXXXXX>` (p. ej. `CO-20261122-7K3F9Q`): país, fecha UTC del pago y 6 caracteres de un alfabeto de 32 sin ambiguos, con `crypto.getRandomValues`. Unicidad solo probabilística; no hay registro central (D4). Reloj y aleatoriedad inyectables para tests. | Resuelta | G2-13 |
| Q-03.19 | ¿Qué pasa con los datos tras un pago exitoso? ¿Qué ocurre al recargar la confirmación o al volver atrás? | Se borra el estado del wizard del país y se guarda solo una confirmación mínima sin documento (número, plan, precio, moneda, fecha). Recargar la confirmación la muestra de nuevo. Atrás o URL del resumen → paso 1 vacío. Abrir la confirmación sin pago → paso 1. "Nueva cotización" borra también la confirmación guardada. | Resuelta | G2-13 |
| Q-03.20 | ¿Qué muestra la confirmación además del número? | Número de cotización, nombre del plan y precio final pagado (copiados en el momento del pago) y la acción "nueva cotización". Sin datos personales ni documento. | Resuelta | G2-13 |
| Q-03.21 | ¿Qué es un mensaje de rechazo "claro" y qué conserva el reintento? | Texto por país desde Strapi, sin códigos técnicos, junto al botón de pago y anunciado como alerta. Se conservan datos, plan, precio y la aceptación de términos. El mensaje se retira al iniciar un nuevo intento. Sin límite de reintentos. | Resuelta | G2-13 |
| Q-03.22 | ¿Cómo se gestionan el foco y los anuncios del resultado del pago? | Foco al encabezado al entrar al resumen y a la confirmación; "procesando" en `aria-live="polite"`; rechazo con `role="alert"`; el bloqueo del botón no debe perder el foco (técnica del Angular Developer); motivo del botón deshabilitado con `aria-describedby`; el documento enmascarado se lee tal cual. | Resuelta | G2-13 |
| Q-03.23 | El documento completo queda en claro en `sessionStorage` (D6) mientras dura la cotización. ¿Es aceptable? | Sí: D6 aprobada, datos ficticios, `sessionStorage` se borra al cerrar la pestaña y se limpia tras el pago. Se documenta en el README como limitación conocida. | Resuelta | G2-13 |
| Q-03.24 | ¿Qué significa "works on mobile and desktop" para el paso 3? | Anchos de prueba 320, 375 y 1280 px; sin desplazamiento horizontal; una columna en móvil; áreas táctiles de al menos 24×24 px CSS (WCAG 2.2 AA, 2.5.8). | Resuelta | G2-13 |

No quedan preguntas abiertas ni bloqueantes. Pendiente de G3 (no de G2): formato concreto del texto de términos (Q-03.11) y nombres reales de content types, campos, rutas y claves.

## 6. Datos y contratos

Referencia pendiente: `docs/architecture/content-model.md` y contratos de API (G3). Nombres descriptivos.

### 6.1 Lo que el resumen consume de Strapi (solo `GET`, a través del proxy de nginx, D4)

| Contenido | Para qué | REQ |
|---|---|---|
| País (código, moneda, locale) | Formato de precio, fechas y números; prefijo del número de cotización; comprobación de moneda del plan | REQ-03.3, REQ-03.4, REQ-03.14, REQ-03.26 |
| Configuración del formulario del país (label, tipo, sección, rol, orden, opciones, validaciones), a través del resultado del paso 1 de US-01 | Labels y valores legibles, secciones, enmascarado por rol `documentNumber`, `isComplete` | REQ-03.2, REQ-03.3, REQ-03.6, REQ-03.13 |
| Planes publicados y activos del país + factores de precio (D8, G2-8) | Plan elegido, precio final, comprobación de que sigue disponible | REQ-03.4, REQ-03.5, REQ-03.14 |
| Términos y condiciones del país | Texto a aceptar | REQ-03.15, REQ-03.18 |
| Textos de UI del país (G2-2) | Acciones, label de la casilla, sí/no, leyendas, avisos, pasarela simulada, mensaje de rechazo, confirmación, mensaje de error genérico del país | REQ-03.38 |

### 6.2 Lo que se guarda en el navegador (`sessionStorage`, separado por país, D6)

| Dato | Dueño | Uso en US-03 |
|---|---|---|
| Valores del paso 1 | US-01 | Lectura (resumen); se borra tras pago exitoso |
| Id del plan elegido (`documentId`; único dato del plan que se persiste, G2-9) | US-02 | Lectura (resumen); se borra tras pago exitoso |
| Confirmación mínima: número, nombre del plan, precio final, moneda, fecha | **US-03** | Escritura tras éxito; lectura en la confirmación; se borra con "nueva cotización" |

No se persisten: la aceptación de términos, el resultado elegido en la pasarela simulada, el estado de procesamiento, el precio ni ninguna señal de "paso completado" (G2-10).

### 6.3 Dependencias con otras historias

| Dependencia | Historia | Qué necesita US-03 | Decisión |
|---|---|---|---|
| Rol de campo `documentNumber` en el catálogo de roles (REQ-01.28) | US-01 | Saber qué campos enmascarar sin depender de la clave | G2-1 |
| Formulario "no disponible" si falta un campo de rol obligatorio | US-01 | Garantía de que al resumen no se llega sin documento | G2-5 |
| Forma en que se guarda el documento (con o sin separadores) | US-01 | Aplicar la regla de enmascarado sobre el valor guardado | G2-13 |
| Atributo de sección `policyholder` · `vehicle`, orden fijo, leyenda en Strapi (REQ-01.12) | US-01 | Agrupación del resumen | G2-6 |
| Resultado del paso 1 con valor visible e indicador `isComplete` calculado con la configuración vigente (REQ-01.27) | US-01 | Valores legibles y guardas del resumen | G2-10 |
| Forma del estado persistido del paso 1 y clave por país | US-01 / ADR de persistencia (G3) | Lectura y borrado tras el pago | D6 |
| `documentId` del plan elegido y preselección al volver al paso 2 (REQ-02.16, REQ-02.18) | US-02 | "Cambiar plan" y recálculo del precio | G2-9 |
| Descarte de la selección y aviso cuando el plan ya no está disponible o tiene otra moneda (REQ-02.7, REQ-02.17) | US-02 | Redirección desde el resumen al paso 2 | G2-11 |
| Función pura de precio final (REQ-02.8, REQ-02.11) | US-02 | Recalcular el precio en el resumen | G2-8, G2-9 |
| Formato de moneda COP/CLP | US-02 | Mismo formato en resumen y confirmación | — |
| Textos de UI por país y los cuatro textos fijos | US-01, US-02, US-03 / G3 | Todos los textos visibles | G2-2 |

## 7. Requisitos no funcionales aplicables

- **Accesibilidad:** casilla de términos con `<label>` asociado; región de términos enfocable y desplazable; todo operable con teclado; foco al encabezado al entrar en el resumen y en la confirmación; "procesando" en región `aria-live`; rechazo con `role="alert"`; motivo del botón deshabilitado con `aria-describedby`; el foco no se pierde al bloquear el botón (REQ-03.33 a REQ-03.35).
- **Responsive:** 320 px a escritorio, sin desplazamiento horizontal, una columna en móvil, áreas táctiles de 24×24 px o más (REQ-03.36).
- **Estados:** "cargando" y "error de carga" con "reintentar" por sección (textos fijos, G2-2); vacío para términos no disponibles; redirección con aviso para plan no disponible; error de configuración si falta un texto en Strapi (REQ-03.14, REQ-03.18, REQ-03.31, REQ-03.32, REQ-03.38).
- **Seguridad:** solo `GET` hacia Strapi (D4); ningún dato de tarjeta (D9); contenido de términos pintado sin HTML crudo (REQ-03.16); documento enmascarado fuera del DOM en claro (REQ-03.6); confirmación persistida sin datos personales (REQ-03.28).
- **Determinismo de pruebas:** resultado del pago elegido por el usuario (G2-12); duración, reloj y aleatoriedad inyectables (REQ-03.21, REQ-03.24, REQ-03.26).

## 8. Plan de verificación

Las rutas exactas dependen de la estructura que fije G3; los nombres de los tests empiezan por el ID del AC (`it('AC-03.7 masks document keeping last visible chars', ...)`).

| AC / REQ | Tipo de test | Ubicación prevista |
|---|---|---|
| AC-03.5, AC-03.6, AC-03.7 (REQ-03.6, REQ-03.7) | Unit (función de enmascarado y selección por rol `documentNumber`) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.8 (REQ-03.2, REQ-03.3) | Unit (secciones y presentación de valores por tipo) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.9 (REQ-03.5) | Unit (misma función de precio que US-02, a partir del id del plan) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.12, AC-03.13, AC-03.16, AC-03.17, AC-03.36 (REQ-03.17 a REQ-03.19, REQ-03.31, REQ-03.32, REQ-03.38) | Unit (componente del resumen con Strapi simulado) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.14 (REQ-03.16) | Unit (render de términos) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.18 a AC-03.21, AC-03.30 (REQ-03.13, REQ-03.14, REQ-03.29) | Unit (guardas con `isComplete` y comprobación del plan) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.22, AC-03.23 (REQ-03.22 a REQ-03.24) | Unit (servicio de pago con duración inyectada; contador de intentos) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.27 (REQ-03.26) | Unit (generador con reloj y aleatoriedad inyectados) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.28 (REQ-03.28) | Unit (store tras éxito) + E2E (recarga) | `frontend/src/app/**`, `e2e/` |
| AC-03.1 a AC-03.4, AC-03.5, AC-03.10, AC-03.11, AC-03.25, AC-03.26, AC-03.29, AC-03.31 | E2E flujo completo de CO (aprobado y rechazado + reintento) | `e2e/` |
| AC-03.2, AC-03.6, AC-03.32 | E2E de CL (términos y RUT) y separación por país | `e2e/` |
| AC-03.15, AC-03.19, AC-03.20, AC-03.21 | E2E si el entorno permite cambiar contenido de Strapi en el test; si no, Manual con evidencia | `e2e/` o `docs/qa/` |
| AC-03.24 (REQ-03.20) | E2E (registro de peticiones de red: ninguna distinta de `GET`) | `e2e/` |
| AC-03.33, AC-03.34 (REQ-03.33 a REQ-03.35) | E2E con teclado + Manual (G5, lector de pantalla) | `e2e/`, `docs/qa/` |
| AC-03.35 (REQ-03.36) | E2E con viewports + Manual (G5, móvil real) | `e2e/`, `docs/qa/` |

## 9. Historial

| Versión | Fecha | Cambio | Motivo |
|---|---|---|---|
| 0.1 | 2026-11-22 | Borrador inicial | — |
| 0.2 | 2026-11-22 | Aplicadas decisiones G2 | G2 aprobado por el humano |
| 0.2 | 2026-11-22 | Alineado mensaje genérico con US-01 | F-00.7 |
