# US-02 — Plan list

| Campo | Valor |
|---|---|
| Estado | Approved (2026-11-22, G2) |
| Versión | 0.4 (cambio post-G2 aprobado por el humano en D14) |
| Autor | Requirements Analyst (subagente) |
| Aprobador | Humano (G2) |
| ADRs relacionados | ADR-0001 (multipaís), ADR-0003 (acceso y seguridad), ADR-0004 (estado y navegación), ADR-0005 (regla de precio), ADR-0007 (pruebas); `docs/architecture/pricing-rule.md`, `content-model.md`, `api-contracts.md` (Accepted, G3) |
| Decisiones relacionadas | D3, D4, D6, D7, D8 · G2-1, G2-2, G2-4, G2-5, G2-8, G2-9, G2-10, G2-11, G2-13 (`docs/decision-log.md`, sección G2) |
| Specs relacionadas | `specs/US-01/spec.md` (entrega los datos del paso 1), `specs/US-03/spec.md` (recibe el plan elegido y su precio final) |

## 1. Historia (literal del PDF)

> As a person getting a quote, I want to see the plans available for my country with their price and coverages, so that I can choose the one that best fits my needs.

**Contexto (literal):** Plans, coverages, benefits and prices change by country and are managed by the business team from Strapi. The business team wants to highlight one plan as "recommended" and control the order in which plans appear.

**Reglas de negocio (literal):**

1. Each plan is configured in Strapi with: name, short description, base price, currency, coverages, benefits, order, recommended flag, active status and country.
2. Only published and active plans for the country are shown.
3. The price is shown in the country's currency and format (Colombian pesos or Chilean pesos).
4. The final price may be adjusted by a simulated rule based on the step 1 data. The rule is documented.
5. Only one plan can be selected.

**Reglas de alcance del PDF que aplican (literal):**

- "The same application and the same build serve Colombia and Chile."
- "Changing a form field or a plan in Strapi must be reflected in the app without changing code."
- "Price calculation may be simulated: a real rating engine is not expected."
- "Use a front-end strategy to persist the data; a database is not required."
- Accessibility: "The wizard can be completed using only the keyboard, and fields have accessible labels".
- Responsive: "Works on mobile and desktop".
- Environment: "(...) with seed data for both countries".

## 2. Alcance

- **Incluido:**
  - Paso 2 del wizard (D7) para CO y CL, con el país tomado de la URL (D3).
  - Lectura de planes del país desde Strapi y su presentación (nombre, descripción corta, precio final, coberturas, beneficios, recomendado).
  - Regla de precio simulada como función pura con factores por país configurables en Strapi (D8), y su documentación.
  - Formato de moneda por país con `Intl.NumberFormat`.
  - Selección única, persistencia de la selección en `sessionStorage` por país (D6) y paso al resumen (US-03).
  - Guarda de acceso al paso 2 cuando el paso 1 no está completo.
  - Estados de carga, vacío y error; accesibilidad con teclado y lector de pantalla; responsive.
  - Requisitos de seed de planes y factores para poder verificar los AC.
- **Fuera de alcance:**
  - Motor de tarificación real (PDF: "a real rating engine is not expected").
  - Conversión entre monedas.
  - Filtrar planes por elegibilidad según los datos del paso 1 (el PDF no lo pide; la regla de precio solo ajusta el precio).
  - Comparador de planes, filtros o búsqueda.
  - Validación en el admin de Strapi de "un único recomendado" (Q-02.1 → G2-13; la app se protege en lectura).
  - Selección y validación del país en la URL: es transversal (D3, G2-3, ADR multipaís). US-02 solo consume el país ya resuelto.
  - El contenido y la validación del formulario del paso 1 (US-01) y el resumen y pago (US-03).

## 3. Requisitos

Columna **Config.**: `Strapi` = lo cambia el negocio sin despliegue; `Código` = fijo en el frontend (cambiarlo exige spec + código); `Strapi + Código` = el dato es configurable y la regla que lo interpreta es fija.

Todas las `Q` se resolvieron en G2 (`docs/decision-log.md`, sección G2). En la columna de origen, `Q-02.n → G2-n` indica la pregunta y la decisión que la resolvió.

| ID | Requisito verificable | Origen | Config. | Verificación |
|---|---|---|---|---|
| REQ-02.1 | El paso 2 muestra únicamente planes relacionados con el país de la URL (`/co/...` → Colombia, `/cl/...` → Chile). Un plan de otro país o sin país nunca se muestra. | PDF (regla 2), AC del PDF "Plans for the country", D3 | Strapi (relación plan–país) | Unit (mapper/filtro) · E2E |
| REQ-02.2 | Solo se muestran planes **publicados** (Draft & Publish de Strapi 5) y con estado **activo** = verdadero. Un plan en borrador o con activo = falso (o activo nulo) no aparece ni es seleccionable. La app nunca solicita borradores. | PDF (regla 2), AC del PDF "Plans for the country" | Strapi | Unit · E2E (seed con un plan en borrador y uno inactivo por país) |
| REQ-02.3 | Cada plan mostrado presenta: nombre, descripción corta, precio final (REQ-02.8), lista de coberturas y lista de beneficios, tal como vienen de Strapi. Si la lista de coberturas o de beneficios está vacía, esa sección no se muestra y el plan sigue siendo seleccionable. | PDF (regla 1, historia), Q-02.9 → G2-13 | Strapi | Unit (componente) · E2E |
| REQ-02.4 | Los planes se ordenan por el campo `order` de forma ascendente. Desempates y valores nulos (Q-02.8 → G2-13): a igual `order`, por nombre (comparación con el locale del país) y después por identificador del documento; los planes con `order` nulo van al final. | PDF (contexto, AC del PDF "Plans for the country"), Q-02.8 → G2-13 | Strapi + Código (dato configurable; criterio de desempate fijo) | Unit (función de orden pura) · E2E |
| REQ-02.5 | El plan marcado como recomendado se distingue visualmente del resto **y** de forma textual (una etiqueta visible y expuesta a tecnologías de apoyo), no solo por color. Si hay varios marcados, solo se destaca el primero según el orden de REQ-02.4; el resto se muestra como plan normal. | AC del PDF "Recommended plan", PDF (contexto: "highlight one plan"), Q-02.1 → G2-13 | Strapi + Código | Unit · E2E · Manual (G5) |
| REQ-02.6 | El precio se formatea con `Intl.NumberFormat(locale del país, { style: 'currency', currency: moneda del país, minimumFractionDigits: 0, maximumFractionDigits: 0 })`. COP y CLP se muestran **sin decimales**. El locale y la moneda vienen de la entrada `Country` en Strapi (p. ej. `es-CO`/`COP`, `es-CL`/`CLP`); ningún símbolo ni separador está escrito en código. | PDF (regla 3), D3 | Strapi + Código (locale y moneda configurables; opciones de formato fijas) | Unit (función de formato pura) · E2E |
| REQ-02.7 | La moneda del plan debe coincidir con la moneda del país. Un plan con moneda distinta, vacía o desconocida no se muestra ni es seleccionable (no se convierte), y la app registra un aviso técnico en consola. | PDF (reglas 1 y 3), hueco de `analysis.md` §1, Q-02.2 → G2-11 | Código | Unit · E2E (intercepción con `page.route`; el seed no incluye planes con moneda distinta) |
| REQ-02.8 | El precio final de cada plan lo calcula una **función pura** (`basePrice`, datos del paso 1, factores del país, fecha de referencia) → entero, definida en la sección 6.3. La función no lee el reloj, no hace I/O y devuelve el mismo resultado para las mismas entradas. | PDF (regla 4), D8, Q-02.3 → G2-8 | Código (algoritmo) | Unit (tabla de ejemplos de §6.3) |
| REQ-02.9 | Los factores de ajuste (**rol** de campo del paso 1 al que aplican, `vehicleYear` o `birthDate`; tipo de operando; bandas `min`–`max` inclusivas; multiplicador) se configuran **por país** en Strapi. Si el país no tiene factores configurados, el precio final es igual al precio base. Añadir, quitar o cambiar una banda o un multiplicador no requiere cambiar código. | D8, PDF (regla de alcance "reflected without changing code"), Q-02.3 → G2-8, Q-02.4 → G2-1 | Strapi | Unit · E2E (intercepción con `page.route`) + Manual G5 (cambio real en el admin de Strapi, `docs/qa/manual-check.md`) |
| REQ-02.10 | La regla de precio localiza el dato del paso 1 por el **rol** del campo (`vehicleYear`, `birthDate`) según la configuración vigente de US-01, nunca por su `key` ni por su etiqueta (G2-1). Si ningún campo tiene ese rol, o su valor está vacío o no se puede interpretar, ese factor vale 1 (neutro) y el resto de factores se aplica. Nota: por G2-5, US-01 marca el formulario como "no disponible" si falta el campo de un rol obligatorio, así que en el flujo normal este caso no llega al paso 2; el factor neutro es la defensa de la función pura. | Hueco de `analysis.md` §1, Q-02.4 → G2-1, G2-5 | Código | Unit (función pura). Sin E2E: por G2-5 el caso no llega al paso 2 |
| REQ-02.11 | El redondeo se aplica **una sola vez**, al final: `Math.round` del producto `basePrice × Π factores` a unidades enteras de la moneda. El resultado es el precio final que se muestra y que se entrega a US-03. | PDF (regla 3), D8, Q-02.6 → G2-8 | Código | Unit |
| REQ-02.12 | Los factores con multiplicador no numérico, no finito o ≤ 0, o con `min` > `max`, se descartan antes de evaluar. Con bandas solapadas se aplica la primera en el orden configurado. | Q-02.7 → G2-13 | Código | Unit |
| REQ-02.13 | La regla de precio queda documentada en esta spec (§6.3, con ejemplos verificables) y en `docs/architecture/` (documento del Software Architect, pendiente G3), con el mismo algoritmo y los valores del seed. | PDF (regla 4: "The rule is documented") | — | Revisión (Code Reviewer) |
| REQ-02.14 | Solo se puede elegir **un** plan a la vez. Elegir otro sustituye la selección anterior. La selección se expone como grupo de opciones exclusivas (semántica de radio group). | PDF (regla 5), AC del PDF "Plan selection" | Código | Unit · E2E |
| REQ-02.15 | El plan elegido queda marcado como tal (visual y programáticamente: `checked` / `aria-checked`). Con un plan elegido y disponible, la acción "continuar" lleva al resumen (US-03). Sin plan elegido no se avanza: el botón sigue habilitado y, al activarlo, muestra un mensaje asociado al grupo y lleva el foco al grupo (Q-02.14). | AC del PDF "Plan selection", Q-02.14 → G2-13 | Código | Unit · E2E |
| REQ-02.16 | La selección se persiste en `sessionStorage` en el espacio del país actual (D6) y se restaura al recargar, al volver desde el paso 3 y al volver al paso 2 desde el paso 1. Lo persistido es el identificador del plan (`documentId`), no una copia de precio ni de textos (G2-9). La selección de un país no afecta al otro. | D6, Q-02.12 → G2-9 | Código | Unit (store) · E2E |
| REQ-02.17 | Si el plan persistido ya no está en la lista vigente (inactivo, despublicado, borrado, de otra moneda o mal formado), la selección se descarta, se informa al usuario con un mensaje anunciado por lector de pantalla y "continuar" queda sin efecto hasta elegir otro plan. | Hueco de `analysis.md` §1, Q-02.11 → G2-11 | Código (texto desde Strapi, G2-2) | Unit · E2E (intercepción con `page.route`) + Manual G5 (cambio real en el admin de Strapi, `docs/qa/manual-check.md`) |
| REQ-02.18 | Entrega a US-03: US-02 deja persistido el `documentId` del plan elegido para el país, y US-03 obtiene el plan y su precio final aplicando **la misma** función de REQ-02.8 con los mismos datos. US-02 no garantiza el precio ante cambios de Strapi posteriores a la selección (G2-9). | PDF (US-03 regla 1: "chosen plan with its final price"), Q-02.12 → G2-9, referencia cruzada `specs/US-03/spec.md` | Código | Unit · E2E (flujo completo) |
| REQ-02.19 | Al entrar en el paso 2 de un país, la guarda evalúa `isComplete` de US-01 para **ese** país: se calcula sobre los datos del paso 1 persistidos (D6) con la configuración **vigente** del formulario, y no se persiste ninguna señal de "paso 1 completado" (G2-10). Si `isComplete` es falso (no hay datos, o ya no cumplen la configuración actual), la app redirige al paso 1 del mismo país sin pedir planes a Strapi. Mientras se obtiene la configuración necesaria para calcularlo se aplica el estado de carga (REQ-02.20) y, si falla, el de error (REQ-02.21). | Hueco detectado por el orquestador, Q-02.10 → G2-10 (F-00.5), referencia cruzada `specs/US-01/spec.md` | Código | Unit (guard) · E2E (intercepción con `page.route`) + Manual G5 (cambio real en el admin de Strapi, `docs/qa/manual-check.md`) |
| REQ-02.20 | Mientras se cargan los planes (y los factores y datos del país si se piden aparte) se muestra un indicador de carga anunciado por lector de pantalla (`aria-busy` en la región o mensaje `role="status"`), y no se puede continuar. | PDF (criterio "loading and error state handling"), CLAUDE.md §8 | Código (texto fijo "cargando", G2-2) | Unit · E2E (respuesta retrasada) |
| REQ-02.21 | Hay dos casos de error. (a) **Fallo de la petición** (Strapi no responde: error de red, HTTP no 2xx, respuesta que no cumple el contrato o tiempo de espera agotado, valor en ADR): se muestran los textos fijos "error de carga" y "reintentar"; la acción repite la petición. (b) **Falta un texto obligatorio del paso en Strapi**: es un error de configuración y se muestra el mensaje de error genérico del país, según REQ-02.32. En ambos casos no se muestran planes parciales ni precios y no se puede continuar. | PDF (criterio "loading and error state handling"), CLAUDE.md §8 y §11, Q-02.13 → G2-2, F-00.7 | Código (textos fijos "error de carga" y "reintentar", G2-2) | Unit · E2E (red interceptada) |
| REQ-02.22 | Si no queda ningún plan que mostrar para el país (ninguno publicado y activo, o todos descartados por REQ-02.7 o REQ-02.25), se muestra un mensaje que explica que no hay planes disponibles, anunciado por lector de pantalla, y no se puede continuar. Se mantiene la navegación para volver al paso 1. | AC del PDF "No plans available" | Strapi (texto, G2-2) + Código | Unit · E2E (intercepción con `page.route`) + Manual G5 (cambio real en el admin de Strapi, `docs/qa/manual-check.md`) |
| REQ-02.23 | Los planes y factores se piden a Strapi cada vez que se entra al paso 2 (sin caché persistente entre recargas ni copia del catálogo en `sessionStorage`). Un cambio publicado en Strapi (alta, baja, desactivación, orden, recomendado, precio base, factores) se refleja al recargar sin cambiar código. | PDF (regla de alcance: "Changing (...) a plan in Strapi must be reflected in the app without changing code"), riesgo "sin caché agresiva" de `analysis.md` §6 | Código | E2E (intercepción con `page.route`) + Manual G5 (cambio real en el admin de Strapi, `docs/qa/manual-check.md`) |
| REQ-02.24 | La app obtiene **todos** los planes publicados y activos del país, sin truncar por la paginación por defecto de Strapi: pide con un tamaño de página explícito y recorre las páginas restantes si `pageCount > 1` (Q-02.15). | Q-02.15 → G2-13 | Código | Unit (cliente con respuesta paginada simulada) |
| REQ-02.25 | Un plan con datos mal formados (nombre vacío o nulo; precio base nulo, no numérico o ≤ 0) se descarta sin romper el listado, y la app registra un aviso técnico en consola. Coberturas o beneficios nulos se tratan como listas vacías (REQ-02.3). | Lista de huecos de la Skill (datos vacíos o nulos de Strapi), Q-02.9 → G2-13 | Código | Unit (mapper) |
| REQ-02.26 | El paso 2 se completa solo con teclado: `Tab` llega al grupo de planes, las flechas cambian la opción dentro del grupo (comportamiento nativo de radio), `Espacio` selecciona, `Tab` llega a "volver" y "continuar", y `Enter` activa los botones. El foco es siempre visible. | PDF (Accessibility), CLAUDE.md §8 | Código | E2E (solo teclado) · Manual (G5) |
| REQ-02.27 | Semántica accesible: el grupo tiene nombre accesible (`fieldset` + `legend` o `role="radiogroup"` + `aria-labelledby`); el nombre accesible de cada opción incluye el nombre del plan, su precio final formateado y, si aplica, la etiqueta de recomendado; coberturas y beneficios se exponen como listas. Los mensajes de vacío, error y "plan ya no disponible" se anuncian (`role="status"` o `role="alert"`). | PDF (Accessibility: "fields have accessible labels"), CLAUDE.md §8 | Código | Unit (atributos ARIA) · Manual con lector de pantalla (G5) |
| REQ-02.28 | Al entrar al paso 2, el foco se mueve al encabezado del paso (o a su contenedor con `tabindex="-1"`), y el título del documento refleja el paso. | CLAUDE.md §8 ("foco gestionado al cambiar de paso") | Código | E2E · Manual (G5) |
| REQ-02.29 | Responsive: con 320 px de ancho CSS no hay scroll horizontal y los planes se apilan en una columna; en escritorio (≥ 1024 px) se muestran en varias columnas o en una lista que aprovecha el ancho. Las áreas táctiles de selección miden al menos 24 × 24 px CSS. | PDF (Responsive) | Código | E2E (viewport móvil y escritorio) · Manual (G5) |
| REQ-02.30 | Desde el paso 2 se puede volver al paso 1 sin perder los datos del paso 1 ni la selección del paso 2. Si al volver cambian los datos del paso 1, el precio final de cada plan se recalcula al regresar al paso 2 y la selección se conserva si el plan sigue disponible. | AC del PDF de US-01 "Keep data when going back", PDF (regla 4), D6 | Código | E2E |
| REQ-02.31 | Las peticiones de planes, factores y país son `GET` de solo lectura a través del proxy nginx, sin token en el navegador ni en el bundle. | D4, PDF (Security) | Código + infraestructura | E2E (inspección de red) · Review |
| REQ-02.32 | Los textos visibles del paso 2 (título, leyenda del grupo, etiqueta de recomendado, botones "volver" y "continuar", mensaje "elige un plan", mensaje de vacío, mensaje de plan no disponible y **mensaje de error genérico del país**) vienen de Strapi por país, como textos de interfaz. Solo hay cuatro textos fijos en código, en español: "cargando", "error de carga", "reintentar" y "país no disponible" (G2-2). Si falta en Strapi un texto obligatorio del paso, es un error de configuración: el paso muestra el mensaje de error genérico del país y no se puede continuar. Si falta también ese mensaje genérico, se usan los textos fijos "error de carga" y "reintentar". **No** hay textos por defecto en código para los textos de Strapi. Definición común con US-01 REQ-01.13. | CLAUDE.md §11 (excepción G2-2), PDF (contexto: "copy" por país), Q-02.13 → G2-2, F-00.7 | Strapi (excepción de 4 textos en Código, G2-2) | Unit (texto ausente → estado de error) · Review |
| REQ-02.33 | El seed de cada país (CO y CL) incluye, como mínimo: 3 planes publicados y activos con `order` distinto y precio base distinto; exactamente 1 recomendado; 1 plan publicado e inactivo; 1 plan en borrador; los factores de §6.3; y moneda y locale en `Country`. Así AC-02.1, AC-02.2 y AC-02.5 son verificables con `docker compose up`. | PDF (Environment: "seed data for both countries"), AC del PDF | Strapi (seed como código) | E2E · Review |
| REQ-02.34 | Al hacer clic o tocar en cualquier parte de la tarjeta de un plan, ese plan queda seleccionado, igual que al pulsar su botón de opción. El control sigue siendo el `radio` nativo con su `label` (mismo nombre accesible y mismo comportamiento con teclado, REQ-02.26 y REQ-02.27). | D14 (petición del humano tras G5) | Código | E2E |

## 4. Criterios de aceptación

### Escenarios del PDF (literales)

```gherkin
# AC-02.1 — origen: PDF
Scenario: Plans for the country
  Given I completed the step 1 form
  When I reach the plans step
  Then I see only the active and published plans for my country, in the configured order

# AC-02.2 — origen: PDF
Scenario: Recommended plan
  Given a plan is marked as recommended in Strapi
  When I view the plan list
  Then that plan is visually distinguished from the others

# AC-02.3 — origen: PDF
Scenario: Plan selection
  Given I am on the plan list
  When I select a plan
  Then it is marked as chosen
  And I can move on to the summary

# AC-02.4 — origen: PDF
Scenario: No plans available
  Given there are no active plans for my country
  When I reach the plans step
  Then I see a message explaining that no plans are available
```

### Escenarios añadidos por la spec

```gherkin
# AC-02.5 — origen: REQ-02.1, REQ-02.2, REQ-02.33 (versión verificable de AC-02.1)
Scenario Outline: Draft, inactive and other-country plans are not shown
  Given Strapi has for <country> a published active plan "A", a published inactive plan "B" and a draft plan "C"
  And Strapi has a published active plan "D" for the other country
  And I completed step 1 for <country>
  When I open "/<code>/" at the plans step
  Then I see plan "A"
  And I do not see plans "B", "C" or "D"
  Examples:
    | country  | code |
    | Colombia | co   |
    | Chile    | cl   |

# AC-02.6 — origen: Q-02.8 → G2-13
Scenario: Order with ties and empty order
  Given the active plans of my country are "Gold" (order 2), "Basic" (order 1), "Plus" (order 2) and "Lite" (no order)
  When I reach the plans step
  Then the plans appear as "Basic", "Gold", "Plus", "Lite"

# AC-02.7 — origen: Q-02.1 → G2-13
Scenario: Several plans marked as recommended
  Given plans "Basic" (order 1) and "Gold" (order 2) are both marked as recommended
  When I view the plan list
  Then only "Basic" is shown as recommended
  And "Gold" is shown as a regular plan

# AC-02.8 — origen: REQ-02.6
Scenario Outline: Price in the country currency without decimals
  Given the final price of a plan is <amount> for <country>
  When I view the plan list
  Then the price is shown as <formatted>
  And it has no decimal part
  Examples:
    | country  | amount  | formatted            |
    | Colombia | 1320000 | "$ 1.320.000"   |
    | Chile    | 38985   | "$38.985"            |
  # Colombia: entre "$" y "1" va U+00A0 (espacio no separable), no un espacio normal; se ve como "$ 1.320.000".
  # Chile: sin separador entre "$" y el número.
  # Ambas cadenas verificadas con Intl en Node 24.22.3 (reviews/000-G2-specs-cross-consistency.md, F-00.6):
  #   es-CO → bytes 24 a0 31 2e 33 32 30 2e 30 30 30 · es-CL → bytes 24 33 38 2e 39 38 35
  # El test compara con la cadena exacta, incluido U+00A0, sin normalizar espacios.

# AC-02.9 — origen: REQ-02.8, REQ-02.11, Q-02.3 → G2-8, Q-02.4 → G2-1
Scenario Outline: Final price adjusted by step 1 data
  Given the reference date is 2026-11-22
  And the price factors of <country> are the seed factors of section 6.3
  And a plan has base price <base>
  And in step 1 I entered <year> in the field with role "vehicleYear" and <birth> in the field with role "birthDate"
  When I reach the plans step
  Then the final price of that plan is <final>
  Examples: see table "Ejemplos verificables" in section 6.3 (E1 to E6)

# AC-02.10 — origen: REQ-02.9
Scenario: No price factors configured
  Given my country has no price factors configured in Strapi
  When I reach the plans step
  Then each plan shows its base price as the final price

# AC-02.11 — origen: Q-02.4 → G2-1 (nivel de función pura; por G2-5 el flujo normal no llega aquí)
Scenario: No step 1 value for a role used by the price rule
  Given the price rule of my country has factors for the roles "vehicleYear" and "birthDate"
  And the step 1 data has no field with the role "birthDate"
  When the final price is calculated
  Then the "birthDate" factor is 1
  And the "vehicleYear" factor is applied
  And no error is raised

# AC-02.12 — origen: Q-02.5 → G2-13, G2-4
Scenario: Vehicle from next year
  Given the reference date is 2026-11-22
  And in step 1 I entered 2027 in the field with role "vehicleYear"
  When the final price is calculated
  Then the vehicle age used by the rule is 0

# AC-02.13 — origen: Q-02.7 → G2-13
Scenario: Invalid price factor configuration
  Given a price factor band of my country has multiplier 0
  When the final price is calculated
  Then that band is ignored
  And the price is calculated with the remaining valid bands

# AC-02.14 — origen: Q-02.2 → G2-11
Scenario: Plan with a currency different from the country
  Given an active published plan for Chile is configured with currency "USD"
  When I reach the plans step in Chile
  Then that plan is not shown
  And the other plans are shown in Chilean pesos

# AC-02.15 — origen: Q-02.9 → G2-13
Scenario: Malformed plan from Strapi
  Given an active published plan of my country has no base price
  When I reach the plans step
  Then that plan is not shown
  And the other plans are shown normally

# AC-02.16 — origen: REQ-02.30
Scenario: Price is recalculated after editing step 1
  Given I selected plan "Gold" and its final price is shown
  When I go back to step 1, change the field with role "vehicleYear" to a value in another price band and continue
  Then "Gold" is still selected
  And its final price reflects the new vehicle year

# AC-02.17 — origen: REQ-02.14
Scenario: Selecting another plan replaces the selection
  Given plan "Basic" is selected
  When I select plan "Gold"
  Then "Gold" is marked as chosen
  And "Basic" is no longer marked as chosen

# AC-02.18 — origen: Q-02.14 → G2-13
Scenario: Continue without a selected plan
  Given no plan is selected
  When I activate "continue"
  Then I stay on the plans step
  And I see the "choose a plan" message configured in Strapi for my country, associated with the plan group
  And the focus moves to the plan group

# AC-02.19 — origen: D6, REQ-02.16
Scenario: Selection survives a reload
  Given I selected plan "Gold" in Colombia
  When I reload the page
  Then "Gold" is still selected

# AC-02.20 — origen: D6, REQ-02.16
Scenario: Selection is kept per country
  Given I selected plan "Gold" in Colombia
  When I open the plans step in Chile after completing step 1 for Chile
  Then no Chilean plan is selected
  And when I go back to Colombia "Gold" is still selected

# AC-02.21 — origen: Q-02.11 → G2-11
Scenario: Persisted plan is no longer available
  Given I selected plan "Gold" and it is persisted
  And the business team deactivates or unpublishes "Gold" in Strapi
  When I reload the plans step
  Then no plan is selected
  And I see the "plan no longer available" message configured in Strapi, announced to screen readers
  And I cannot move on to the summary until I choose another plan

# AC-02.22 — origen: Q-02.10 → G2-10 (F-00.5)
Scenario Outline: Opening the plans step when step 1 is not complete
  Given <situation>
  When I open the plans step URL for Chile directly
  Then "isComplete" of step 1 for Chile is false with the current form configuration
  And I am redirected to step 1 for Chile
  And no plan request is sent to Strapi
  Examples:
    | situation                                                                                          |
    | there is no step 1 data for Chile in this session                                                  |
    | the step 1 data for Chile was valid, but the business team then published a new required field   |

# AC-02.23 — origen: REQ-02.20, G2-2
Scenario: Loading state
  Given the plan request takes time to respond
  When I reach the plans step
  Then I see a loading indicator with the fixed "loading" text, announced to screen readers
  And I cannot move on to the summary

# AC-02.24 — origen: REQ-02.21, G2-2
Scenario: Error loading plans
  Given the plan request fails
  When I reach the plans step
  Then I see the fixed "load error" message and the fixed "retry" action
  And no plans or prices are shown
  When the service recovers and I activate "retry"
  Then the plans are listed

# AC-02.25 — origen: REQ-02.23, REQ-02.9
Scenario: Plan change in Strapi without deployment
  Given I am on the plans step
  When the business team publishes a change in Strapi (deactivates a plan, changes its order, its recommended flag, its base price or a price factor)
  And I reload the application
  Then the plan list reflects the change without code changes

# AC-02.26 — origen: REQ-02.26
Scenario: Complete the plans step with the keyboard only
  Given I reached the plans step using only the keyboard
  When I move to the plan group with Tab, change option with the arrow keys and press Space
  And I move to "continue" with Tab and press Enter
  Then the plan is selected and I reach the summary without using a pointer

# AC-02.27 — origen: REQ-02.27
Scenario: Plan group exposed to assistive technologies
  Given I use a screen reader on the plans step
  When I move through the plans
  Then the group is announced with its name
  And each option is announced with the plan name, its final price, whether it is recommended and whether it is selected

# AC-02.28 — origen: REQ-02.28
Scenario: Focus when entering the step
  Given I completed step 1
  When the plans step is shown
  Then the focus is on the step heading

# AC-02.29 — origen: REQ-02.29
Scenario Outline: Responsive layout
  Given the viewport is <width> px wide
  When I view the plan list
  Then there is no horizontal scroll
  And every plan, its price and the "continue" action are reachable
  Examples:
    | width |
    | 320   |
    | 375   |
    | 1280  |

# AC-02.30 — origen: REQ-02.30
Scenario: Back to step 1 keeps data and selection
  Given I selected plan "Gold"
  When I go back to step 1 and return to the plans step without changes
  Then my step 1 data is still filled in
  And "Gold" is still selected with the same final price

# AC-02.31 — origen: REQ-02.31, D4
Scenario: Read-only requests without tokens
  Given I am on the plans step
  When I inspect the network requests to the content API
  Then they are GET requests through the proxy
  And none of them carries an Authorization header or token

# AC-02.32 — origen: Q-02.15 → G2-13
Scenario: More plans than the default page size
  Given my country has 30 active published plans
  When I reach the plans step
  Then the 30 plans are listed

# AC-02.33 — origen: Q-02.13 → G2-2 (F-00.4, F-00.7)
Scenario: A step text is missing in Strapi
  Given the "continue" text of the plans step is not configured in Strapi for my country
  And the generic error message of my country is configured in Strapi
  When I reach the plans step
  Then I see the generic error message configured in Strapi for my country
  And no plans are shown
  And I cannot move on to the summary
  And no default text from the code replaces the missing one

# AC-02.34 — origen: D14
Scenario: Choose a plan by clicking anywhere on its card
  Given I am on the plans step of "/co"
  When I click on the coverages list of "Plan Total"
  Then "Plan Total" is the selected plan

Scenario: A step text and the generic error message are missing in Strapi
  Given the "continue" text of the plans step is not configured in Strapi for my country
  And the generic error message of my country is not configured either
  When I reach the plans step
  Then I see the fixed "load error" message and the fixed "retry" action
  And no plans are shown
  And I cannot move on to the summary
```

| AC | Escenario | REQ cubiertos |
|---|---|---|
| AC-02.1 | Plans for the country (PDF) | REQ-02.1, REQ-02.2, REQ-02.4 |
| AC-02.2 | Recommended plan (PDF) | REQ-02.5 |
| AC-02.3 | Plan selection (PDF) | REQ-02.14, REQ-02.15, REQ-02.18 |
| AC-02.4 | No plans available (PDF) | REQ-02.22 |
| AC-02.5 | Borradores, inactivos y de otro país excluidos | REQ-02.1, REQ-02.2, REQ-02.33 |
| AC-02.6 | Orden con empates y nulos | REQ-02.4 |
| AC-02.7 | Varios recomendados | REQ-02.5 |
| AC-02.8 | Formato de moneda sin decimales | REQ-02.6 |
| AC-02.9 | Precio final ajustado (E1–E6) | REQ-02.8, REQ-02.9, REQ-02.11, REQ-02.13 |
| AC-02.10 | Sin factores configurados | REQ-02.9 |
| AC-02.11 | Sin valor para un rol usado por la regla | REQ-02.10 |
| AC-02.12 | Vehículo del año siguiente | REQ-02.8 |
| AC-02.13 | Factor mal configurado | REQ-02.12 |
| AC-02.14 | Moneda distinta | REQ-02.7 |
| AC-02.15 | Plan mal formado | REQ-02.25, REQ-02.3 |
| AC-02.16 | Recalcular tras editar el paso 1 | REQ-02.30, REQ-02.8 |
| AC-02.17 | Selección única | REQ-02.14 |
| AC-02.18 | Continuar sin selección | REQ-02.15 |
| AC-02.19 | Selección tras recargar | REQ-02.16 |
| AC-02.20 | Selección por país | REQ-02.16 |
| AC-02.21 | Plan persistido no disponible | REQ-02.17 |
| AC-02.22 | Acceso con el paso 1 incompleto (`isComplete` falso) | REQ-02.19 |
| AC-02.23 | Carga | REQ-02.20, REQ-02.32 |
| AC-02.24 | Error y reintento | REQ-02.21, REQ-02.32 |
| AC-02.25 | Cambio en Strapi sin despliegue | REQ-02.23, REQ-02.9 |
| AC-02.26 | Solo teclado | REQ-02.26 |
| AC-02.27 | Lector de pantalla | REQ-02.27, REQ-02.5 |
| AC-02.28 | Foco al entrar | REQ-02.28 |
| AC-02.29 | Responsive | REQ-02.29 |
| AC-02.30 | Volver al paso 1 | REQ-02.30, REQ-02.16 |
| AC-02.31 | Solo lectura sin token | REQ-02.31 |
| AC-02.32 | Paginación | REQ-02.24 |
| AC-02.33 | Texto ausente en Strapi | REQ-02.32, REQ-02.21 |
| AC-02.34 | Clic en cualquier parte de la tarjeta | REQ-02.34 |

REQ sin AC propio: REQ-02.13 (documentación, se verifica en review).

## 5. Preguntas abiertas y huecos

Todas las preguntas quedaron **resueltas en G2** (2026-11-22, "Apruebo todo"; `docs/decision-log.md`, sección G2). La columna "Respuesta aprobada" recoge la propuesta de la v0.1, salvo donde la decisión G2 la cambió; esos casos están marcados como **(ajustada por G2-n)**. No quedan preguntas abiertas ni bloqueantes.

| ID | Pregunta | Respuesta aprobada | Estado | Resuelto por |
|---|---|---|---|---|
| Q-02.1 | El PDF dice "highlight **one** plan", pero el flag es por plan y nada impide marcar varios. ¿Qué se muestra si hay varios recomendados (o ninguno)? | Destacar solo el primero según el orden de REQ-02.4; el resto se muestra normal. Si ninguno está marcado, no se destaca ninguno. No se añade validación en el admin de Strapi; el seed tiene exactamente uno por país. | Resuelta | G2-13 |
| Q-02.2 | Cada plan tiene su propia moneda (regla 1), pero el precio se muestra en la moneda del país (regla 3). ¿Qué pasa si no coinciden? | No se muestra el plan (no se convierte) y se registra un aviso en consola. Si todos quedan excluidos, se muestra el estado vacío. | Resuelta | G2-11 |
| Q-02.3 | El PDF solo dice "may be adjusted by a simulated rule based on the step 1 data. The rule is documented". ¿Cuáles son las entradas, los factores, las bandas, el redondeo y qué es configurable? | `Math.round(basePrice × Π multiplicadores)`; operandos fijos en código `vehicleAge` y `ageInYears`; bandas inclusivas y multiplicadores por país en Strapi (§6.3). Nombre y forma del content type: Software Architect (G3). | Resuelta | G2-8 |
| Q-02.4 | La regla depende de campos del paso 1 que el negocio puede eliminar o renombrar desde Strapi (US-01). ¿Qué pasa con el precio? | **(ajustada por G2-1)** La regla se enlaza con el **rol** del campo (`vehicleYear`, `birthDate`), asignado en Strapi, y no con su `key` ni su etiqueta. Si ningún campo tiene el rol o el valor falta, el factor vale 1 y el resto se aplica. Por G2-5, US-01 marca el formulario como "no disponible" si falta el campo de un rol obligatorio, así que en el flujo normal el caso no llega al paso 2. | Resuelta | G2-1 |
| Q-02.5 | ¿Con qué fecha y zona horaria se calculan la edad del vehículo y la del tomador? US-01 permite un vehículo del año siguiente: su "edad" sería −1. | Fecha de referencia date-only, la misma fuente de "hoy" que use US-01 (reloj inyectable para tests); edad del tomador con la misma función que la mayoría de edad de US-01; edad del vehículo = `max(0, año de referencia − año del vehículo)`. Con el rango de año de G2-4 (`[añoActual − 20, añoActual + 1]`), la edad usada queda en `[0, 20]`. | Resuelta | G2-13 (coherente con G2-4) |
| Q-02.6 | ¿Cómo se redondea el precio final? ¿A la unidad, a múltiplos de 100 (COP) o de 10 (CLP)? | Redondeo a unidad entera con `Math.round`, una sola vez al final. Sin múltiplos comerciales. | Resuelta | G2-8 |
| Q-02.7 | ¿Qué pasa si los factores están mal configurados (multiplicador 0, negativo o vacío; `min` > `max`; bandas solapadas)? | Se descarta la banda inválida antes de evaluar; con solapes gana la primera en el orden configurado; si ninguna coincide, factor 1. Aviso en consola, nunca error al usuario. | Resuelta | G2-13 |
| Q-02.8 | El PDF pide "configured order" pero no define empates ni planes sin `order`. | Ascendente por `order`; empate → nombre con `localeCompare` en el locale del país; empate → `documentId`; `order` nulo al final. | Resuelta | G2-13 |
| Q-02.9 | ¿Qué hace la app con planes mal formados desde Strapi (sin nombre, precio base nulo, ≤ 0 o no numérico, coberturas o beneficios vacíos)? | Sin nombre o con precio inválido (incluido 0) → plan descartado y aviso en consola. Coberturas o beneficios vacíos o nulos → plan visible sin esa sección. | Resuelta | G2-13 |
| Q-02.10 | ¿Qué significa "I completed the step 1 form" y qué pasa si se entra al paso 2 por URL sin haberlo hecho, o con datos del paso 1 que ya no cumplen la configuración actual? | **(ajustada por G2-10, F-00.5)** No se persiste ninguna señal de "paso 1 completado". La guarda usa `isComplete` de US-01, calculado sobre los datos persistidos con la configuración vigente. Si es falso → redirección al paso 1 del mismo país, sin pedir planes. Referencia cruzada `specs/US-01/spec.md`. | Resuelta | G2-10 |
| Q-02.11 | El plan elegido y persistido deja de estar activo o publicado (o cambia de moneda). ¿Qué ve el usuario en el paso 2 y en el resumen? | En el paso 2 se descarta la selección y se muestra un aviso anunciado (REQ-02.17). En el paso 3, US-03 lo detecta, deselecciona con aviso y vuelve al paso 2 (referencia cruzada `specs/US-03/spec.md`). | Resuelta | G2-11 |
| Q-02.12 | ¿Qué entrega US-02 a US-03: solo el identificador del plan o una copia (snapshot) con nombre y precio final? | Solo se persiste el `documentId`. US-03 vuelve a pedir el plan y recalcula el precio con la misma función pura (REQ-02.18). Si el negocio cambia el precio entre el paso 2 y el 3, el resumen muestra el precio vigente. | Resuelta | G2-9 |
| Q-02.13 | CLAUDE.md §11 dice que los textos visibles vienen de Strapi, pero el mensaje de error (y el de carga) se muestra justo cuando Strapi no responde. ¿De dónde salen esos textos? | **(ajustada por G2-2, F-00.3, F-00.4)** Excepción recogida en `CLAUDE.md` §11: solo cuatro textos fijos en código, en español: "cargando", "error de carga", "reintentar" y "país no disponible". El resto de textos del paso (título, leyenda, "recomendado", botones, "elige un plan", vacío, plan no disponible y el mensaje de error genérico del país) viene de Strapi por país; dónde se modelan lo decide el Software Architect. **(alineada con US-01 REQ-01.13, F-00.7)** Si falta en Strapi un texto obligatorio del paso, es un error de configuración: se muestra el mensaje de error genérico del país, configurado en Strapi, y no se puede continuar. Si falta también ese mensaje, se usan los textos fijos "error de carga" y "reintentar". Un fallo de la petición (Strapi no responde) muestra siempre los textos fijos. **No** hay textos por defecto en código. | Resuelta | G2-2 |
| Q-02.14 | ¿El botón "continuar" está deshabilitado hasta que se elige un plan, o habilitado con validación al pulsarlo? | Habilitado. Al pulsarlo sin selección se muestra un mensaje asociado al grupo (`aria-describedby`) y el foco va al grupo (AC-02.18). | Resuelta | G2-13 |
| Q-02.15 | La REST API de Strapi pagina por defecto (25 elementos). Con más planes, la lista se truncaría en silencio. | Pedir con un tamaño de página explícito y recorrer las páginas restantes si `pageCount > 1`. El tamaño exacto y el contrato los fija el Software Architect (G3). | Resuelta | G2-13 |
| Q-02.16 | ¿Se muestra solo el precio final o también el precio base y el desglose del ajuste? | Solo el precio final. La regla queda documentada en §6.3 y en `docs/architecture/`. | Resuelta | G2-13 |

## 6. Datos y contratos

Nombres de content types, campos, rutas y claves de almacenamiento: **pendientes** del Software Architect (`docs/architecture/content-model.md`, contratos de API y ADRs, G3). Esta sección fija qué información se necesita, no cómo se modela.

### 6.1 Lo que se consume de Strapi (solo lectura, D4)

| Dato | Origen | Uso en US-02 |
|---|---|---|
| País: código (`co`, `cl`), locale (`es-CO`, `es-CL`), moneda (`COP`, `CLP`) | `Country` (D3) | REQ-02.1, REQ-02.6, REQ-02.7 |
| Plan: nombre, descripción corta, precio base, moneda, coberturas, beneficios, `order`, recomendado, activo, país, `documentId`, estado de publicación | Plan (PDF, regla 1) | REQ-02.1 a REQ-02.5, REQ-02.25 |
| Factores de precio del país: `role`, operando, `min`, `max`, multiplicador, orden | Modelo pendiente del Software Architect (D8, G2-8) | REQ-02.8 a REQ-02.12 |
| Configuración del formulario del paso 1 (campos con su `role`) | US-01 (G2-1) | REQ-02.10 (resolver valores por rol), REQ-02.19 (`isComplete`) |
| Textos del paso por país (todos salvo los cuatro fijos de G2-2) | Modelo pendiente del Software Architect (G2-2) | REQ-02.32 |

### 6.2 Lo que se lee y escribe en el navegador (`sessionStorage`, por país, D6)

| Clave (lógica) | Quién escribe | Quién lee | Contenido |
|---|---|---|---|
| Datos del paso 1 | US-01 | US-02 (guarda vía `isComplete` y precio), US-03 | Valores de los campos tal como los persiste US-01. US-02 los resuelve por **rol** con la configuración vigente (G2-1) |
| Plan elegido | US-02 | US-02 (restaurar), US-03 | `documentId` del plan (G2-9) |

No se persisten el catálogo de planes, los precios, los factores ni una señal de "paso 1 completado" (REQ-02.23, G2-10).

### 6.3 Regla de precio simulada (aprobada en G2-8; enlace por rol según G2-1)

**Firma conceptual (función pura):**
`computeFinalPrice(basePrice, step1Values, factorRules, referenceDate) → { finalPrice: integer, appliedFactors: [...] }`

**Entradas:**

- `basePrice`: precio base del plan (número > 0, en la moneda del país).
- `step1Values`: valores del paso 1 indexados por **rol** de campo (`vehicleYear`, `birthDate`), resueltos a partir de la configuración vigente de US-01 (G2-1).
- `factorRules`: lista ordenada de reglas del país, cada una con `role`, `operand` (`vehicleAge` | `ageInYears`), `min` (entero o vacío = sin límite), `max` (entero o vacío = sin límite) y `multiplier` (decimal > 0).
- `referenceDate`: fecha date-only inyectada (Q-02.5).

**Algoritmo:**

1. Descartar reglas inválidas (REQ-02.12): `multiplier` no finito o ≤ 0, o `min` > `max`.
2. Agrupar las reglas por (`role`, `operand`). Para cada grupo, derivar un entero `x` del valor del campo que tiene ese rol:
   - `vehicleAge`: `x = max(0, año(referenceDate) − año del vehículo)`.
   - `ageInYears`: años cumplidos entre la fecha del campo y `referenceDate` (misma función que la mayoría de edad de US-01).
   - Ningún campo con ese rol, o valor vacío o no interpretable → factor del grupo = 1 (REQ-02.10). Por G2-5 esto no debería ocurrir en el flujo normal.
3. El factor del grupo es el `multiplier` de la **primera** regla, en el orden configurado, con `min ≤ x ≤ max` (límites inclusivos). Si ninguna coincide → 1.
4. `finalPrice = Math.round(basePrice × Π factores)` (REQ-02.11).

**Qué es configurable y qué es fijo:**

| Elemento | Dónde |
|---|---|
| Bandas, multiplicadores, rol al que aplica cada regla (de los roles existentes), orden de las reglas, por país | Strapi (sin despliegue) |
| Qué campo del paso 1 tiene cada rol | Strapi (configuración de US-01, G2-1) |
| Precio base y moneda de cada plan | Strapi |
| Tipos de operando (`vehicleAge`, `ageInYears`), conjunto de roles, composición multiplicativa, redondeo, factor neutro ante datos ausentes | Código (un operando nuevo sigue el Caso B de la Skill `country-content`) |

**Factores del seed** (valores ficticios; los roles son los de US-01, G2-1):

| País | `role` · operando | Banda (inclusiva) | Multiplicador |
|---|---|---|---|
| CO | `vehicleYear` · `vehicleAge` | 0–5 | 1.00 |
| CO | `vehicleYear` · `vehicleAge` | 6–10 | 1.10 |
| CO | `vehicleYear` · `vehicleAge` | 11–20 | 1.25 |
| CO | `birthDate` · `ageInYears` | 18–25 | 1.20 |
| CO | `birthDate` · `ageInYears` | 26–65 | 1.00 |
| CO | `birthDate` · `ageInYears` | 66– | 1.15 |
| CL | `vehicleYear` · `vehicleAge` | 0–5 | 1.00 |
| CL | `vehicleYear` · `vehicleAge` | 6–12 | 1.08 |
| CL | `vehicleYear` · `vehicleAge` | 13–20 | 1.20 |
| CL | `birthDate` · `ageInYears` | 18–24 | 1.25 |
| CL | `birthDate` · `ageInYears` | 25–70 | 1.00 |
| CL | `birthDate` · `ageInYears` | 71– | 1.10 |

**Ejemplos verificables** (fecha de referencia 2026-11-22; base de AC-02.9 y de los unit tests):

| # | País | Precio base | Rol `vehicleYear` → edad → factor | Rol `birthDate` → edad → factor | Precio final |
|---|---|---|---|---|---|
| E1 | CO | 1 200 000 | 2018 → 8 → 1.10 | 2000-05-10 → 26 → 1.00 | 1 320 000 |
| E2 | CO | 1 200 000 | 2027 → 0 (no −1) → 1.00 | 2005-12-01 → 20 (aún no cumple 21) → 1.20 | 1 440 000 |
| E3 | CO | 850 000 | 2006 → 20 (límite) → 1.25 | 1960-11-22 → 66 (cumple hoy, límite) → 1.15 | 1 221 875 |
| E4 | CL | 25 990 | 2012 → 14 → 1.20 | 2004-03-15 → 22 → 1.25 | 38 985 |
| E5 | CL | 25 990 | 2022 → 4 → 1.00 | sin valor para el rol → factor 1 | 25 990 |
| E6 | CL | 19 990 | 2017 → 9 → 1.08 | 1990-01-01 → 36 → 1.00 | 21 589 (de 21 589,2) |

## 7. Requisitos no funcionales aplicables

- **Accesibilidad:** REQ-02.26 a REQ-02.28. Semántica de radio group nativa preferida a ARIA a medida. La condición de recomendado no se transmite solo con color (WCAG 1.4.1). Foco visible y gestionado al cambiar de paso. Mensajes de estado anunciados.
- **Responsive:** REQ-02.29 (reflow a 320 px, WCAG 1.4.10; tamaño mínimo de objetivo 24 × 24 px, WCAG 2.5.8).
- **Estados de carga, vacío y error:** REQ-02.20 a REQ-02.22, y REQ-02.17 para la selección obsoleta.
- **Seguridad:** REQ-02.31 (D4). Solo `GET`, sin tokens. Los avisos de consola no incluyen datos del paso 1.
- **Determinismo de tests:** la regla de precio recibe la fecha de referencia como parámetro (REQ-02.8). El e2e fija el reloj del navegador o usa datos cuyas bandas no cambien cerca de la fecha de ejecución. Ningún e2e modifica contenido real de Strapi: los AC que dependen de un cambio de contenido se prueban por intercepción (`page.route`) y el cambio real se comprueba a mano en G5 (`docs/qa/manual-check.md`) (G3-3).
- **Configurabilidad:** ningún plan, precio, factor ni texto está en el código, salvo los cuatro textos de G2-2 ("cargando", "error de carga", "reintentar", "país no disponible"). No hay textos por defecto en código.

## 8. Plan de verificación

Las rutas exactas de los archivos dependen de la estructura que fije el ADR del frontend. Los nombres de test empiezan por el AC o REQ que verifican.

| AC / REQ | Tipo de test | Ubicación prevista |
|---|---|---|
| AC-02.9, AC-02.10, AC-02.11, AC-02.12, AC-02.13 (E1–E6) | Unit (función pura de precio) | `frontend/` junto a la función de precio, `*.spec.ts` |
| AC-02.8 | Unit (función pura de formato) | `frontend/`, `*.spec.ts` |
| AC-02.6, AC-02.7 | Unit (función pura de orden y recomendado) | `frontend/`, `*.spec.ts` |
| AC-02.5, AC-02.14, AC-02.15, AC-02.32 | Unit (mapper DTO → dominio y cliente) | `frontend/`, `*.spec.ts` |
| AC-02.17, AC-02.18, AC-02.19, AC-02.20 | Unit (store y componente) | `frontend/`, `*.spec.ts` |
| AC-02.21 | Unit (store y componente) · E2E (intercepción con `page.route`) + Manual G5 (cambio real en el admin de Strapi, `docs/qa/manual-check.md`) | `frontend/`, `e2e/`, `docs/qa/manual-check.md` |
| AC-02.22 | Unit (guard) · E2E (intercepción con `page.route`) + Manual G5 (cambio real en el admin de Strapi, `docs/qa/manual-check.md`) | `frontend/`, `e2e/`, `docs/qa/manual-check.md` |
| AC-02.23, AC-02.24, AC-02.33 | Unit (componente con cliente simulado) · E2E con red interceptada | `frontend/`, `e2e/` |
| AC-02.1, AC-02.2, AC-02.3 | E2E contra el seed (sin modificar Strapi) | `e2e/` |
| AC-02.4 | E2E (intercepción con `page.route`) + Manual G5 (cambio real en el admin de Strapi, `docs/qa/manual-check.md`) | `e2e/`, `docs/qa/manual-check.md` |
| AC-02.25 | E2E (intercepción con `page.route`) + Manual G5 (cambio real en el admin de Strapi, `docs/qa/manual-check.md`) | `e2e/`, `docs/qa/manual-check.md` |
| AC-02.34 | E2E sobre el seed de CO | `e2e/` |
| AC-02.16, AC-02.30 | E2E | `e2e/` |
| AC-02.26, AC-02.28, AC-02.29 | E2E (solo teclado; viewports 320, 375 y 1280) · Manual (G5) | `e2e/`, `docs/qa/` |
| AC-02.27 | Unit (atributos ARIA) · Manual con lector de pantalla (G5) | `frontend/`, `docs/qa/` |
| AC-02.31 | E2E (inspección de peticiones) · Review | `e2e/`, `reviews/` |
| REQ-02.13, REQ-02.32, REQ-02.33 | Review (documento de precio, origen de textos, seed) | `reviews/` |

## 9. Historial

| Versión | Fecha | Cambio | Motivo |
|---|---|---|---|
| 0.1 | 2026-11-22 | Borrador inicial | Fase 3, preparación de G2 |
| 0.2 | 2026-11-22 | Aplicadas decisiones G2 | G2 aprobado por el humano |
| 0.2 | 2026-11-22 | Alineado mensaje genérico con US-01 | F-00.7 |
| 0.3 | 2026-11-22 | Verificación de AC con cambios en Strapi ajustada a G3-3 | G3 |
| 0.4 | 2026-11-23 | REQ-02.34 y AC-02.34: toda la tarjeta del plan selecciona el plan | D14 |
