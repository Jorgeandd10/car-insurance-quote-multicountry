# US-03 — Summary and payment

| Campo | Valor |
|---|---|
| Estado | Draft |
| Versión | 0.1 |
| Autor | Requirements Analyst (subagente) |
| Aprobador | Humano (G2) |
| ADRs relacionados | Pendientes (G3): estrategia multipaís (D3), persistencia en `sessionStorage` (D6), pasarela de pago simulada (D9), regla de precio (D8), modelo de contenido (`docs/architecture/content-model.md`, aún no existe) |
| Decisiones relacionadas | D3, D4, D6, D7, D8, D9, D10 |
| Specs relacionadas | `specs/US-01/spec.md` y `specs/US-02/spec.md` (redactadas en paralelo; dependencias en la sección 6.3) |

> **Cómo leer esta spec.** Los `REQ` cuyo origen es una `Q` abierta son **propuestas condicionadas a G2**: si el humano rechaza o modifica la propuesta de esa `Q`, el `REQ` y sus `AC` se reescriben antes de aprobar. Los nombres de content types, campos, rutas y claves de almacenamiento que aparecen aquí son descriptivos; los nombres reales los fija el Software Architect en G3.

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
  - Pasarela de pago simulada dentro del paso 3, con resultado elegido (éxito/rechazo) y sin campos de tarjeta (D9).
  - Pantalla de confirmación con número de cotización simulado (D7: 3 pasos + confirmación).
  - Protección contra doble envío, mensaje de rechazo y reintento.
  - Estados de carga, vacío y error de las llamadas que necesita el resumen; accesibilidad y responsive del paso 3 y de la confirmación.
  - Comportamiento de los datos persistidos (D6) al entrar al resumen, tras un rechazo y tras un pago exitoso.
- **Fuera de alcance:**
  - Pasarelas reales, datos de tarjeta o bancarios (PDF, D9).
  - Registrar la cotización o el pago en Strapi o en cualquier backend: el rol público solo lee y el proxy solo deja pasar `GET` (D4).
  - Emisión real de póliza, envío de correos, descarga de PDF.
  - Definición de la regla de precio (US-02 y D8): US-03 la **consume**.
  - Validaciones del formulario del paso 1 (US-01): US-03 las **reutiliza** para comprobar los datos persistidos.

## 3. Requisitos

Columna **Config**: `Strapi` = lo cambia el negocio sin despliegue; `Código` = fijo en el frontend; `Strapi + Código` = el contenido viene de Strapi y la lógica o el formato están en código.

### 3.1 Resumen de datos y plan

| ID | Requisito verificable | Origen | Config | Verificación |
|---|---|---|---|---|
| REQ-03.1 | El resumen muestra todos los datos del paso 1 (asegurado y vehículo) del país de la URL, leídos del estado del wizard persistido para ese país. | PDF regla 1; AC del PDF "Complete summary"; D6 | Strapi + Código (qué campos hay: Strapi; lectura del estado: código) | Unit · E2E |
| REQ-03.2 | Cada dato se muestra con el **label** configurado en Strapi para su campo (nunca la clave técnica), agrupado por sección (asegurado / vehículo) y en el orden configurado en Strapi. | PDF regla 1; Q-03.3 (propuesta) | Strapi (label, sección, orden) | Unit |
| REQ-03.3 | Los valores se muestran legibles según su tipo: `select` muestra el label de la opción (no su valor interno); `checkbox` muestra el texto de sí/no configurado; `date` se muestra con el formato del locale del país sin desplazar el día por zona horaria; `number` con el formato numérico del locale; un campo opcional vacío se muestra como "—". | Q-03.4 (propuesta) | Strapi + Código (labels y textos: Strapi; formateo `Intl`: código) | Unit |
| REQ-03.4 | El resumen muestra el plan elegido con su nombre y su **precio final** en la moneda y el formato del país (COP y CLP sin decimales), y los demás datos del plan que fije Q-03.5. | PDF regla 1; US-02 regla "price in the country's currency"; Q-03.5 (propuesta) | Strapi + Código (plan, moneda y locale: Strapi; formato `Intl`: código) | Unit · E2E |
| REQ-03.5 | El precio final del resumen se calcula con la **misma función pura** que usa el paso 2 (D8), con los datos del paso 1 y el plan y los factores vigentes en Strapi. Para los mismos datos y la misma configuración, paso 2 y resumen muestran el mismo valor. | D8; PDF regla 1; Q-03.6 (propuesta) | Strapi + Código (factores: Strapi; función: código) | Unit |

### 3.2 Documento enmascarado

| ID | Requisito verificable | Origen | Config | Verificación |
|---|---|---|---|---|
| REQ-03.6 | El campo identificado como documento (Q-03.1) se muestra parcialmente enmascarado en el resumen y en cualquier otra pantalla posterior. El valor completo no aparece en el DOM de esas pantallas (ni en texto, ni en atributos, ni en nombres accesibles). | PDF regla 2; Q-03.1 (bloqueante) | Strapi + Código (qué campo: Strapi; enmascarado: código) | Unit · E2E |
| REQ-03.7 | El enmascarado lo hace una función pura con esta regla (Q-03.2): se cuentan solo los caracteres alfanuméricos; quedan visibles los últimos `min(4, floor(n/2))`; el resto de alfanuméricos se sustituye por `*`; los separadores (`.`, `-`, espacio) se conservan. Misma regla en CO y CL. | Q-03.2 (propuesta) | Código | Unit |
| REQ-03.8 | El enmascarado es solo de presentación: el estado del wizard conserva el valor completo para que "editar datos" lo muestre completo en el paso 1. | PDF regla 3; AC del PDF de US-01 "Keep data when going back"; Q-03.23 | Código | Unit · E2E |

### 3.3 Volver a editar y cambiar de plan

| ID | Requisito verificable | Origen | Config | Verificación |
|---|---|---|---|---|
| REQ-03.9 | Desde el resumen hay una acción "editar datos" que lleva al paso 1 del mismo país con todos los datos precargados. | PDF regla 3 | Código (navegación); Strapi (texto) | E2E |
| REQ-03.10 | Desde el resumen hay una acción "cambiar plan" que lleva al paso 2 con el plan actual marcado como elegido. | PDF regla 3; AC del PDF de US-02 "Plan selection" | Código (navegación); Strapi (texto) | E2E |
| REQ-03.11 | Al volver al resumen tras editar datos o cambiar de plan, el resumen muestra los valores nuevos y el precio final recalculado. Editar datos conserva el plan elegido si sigue disponible. Desde el paso 1 editado se continúa por el paso 2 (con el plan preseleccionado) antes de volver al resumen. | PDF reglas 1 y 3; Q-03.9 (propuesta) | Código | Unit · E2E |
| REQ-03.12 | La aceptación de términos **no se persiste**: la casilla empieza desmarcada cada vez que se entra al resumen (incluidas la recarga y la vuelta desde el paso 1 o 2). Se conserva marcada tras un pago rechazado mientras se permanece en el resumen. | Q-03.9 (propuesta); Q-03.21 (propuesta) | Código | Unit · E2E |
| REQ-03.13 | Si se accede al resumen sin datos válidos del paso 1 o sin plan elegido para el país de la URL, la app redirige al primer paso incompleto (paso 1 o paso 2). | Q-03.8 (propuesta) | Código | Unit · E2E |
| REQ-03.14 | Al cargar el resumen se revalidan los datos persistidos contra la configuración actual de Strapi: (a) si el plan elegido ya no está publicado y activo, se muestra un aviso con acceso al paso 2 y el pago queda bloqueado; (b) si los datos del paso 1 ya no cumplen la configuración (campo obligatorio nuevo, opción de select retirada, validación cambiada), se redirige al paso 1 con los datos conservados y el campo afectado señalado; (c) los valores persistidos de campos que ya no existen en la configuración no se muestran. | analysis.md §1 (datos persistidos vs. plan inactivo); Skill §3; Q-03.7 (propuesta) | Código (revalidación); Strapi (estado de planes y campos) | Unit · E2E |

### 3.4 Términos y condiciones

| ID | Requisito verificable | Origen | Config | Verificación |
|---|---|---|---|---|
| REQ-03.15 | El resumen muestra los términos y condiciones del país de la URL, obtenidos de Strapi. El texto no está en el código: si el negocio lo edita y publica, el cambio se ve al recargar. | PDF contexto; AC del PDF "Terms by country"; D3 | Strapi | Unit · E2E |
| REQ-03.16 | El texto de los términos se presenta sin ejecutar ni insertar HTML o scripts arbitrarios que vengan en el contenido, dentro de un contenedor legible que se puede desplazar con teclado. | CLAUDE.md §6 (seguridad); Q-03.11, Q-03.13 (propuestas) | Código (render); Strapi (texto) | Unit · Manual |
| REQ-03.17 | Hay una casilla de aceptación con `<label>` asociado (texto desde Strapi), desmarcada por defecto. Marcarla es condición para habilitar el pago; desmarcarla vuelve a deshabilitarlo. | PDF regla 4; AC del PDF "Terms by country"; PDF Accessibility | Strapi (texto) + Código | Unit · E2E |
| REQ-03.18 | Si para el país no hay términos publicados, el texto está vacío o llega más de un registro, se muestra un estado "términos no disponibles"; la casilla y el pago quedan deshabilitados; los datos y el plan siguen visibles. | Skill §3 (vacíos/nulos, varios elementos); Q-03.12 (propuesta) | Código (comportamiento); Strapi (texto del aviso) | Unit |
| REQ-03.19 | El botón de pago está habilitado **si y solo si**: los datos y el plan están cargados y son válidos, los términos están cargados y aceptados, y no hay un pago en curso. | PDF reglas 4 y 5; Q-03.7, Q-03.12 (propuestas) | Código | Unit · E2E |

### 3.5 Pago simulado

| ID | Requisito verificable | Origen | Config | Verificación |
|---|---|---|---|---|
| REQ-03.20 | El pago se simula en el navegador: no hay campos de tarjeta ni bancarios y no se hace ninguna petición distinta de `GET` (ni a Strapi ni a terceros). | PDF reglas de alcance; D4; D9 | Código | Unit · E2E |
| REQ-03.21 | El resultado del pago simulado (éxito o rechazo) lo elige el usuario en un control de la propia pantalla del paso 3, de forma que el e2e lo fuerza de forma determinista sin hooks ocultos. | D9; analysis.md §1 (rechazo determinista); Q-03.15 (bloqueante) | Código (mecanismo); Strapi (textos, según Q-03.14) | Unit · E2E |
| REQ-03.22 | Al pulsar pagar, el botón queda bloqueado e indica que el pago se procesa durante toda la operación; la casilla de términos, el selector de resultado y las acciones "editar datos" y "cambiar plan" quedan inhabilitados hasta que termina. | PDF regla 5; AC del PDF "Successful payment"; Q-03.16 (propuesta) | Código | Unit · E2E |
| REQ-03.23 | Cada activación válida produce **un único** intento de pago aunque haya doble clic, Enter mantenido o combinación de Enter y clic. La protección está en el estado de la aplicación, no solo en el atributo `disabled`. | PDF regla 5; Q-03.17 (propuesta) | Código | Unit · E2E |
| REQ-03.24 | La duración simulada del procesamiento es fija, está definida en código y es inyectable en los tests. | Q-03.16 (propuesta) | Código | Unit |
| REQ-03.25 | Con resultado de éxito, la app navega a la pantalla de confirmación (D7) que muestra el número de cotización simulado. | PDF regla 6; AC del PDF "Successful payment"; D7 | Código; Strapi (textos) | E2E |
| REQ-03.26 | El número de cotización tiene el formato `<CC>-<YYYYMMDD>-<XXXXXX>`: código de país en mayúsculas, fecha UTC del pago y 6 caracteres del alfabeto `A-H J-N P-Z 2-9` (sin `0`, `O`, `1`, `I`), generados con una fuente aleatoria criptográfica del navegador. El reloj y la fuente aleatoria son inyectables en los tests. | Q-03.18 (propuesta) | Código | Unit |
| REQ-03.27 | La confirmación muestra el número de cotización, el nombre del plan y el precio final pagado, y ofrece una acción "nueva cotización" que lleva al paso 1 vacío del mismo país. | Q-03.20 (propuesta) | Strapi (textos) + Código | E2E |
| REQ-03.28 | Tras un pago exitoso se borra el estado del wizard del país en `sessionStorage` y solo se guarda una confirmación mínima (número, nombre del plan, precio final, moneda, fecha; **sin documento ni datos personales**). Recargar la confirmación la vuelve a mostrar. Volver atrás con el navegador no permite pagar de nuevo esa cotización: el resumen redirige al paso 1 vacío. | PDF regla 5; D6; Q-03.19 (propuesta) | Código | Unit · E2E |
| REQ-03.29 | Si se accede a la confirmación sin un pago exitoso en la sesión de ese país, la app redirige al paso 1. | Q-03.19 (propuesta) | Código | Unit |
| REQ-03.30 | Con resultado de rechazo, se muestra un mensaje de error claro (texto de Strapi, sin detalles técnicos) junto al botón de pago; el usuario permanece en el resumen con sus datos, el plan, el precio y la aceptación de términos intactos; el botón se rehabilita para reintentar; el mensaje se retira al iniciar un nuevo intento; no hay límite de reintentos. | AC del PDF "Rejected payment"; Q-03.21 (propuesta) | Strapi (mensaje) + Código | Unit · E2E |

### 3.6 Carga, error, país, accesibilidad y responsive

| ID | Requisito verificable | Origen | Config | Verificación |
|---|---|---|---|---|
| REQ-03.31 | Mientras se cargan los datos que necesita el resumen (configuración del formulario, planes y factores de precio, términos, textos de UI), se muestra un indicador de carga en la sección afectada y el pago está deshabilitado. | CLAUDE.md §8 (estados explícitos); PDF criterio "loading and error state handling" | Código | Unit |
| REQ-03.32 | Si una de esas llamadas falla, se muestra un mensaje de error en la sección afectada con una acción para reintentar; el pago queda deshabilitado y los datos persistidos no se pierden. | CLAUDE.md §8; PDF criterio "loading and error state handling" | Código; texto de respaldo según Q-03.14 | Unit · Manual |
| REQ-03.33 | Al entrar al resumen y a la confirmación, el foco se mueve al encabezado principal de la pantalla. | CLAUDE.md §8 (foco al cambiar de paso) | Código | Unit · E2E |
| REQ-03.34 | El paso 3 y la confirmación se completan solo con teclado, con un orden de foco lógico: Tab/Shift+Tab entre controles, Espacio en la casilla, flechas en el selector de resultado, Enter o Espacio en los botones; la región de términos es enfocable y desplazable con teclado. | PDF Accessibility | Código | E2E · Manual (G5) |
| REQ-03.35 | Anuncios y foco del pago: el estado "procesando" se anuncia en una región `aria-live="polite"`; el rechazo se anuncia como alerta (`role="alert"`); el foco no se pierde (no pasa a `body`) al bloquear el botón; el botón deshabilitado está asociado por `aria-describedby` al texto que explica que hay que aceptar los términos. | PDF Accessibility; CLAUDE.md §8; Q-03.22 (propuesta) | Código; Strapi (textos) | Unit · Manual (G5) |
| REQ-03.36 | Resumen, pago y confirmación funcionan de 320 px a escritorio sin desplazamiento horizontal de la página; en móvil el resumen va en una columna; los controles interactivos tienen un área de al menos 24×24 px CSS. | PDF Responsive; Q-03.24 (propuesta) | Código | E2E (viewport) · Manual (G5) |
| REQ-03.37 | El resumen y la confirmación solo leen y escriben el estado del país de la URL: los datos, el plan y la confirmación de un país no aparecen en el otro. | D3; D6 | Código | Unit · E2E |
| REQ-03.38 | Los textos visibles del paso 3 y de la confirmación (acciones, label de la casilla, sí/no, avisos, mensaje de rechazo, títulos) proceden de Strapi por país; solo el mensaje de "no se pudo conectar con el contenido" tiene texto de respaldo en código. | CLAUDE.md §11; Q-03.14 (bloqueante) | Strapi (textos); Código (respaldo mínimo) | Unit |

### 3.7 Cobertura del PDF

| Elemento del PDF | REQ | AC |
|---|---|---|
| Regla 1 (datos, vehículo, plan, precio final) | REQ-03.1 a REQ-03.5 | AC-03.1, AC-03.8, AC-03.9 |
| Regla 2 (documento enmascarado) | REQ-03.6, REQ-03.7, REQ-03.8 | AC-03.5, AC-03.6, AC-03.7 |
| Regla 3 (editar datos, cambiar plan) | REQ-03.9, REQ-03.10, REQ-03.11 | AC-03.10, AC-03.11 |
| Regla 4 (pagar solo tras aceptar términos) | REQ-03.17, REQ-03.19 | AC-03.2, AC-03.12 |
| Regla 5 (sin doble envío) | REQ-03.22, REQ-03.23, REQ-03.28 | AC-03.3, AC-03.22, AC-03.29 |
| Regla 6 (confirmación con número simulado) | REQ-03.25, REQ-03.26 | AC-03.3, AC-03.27 |
| Contexto: confirmar datos | Q-03.10 | AC-03.1 |
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
# AC-03.5 — origen: PDF regla 2, Q-03.1, Q-03.2
Scenario: Documento colombiano parcialmente enmascarado
  Given estoy en /co y el campo identificado como documento vale "1234567890"
  When llego al resumen
  Then veo el documento como "******7890"
  And el texto "1234567890" no aparece en el DOM del resumen

# AC-03.6 — origen: PDF regla 2, Q-03.2
Scenario: RUT chileno enmascarado conservando separadores
  Given estoy en /cl y el campo identificado como documento vale "12.345.678-5"
  When llego al resumen
  Then veo el documento como "**.***.678-5"
  And el texto "12.345.678-5" no aparece en el DOM del resumen

# AC-03.7 — origen: Q-03.2 (test unitario de la función pura)
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

# AC-03.8 — origen: PDF regla 1, Q-03.3, Q-03.4
Scenario: Datos legibles con labels de Strapi
  Given en Strapi hay un campo select con una opción de valor "mazda" y label "Mazda" que elegí en el paso 1
  And marqué un campo checkbox
  And un campo de fecha vale "1990-05-07"
  And un campo opcional quedó vacío
  When llego al resumen
  Then cada dato aparece con el label configurado en Strapi, agrupado por sección y en el orden configurado
  And el select muestra "Mazda" y no "mazda"
  And el checkbox muestra el texto de "sí" configurado en Strapi para mi país
  And la fecha muestra el día 7 de mayo de 1990 con el formato del locale de mi país
  And el campo opcional vacío muestra "—"

# AC-03.9 — origen: D8, Q-03.6
Scenario: Precio final consistente con el paso 2
  Given en el paso 2 elegí un plan cuyo precio final mostrado fue P
  When llego al resumen sin que cambien mis datos ni la configuración
  Then el resumen muestra el precio final P en la moneda y el formato de mi país
  When vuelvo al paso 1, cambio un dato que usa la regla de precio y regreso al resumen
  Then el precio final del resumen es el que calcula la función de precio con el dato nuevo
  And coincide con el que muestra el paso 2 para ese plan

# AC-03.10 — origen: PDF regla 3, Q-03.9
Scenario: Editar datos desde el resumen
  Given estoy en el resumen con los términos aceptados
  When elijo "editar datos"
  Then veo el paso 1 con todos mis datos, incluido el documento completo sin enmascarar
  When cambio un dato y continúo
  Then paso por el paso 2 con mi plan preseleccionado
  When continúo al resumen
  Then el resumen muestra el dato nuevo y el mismo plan
  And la casilla de términos está desmarcada y el botón de pago deshabilitado

# AC-03.11 — origen: PDF regla 3, Q-03.9
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

# AC-03.13 — origen: Q-03.12 (estado vacío)
Scenario Outline: Términos no disponibles para el país
  Given para mi país <situación>
  When llego al resumen
  Then veo un aviso de que los términos no están disponibles
  And la casilla de aceptación y el botón de pago están deshabilitados
  And mis datos y el plan siguen visibles

  Examples:
    | situación                              |
    | no hay términos publicados             |
    | los términos publicados tienen texto vacío |
    | llega más de un registro de términos   |

# AC-03.14 — origen: CLAUDE.md §6, Q-03.11
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

# AC-03.16 — origen: CLAUDE.md §8 (estado de carga)
Scenario: Resumen mientras se carga el contenido
  Given las respuestas de Strapi que necesita el resumen todavía no han llegado
  When llego al resumen
  Then veo un indicador de carga en cada sección pendiente
  And el botón de pago está deshabilitado

# AC-03.17 — origen: CLAUDE.md §8 (estado de error)
Scenario: Error al cargar los términos y reintento
  Given la petición de términos falla
  When llego al resumen
  Then veo un mensaje de error en la sección de términos con una acción para reintentar
  And el botón de pago está deshabilitado
  And mis datos persistidos no se pierden
  When reintento y la petición responde correctamente
  Then veo los términos y puedo aceptarlos

# AC-03.18 — origen: Q-03.8
Scenario Outline: Acceso directo al resumen con el wizard incompleto
  Given en la sesión de /co <estado>
  When abro directamente la URL del resumen de /co
  Then se me lleva a <destino>

  Examples:
    | estado                                               | destino     |
    | no hay datos del paso 1                              | el paso 1   |
    | hay datos válidos del paso 1 pero ningún plan elegido | el paso 2   |

# AC-03.19 — origen: analysis.md §1, Q-03.7
Scenario: El plan elegido dejó de estar disponible
  Given elegí un plan y después el negocio lo desactivó o lo despublicó en Strapi
  When llego al resumen o lo recargo
  Then veo un aviso de que el plan ya no está disponible con una acción para elegir otro plan
  And el botón de pago está deshabilitado

# AC-03.20 — origen: analysis.md §1, Q-03.7
Scenario Outline: Datos persistidos que ya no cumplen la configuración actual
  Given completé el paso 1 y después el negocio <cambio> en Strapi
  When llego al resumen o lo recargo
  Then se me lleva al paso 1 con mis datos conservados
  And el campo afectado muestra su mensaje de error configurado

  Examples:
    | cambio                                                |
    | añadió un campo obligatorio nuevo                     |
    | retiró la opción de select que yo había elegido       |

# AC-03.21 — origen: Q-03.7
Scenario: Campo eliminado de la configuración
  Given completé el paso 1 y después el negocio eliminó o despublicó un campo en Strapi
  When llego al resumen
  Then ese campo no aparece en el resumen
  And el resto de mis datos se muestra normalmente

# AC-03.22 — origen: PDF regla 5, Q-03.17
Scenario Outline: Un único intento de pago ante entradas repetidas
  Given acepté los términos
  When <acción>
  Then la pasarela simulada recibe exactamente un intento de pago

  Examples:
    | acción                                                                       |
    | hago doble clic en el botón de pago                                          |
    | mantengo pulsado Enter con el foco en el botón de pago                       |
    | pulso Enter y hago clic en el botón de pago antes de que termine el proceso  |

# AC-03.23 — origen: PDF regla 5, Q-03.16
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

# AC-03.25 — origen: D9, Q-03.15
Scenario Outline: Resultado del pago elegido de forma determinista
  Given acepté los términos
  And en la pasarela simulada elijo el resultado "<resultado>"
  When pulso pagar
  Then <efecto>

  Examples:
    | resultado | efecto                                              |
    | aprobado  | veo la confirmación con el número de cotización     |
    | rechazado | veo el mensaje de rechazo y sigo en el resumen      |

# AC-03.26 — origen: AC del PDF "Rejected payment", Q-03.21
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

# AC-03.27 — origen: PDF regla 6, Q-03.18 (test unitario)
Scenario: Formato del número de cotización
  Given el reloj inyectado marca 2026-11-22T10:00:00Z y la fuente aleatoria es fija
  When se genera el número de cotización para Colombia
  Then el número cumple el patrón "^CO-20261122-[A-HJ-NP-Z2-9]{6}$"
  And con la misma fuente aleatoria el resultado es siempre el mismo

# AC-03.28 — origen: Q-03.19
Scenario: Recargar la confirmación
  Given pagué con éxito y veo la confirmación con el número N
  When recargo la página
  Then veo la misma confirmación con el número N
  And el documento no está guardado en sessionStorage

# AC-03.29 — origen: PDF regla 5, Q-03.19
Scenario: Volver atrás tras un pago exitoso no permite pagar de nuevo
  Given pagué con éxito y veo la confirmación
  When uso la acción "atrás" del navegador
  Then no veo un resumen con el botón de pago para esa cotización
  And se me lleva al paso 1 vacío de mi país

# AC-03.30 — origen: Q-03.19
Scenario: Acceso directo a la confirmación sin pago
  Given no he pagado con éxito en la sesión de /cl
  When abro directamente la URL de confirmación de /cl
  Then se me lleva al paso 1 de /cl

# AC-03.31 — origen: Q-03.20
Scenario: Contenido de la confirmación y nueva cotización
  Given pagué con éxito
  Then la confirmación muestra el número de cotización, el nombre del plan y el precio final pagado
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

# AC-03.34 — origen: CLAUDE.md §8, Q-03.22
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

# AC-03.35 — origen: PDF Responsive, Q-03.24
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
| AC-03.8 | Datos legibles con labels de Strapi | REQ-03.1, REQ-03.2, REQ-03.3, REQ-03.38 |
| AC-03.9 | Precio final consistente con el paso 2 | REQ-03.4, REQ-03.5, REQ-03.11 |
| AC-03.10 | Editar datos desde el resumen | REQ-03.8, REQ-03.9, REQ-03.11, REQ-03.12 |
| AC-03.11 | Cambiar de plan desde el resumen | REQ-03.10, REQ-03.11 |
| AC-03.12 | Retirar la aceptación de términos | REQ-03.17, REQ-03.19 |
| AC-03.13 | Términos no disponibles | REQ-03.18, REQ-03.19 |
| AC-03.14 | Términos con marcado no seguro | REQ-03.16 |
| AC-03.15 | Cambio de términos sin despliegue | REQ-03.15 |
| AC-03.16 | Estado de carga | REQ-03.19, REQ-03.31 |
| AC-03.17 | Error al cargar términos y reintento | REQ-03.19, REQ-03.32 |
| AC-03.18 | Acceso directo al resumen incompleto | REQ-03.13 |
| AC-03.19 | Plan ya no disponible | REQ-03.14, REQ-03.19 |
| AC-03.20 | Datos persistidos inválidos | REQ-03.14 |
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

## 5. Preguntas abiertas y huecos

Estados: `Abierta` (propuesta pendiente de G2) · `Bloqueante` (impide aprobar la spec o implementar sin decisión) · `Resuelta`.

| ID | Pregunta | Propuesta | Estado | Resuelto por |
|---|---|---|---|---|
| Q-03.1 | ¿Qué campo es "el documento" y cómo lo identifica la app? En CO hay tipo de documento (CC o CE) y número; en CL, RUT. El negocio puede renombrar o reordenar campos (US-01), así que no se puede depender de la clave técnica. (analysis.md §1) | Un atributo booleano en la configuración del campo en Strapi (p. ej. `masked`/`sensitive`) marca qué campos se enmascaran; solo se enmascara el **número**, no el tipo de documento (que se muestra en claro). Si ningún campo está marcado, no se enmascara nada y se registra un aviso en consola; si hay varios marcados, se enmascaran todos. Debe coincidir con lo que defina `specs/US-01/spec.md` y con el modelo de contenido (G3). | Bloqueante | Humano (G2) + alineación con US-01 + Software Architect (G3) |
| Q-03.2 | ¿Cuántos caracteres se muestran, con qué carácter se enmascara y es igual en CO y CL? ¿Qué pasa con valores cortos y con separadores del RUT? (analysis.md §1) | Misma regla en CO y CL, fija en código (no configurable en Strapi): se cuentan solo alfanuméricos; visibles los últimos `min(4, floor(n/2))` (nunca se muestra más de la mitad); carácter `*`; se conservan `.`, `-` y espacios. Ejemplos en AC-03.7. La regla se aplica sobre el valor tal como lo guarda US-01 (si US-01 normaliza el RUT, el ejemplo cambia de forma). | Abierta | Humano (G2) |
| Q-03.3 | ¿Cómo se agrupan y ordenan los datos en el resumen? El PDF distingue "policyholder's data" y "vehicle's data", pero la agrupación depende de la configuración de US-01. | Agrupar por la sección que cada campo tenga en Strapi (asegurado / vehículo), con el título de sección desde Strapi y, dentro de cada sección, el orden configurado. Si un campo no tiene sección, va en un grupo final sin título. Depende de que US-01 defina el atributo de sección. | Abierta | Humano (G2) + alineación con US-01 |
| Q-03.4 | ¿Cómo se muestran los valores de cada tipo (select, checkbox, date, number) y los opcionales vacíos? | `select`: label de la opción vigente; `checkbox`: textos de sí/no desde Strapi por país; `date`: `Intl.DateTimeFormat` con el locale del país, tratando la fecha como solo-fecha (sin desplazamiento por zona horaria); `number`: `Intl.NumberFormat` con el locale del país; opcional vacío: "—". | Abierta | Humano (G2) |
| Q-03.5 | ¿Qué datos del plan se muestran en el resumen? El PDF solo exige "the chosen plan with its final price". | Nombre y precio final (obligatorios por el PDF) más descripción corta, coberturas y beneficios, para que la persona confirme qué compra. Sin desglose base/ajuste (la regla está documentada en D8 / US-02). | Abierta | Humano (G2) |
| Q-03.6 | ¿El precio final del resumen se recalcula o se usa el que se guardó en el paso 2? | Se recalcula al cargar el resumen con la función pura de D8, los datos del paso 1 y el plan y los factores vigentes en Strapi; el precio guardado (si US-02 lo guarda) no es fuente de verdad. Si el negocio cambió precios, se muestra el nuevo sin aviso adicional. Debe coincidir con `specs/US-02/spec.md`. | Abierta | Humano (G2) + alineación con US-02 |
| Q-03.7 | ¿Qué pasa si los datos persistidos ya no coinciden con la configuración actual (plan desactivado o despublicado, campo nuevo obligatorio, opción retirada, campo eliminado)? (analysis.md §1; Skill §3) | Revalidar al cargar el resumen (REQ-03.14): plan no disponible → aviso + acceso al paso 2 + pago bloqueado; datos inválidos → paso 1 con datos conservados y error en el campo; campo eliminado → no se muestra. **No** se revalida otra vez justo antes de pagar (riesgo aceptado: un cambio en Strapi entre la carga del resumen y el clic en pagar no se detecta). La validación de los datos reutiliza los validadores de US-01. | Abierta | Humano (G2) + alineación con US-01/US-02 |
| Q-03.8 | ¿Qué ocurre si se abre la URL del resumen directamente o se recarga? | Con datos válidos y plan elegido: se reconstruye el resumen desde `sessionStorage` (D6), con la casilla de términos desmarcada. Sin datos del paso 1 → paso 1; con datos pero sin plan → paso 2. | Abierta | Humano (G2) |
| Q-03.9 | Al volver a editar datos o cambiar de plan, ¿qué se conserva? ¿Se conserva la aceptación de términos? Tras editar el paso 1, ¿se vuelve directo al resumen o se pasa por el paso 2? | Se conservan los datos del paso 1 y el plan (D6). Editar datos conserva el plan si sigue disponible y se recalcula el precio. Tras editar el paso 1 se pasa por el paso 2 con el plan preseleccionado (el precio puede haber cambiado y el wizard sigue siendo lineal). La aceptación de términos no se persiste y se reinicia al salir del resumen o recargar: el consentimiento se da sobre el resumen final que se va a pagar. | Abierta | Humano (G2) |
| Q-03.10 | El contexto dice "the person must confirm their data". ¿Hace falta una confirmación explícita (otra casilla o botón) además de aceptar los términos? | No: revisar el resumen y pulsar pagar constituye la confirmación. Las reglas de negocio solo condicionan el pago a aceptar los términos; añadir otra casilla sería un requisito inventado. | Abierta | Humano (G2) |
| Q-03.11 | ¿En qué formato llega el texto de términos (texto plano, Markdown, rich text "blocks" de Strapi 5) y cómo se pinta de forma segura? | Decisión técnica del Software Architect (G3). Requisito funcional: que permita párrafos y listas, y que el render no inserte HTML crudo del contenido (REQ-03.16, AC-03.14). | Abierta | Software Architect (G3) |
| Q-03.12 | ¿Qué pasa si no hay términos para el país, el texto está vacío o hay más de un registro? | Estado "términos no disponibles" con aviso (texto desde Strapi) y pago bloqueado en los tres casos (REQ-03.18). Con varios registros no se elige uno: aceptar un texto arbitrario no tiene validez. El modelo de contenido (G3) debería impedir más de un registro por país. | Abierta | Humano (G2) + Software Architect (G3) |
| Q-03.13 | ¿Hay que obligar a leer o desplazarse hasta el final de los términos antes de aceptarlos? ¿Se muestran inline o en un modal? | No se obliga a desplazarse (el PDF no lo pide). Se muestran inline en el resumen, en una región con altura máxima, desplazable y enfocable con teclado (evita la gestión de foco de un modal). | Abierta | Humano (G2) |
| Q-03.14 | ¿De dónde salen los textos de UI del paso 3 y de la confirmación (acciones, label de la casilla, sí/no, avisos, mensaje de rechazo, títulos)? CLAUDE.md §11 dice que los textos visibles vienen de Strapi, pero si Strapi no responde, el mensaje de error no puede venir de Strapi. Afecta también a US-01 y US-02. | Textos de UI por país en Strapi (estructura definida en el modelo de contenido, G3). Única excepción: un mensaje de respaldo fijo en código, en español, para "no se pudo cargar el contenido" con su acción de reintentar. Si falta un texto concreto en Strapi, se trata como error de configuración de esa sección. | Bloqueante | Humano (G2) + Software Architect (G3); transversal a US-01/US-02 |
| Q-03.15 | ¿Cómo se elige el resultado del pago simulado (D9) y cómo se fuerza un rechazo determinista en el e2e? (analysis.md §1) | Un grupo de radios visible en el paso 3, dentro de un bloque rotulado como pasarela simulada, con dos opciones (aprobado/rechazado) y "aprobado" por defecto. Sin parámetros de URL, flags ocultos ni aleatoriedad: el e2e elige la opción como un usuario. Va **dentro** del paso 3 para respetar D7 (3 pasos + confirmación); una pantalla de pasarela aparte exigiría cambiar D7. Sus textos siguen Q-03.14. | Bloqueante | Humano (G2) |
| Q-03.16 | ¿Cuánto dura el procesamiento simulado y qué se puede hacer mientras tanto? | Duración fija de 1500 ms definida en código e inyectable en tests (sin configurar en Strapi). Durante el proceso se bloquean la casilla, el selector de resultado y las acciones de edición. Si la persona abandona la pantalla durante el proceso, el resultado pendiente se descarta y no se muestra confirmación. | Abierta | Humano (G2) |
| Q-03.17 | ¿Qué cubre "cannot be submitted twice"? | (a) Doble clic, Enter mantenido y Enter+clic → un único intento, con guardia en el estado (`processing`) además del bloqueo visual. (b) Tras un éxito, volver atrás o recargar no permite pagar otra vez (Q-03.19). (c) **Limitación aceptada:** sin backend (D4), no se impide pagar en una pestaña duplicada (el navegador copia `sessionStorage` al duplicar); se documenta en el README. | Abierta | Humano (G2) |
| Q-03.18 | ¿Qué formato y qué unicidad tiene el número de cotización simulado? | `<CC>-<YYYYMMDD>-<XXXXXX>` (p. ej. `CO-20261122-7K3F9Q`): país, fecha UTC del pago y 6 caracteres de un alfabeto de 32 sin ambiguos, con `crypto.getRandomValues`. Unicidad solo probabilística (unos 10^9 valores por país y día); no hay registro central porque no se escribe en ningún backend (D4). Reloj y aleatoriedad inyectables para tests. | Abierta | Humano (G2) |
| Q-03.19 | ¿Qué pasa con los datos tras un pago exitoso? ¿Qué ocurre al recargar la confirmación o al volver atrás? | Se borra el estado del wizard del país (datos personales y plan) y se guarda solo una confirmación mínima sin documento (número, plan, precio, moneda, fecha) en `sessionStorage` del país. Recargar la confirmación la muestra de nuevo. Atrás o URL del resumen → paso 1 vacío. Abrir la confirmación sin pago → paso 1. "Nueva cotización" borra también la confirmación guardada. | Abierta | Humano (G2) |
| Q-03.20 | ¿Qué muestra la confirmación además del número? | Número de cotización, nombre del plan y precio final pagado (copiados en el momento del pago, no se vuelven a pedir a Strapi) y la acción "nueva cotización". No se muestran datos personales ni el documento. | Abierta | Humano (G2) |
| Q-03.21 | ¿Qué es un mensaje de rechazo "claro" y qué conserva el reintento? | Texto por país desde Strapi, sin códigos técnicos, junto al botón de pago y anunciado como alerta. Se conservan datos, plan, precio y la aceptación de términos (no se sale del resumen), así que reintentar es un clic. El mensaje se retira al iniciar un nuevo intento. Sin límite de reintentos. | Abierta | Humano (G2) |
| Q-03.22 | ¿Cómo se gestionan el foco y los anuncios del resultado del pago? Un botón con el foco que pasa a `disabled` hace que el foco caiga en `body` en algunos navegadores. | Foco al encabezado al entrar al resumen y a la confirmación; "procesando" en `aria-live="polite"`; rechazo con `role="alert"`; el bloqueo del botón no debe perder el foco (la técnica, p. ej. `aria-disabled` + guardia en estado, la decide el Angular Developer); motivo del botón deshabilitado enlazado con `aria-describedby`. El documento enmascarado se lee tal cual (asteriscos); no se añade texto accesible alternativo. | Abierta | Humano (G2) |
| Q-03.23 | El documento completo queda en claro en `sessionStorage` (D6) mientras dura la cotización. ¿Es aceptable? | Sí: D6 está aprobada, los datos son ficticios, `sessionStorage` se borra al cerrar la pestaña y se limpia tras el pago (Q-03.19). Se documenta en el README como limitación conocida. | Abierta | Humano (G2) |
| Q-03.24 | ¿Qué significa "works on mobile and desktop" para el paso 3? | Anchos de prueba 320, 375 y 1280 px; sin desplazamiento horizontal; una columna en móvil; áreas táctiles de al menos 24×24 px CSS (WCAG 2.2 AA, 2.5.8). | Abierta | Humano (G2) |

**Bloqueantes:** Q-03.1 (identificación del documento, compartida con US-01), Q-03.14 (origen de los textos de UI, transversal) y Q-03.15 (mecanismo de elección del resultado del pago y su encaje con D7).

## 6. Datos y contratos

Referencia pendiente: `docs/architecture/content-model.md` y contratos de API (G3). Nombres descriptivos.

### 6.1 Lo que el resumen consume de Strapi (solo `GET`, a través del proxy de nginx, D4)

| Contenido | Para qué | REQ |
|---|---|---|
| País (código, moneda, locale) | Formato de precio, fechas y números; prefijo del número de cotización | REQ-03.3, REQ-03.4, REQ-03.26 |
| Configuración del formulario del país (label, tipo, sección, orden, opciones, validaciones, marca de documento) | Labels y valores legibles, enmascarado, revalidación de datos persistidos | REQ-03.2, REQ-03.3, REQ-03.6, REQ-03.14 |
| Planes publicados y activos del país + factores de precio (D8) | Plan elegido, precio final, comprobación de que sigue disponible | REQ-03.4, REQ-03.5, REQ-03.14 |
| Términos y condiciones del país | Texto a aceptar | REQ-03.15, REQ-03.18 |
| Textos de UI del país (Q-03.14) | Acciones, label de la casilla, sí/no, avisos, mensaje de rechazo, confirmación | REQ-03.38 |

### 6.2 Lo que se guarda en el navegador (`sessionStorage`, separado por país, D6)

| Dato | Dueño | Uso en US-03 |
|---|---|---|
| Valores del paso 1 | US-01 | Lectura (resumen); se borra tras pago exitoso |
| Plan elegido (identificador estable del plan) | US-02 | Lectura (resumen); se borra tras pago exitoso |
| Confirmación mínima: número, nombre del plan, precio final, moneda, fecha | **US-03** | Escritura tras éxito; lectura en la confirmación; se borra con "nueva cotización" |

No se persisten: la aceptación de términos, el resultado elegido en la pasarela simulada ni el estado de procesamiento.

### 6.3 Dependencias con otras historias

| Dependencia | Historia | Qué necesita US-03 | Q |
|---|---|---|---|
| Marca de campo "documento" en la configuración de campos | US-01 | Saber qué campo enmascarar sin depender de la clave | Q-03.1 |
| Forma en que se guarda el documento (con o sin separadores) | US-01 | Ejemplos de enmascarado de RUT | Q-03.2 |
| Atributo de sección (asegurado / vehículo) | US-01 | Agrupación del resumen | Q-03.3 |
| Validadores reutilizables sobre datos persistidos | US-01 | Revalidación al cargar el resumen | Q-03.7 |
| Forma del estado persistido del paso 1 y clave por país | US-01 / ADR de persistencia | Lectura y borrado tras el pago | Q-03.19 |
| Identificador del plan elegido y preselección al volver al paso 2 | US-02 | "Cambiar plan" y comprobación de plan disponible | Q-03.7, Q-03.9 |
| Función pura de precio final (D8) y sus entradas | US-02 | Recalcular el precio en el resumen | Q-03.6 |
| Formato de moneda COP/CLP | US-02 | Mismo formato en resumen y confirmación | — |
| Textos de UI por país | US-01, US-02, US-03 / G3 | Todos los textos visibles | Q-03.14 |

## 7. Requisitos no funcionales aplicables

- **Accesibilidad:** casilla de términos con `<label>` asociado; región de términos enfocable y desplazable; todo operable con teclado; foco al encabezado al entrar en el resumen y en la confirmación; "procesando" en región `aria-live`; rechazo con `role="alert"`; motivo del botón deshabilitado con `aria-describedby`; el foco no se pierde al bloquear el botón (REQ-03.33 a REQ-03.35).
- **Responsive:** 320 px a escritorio, sin desplazamiento horizontal, una columna en móvil, áreas táctiles de 24×24 px o más (REQ-03.36).
- **Estados:** carga y error con reintento por sección; vacío para términos no disponibles; aviso para plan no disponible (REQ-03.14, REQ-03.18, REQ-03.31, REQ-03.32).
- **Seguridad:** solo `GET` hacia Strapi (D4); ningún dato de tarjeta (D9); contenido de términos pintado sin HTML crudo (REQ-03.16); documento enmascarado fuera del DOM en claro (REQ-03.6); confirmación persistida sin datos personales (REQ-03.28).
- **Determinismo de pruebas:** resultado del pago elegido por el usuario; duración, reloj y aleatoriedad inyectables (REQ-03.21, REQ-03.24, REQ-03.26).

## 8. Plan de verificación

Las rutas exactas dependen de la estructura que fije G3; los nombres de los tests empiezan por el ID del AC (`it('AC-03.7 masks document keeping last visible chars', ...)`).

| AC / REQ | Tipo de test | Ubicación prevista |
|---|---|---|
| AC-03.5, AC-03.6, AC-03.7 (REQ-03.6, REQ-03.7) | Unit (función de enmascarado y componente del resumen) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.8 (REQ-03.2, REQ-03.3) | Unit (presentación de valores por tipo) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.9 (REQ-03.5) | Unit (misma función de precio que US-02) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.12, AC-03.13, AC-03.16, AC-03.17 (REQ-03.17 a REQ-03.19, REQ-03.31, REQ-03.32) | Unit (componente del resumen con Strapi simulado) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.14 (REQ-03.16) | Unit (render de términos) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.18 a AC-03.21, AC-03.30 (REQ-03.13, REQ-03.14, REQ-03.29) | Unit (guards y revalidación) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.22, AC-03.23 (REQ-03.22 a REQ-03.24) | Unit (servicio de pago con duración inyectada; contador de intentos) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.27 (REQ-03.26) | Unit (generador con reloj y aleatoriedad inyectados) | `frontend/src/app/**` `*.spec.ts` |
| AC-03.28 (REQ-03.28) | Unit (store tras éxito) + E2E (recarga) | `frontend/src/app/**`, `e2e/` |
| AC-03.1 a AC-03.4, AC-03.5, AC-03.10, AC-03.11, AC-03.25, AC-03.26, AC-03.29, AC-03.31 | E2E flujo completo de CO (éxito y rechazo + reintento) | `e2e/` |
| AC-03.2, AC-03.6, AC-03.32 | E2E de CL (términos y RUT) y separación por país | `e2e/` |
| AC-03.15, AC-03.19, AC-03.20, AC-03.21 | E2E si el entorno permite cambiar contenido de Strapi en el test; si no, Manual con evidencia | `e2e/` o `docs/qa/` |
| AC-03.24 (REQ-03.20) | E2E (registro de peticiones de red: ninguna distinta de `GET`) | `e2e/` |
| AC-03.33, AC-03.34 (REQ-03.33 a REQ-03.35) | E2E con teclado + Manual (G5, lector de pantalla) | `e2e/`, `docs/qa/` |
| AC-03.35 (REQ-03.36) | E2E con viewports + Manual (G5, móvil real) | `e2e/`, `docs/qa/` |

## 9. Historial

| Versión | Fecha | Cambio | Motivo |
|---|---|---|---|
| 0.1 | 2026-11-22 | Borrador inicial | — |
