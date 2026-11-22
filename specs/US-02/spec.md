# US-02 — Plan list

| Campo | Valor |
|---|---|
| Estado | Draft |
| Versión | 0.1 |
| Autor | Requirements Analyst (subagente) |
| Aprobador | Humano (G2) |
| ADRs relacionados | Pendientes (Software Architect, G3): estrategia multipaís (D3), regla de precio (D8), persistencia del wizard (D6), acceso a Strapi (D4) |
| Decisiones relacionadas | D3, D4, D6, D7, D8 |
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
  - Validación en el admin de Strapi de "un único recomendado" (ver Q-02.1; la app se protege en lectura).
  - Selección y validación del país en la URL: es transversal (D3, ADR multipaís). US-02 solo consume el país ya resuelto.
  - El contenido y la validación del formulario del paso 1 (US-01) y el resumen y pago (US-03).

## 3. Requisitos

Columna **Config.**: `Strapi` = lo cambia el negocio sin despliegue; `Código` = fijo en el frontend (cambiarlo exige spec + código); `Strapi + Código` = el dato es configurable y la regla que lo interpreta es fija.

Los REQ cuyo origen es una `Q` con propuesta quedan **condicionados** a que el humano acepte la propuesta en G2; si la modifica, el REQ se reescribe.

| ID | Requisito verificable | Origen | Config. | Verificación |
|---|---|---|---|---|
| REQ-02.1 | El paso 2 muestra únicamente planes relacionados con el país de la URL (`/co/...` → Colombia, `/cl/...` → Chile). Un plan de otro país o sin país nunca se muestra. | PDF (regla 2), AC del PDF "Plans for the country", D3 | Strapi (relación plan–país) | Unit (mapper/filtro) · E2E |
| REQ-02.2 | Solo se muestran planes **publicados** (Draft & Publish de Strapi 5) y con estado **activo** = verdadero. Un plan en borrador o con activo = falso (o activo nulo) no aparece ni es seleccionable. La app nunca solicita borradores. | PDF (regla 2), AC del PDF "Plans for the country" | Strapi | Unit · E2E (seed con un plan en borrador y uno inactivo por país) |
| REQ-02.3 | Cada plan mostrado presenta: nombre, descripción corta, precio final (REQ-02.8), lista de coberturas y lista de beneficios, tal como vienen de Strapi. Si la lista de coberturas o de beneficios está vacía, esa sección no se muestra y el plan sigue siendo seleccionable. | PDF (regla 1, historia), Q-02.9 (propuesta) | Strapi | Unit (componente) · E2E |
| REQ-02.4 | Los planes se ordenan por el campo `order` de forma ascendente. Desempates y valores nulos según Q-02.8: a igual `order`, por nombre (comparación con el locale del país) y después por identificador del documento; los planes con `order` nulo van al final. | PDF (contexto, AC del PDF "Plans for the country"), Q-02.8 (propuesta) | Strapi + Código (dato configurable; criterio de desempate fijo) | Unit (función de orden pura) · E2E |
| REQ-02.5 | El plan marcado como recomendado se distingue visualmente del resto **y** de forma textual (una etiqueta visible y expuesta a tecnologías de apoyo), no solo por color. Si hay varios marcados, solo se destaca el primero según el orden de REQ-02.4; el resto se muestra como plan normal. | AC del PDF "Recommended plan", PDF (contexto: "highlight one plan"), Q-02.1 (propuesta) | Strapi + Código | Unit · E2E · Manual (G5) |
| REQ-02.6 | El precio se formatea con `Intl.NumberFormat(locale del país, { style: 'currency', currency: moneda del país, minimumFractionDigits: 0, maximumFractionDigits: 0 })`. COP y CLP se muestran **sin decimales**. El locale y la moneda vienen de la entrada `Country` en Strapi (p. ej. `es-CO`/`COP`, `es-CL`/`CLP`); ningún símbolo ni separador está escrito en código. | PDF (regla 3), D3 | Strapi + Código (locale y moneda configurables; opciones de formato fijas) | Unit (función de formato pura) · E2E |
| REQ-02.7 | La moneda del plan debe coincidir con la moneda del país. Un plan con moneda distinta, vacía o desconocida no se muestra ni es seleccionable (no se convierte), y la app registra un aviso técnico en consola. | PDF (reglas 1 y 3), hueco de `analysis.md` §1, Q-02.2 (propuesta) | Código | Unit · E2E (seed opcional) |
| REQ-02.8 | El precio final de cada plan lo calcula una **función pura** (`basePrice`, datos del paso 1, factores del país, fecha de referencia) → entero, definida en la sección 6.3. La función no lee el reloj, no hace I/O y devuelve el mismo resultado para las mismas entradas. | PDF (regla 4), D8, Q-02.3 (propuesta) | Código (algoritmo) | Unit (tabla de ejemplos de §6.3) |
| REQ-02.9 | Los factores de ajuste (campo del paso 1 al que aplican, tipo de operando, bandas `min`–`max` inclusivas y multiplicador) se configuran **por país** en Strapi. Si el país no tiene factores configurados, el precio final es igual al precio base. Añadir, quitar o cambiar una banda o un multiplicador no requiere cambiar código. | D8, PDF (regla de alcance "reflected without changing code") | Strapi | Unit · E2E (cambio de factor + recarga, AC-02.25) |
| REQ-02.10 | Si el campo del paso 1 que usa un factor no existe en los datos (el negocio lo eliminó o renombró), está vacío o no se puede interpretar, ese factor vale 1 (neutro). El listado nunca se bloquea por esta causa y el resto de factores se aplica. | Hueco de `analysis.md` §1, Q-02.4 (propuesta) | Código | Unit · E2E |
| REQ-02.11 | El redondeo se aplica **una sola vez**, al final: `Math.round` del producto `basePrice × Π factores` a unidades enteras de la moneda. El resultado es el precio final que se muestra y que se entrega a US-03. | PDF (regla 3), D8, Q-02.6 (propuesta) | Código | Unit |
| REQ-02.12 | Los factores con multiplicador no numérico, no finito o ≤ 0, o con `min` > `max`, se descartan antes de evaluar. Con bandas solapadas se aplica la primera en el orden configurado. | Q-02.7 (propuesta) | Código | Unit |
| REQ-02.13 | La regla de precio queda documentada en esta spec (§6.3, con ejemplos verificables) y en `docs/architecture/` (documento del Software Architect, pendiente G3), con el mismo algoritmo y los valores del seed. | PDF (regla 4: "The rule is documented") | — | Revisión (Code Reviewer) |
| REQ-02.14 | Solo se puede elegir **un** plan a la vez. Elegir otro sustituye la selección anterior. La selección se expone como grupo de opciones exclusivas (semántica de radio group). | PDF (regla 5), AC del PDF "Plan selection" | Código | Unit · E2E |
| REQ-02.15 | El plan elegido queda marcado como tal (visual y programáticamente: `checked` / `aria-checked`). Con un plan elegido y disponible, la acción "continuar" lleva al resumen (US-03). Sin plan elegido no se avanza; el comportamiento exacto del botón sigue Q-02.14. | AC del PDF "Plan selection", Q-02.14 (propuesta) | Código | Unit · E2E |
| REQ-02.16 | La selección se persiste en `sessionStorage` en el espacio del país actual (D6) y se restaura al recargar, al volver desde el paso 3 y al volver al paso 2 desde el paso 1. Lo persistido es el identificador del plan (`documentId`), no una copia de precio ni de textos (ver Q-02.12). La selección de un país no afecta al otro. | D6, Q-02.12 (propuesta) | Código | Unit (store) · E2E |
| REQ-02.17 | Si el plan persistido ya no está en la lista vigente (inactivo, despublicado, borrado, de otra moneda o mal formado), la selección se descarta, se informa al usuario con un mensaje anunciado por lector de pantalla y "continuar" queda sin efecto hasta elegir otro plan. | Hueco de `analysis.md` §1, Q-02.11 (propuesta) | Código (texto: ver Q-02.13) | Unit · E2E |
| REQ-02.18 | Entrega a US-03: US-02 deja persistido el `documentId` del plan elegido para el país, y US-03 obtiene el plan y su precio final aplicando **la misma** función de REQ-02.8 con los mismos datos. US-02 no garantiza el precio ante cambios de Strapi posteriores a la selección (ver Q-02.12). | PDF (US-03 regla 1: "chosen plan with its final price"), Q-02.12 (propuesta), referencia cruzada `specs/US-03/spec.md` | Código | Unit · E2E (flujo completo) |
| REQ-02.19 | Al entrar en el paso 2 de un país sin el paso 1 completado para **ese** país (según la señal que defina US-01, ver Q-02.10), la app redirige al paso 1 del mismo país sin pedir planes a Strapi. | Hueco detectado por el orquestador, Q-02.10 (propuesta), referencia cruzada `specs/US-01/spec.md` | Código | Unit (guard) · E2E |
| REQ-02.20 | Mientras se cargan los planes (y los factores y datos del país si se piden aparte) se muestra un indicador de carga anunciado por lector de pantalla (`aria-busy` en la región o mensaje `role="status"`), y no se puede continuar. | PDF (criterio "loading and error state handling"), CLAUDE.md §8 | Código (texto: ver Q-02.13) | Unit · E2E (respuesta retrasada) |
| REQ-02.21 | Si la petición a Strapi falla (error de red, HTTP no 2xx, respuesta que no cumple el contrato o tiempo de espera agotado, valor en ADR), se muestra un mensaje de error con una acción "reintentar" que repite la petición. No se muestran planes parciales ni precios y no se puede continuar. | PDF (criterio "loading and error state handling"), CLAUDE.md §8 | Código (texto: ver Q-02.13) | Unit · E2E (red interceptada) |
| REQ-02.22 | Si no queda ningún plan que mostrar para el país (ninguno publicado y activo, o todos descartados por REQ-02.7 o REQ-02.25), se muestra un mensaje que explica que no hay planes disponibles, anunciado por lector de pantalla, y no se puede continuar. Se mantiene la navegación para volver al paso 1. | AC del PDF "No plans available" | Strapi (texto, Q-02.13) + Código | Unit · E2E (seed o intercepción sin planes) |
| REQ-02.23 | Los planes y factores se piden a Strapi cada vez que se entra al paso 2 (sin caché persistente entre recargas ni copia del catálogo en `sessionStorage`). Un cambio publicado en Strapi (alta, baja, desactivación, orden, recomendado, precio base, factores) se refleja al recargar sin cambiar código. | PDF (regla de alcance: "Changing (...) a plan in Strapi must be reflected in the app without changing code"), riesgo "sin caché agresiva" de `analysis.md` §6 | Código | E2E (AC-02.25) |
| REQ-02.24 | La app obtiene **todos** los planes publicados y activos del país, sin truncar por la paginación por defecto de Strapi (ver Q-02.15). | Q-02.15 (propuesta) | Código | Unit (cliente con respuesta paginada simulada) |
| REQ-02.25 | Un plan con datos mal formados (nombre vacío o nulo; precio base nulo, no numérico o ≤ 0) se descarta sin romper el listado, y la app registra un aviso técnico en consola. Coberturas o beneficios nulos se tratan como listas vacías (REQ-02.3). | Lista de huecos de la Skill (datos vacíos o nulos de Strapi), Q-02.9 (propuesta) | Código | Unit (mapper) |
| REQ-02.26 | El paso 2 se completa solo con teclado: `Tab` llega al grupo de planes, las flechas cambian la opción dentro del grupo (comportamiento nativo de radio), `Espacio` selecciona, `Tab` llega a "volver" y "continuar", y `Enter` activa los botones. El foco es siempre visible. | PDF (Accessibility), CLAUDE.md §8 | Código | E2E (solo teclado) · Manual (G5) |
| REQ-02.27 | Semántica accesible: el grupo tiene nombre accesible (`fieldset` + `legend` o `role="radiogroup"` + `aria-labelledby`); el nombre accesible de cada opción incluye el nombre del plan, su precio final formateado y, si aplica, la etiqueta de recomendado; coberturas y beneficios se exponen como listas. Los mensajes de vacío, error y "plan ya no disponible" se anuncian (`role="status"` o `role="alert"`). | PDF (Accessibility: "fields have accessible labels"), CLAUDE.md §8 | Código | Unit (atributos ARIA) · Manual con lector de pantalla (G5) |
| REQ-02.28 | Al entrar al paso 2, el foco se mueve al encabezado del paso (o a su contenedor con `tabindex="-1"`), y el título del documento refleja el paso. | CLAUDE.md §8 ("foco gestionado al cambiar de paso") | Código | E2E · Manual (G5) |
| REQ-02.29 | Responsive: con 320 px de ancho CSS no hay scroll horizontal y los planes se apilan en una columna; en escritorio (≥ 1024 px) se muestran en varias columnas o en una lista que aprovecha el ancho. Las áreas táctiles de selección miden al menos 24 × 24 px CSS. | PDF (Responsive) | Código | E2E (viewport móvil y escritorio) · Manual (G5) |
| REQ-02.30 | Desde el paso 2 se puede volver al paso 1 sin perder los datos del paso 1 ni la selección del paso 2. Si al volver cambian los datos del paso 1, el precio final de cada plan se recalcula al regresar al paso 2 y la selección se conserva si el plan sigue disponible. | AC del PDF de US-01 "Keep data when going back", PDF (regla 4), D6 | Código | E2E |
| REQ-02.31 | Las peticiones de planes, factores y país son `GET` de solo lectura a través del proxy nginx, sin token en el navegador ni en el bundle. | D4, PDF (Security) | Código + infraestructura | E2E (inspección de red) · Review |
| REQ-02.32 | Los textos visibles del paso 2 (título, leyenda del grupo, etiqueta de recomendado, botones, mensaje de vacío, mensaje de plan no disponible) vienen de Strapi por país, salvo la excepción que se apruebe en Q-02.13 para los textos que se muestran cuando Strapi no responde. | CLAUDE.md §11, PDF (contexto: "copy" por país), Q-02.13 (propuesta) | Strapi (con excepción en Código pendiente de Q-02.13) | Unit · Review |
| REQ-02.33 | El seed de cada país (CO y CL) incluye, como mínimo: 3 planes publicados y activos con `order` distinto y precio base distinto; exactamente 1 recomendado; 1 plan publicado e inactivo; 1 plan en borrador; los factores de §6.3; y moneda y locale en `Country`. Así AC-02.1, AC-02.2 y AC-02.5 son verificables con `docker compose up`. | PDF (Environment: "seed data for both countries"), AC del PDF | Strapi (seed como código) | E2E · Review |

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

# AC-02.6 — origen: Q-02.8
Scenario: Order with ties and empty order
  Given the active plans of my country are "Gold" (order 2), "Basic" (order 1), "Plus" (order 2) and "Lite" (no order)
  When I reach the plans step
  Then the plans appear as "Basic", "Gold", "Plus", "Lite"

# AC-02.7 — origen: Q-02.1
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
    | country  | amount  | formatted     |
    | Colombia | 1320000 | "$ 1.320.000" |
    | Chile    | 38985   | "$38.985"     |
  # Cadena esperada tras normalizar espacios no separables a espacio simple (ICU de Node 24). Ver supuestos.

# AC-02.9 — origen: REQ-02.8, REQ-02.11, Q-02.3
Scenario Outline: Final price adjusted by step 1 data
  Given the reference date is 2026-11-22
  And the price factors of <country> are the seed factors of section 6.3
  And a plan has base price <base>
  And in step 1 I entered vehicle year <year> and birth date <birth>
  When I reach the plans step
  Then the final price of that plan is <final>
  Examples: see table "Ejemplos verificables" in section 6.3 (E1 to E6)

# AC-02.10 — origen: REQ-02.9
Scenario: No price factors configured
  Given my country has no price factors configured in Strapi
  When I reach the plans step
  Then each plan shows its base price as the final price

# AC-02.11 — origen: Q-02.4
Scenario: Step 1 field used by the price rule was removed
  Given the price rule of my country uses the step 1 field "birthDate"
  And the business team removed the field "birthDate" from the step 1 form
  And I completed step 1 without that field
  When I reach the plans step
  Then the plans are listed with prices
  And the "birthDate" factor is not applied (factor 1)
  And the other factors are applied

# AC-02.12 — origen: Q-02.5
Scenario: Vehicle from next year
  Given the reference date is 2026-11-22
  And in step 1 I entered vehicle year 2027
  When the final price is calculated
  Then the vehicle age used by the rule is 0

# AC-02.13 — origen: Q-02.7
Scenario: Invalid price factor configuration
  Given a price factor band of my country has multiplier 0
  When the final price is calculated
  Then that band is ignored
  And the price is calculated with the remaining valid bands

# AC-02.14 — origen: Q-02.2
Scenario: Plan with a currency different from the country
  Given an active published plan for Chile is configured with currency "USD"
  When I reach the plans step in Chile
  Then that plan is not shown
  And the other plans are shown in Chilean pesos

# AC-02.15 — origen: Q-02.9
Scenario: Malformed plan from Strapi
  Given an active published plan of my country has no base price
  When I reach the plans step
  Then that plan is not shown
  And the other plans are shown normally

# AC-02.16 — origen: REQ-02.30
Scenario: Price is recalculated after editing step 1
  Given I selected plan "Gold" and its final price is shown
  When I go back to step 1, change the vehicle year to a value in another price band and continue
  Then "Gold" is still selected
  And its final price reflects the new vehicle year

# AC-02.17 — origen: REQ-02.14
Scenario: Selecting another plan replaces the selection
  Given plan "Basic" is selected
  When I select plan "Gold"
  Then "Gold" is marked as chosen
  And "Basic" is no longer marked as chosen

# AC-02.18 — origen: Q-02.14
Scenario: Continue without a selected plan
  Given no plan is selected
  When I activate "continue"
  Then I stay on the plans step
  And I see a message asking me to choose a plan, associated with the plan group
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

# AC-02.21 — origen: Q-02.11
Scenario: Persisted plan is no longer available
  Given I selected plan "Gold" and it is persisted
  And the business team deactivates or unpublishes "Gold" in Strapi
  When I reload the plans step
  Then no plan is selected
  And I see a message, announced to screen readers, saying my previous plan is no longer available
  And I cannot move on to the summary until I choose another plan

# AC-02.22 — origen: Q-02.10
Scenario: Opening the plans step without completing step 1
  Given I have not completed step 1 for Chile in this session
  When I open the plans step URL for Chile directly
  Then I am redirected to step 1 for Chile
  And no plan request is sent to Strapi

# AC-02.23 — origen: REQ-02.20
Scenario: Loading state
  Given the plan request takes time to respond
  When I reach the plans step
  Then I see a loading indicator announced to screen readers
  And I cannot move on to the summary

# AC-02.24 — origen: REQ-02.21
Scenario: Error loading plans
  Given the plan request fails
  When I reach the plans step
  Then I see an error message and a "retry" action
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

# AC-02.32 — origen: Q-02.15
Scenario: More plans than the default page size
  Given my country has 30 active published plans
  When I reach the plans step
  Then the 30 plans are listed
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
| AC-02.11 | Campo del paso 1 eliminado | REQ-02.10 |
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
| AC-02.22 | Acceso sin paso 1 | REQ-02.19 |
| AC-02.23 | Carga | REQ-02.20 |
| AC-02.24 | Error y reintento | REQ-02.21 |
| AC-02.25 | Cambio en Strapi sin despliegue | REQ-02.23, REQ-02.9 |
| AC-02.26 | Solo teclado | REQ-02.26 |
| AC-02.27 | Lector de pantalla | REQ-02.27, REQ-02.5 |
| AC-02.28 | Foco al entrar | REQ-02.28 |
| AC-02.29 | Responsive | REQ-02.29 |
| AC-02.30 | Volver al paso 1 | REQ-02.30, REQ-02.16 |
| AC-02.31 | Solo lectura sin token | REQ-02.31 |
| AC-02.32 | Paginación | REQ-02.24 |

REQ sin AC propio: REQ-02.13 (documentación, se verifica en review) y REQ-02.32 (origen de textos, se verifica en unit y review).

## 5. Preguntas abiertas y huecos

Estados: `Abierta` (tiene propuesta; el humano puede aceptarla en G2) · `Bloqueante` (la implementación no puede empezar sin respuesta explícita) · `Resuelta`.

| ID | Pregunta | Propuesta | Estado | Resuelto por |
|---|---|---|---|---|
| Q-02.1 | El PDF dice "highlight **one** plan", pero el flag es por plan y nada impide marcar varios. ¿Qué se muestra si hay varios recomendados (o ninguno)? | Destacar solo el primero según el orden de REQ-02.4; el resto se muestra normal. Si ninguno está marcado, no se destaca ninguno. No se añade validación en el admin de Strapi (sería lógica de escritura fuera del alcance del rol público); el seed tiene exactamente uno por país. Alternativa: destacar todos los marcados. | Abierta | Humano (G2) |
| Q-02.2 | Cada plan tiene su propia moneda (regla 1), pero el precio se muestra en la moneda del país (regla 3). ¿Qué pasa si no coinciden? | No mostrar el plan (no se convierte; no hay motor de cambio) y registrar un aviso en consola. Si todos quedan excluidos, se muestra el estado vacío. Alternativas: mostrarlo en su moneda (contradice la regla 3) o mostrarlo con un aviso. | Bloqueante | Humano (G2) |
| Q-02.3 | El PDF solo dice "may be adjusted by a simulated rule based on the step 1 data. The rule is documented". ¿Cuáles son las entradas, los factores, las bandas, el redondeo y qué es configurable? | Algoritmo y valores de §6.3: dos operandos fijos en código (`vehicleAge` a partir de un año, `ageInYears` a partir de una fecha); bandas inclusivas y multiplicadores por país en Strapi; producto de factores y un único `Math.round` final. Nombre y forma del content type: Software Architect (G3). | Bloqueante | Humano (G2) · ADR de precio (G3) |
| Q-02.4 | La regla depende de campos del paso 1 que el negocio puede eliminar o renombrar desde Strapi (US-01). ¿Qué pasa con el precio? | Factor neutro (1) para ese campo, sin bloquear ni avisar al usuario final; el resto de factores se aplica. El vínculo es por la `key` estable del campo de US-01, no por la etiqueta. Requiere que US-01 exponga los valores por `key` (referencia cruzada `specs/US-01/spec.md`). Alternativas: ocultar precios o bloquear el paso. | Bloqueante | Humano (G2) |
| Q-02.5 | ¿Con qué fecha y zona horaria se calculan la edad del vehículo y la del tomador? US-01 permite un vehículo del año siguiente: su "edad" sería −1. | Fecha de referencia date-only, la misma fuente de "hoy" que use US-01 (reloj inyectable para tests); edad del tomador con la misma función que la mayoría de edad de US-01; edad del vehículo = `max(0, año de referencia − año del vehículo)`. Referencia cruzada `specs/US-01/spec.md`. | Abierta | Humano (G2) |
| Q-02.6 | ¿Cómo se redondea el precio final? ¿A la unidad, a múltiplos de 100 (COP) o de 10 (CLP)? | Redondeo a unidad entera con `Math.round` (mitad hacia arriba para importes positivos), una sola vez al final. Sin múltiplos comerciales. | Abierta | Humano (G2) |
| Q-02.7 | ¿Qué pasa si los factores están mal configurados (multiplicador 0, negativo o vacío; `min` > `max`; bandas solapadas)? | Descartar la banda inválida antes de evaluar; con solapes gana la primera en el orden configurado; ninguna coincide → factor 1. Aviso en consola, nunca error al usuario. | Abierta | Humano (G2) |
| Q-02.8 | El PDF pide "configured order" pero no define empates ni planes sin `order`. | Ascendente por `order`; empate → nombre con `localeCompare` en el locale del país; empate → `documentId`; `order` nulo al final. | Abierta | Humano (G2) |
| Q-02.9 | ¿Qué hace la app con planes mal formados desde Strapi (sin nombre, precio base nulo, ≤ 0 o no numérico, coberturas o beneficios vacíos)? | Sin nombre o con precio inválido → plan descartado y aviso en consola. Coberturas o beneficios vacíos o nulos → plan visible sin esa sección. Un precio base de 0 se trata como inválido. | Abierta | Humano (G2) |
| Q-02.10 | ¿Qué significa "I completed the step 1 form" y qué pasa si se entra al paso 2 por URL sin haberlo hecho, o con datos del paso 1 que ya no cumplen la configuración actual? | US-01 persiste una señal de "paso 1 completado" junto a los datos, en el espacio del país (D6). Sin señal → redirección al paso 1 del mismo país, sin pedir planes. La revalidación de datos antiguos frente a una configuración nueva la define US-01. Referencia cruzada `specs/US-01/spec.md`. | Bloqueante | Humano (G2), coordinado con US-01 |
| Q-02.11 | El plan elegido y persistido deja de estar activo o publicado (o cambia de moneda). ¿Qué ve el usuario en el paso 2 y en el resumen? | En el paso 2: se descarta la selección y se muestra un aviso anunciado (REQ-02.17). En el paso 3: US-03 debe detectarlo y devolver al paso 2 (referencia cruzada `specs/US-03/spec.md`). | Bloqueante | Humano (G2), coordinado con US-03 |
| Q-02.12 | ¿Qué entrega US-02 a US-03: solo el identificador del plan o una copia (snapshot) con nombre y precio final? | Persistir solo `documentId`. US-03 vuelve a pedir el plan y recalcula el precio con la misma función pura (REQ-02.18). Ventaja: no hay precios ni textos obsoletos en el navegador. Consecuencia: si el negocio cambia el precio entre el paso 2 y el 3, el resumen muestra el precio vigente. Alternativa: snapshot y precio "congelado" en la selección. Referencia cruzada `specs/US-03/spec.md`. | Bloqueante | Humano (G2), coordinado con US-03 |
| Q-02.13 | CLAUDE.md §11 dice que los textos visibles vienen de Strapi, pero el mensaje de error (y el de carga) se muestra justo cuando Strapi no responde. ¿De dónde salen esos textos? | Excepción documentada: los textos de carga y error de conexión, por locale (`es-CO`, `es-CL`), fijos en código. El resto de textos del paso (título, leyenda, "recomendado", botones, vacío, plan no disponible, "elige un plan") viene de Strapi por país. Dónde se modelan lo decide el Software Architect. Si falta un texto en Strapi, se usa el texto por defecto del código. Es una excepción a una regla de CLAUDE.md, así que exige aprobación explícita. | Bloqueante | Humano (G2) |
| Q-02.14 | ¿El botón "continuar" está deshabilitado hasta que se elige un plan, o habilitado con validación al pulsarlo? | Habilitado. Al pulsarlo sin selección se muestra un mensaje asociado al grupo (`aria-describedby`) y el foco va al grupo (AC-02.18). Un botón `disabled` no recibe foco y no explica por qué no se puede avanzar. Alternativa: `aria-disabled="true"` con texto de ayuda. | Abierta | Humano (G2) |
| Q-02.15 | La REST API de Strapi pagina por defecto (25 elementos). Con más planes, la lista se truncaría en silencio. | Pedir con un tamaño de página explícito y recorrer las páginas restantes si `pageCount > 1`. El tamaño exacto y el contrato los fija el Software Architect. | Abierta | Humano (G2) · ADR (G3) |
| Q-02.16 | ¿Se muestra solo el precio final o también el precio base y el desglose del ajuste? | Solo el precio final, que es el que pide el PDF ("with price"). La regla queda documentada en §6.3 y en `docs/architecture/`. Alternativa: mostrar el precio base tachado si difiere del final. | Abierta | Humano (G2) |

## 6. Datos y contratos

Nombres de content types, campos, rutas y claves de almacenamiento: **pendientes** del Software Architect (`docs/architecture/content-model.md`, contratos de API y ADRs, G3). Esta sección fija qué información se necesita, no cómo se modela.

### 6.1 Lo que se consume de Strapi (solo lectura, D4)

| Dato | Origen | Uso en US-02 |
|---|---|---|
| País: código (`co`, `cl`), locale (`es-CO`, `es-CL`), moneda (`COP`, `CLP`) | `Country` (D3) | REQ-02.1, REQ-02.6, REQ-02.7 |
| Plan: nombre, descripción corta, precio base, moneda, coberturas, beneficios, `order`, recomendado, activo, país, `documentId`, estado de publicación | Plan (PDF, regla 1) | REQ-02.1 a REQ-02.5, REQ-02.25 |
| Factores de precio del país: `fieldKey`, operando, `min`, `max`, multiplicador, orden | A definir (D8, Q-02.3) | REQ-02.8 a REQ-02.12 |
| Textos del paso por país | A definir (Q-02.13) | REQ-02.32 |

### 6.2 Lo que se lee y escribe en el navegador (`sessionStorage`, por país, D6)

| Clave (lógica) | Quién escribe | Quién lee | Contenido |
|---|---|---|---|
| Datos del paso 1 + señal de completado | US-01 | US-02 (guard y precio), US-03 | Valores por `key` de campo (Q-02.4, Q-02.10) |
| Plan elegido | US-02 | US-02 (restaurar), US-03 | `documentId` del plan (Q-02.12) |

No se persisten el catálogo de planes, los precios ni los factores (REQ-02.23).

### 6.3 Regla de precio simulada (propuesta para Q-02.3)

**Firma conceptual (función pura):**
`computeFinalPrice(basePrice, step1Values, factorRules, referenceDate) → { finalPrice: integer, appliedFactors: [...] }`

**Entradas:**

- `basePrice`: precio base del plan (número > 0, en la moneda del país).
- `step1Values`: valores del paso 1 indexados por `key` de campo (US-01).
- `factorRules`: lista ordenada de reglas del país, cada una con `fieldKey`, `operand` (`vehicleAge` | `ageInYears`), `min` (entero o vacío = sin límite), `max` (entero o vacío = sin límite) y `multiplier` (decimal > 0).
- `referenceDate`: fecha date-only inyectada (Q-02.5).

**Algoritmo:**

1. Descartar reglas inválidas (REQ-02.12): `multiplier` no finito o ≤ 0, o `min` > `max`.
2. Agrupar las reglas por (`fieldKey`, `operand`). Para cada grupo, derivar un entero `x` del valor del paso 1:
   - `vehicleAge`: `x = max(0, año(referenceDate) − año del vehículo)`.
   - `ageInYears`: años cumplidos entre la fecha del campo y `referenceDate` (misma función que la mayoría de edad de US-01).
   - Valor ausente, vacío o no interpretable → factor del grupo = 1 (REQ-02.10).
3. El factor del grupo es el `multiplier` de la **primera** regla, en el orden configurado, con `min ≤ x ≤ max` (límites inclusivos). Si ninguna coincide → 1.
4. `finalPrice = Math.round(basePrice × Π factores)` (REQ-02.11).

**Qué es configurable y qué es fijo:**

| Elemento | Dónde |
|---|---|
| Bandas, multiplicadores, campo al que aplica cada regla, orden de las reglas, por país | Strapi (sin despliegue) |
| Precio base y moneda de cada plan | Strapi |
| Tipos de operando (`vehicleAge`, `ageInYears`), composición multiplicativa, redondeo, factor neutro ante datos ausentes | Código (un operando nuevo sigue el Caso B de la Skill `country-content`) |

**Factores propuestos para el seed** (valores ficticios; `fieldKey` provisionales hasta que US-01 fije las claves reales):

| País | `fieldKey` · operando | Banda (inclusiva) | Multiplicador |
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

| # | País | Precio base | Año vehículo → edad → factor | Nacimiento → edad → factor | Precio final |
|---|---|---|---|---|---|
| E1 | CO | 1 200 000 | 2018 → 8 → 1.10 | 2000-05-10 → 26 → 1.00 | 1 320 000 |
| E2 | CO | 1 200 000 | 2027 → 0 (no −1) → 1.00 | 2005-12-01 → 20 (aún no cumple 21) → 1.20 | 1 440 000 |
| E3 | CO | 850 000 | 2006 → 20 (límite) → 1.25 | 1960-11-22 → 66 (cumple hoy, límite) → 1.15 | 1 221 875 |
| E4 | CL | 25 990 | 2012 → 14 → 1.20 | 2004-03-15 → 22 → 1.25 | 38 985 |
| E5 | CL | 25 990 | 2022 → 4 → 1.00 | campo eliminado → factor 1 | 25 990 |
| E6 | CL | 19 990 | 2017 → 9 → 1.08 | 1990-01-01 → 36 → 1.00 | 21 589 (de 21 589,2) |

## 7. Requisitos no funcionales aplicables

- **Accesibilidad:** REQ-02.26 a REQ-02.28. Semántica de radio group nativa preferida a ARIA a medida. La condición de recomendado no se transmite solo con color (WCAG 1.4.1). Foco visible y gestionado al cambiar de paso. Mensajes de estado anunciados.
- **Responsive:** REQ-02.29 (reflow a 320 px, WCAG 1.4.10; tamaño mínimo de objetivo 24 × 24 px, WCAG 2.5.8).
- **Estados de carga, vacío y error:** REQ-02.20 a REQ-02.22, y REQ-02.17 para la selección obsoleta.
- **Seguridad:** REQ-02.31 (D4). Solo `GET`, sin tokens. Los avisos de consola no incluyen datos del paso 1.
- **Determinismo de tests:** la regla de precio recibe la fecha de referencia como parámetro (REQ-02.8). El e2e fija el reloj del navegador o usa datos cuyas bandas no cambien cerca de la fecha de ejecución.
- **Configurabilidad:** ningún plan, precio, factor ni texto (salvo la excepción de Q-02.13) está en el código.

## 8. Plan de verificación

Las rutas exactas de los archivos dependen de la estructura que fije el ADR del frontend. Los nombres de test empiezan por el AC o REQ que verifican.

| AC / REQ | Tipo de test | Ubicación prevista |
|---|---|---|
| AC-02.9, AC-02.10, AC-02.11, AC-02.12, AC-02.13 (E1–E6) | Unit (función pura de precio) | `frontend/` junto a la función de precio, `*.spec.ts` |
| AC-02.8 | Unit (función pura de formato) | `frontend/`, `*.spec.ts` |
| AC-02.6, AC-02.7 | Unit (función pura de orden y recomendado) | `frontend/`, `*.spec.ts` |
| AC-02.5, AC-02.14, AC-02.15, AC-02.32 | Unit (mapper DTO → dominio y cliente) | `frontend/`, `*.spec.ts` |
| AC-02.17, AC-02.18, AC-02.19, AC-02.20, AC-02.21 | Unit (store y componente) | `frontend/`, `*.spec.ts` |
| AC-02.22 | Unit (guard) · E2E | `frontend/`, `e2e/` |
| AC-02.23, AC-02.24 | Unit (componente con cliente simulado) · E2E con red interceptada | `frontend/`, `e2e/` |
| AC-02.1, AC-02.2, AC-02.3, AC-02.4 | E2E contra el seed (AC-02.4 con red interceptada o país sin planes) | `e2e/` |
| AC-02.16, AC-02.25, AC-02.30 | E2E | `e2e/` |
| AC-02.26, AC-02.28, AC-02.29 | E2E (solo teclado; viewports 320, 375 y 1280) · Manual (G5) | `e2e/`, `docs/qa/` |
| AC-02.27 | Unit (atributos ARIA) · Manual con lector de pantalla (G5) | `frontend/`, `docs/qa/` |
| AC-02.31 | E2E (inspección de peticiones) · Review | `e2e/`, `reviews/` |
| REQ-02.13, REQ-02.32, REQ-02.33 | Review (documento de precio, origen de textos, seed) | `reviews/` |

## 9. Historial

| Versión | Fecha | Cambio | Motivo |
|---|---|---|---|
| 0.1 | 2026-11-22 | Borrador inicial | Fase 3, preparación de G2 |
