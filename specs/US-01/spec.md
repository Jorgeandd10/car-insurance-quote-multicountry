# US-01 — Policyholder and vehicle data form

| Campo | Valor |
|---|---|
| Estado | Draft |
| Versión | 0.1 |
| Autor | Requirements Analyst (subagente) |
| Aprobador | Humano (G2) |
| ADRs relacionados | Pendientes (Fase 3): ADR multipaís (D3), ADR de formularios (D5), ADR de persistencia (D6). Modelo de contenido en `docs/architecture/content-model.md` (pendiente G3) |
| Decisiones relacionadas | D3, D4, D5, D6, D7, D10 · `CLAUDE.md` §8 y §11 |

> Convenciones de esta spec:
> - Columna **Config.**: `Strapi` = lo cambia el negocio sin despliegue; `Código` = fijo en el frontend, cambiarlo exige desarrollo; `Strapi + Código` = el catálogo o la lógica están en código y los valores en Strapi; `Q-01.n` = depende de una pregunta abierta.
> - Un REQ con origen `Q-01.n (propuesta)` describe la **propuesta** de esa pregunta. Si en G2 se aprueba otra respuesta, el REQ se reescribe antes de pasar a `Approved`.
> - Los nombres de atributos (`key`, `role`, `section`, `minimumAge`...) son **orientativos**. Los nombres definitivos los fija el Software Architect en el modelo de contenido (G3).
> - Los escenarios añadidos se escriben en inglés, igual que los del PDF, para alinearlos con los nombres de los tests (`it('AC-01.n ...')`).

## 1. Historia (literal del PDF)

> As a person interested in insuring my car, I want to enter my data and my vehicle's data in a simple form, so that I receive insurance options suited to my country and my vehicle.

**Contexto (literal):** Fields change by country. In Colombia the identity document is usually the citizenship ID (cédula de ciudadanía) or foreigner ID (cédula de extranjería), and the vehicle is identified by its license plate (placa). In Chile the document is the RUT and the vehicle is identified by its license plate (patente). The business team wants to add, remove or reorder fields from Strapi without asking development for changes.

**Reglas de negocio (literales):**

1. Each field is configured in Strapi with: label, type (text, number, select, date, checkbox), required flag, validations, help text, error message, order and country.
2. Select fields (for example, make or city) get their options from Strapi.
3. The vehicle year cannot be later than next year or more than 20 years old.
4. The policyholder must be of legal age.

**Otras fuentes del PDF que aplican a esta historia (literales):**

- Paso 1, *Data form*: "Captures policyholder and vehicle data. Fields, types, validations, copy and order are configured in Strapi per country."
- Scope rules: "The same application and the same build serve Colombia and Chile." · "Changing a form field or a plan in Strapi must be reflected in the app without changing code." · "Use fictitious data only." · "Use a front-end strategy to persist the data; a database is not required."
- Technical requirements: Forms "Step 1 form generated dynamically from the Strapi configuration, with typed validations" · Security "No Strapi token with write permissions may reach the browser. Public role permissions minimal and justified" · Environment "[...] with seed data for both countries" · Accessibility "The wizard can be completed using only the keyboard, and fields have accessible labels" · Responsive "Works on mobile and desktop".
- Evaluation criteria: "loading and error state handling" · "form and plans 100% configurable from Strapi".

## 2. Alcance

**Incluido**

- Resolución del país desde la URL (D3) y comportamiento ante país ausente o desconocido.
- Carga de la configuración del formulario del país desde Strapi, con estados de carga, error, vacío y configuración mal formada.
- Render dinámico de los 5 tipos de campo, en el orden configurado, con label, help text, required, validaciones tipadas y mensaje de error.
- Reglas de negocio de año del vehículo y mayoría de edad.
- Bloqueo del avance al paso 2 mientras haya errores; avance cuando el formulario es válido.
- Persistencia por país en `sessionStorage` (D6) y reconciliación de datos guardados con la configuración actual.
- Contrato de salida que US-02 (precio) y US-03 (resumen, enmascarado) consumen.
- Accesibilidad (etiquetas, errores asociados, teclado, foco, anuncios) y responsive del paso 1.
- Seed de campos para CO y CL (contenido mínimo que ejercita la historia).

**Fuera de alcance**

- Lista de planes, selección y cálculo de precio (US-02). Resumen, enmascarado del documento, términos y pago (US-03).
- Validaciones entre campos (p. ej., patrón del número según el tipo de documento), campos condicionales, valores por defecto y placeholders: el PDF no los lista entre los atributos de un campo (ver Q-01.17).
- Validación del documento contra registros oficiales.
- Traducción a otros idiomas: CO y CL usan español; los textos vienen de Strapi por país.

## 3. Requisitos

### A. País y carga de la configuración

| ID | Requisito verificable | Origen | Config. | Verificación |
|---|---|---|---|---|
| REQ-01.1 | La app obtiene el país del primer segmento de la URL (`/co`, `/cl`) y solicita a Strapi **solo** la configuración de ese país. El mismo build sirve ambos países. | D3; AC del PDF "Form configured by country"; scope rule 1 | Países: Strapi (`Country`). Mecanismo de ruta: Código | Unit · E2E |
| REQ-01.2 | En `/` se muestra una selección de país con los países publicados en Strapi. Con un código desconocido, no publicado o con mayúsculas distintas se aplica la propuesta de Q-01.1 (página "país no disponible" con enlace a la selección; `/CO` redirige a `/co`). Ninguno de estos casos cuenta como paso del wizard (D7). | Q-01.1 (propuesta) | Lista de países: Strapi. Comportamiento: Código | E2E |
| REQ-01.3 | Mientras se obtiene la configuración se muestra un estado de carga; no se muestra un formulario parcial ni el botón de continuar. | Criterios de evaluación ("loading and error state handling"); `CLAUDE.md` §8 | Código (texto: Q-01.6) | Unit · E2E |
| REQ-01.4 | Si la obtención de la configuración falla (sin red, timeout, HTTP 4xx/5xx o respuesta no interpretable) se muestra un mensaje de error con una acción "reintentar" que repite la petición. No se muestra el formulario ni se puede avanzar. | Criterios de evaluación; `CLAUDE.md` §8 | Código (texto: Q-01.6) | Unit · E2E (interceptando la red) |
| REQ-01.5 | Si el país no tiene ningún campo publicado y válido, se muestra un estado vacío con un mensaje configurado en Strapi y no se puede avanzar. | Q-01.12 (propuesta) | Mensaje: Strapi | Unit · E2E |
| REQ-01.6 | La configuración se lee de Strapi en cada carga de la aplicación, sin caché persistente en el navegador (ni `localStorage`, ni `sessionStorage`, ni service worker). Solo se usan entradas **publicadas**; los borradores no aparecen. | AC del PDF "Configuration change without deployment"; scope rule 2; Q-01.20 (propuesta) | Código | E2E · Manual · Review |
| REQ-01.7 | La configuración mal formada se trata según la tabla de Q-01.11: un campo inválido se omite con un aviso en consola; una validación inválida se ignora sin perder el campo. La app no falla por un dato inesperado de Strapi. | Lista de huecos §3 ("datos vacíos, nulos o mal formados"); Q-01.11 (propuesta) | Código | Unit (mapper) |

### B. Render del formulario

| ID | Requisito verificable | Origen | Config. | Verificación |
|---|---|---|---|---|
| REQ-01.8 | Se muestran solo los campos publicados del país activo, en orden ascendente por `order`. Los empates y los `order` vacíos se resuelven de forma determinista (Q-01.11: vacíos al final, desempate por identificador). | Regla 1; AC del PDF "Form configured by country"; contexto ("add, remove or reorder") | Strapi | Unit · E2E |
| REQ-01.9 | Cada campo muestra el label y, si existe, el help text configurados. Ningún label ni help text de campo está en el código. | Regla 1; paso 1 ("copy [...] configured in Strapi") | Strapi | Unit · E2E |
| REQ-01.10 | Tipos soportados: `text`, `number`, `select`, `date` y `checkbox`. Cada tipo usa un control con la semántica nativa equivalente (detalle de implementación pendiente del ADR de formularios, D5). El catálogo de tipos es fijo en código; el tipo de cada campo se configura en Strapi. | Regla 1; requisito técnico Forms | Strapi + Código | Unit · E2E |
| REQ-01.11 | Los campos `select` muestran las opciones configuradas en Strapi para ese campo y país, en el orden configurado. Se guarda el **valor** estable de la opción, no su etiqueta; la etiqueta se resuelve con la configuración vigente. | Regla 2 | Strapi | Unit · E2E |
| REQ-01.12 | Los campos se agrupan en las secciones "asegurado" y "vehículo" (grupos con leyenda accesible), según la sección asignada en Strapi. | Paso 1 ("policyholder and vehicle data"); US-03 regla 1 (el resumen separa ambos); Q-01.4 (propuesta) | Sección del campo y leyenda: Strapi. Catálogo de secciones: Código | Unit · E2E |
| REQ-01.13 | Los textos de interfaz del paso 1 (título del paso, botón continuar, mensaje de estado vacío, mensaje de error genérico) vienen de Strapi por país. Excepción: los textos que se muestran antes de tener la configuración del país (carga, error de carga, selección de país), según Q-01.6. | Paso 1 ("copy"); `CLAUDE.md` §11; Q-01.6 | Strapi (excepción: Código, Q-01.6) | E2E · Review |

### C. Validación y avance

| ID | Requisito verificable | Origen | Config. | Verificación |
|---|---|---|---|---|
| REQ-01.14 | Un campo marcado como obligatorio se indica de forma visual y programática. Está vacío (y por tanto inválido) si no tiene valor; en `text`, un valor de solo espacios cuenta como vacío; en `checkbox`, obligatorio significa "marcado" (Q-01.16). | Regla 1 (required flag); Q-01.16 (propuesta) | Strapi | Unit · E2E |
| REQ-01.15 | Cada campo admite validaciones **tipadas** de un catálogo cerrado por tipo de campo (Q-01.5). El negocio elige en Strapi qué validaciones aplica y con qué parámetros. Una validación que no corresponde al tipo del campo se ignora (REQ-01.7). | Regla 1 (validations); requisito técnico "typed validations"; Q-01.5 (propuesta) | Catálogo: Código. Asignación y parámetros: Strapi | Unit · E2E |
| REQ-01.16 | Cuando un campo no cumple su validación, el mensaje de error configurado se muestra junto al campo, asociado programáticamente a él y con el campo marcado como inválido. Se muestra cuando el campo pierde el foco con un valor inválido o al intentar avanzar (Q-01.10). Si el mensaje configurado está vacío se usa el mensaje genérico del país (REQ-01.13). | AC del PDF "Field validation"; regla 1 (error message); Q-01.10 (propuesta) | Texto: Strapi. Momento de mostrarlo: Código | Unit · E2E |
| REQ-01.17 | Mientras algún campo sea inválido no se puede pasar al paso 2. Al intentarlo se muestran todos los errores, el foco va al primer campo inválido (en el orden configurado) y la URL no cambia. | AC del PDF "Field validation"; `CLAUDE.md` §8 (foco) | Código | Unit · E2E |
| REQ-01.18 | Con el formulario válido, la acción continuar guarda los datos (REQ-01.23) y navega al paso 2 del mismo país. El nombre de la ruta lo fija el ADR multipaís. | Alcance del PDF (paso 1 → paso 2); D7 | Código | E2E |

### D. Reglas de negocio

| ID | Requisito verificable | Origen | Config. | Verificación |
|---|---|---|---|---|
| REQ-01.19 | Año del vehículo: válido si y solo si `añoActual − 20 ≤ año ≤ añoActual + 1`, con ambos límites **inclusivos** y `añoActual` = año calendario de la fecha local del dispositivo. Solo enteros. Se aplica al campo identificado como año del vehículo (Q-01.3). | Regla 3; Q-01.9 (propuesta) | Q-01.2 (propuesta: límites 20 y +1 fijos en código) | Unit · E2E |
| REQ-01.20 | Mayoría de edad: la edad en años cumplidos a la fecha local del dispositivo debe ser `≥ edadMínima` del país. El día del cumpleaños cuenta como cumplido. Una fecha futura es inválida. Para quien nació el 29 de febrero, en años no bisiestos el cumpleaños cuenta desde el 1 de marzo. Se aplica al campo identificado como fecha de nacimiento (Q-01.3). | Regla 4; Q-01.8 (propuesta) | Q-01.2 (propuesta: edad mínima por país en Strapi, seed 18 en CO y CL) | Unit · E2E |
| REQ-01.21 | Las fechas se guardan y comparan como fecha de calendario `YYYY-MM-DD`, sin conversión de zona horaria. Los validadores de edad y año son funciones puras que reciben la fecha de referencia ("hoy") como parámetro, para que los tests sean deterministas. | Lista de huecos §3 (zona horaria, prueba determinista); `CLAUDE.md` §8 (funciones puras) | Código | Unit (incluida la zona `America/Bogota`) · E2E (reloj fijado) |
| REQ-01.22 | Las reglas de REQ-01.19 y REQ-01.20 no se pueden desactivar desde Strapi. Si en la configuración publicada del país falta el campo del que depende una regla, se aplica la propuesta de Q-01.7: estado de "formulario no disponible" sin poder avanzar y aviso en consola. Si varios campos tienen el mismo rol, la regla se aplica a todos. | Reglas 3 y 4; lista de huecos §3 ("si el negocio elimina o renombra un campo"); Q-01.2 y Q-01.7 (propuesta) | Q-01.2 | Unit · E2E |

### E. Persistencia

| ID | Requisito verificable | Origen | Config. | Verificación |
|---|---|---|---|---|
| REQ-01.23 | Los valores del paso 1 se guardan en `sessionStorage`, separados por país, con cada cambio de valor (Q-01.15). Al volver del paso 2 al paso 1 (con la acción de la app o con el "atrás" del navegador) los valores siguen cargados. | AC del PDF "Keep data when going back"; scope rule (persistencia en el front); D6; Q-01.15 (propuesta) | Código | Unit · E2E |
| REQ-01.24 | Al recargar la página en la misma pestaña, los valores del paso 1 se restauran. En una pestaña nueva el formulario empieza vacío. | D6 | Código | E2E |
| REQ-01.25 | Los datos de un país nunca se muestran ni se usan en otro: `/co` y `/cl` tienen almacenamientos independientes. | D6; D3 | Código | Unit · E2E |
| REQ-01.26 | Al restaurar, los datos guardados se reconcilian con la configuración vigente según la tabla de Q-01.14: se descartan los valores de campos eliminados, de opciones eliminadas o de campos con tipo cambiado; los campos nuevos empiezan vacíos; el resto se conserva y se revalida con las reglas actuales. Un almacenamiento corrupto se descarta sin romper la app. | Lista de huecos §3 ("datos persistidos que ya no coinciden"); `country-content` (comprobaciones comunes); Q-01.14 (propuesta) | Código | Unit · E2E |

### F. Contrato para US-02 y US-03

| ID | Requisito verificable | Origen | Config. | Verificación |
|---|---|---|---|---|
| REQ-01.27 | US-01 expone, por país, el resultado del paso 1: para cada campo vigente, su identificador, tipo, sección, rol (si tiene), valor y valor visible (etiqueta de la opción en `select`), y un indicador `isComplete` que es verdadero solo si los datos guardados son válidos con la configuración y las reglas vigentes. | US-02 regla 4 (precio según los datos del paso 1); US-03 regla 1 (resumen); Q-01.3, Q-01.4, Q-01.18 | Código | Unit |
| REQ-01.28 | Los campos con datos que otras historias necesitan se identifican por un **rol** asignado en Strapi a partir de un catálogo fijo en código: como mínimo `documentNumber` (US-03 lo enmascara), `birthDate` (REQ-01.20) y `vehicleYear` (REQ-01.19). Los roles que US-02 necesite para el precio se añaden al catálogo desde la spec de US-02. | US-03 regla 2 ("document number [...] partially masked"); reglas 3 y 4; Q-01.3 (propuesta) | Rol del campo: Strapi. Catálogo de roles: Código | Unit |

### G. Accesibilidad y responsive

| ID | Requisito verificable | Origen | Config. | Verificación |
|---|---|---|---|---|
| REQ-01.29 | Cada control tiene un `<label>` visible asociado. El help text y el mensaje de error se asocian con `aria-describedby`; el campo inválido lleva `aria-invalid="true"`; el obligatorio se marca programáticamente. Cada sección es un grupo con leyenda. | Requisito técnico Accessibility; `CLAUDE.md` §8 | Código | Unit (DOM) · E2E (`getByLabel`) · Manual (G5) |
| REQ-01.30 | El paso 1 se completa solo con teclado: todos los campos, las opciones de los `select`, los `checkbox`, continuar y reintentar. El orden de tabulación coincide con el orden visual (el configurado), sin `tabindex` positivos, y el foco siempre es visible. Enter en un campo de texto envía el formulario (equivale a continuar). | Requisito técnico Accessibility | Código | E2E (solo teclado) · Manual (G5) |
| REQ-01.31 | Al entrar al paso 1 (carga inicial, vuelta desde el paso 2 o reintento con éxito) el foco va al encabezado del paso. | `CLAUDE.md` §8 ("foco gestionado al cambiar de paso"); Q-01.19 | Código | E2E · Manual (G5) |
| REQ-01.32 | Los cambios de estado de carga, error y vacío se anuncian a los lectores de pantalla (región viva o `role="alert"`). | `CLAUDE.md` §8; requisito técnico Accessibility | Código | Unit (DOM) · Manual (G5) |
| REQ-01.33 | El paso 1 funciona sin scroll horizontal desde 320 px CSS de ancho hasta escritorio; en pantallas estrechas los campos van en una sola columna. | Requisito técnico Responsive | Código | E2E (viewport 320 y 1280) · Manual (G5) |

### H. Seed y seguridad

| ID | Requisito verificable | Origen | Config. | Verificación |
|---|---|---|---|---|
| REQ-01.34 | El seed incluye un formulario para CO y otro para CL con datos ficticios que, en conjunto, usan los 5 tipos de campo y contienen: documento (CO: tipo de documento con cédula de ciudadanía y cédula de extranjería, más número; CL: RUT), placa (CO) o patente (CL), marca y ciudad como `select`, fecha de nacimiento y año del vehículo. | Contexto (literal); regla 2; requisito técnico Environment ("seed data for both countries") | Strapi (seed) | E2E · Manual |
| REQ-01.35 | La configuración se obtiene con peticiones de solo lectura a los endpoints públicos permitidos (D4): ninguna petición del navegador lleva token de Strapi. | Requisito técnico Security; D4; `CLAUDE.md` §6 | Código + permisos en Strapi | E2E (inspección de red) · Review |

## 4. Criterios de aceptación

### Escenarios del PDF (literales)

```gherkin
# AC-01.1
Scenario: Form configured by country
  Given fields are configured in Strapi for Colombia and for Chile
  When I open the application in the context of a country
  Then I see only the fields configured for that country, in the defined order

# AC-01.2
Scenario: Field validation
  Given I am filling out the form
  When a field does not meet its configured validation
  Then I see the configured error message next to the field
  And I cannot move to the next step

# AC-01.3
Scenario: Configuration change without deployment
  Given the business team adds a new published field in Strapi
  When I reload the application
  Then the new field appears without code changes

# AC-01.4
Scenario: Keep data when going back
  Given I moved on to step 2
  When I go back to step 1
  Then my data is still filled in
```

### Escenarios añadidos por la spec

Las fechas de ejemplo suponen `today = 2026-11-22` y edad mínima 18, salvo que el escenario diga otra cosa. En los tests la fecha se fija (REQ-01.21).

```gherkin
# AC-01.5 — origen: Q-01.1
Scenario: Root URL without country
  Given Colombia and Chile are published in Strapi
  When I open "/"
  Then I see a country selection listing Colombia and Chile
  And choosing Chile takes me to step 1 of "/cl"

# AC-01.6 — origen: Q-01.1
Scenario Outline: Unknown or unavailable country code
  When I open "<url>"
  Then <result>

  Examples:
    | url | result                                                              |
    | /pe | I see a "country not available" page with a link to the selection   |
    | /CO | I am redirected to "/co"                                            |

# AC-01.7 — origen: REQ-01.3, REQ-01.32
Scenario: Loading the form configuration
  Given the form configuration request for my country has not answered yet
  When I open step 1
  Then I see a loading state announced to assistive technologies
  And I see neither form fields nor the continue button

# AC-01.8 — origen: REQ-01.4, REQ-01.32
Scenario: Error loading the form configuration and retry
  Given the form configuration request fails
  When I open step 1
  Then I see an error message announced to assistive technologies
  And I see a retry action and no continue button
  When the service is available again and I activate retry
  Then the form is shown with the fields of my country

# AC-01.9 — origen: Q-01.12
Scenario: Country without configured fields
  Given my country has no published fields in Strapi
  When I open step 1
  Then I see the empty-state message configured for my country
  And I cannot move to the next step

# AC-01.10 — origen: contexto del PDF ("add, remove or reorder fields")
Scenario: Field removed and fields reordered without deployment
  Given the business team unpublishes field "A" and swaps the order of fields "B" and "C" in Strapi
  When I reload the application
  Then field "A" is not shown
  And field "C" appears before field "B"

# AC-01.11 — origen: REQ-01.6
Scenario: Draft fields are not shown
  Given a field for my country is saved as draft but not published in Strapi
  When I open step 1
  Then that field is not shown

# AC-01.12 — origen: REQ-01.9, REQ-01.10
Scenario Outline: Each field type is rendered with its configured copy
  Given a published field of type "<type>" with a label and help text
  When I open step 1
  Then I see a <control> with that label
  And the help text is associated with the control

  Examples:
    | type     | control                  |
    | text     | text input               |
    | number   | numeric input            |
    | select   | list of options          |
    | date     | date input               |
    | checkbox | checkbox                 |

# AC-01.13 — origen: regla 2
Scenario: Select options come from Strapi
  Given the select field "make" has the options "Marca A", "Marca B" in that order in Strapi
  When I open the options of "make"
  Then I see exactly "Marca A" and "Marca B" in that order
  When the business adds the option "Marca C" and I reload
  Then "Marca C" is offered without code changes

# AC-01.14 — origen: regla 1 (required flag)
Scenario: Required field left empty
  Given a required text field
  When I leave it empty or with only spaces and try to continue
  Then I see its configured error message next to it
  And I stay on step 1

# AC-01.15 — origen: Q-01.5
Scenario Outline: Typed validation configured in Strapi
  Given a "<type>" field configured with the validation "<validation>"
  When I enter "<value>" and leave the field
  Then the field is <state>

  Examples:
    | type   | validation           | value   | state   |
    | text   | pattern ^[A-Z]{3}\d{3}$ | ABC123 | valid   |
    | text   | pattern ^[A-Z]{3}\d{3}$ | ABC12  | invalid |
    | text   | maxLength 5          | ABCDEF  | invalid |
    | number | min 1                | 0       | invalid |
    | number | integer              | 2.5     | invalid |

# AC-01.16 — origen: REQ-01.17
Scenario: Focus goes to the first invalid field when trying to continue
  Given the second and fourth fields in the configured order are invalid
  When I activate continue
  Then all error messages are shown
  And the focus is on the second field
  And the URL is still step 1

# AC-01.17 — origen: regla 3, Q-01.9
Scenario Outline: Vehicle year limits
  Given today is "2026-11-22"
  When I enter "<year>" in the vehicle year field and try to continue
  Then the vehicle year is <state>

  Examples:
    | year | state   |
    | 2005 | invalid |
    | 2006 | valid   |
    | 2026 | valid   |
    | 2027 | valid   |
    | 2028 | invalid |

# AC-01.18 — origen: regla 4, Q-01.8
Scenario Outline: Policyholder of legal age
  Given today is "<today>" and the minimum age of my country is 18
  When I enter "<birthDate>" as birth date and try to continue
  Then the birth date is <state>

  Examples:
    | today      | birthDate  | state   |
    | 2026-11-22 | 2008-11-22 | valid   |
    | 2026-11-22 | 2008-11-23 | invalid |
    | 2026-11-22 | 2026-11-23 | invalid |
    | 2026-02-28 | 2008-02-29 | invalid |
    | 2026-03-01 | 2008-02-29 | valid   |

# AC-01.19 — origen: REQ-01.21 (zona horaria)
Scenario: Dates are not shifted by the time zone
  Given the device time zone is "America/Bogota"
  And the local date-time is "2026-11-22 20:00" (UTC "2026-11-23 01:00")
  When I enter "2008-11-23" as birth date
  Then the birth date is invalid because I am 17 on my local date
  And the stored value is exactly "2008-11-23"

# AC-01.20 — origen: Q-01.2, Q-01.7
Scenario: A field required by a business rule is missing in the configuration
  Given the published configuration of my country has no field with role "birthDate"
  When I open step 1
  Then I see a "form not available" state and cannot move to the next step
  And a configuration warning is logged in the console

# AC-01.21 — origen: D6
Scenario: Reload keeps step 1 data in the same tab
  Given I filled some fields of step 1
  When I reload the page
  Then the fields keep their values
  When I open the application in a new tab
  Then step 1 is empty

# AC-01.22 — origen: D6, D3
Scenario: Data is separated by country
  Given I filled step 1 in "/co"
  When I open "/cl"
  Then the Chile form is empty
  When I go back to "/co"
  Then my Colombia data is still filled in

# AC-01.23 — origen: Q-01.14
Scenario: Stored data after a field or option is removed in Strapi
  Given I saved a value for field "A" and the option "Marca B" for "make"
  And the business unpublishes field "A" and removes the option "Marca B"
  When I reload the application
  Then field "A" is not shown and its value is discarded
  And "make" is empty and must be selected again

# AC-01.24 — origen: Q-01.14
Scenario: Stored value no longer meets a changed validation
  Given I saved "ABC12" in a text field whose configuration had no pattern
  And the business adds the pattern ^[A-Z]{3}\d{3}$ to that field
  When I reload the application and try to continue
  Then the value "ABC12" is still shown
  And I see the configured error message next to the field

# AC-01.25 — origen: Q-01.11
Scenario: Malformed field configuration is skipped
  Given my country has a published field with an unknown type and another without label
  When I open step 1
  Then both fields are skipped and the rest of the form works
  And a warning is logged in the console for each skipped field

# AC-01.26 — origen: requisito técnico Accessibility
Scenario: Accessible labels and descriptions
  Given step 1 is shown
  Then every control can be found by its visible label
  And each control with help text references it with aria-describedby
  And each invalid control has aria-invalid="true" and references its error message
  And each section is a group with an accessible name

# AC-01.27 — origen: requisito técnico Accessibility, REQ-01.31
Scenario: Complete step 1 using only the keyboard
  Given I open step 1 of my country
  Then the focus is on the step heading
  When I fill every field, choose select options and toggle checkboxes using only the keyboard
  And I press Enter in a text field
  Then I move to step 2 without using a pointer

# AC-01.28 — origen: requisito técnico Responsive
Scenario Outline: Step 1 on mobile and desktop
  Given the viewport is <width> CSS pixels wide
  When I open step 1
  Then there is no horizontal scroll and every field and the continue button are visible and usable

  Examples:
    | width |
    | 320   |
    | 1280  |

# AC-01.29 — origen: REQ-01.27, REQ-01.28 (contrato para US-02 y US-03)
Scenario: Step 1 result exposed to the next steps
  Given I completed step 1 of "/co" with valid data
  Then the step 1 result marks the field with role "documentNumber" as the document
  And it gives the option label, not only the value, for each select
  And it reports the result as complete
  When the business makes one of my stored values invalid and I reload
  Then the step 1 result is reported as incomplete

# AC-01.30 — origen: D4, requisito técnico Security
Scenario: No Strapi token reaches the browser
  When I load step 1 of any country
  Then every request to the content API is a GET without an Authorization header

# AC-01.31 — origen: paso 1 ("copy"), CLAUDE.md §11
Scenario: Step copy comes from Strapi
  Given the business changes the continue button text for Chile in Strapi
  When I reload "/cl"
  Then the continue button shows the new text
  And the Colombia button text is unchanged

# AC-01.32 — origen: REQ-01.18
Scenario: Continue with a valid form
  Given every field of step 1 is valid
  When I activate continue
  Then I am on step 2 of the same country
  And my step 1 data is stored for that country

# AC-01.33 — origen: Q-01.16
Scenario: Required checkbox
  Given a required checkbox field
  When I leave it unchecked and try to continue
  Then I see its configured error message next to it
  And I stay on step 1

# AC-01.34 — origen: contexto del PDF, requisito técnico Environment
Scenario Outline: Seed form for each country
  Given the project was started with the seed data
  When I open "<url>"
  Then I see a document field, a <plate> field, make and city selects, a birth date and a vehicle year
  And the form uses the types text, number, select, date and checkbox

  Examples:
    | url | plate             |
    | /co | placa             |
    | /cl | patente           |
```

| AC | Escenario | REQ cubiertos |
|---|---|---|
| AC-01.1 | Form configured by country (PDF) | REQ-01.1, REQ-01.8 |
| AC-01.2 | Field validation (PDF) | REQ-01.15, REQ-01.16, REQ-01.17 |
| AC-01.3 | Configuration change without deployment (PDF) | REQ-01.6, REQ-01.8 |
| AC-01.4 | Keep data when going back (PDF) | REQ-01.23 |
| AC-01.5 | Root URL without country | REQ-01.2 |
| AC-01.6 | Unknown or unavailable country code | REQ-01.2 |
| AC-01.7 | Loading the form configuration | REQ-01.3, REQ-01.32 |
| AC-01.8 | Error loading and retry | REQ-01.4, REQ-01.32, REQ-01.31 |
| AC-01.9 | Country without configured fields | REQ-01.5 |
| AC-01.10 | Field removed and reordered without deployment | REQ-01.6, REQ-01.8 |
| AC-01.11 | Draft fields are not shown | REQ-01.6 |
| AC-01.12 | Each field type rendered with its copy | REQ-01.9, REQ-01.10 |
| AC-01.13 | Select options come from Strapi | REQ-01.11 |
| AC-01.14 | Required field left empty | REQ-01.14, REQ-01.16 |
| AC-01.15 | Typed validation configured in Strapi | REQ-01.15, REQ-01.16 |
| AC-01.16 | Focus on first invalid field | REQ-01.17 |
| AC-01.17 | Vehicle year limits | REQ-01.19, REQ-01.21 |
| AC-01.18 | Policyholder of legal age | REQ-01.20, REQ-01.21 |
| AC-01.19 | Dates not shifted by time zone | REQ-01.21 |
| AC-01.20 | Field required by a rule is missing | REQ-01.22, REQ-01.28 |
| AC-01.21 | Reload keeps data in the same tab | REQ-01.24 |
| AC-01.22 | Data separated by country | REQ-01.25 |
| AC-01.23 | Stored data after field or option removed | REQ-01.26 |
| AC-01.24 | Stored value no longer meets changed validation | REQ-01.26 |
| AC-01.25 | Malformed field configuration skipped | REQ-01.7 |
| AC-01.26 | Accessible labels and descriptions | REQ-01.12, REQ-01.29 |
| AC-01.27 | Complete step 1 with keyboard only | REQ-01.30, REQ-01.31 |
| AC-01.28 | Step 1 on mobile and desktop | REQ-01.33 |
| AC-01.29 | Step 1 result exposed to next steps | REQ-01.27, REQ-01.28 |
| AC-01.30 | No Strapi token reaches the browser | REQ-01.35 |
| AC-01.31 | Step copy comes from Strapi | REQ-01.13 |
| AC-01.32 | Continue with a valid form | REQ-01.18, REQ-01.23 |
| AC-01.33 | Required checkbox | REQ-01.14 |
| AC-01.34 | Seed form for each country | REQ-01.34, REQ-01.10 |

## 5. Preguntas abiertas y huecos

Criterio de estado: **Bloqueante** = condiciona el modelo de contenido, un ADR o una regla de `CLAUDE.md` y debe responderse antes de G3. **Abierta** = tiene propuesta. Si G2 la aprueba sin cambios, la propuesta pasa a ser la respuesta. Todas se responden en G2.

| ID | Pregunta | Propuesta | Estado | Resuelto por |
|---|---|---|---|---|
| Q-01.1 | ¿Cómo se entra a un país? ¿Qué pasa en `/`, con un código desconocido (`/pe`), con un país existente pero despublicado o con mayúsculas (`/CO`)? | `/` muestra la selección de país con los `Country` publicados en Strapi (no es un paso del wizard, D7 intacta). Código desconocido o despublicado: página "país no disponible" con enlace a la selección. `/CO` redirige a `/co`. No se detecta el país por IP ni por el idioma del navegador. | Bloqueante (rutas, ADR multipaís) | Humano (G2) |
| Q-01.2 | ¿Mayoría de edad y año del vehículo son validaciones configurables por el negocio o reglas fijas en código? ¿La edad es 18 en ambos países? | Opción C (detalle en 5.1): la lógica de ambas reglas está en código y siempre se aplica; el campo al que se aplica se elige en Strapi mediante un rol (Q-01.3); la edad mínima es un dato del `Country` en Strapi (seed 18 en CO y CL); los límites del año (20 hacia atrás, +1) son fijos en código porque el PDF los da como números y no dependen del país. | Bloqueante (modelo de contenido) | Humano (G2) |
| Q-01.3 | ¿Cómo sabe la app qué campo es la fecha de nacimiento, el año del vehículo o el número de documento, si el negocio puede renombrar, reordenar o eliminar campos? | Catálogo cerrado de roles en código (`documentNumber`, `birthDate`, `vehicleYear`, ampliable por US-02); en Strapi el negocio asigna el rol a un campo (opcional, como mucho uno por campo). Las reglas y el enmascarado (US-03) se enlazan al rol, nunca al label ni al orden. Alternativa descartada en la propuesta: identificar por un `key` fijo, que obligaría al negocio a no tocar ese identificador. | Bloqueante (modelo de contenido; dependencias de US-02 y US-03) | Humano (G2) |
| Q-01.4 | El PDF habla de "policyholder and vehicle data" y US-03 muestra ambos por separado, pero entre los atributos de un campo no hay sección. ¿Cómo se agrupan? | Atributo de sección por campo con catálogo cerrado `policyholder` · `vehicle`. La leyenda de cada sección es un texto del país en Strapi. Dentro de cada sección se respeta `order`; las secciones van en orden fijo (asegurado, vehículo). | Bloqueante (modelo de contenido; US-03) | Humano (G2) |
| Q-01.5 | El PDF dice "validations" y "typed validations" sin decir cuáles. ¿Qué validaciones puede configurar el negocio para cada tipo? | Catálogo de 5.2: `text` admite `minLength`, `maxLength` y `pattern`; `number` admite `min`, `max` e `integer`; `select`, `date` y `checkbox` no admiten validaciones genéricas en esta versión (además de `required` y de las reglas por rol). Un tipo de validación nuevo sigue el caso B de la Skill `country-content`. | Bloqueante (modelo de contenido) | Humano (G2) |
| Q-01.6 | `CLAUDE.md` §11 dice que los textos visibles vienen de Strapi, pero los estados de carga, de error de carga y de selección de país se muestran **antes** de tener la configuración del país o cuando Strapi no responde. ¿De dónde salen esos textos? | Excepción acotada y documentada: un conjunto mínimo de textos fijos en español en el código, solo para carga, error de carga, reintento y "país no disponible". El resto (título, botón continuar, estado vacío, error genérico, leyendas de sección) viene de Strapi por país. Alternativa: un tipo único global en Strapi para los textos de la selección, que no resuelve el caso "Strapi caído". | Bloqueante (excepción a `CLAUDE.md` §11) | Humano (G2) |
| Q-01.7 | ¿Qué pasa si el negocio elimina, despublica o quita el rol al campo del que depende una regla (fecha de nacimiento, año del vehículo, documento)? ¿Y si hay dos campos con el mismo rol? | Falta un rol obligatorio (`birthDate`, `vehicleYear`, `documentNumber`): estado "formulario no disponible" con el mensaje genérico del país, sin poder avanzar y con aviso en consola; así ninguna regla del PDF se salta por configuración. Rol repetido: la regla se aplica a todos los campos con ese rol (y US-03 enmascara todos los `documentNumber`). Alternativa: mostrar el formulario sin la regla (más tolerante, pero permite cotizar a un menor de edad). | Abierta | Humano (G2) |
| Q-01.8 | Detalle de la mayoría de edad: ¿fecha de referencia y zona horaria?, ¿el día del cumpleaños cuenta?, ¿29 de febrero?, ¿fecha futura? | Fecha local del dispositivo; cálculo solo con fechas de calendario, sin horas. El día del cumpleaños cuenta como cumplido. Para el 29 de febrero, en años no bisiestos se cumple el 1 de marzo. Una fecha futura es inválida con el mismo mensaje de error del campo. | Abierta | Humano (G2) |
| Q-01.9 | Año del vehículo: ¿límites inclusivos? ¿"20 años" se cuenta con el año o con la fecha exacta? ¿Año actual según qué zona horaria? | Solo con el año: rango `[añoActual − 20, añoActual + 1]` con ambos extremos inclusivos (en 2026: de 2006 a 2027). `añoActual` según la fecha local del dispositivo. Solo enteros. | Abierta | Humano (G2) |
| Q-01.10 | El PDF define **un** mensaje de error por campo. ¿Qué se muestra si fallan varias validaciones, si el mensaje está vacío y en qué momento? | Un mensaje por campo (literal del PDF), el mismo para cualquier validación que falle, también para las reglas por rol. Si está vacío, se usa el mensaje genérico del país. Se muestra al salir del campo con un valor inválido y al intentar avanzar; no mientras se escribe. Alternativa: un mensaje opcional por validación que sustituye al del campo (más preciso, más carga para el negocio). | Abierta | Humano (G2) |
| Q-01.11 | ¿Qué pasa con datos vacíos, nulos o mal formados que vienen de Strapi? | Tabla de 5.3: omitir el campo o ignorar la validación con aviso en consola, sin romper la app. | Abierta | Humano (G2) |
| Q-01.12 | ¿Qué se muestra si un país no tiene ningún campo publicado? | Estado vacío con un mensaje del país en Strapi, sin botón continuar. Si falta también ese mensaje, se usa el texto fijo de Q-01.6. | Abierta | Humano (G2) |
| Q-01.13 | El PDF no incluye un identificador técnico del campo, pero persistir y reconciliar datos exige uno estable. ¿Qué pasa si el negocio lo cambia? | Identificador técnico por campo, único dentro del país, no visible al usuario. Cambiar el label, el orden o los textos conserva los datos; cambiar el identificador equivale a eliminar un campo y crear otro (se descarta el valor guardado). Cómo se garantiza la unicidad lo decide el modelo de contenido (G3). | Abierta (depende de G3) | Humano (G2) · Software Architect (G3) |
| Q-01.14 | ¿Qué pasa con los datos guardados en `sessionStorage` cuando la configuración cambia en Strapi (campo nuevo, eliminado, con otra validación, opción eliminada, tipo cambiado)? | Tabla de 5.4. | Abierta | Humano (G2) |
| Q-01.15 | ¿Cuándo se guarda y cuándo se borra lo del paso 1? | Se guarda con cada cambio de valor, para que una recarga no pierda lo escrito, y siempre al continuar. Se borra solo tras un pago exitoso, lo que decide US-03; nunca tras un pago rechazado (US-03, "without losing my information"). Nota: el número de documento y la fecha de nacimiento quedan en claro en `sessionStorage`; es aceptable porque los datos son ficticios, el almacenamiento dura lo que la pestaña y D6 está aprobada. | Abierta (referencia US-03) | Humano (G2) |
| Q-01.16 | Semántica de cada tipo: ¿se recortan espacios?, ¿el `pattern` debe cubrir todo el valor?, ¿qué significa obligatorio en un `checkbox`?, ¿`number` admite decimales? | `text`: se recortan los espacios inicial y final antes de validar y guardar; `pattern` siempre cubre el valor completo. `checkbox` obligatorio = debe estar marcado. `number`: admite decimales salvo que tenga la validación `integer`; el separador decimal lo resuelve el control nativo. `date`: se guarda `YYYY-MM-DD`. No se transforma a mayúsculas (la placa en minúsculas falla el patrón y el mensaje lo explica). | Abierta | Humano (G2) |
| Q-01.17 | Documentos propios de cada país: ¿hay que validar el dígito verificador del RUT? ¿El patrón del número en CO depende del tipo elegido (CC o CE)? | En esta versión, solo `pattern` configurable por campo; sin dígito verificador ni validaciones entre campos (CO usa un patrón que admite CC y CE). Si se quiere el dígito verificador, es un tipo de validación nuevo (caso B de `country-content`) y un REQ nuevo. Los patrones concretos del seed los propone el Strapi Developer con datos ficticios y se revisan en la demo. | Abierta | Humano (G2) |
| Q-01.18 | ¿Qué pasa si se abre por URL el paso 2 o 3 sin un paso 1 completo y válido? | US-01 expone `isComplete` (REQ-01.27). Propuesta para US-02 y US-03: si es falso, redirigir al paso 1 del mismo país con los datos conservados. La decisión es de las specs de US-02 y US-03. | Abierta (referencia US-02, US-03) | Humano (G2) |
| Q-01.19 | ¿Qué historia es dueña del armazón del wizard (indicador de pasos, navegación entre pasos, foco al cambiar de paso)? | US-01, porque se implementa primero; US-02 y US-03 lo reutilizan. El indicador marca el paso actual con `aria-current="step"`; sus textos vienen de Strapi. Tiene 3 pasos (D7). | Abierta (referencia US-02, US-03) | Humano (G2) |
| Q-01.20 | ¿Se vuelve a pedir la configuración al volver del paso 2 al 1, o solo al cargar la app? | Una vez por carga de la app; para ver cambios de Strapi hay que recargar, que es lo que pide el AC del PDF. Sin caché persistente en el navegador (REQ-01.6). Que no haya caché HTTP intermedia (nginx, cabeceras de Strapi) lo garantiza el ADR o el contrato de API. | Abierta (referencia ADR) | Humano (G2) · Software Architect (G3) |

### 5.1 Detalle de Q-01.2: reglas configurables o fijas

| Opción | Descripción | A favor | En contra |
|---|---|---|---|
| A. Totalmente configurable | `minAge(n)` y `yearRange(atrás, adelante)` son validaciones genéricas del catálogo; el negocio las asigna a cualquier campo en Strapi. | Máxima configurabilidad ("100% configurable") y sin roles. | El negocio puede quitar la validación o el campo y la regla del PDF deja de cumplirse sin que nadie lo note. |
| B. Totalmente fija | La lógica y los parámetros (18, 20, +1) están en código y se enlazan a un campo por rol. | Las reglas del PDF siempre se cumplen. | Cambiar la edad de un país exige despliegue, y "legal age" depende de la regulación de cada país, que el PDF señala como diferente. |
| **C. Mixta (propuesta)** | Lógica en código y siempre activa, enlazada por rol (Q-01.3). Edad mínima como dato del `Country` en Strapi; límites del año fijos en código. Si falta el campo con rol, Q-01.7. | Las reglas del PDF no se pueden saltar; lo que depende del país (edad) es configurable; lo que el PDF fija como número (20, +1) no lo es. | Más conceptos para el negocio (roles); un error de configuración deja el formulario no disponible (Q-01.7). |

### 5.2 Detalle de Q-01.5: catálogo de validaciones propuesto

| Tipo de campo | `required` | Validaciones configurables (parámetros) | Reglas por rol (siempre activas) |
|---|---|---|---|
| `text` | Sí (solo espacios = vacío) | `minLength(n)`, `maxLength(n)`, `pattern(regex, coincidencia completa)` | `documentNumber` (sin validación propia; la usa US-03) |
| `number` | Sí | `min(n)`, `max(n)`, `integer` | `vehicleYear` → REQ-01.19 |
| `select` | Sí | Ninguna (el valor debe ser una opción vigente; implícito, en código) | — |
| `date` | Sí | Ninguna en esta versión | `birthDate` → REQ-01.20 (y fecha futura inválida) |
| `checkbox` | Sí (= marcado) | Ninguna | — |

Un rol asignado a un tipo incompatible (p. ej., `birthDate` en un `text`) se trata como configuración mal formada (5.3).

### 5.3 Detalle de Q-01.11: configuración mal formada

| Caso | Propuesta |
|---|---|
| Respuesta global no interpretable (no es JSON, estructura inesperada) | Estado de error con reintento (REQ-01.4) |
| Campo con tipo desconocido o sin tipo | Se omite el campo y se avisa en consola |
| Campo sin label | Se omite el campo y se avisa en consola (no hay control accesible sin etiqueta) |
| `select` sin opciones o con opciones sin valor o sin etiqueta | Se omiten las opciones inválidas; si no queda ninguna, se omite el campo y se avisa en consola |
| Validación que no corresponde al tipo o con parámetros inválidos (regex que no compila, `min > max`, número negativo en `maxLength`) | Se ignora esa validación, se mantiene el campo y se avisa en consola |
| Rol en un tipo incompatible | Se ignora el rol y se avisa en consola; si era un rol obligatorio, aplica Q-01.7 |
| Identificador de campo repetido en el país | Se mantiene el primero por `order` y se omiten los demás con aviso en consola |
| `order` vacío o repetido | Los vacíos van al final; los empates se ordenan por identificador |
| `errorMessage` vacío | Mensaje genérico del país (REQ-01.16) |
| Help text vacío | Simplemente no se muestra |
| Campo omitido que tenía un rol obligatorio | Q-01.7 |
| Ningún campo válido tras omitir | Estado vacío (REQ-01.5) |

### 5.4 Detalle de Q-01.14: datos persistidos frente a configuración actual

| Cambio en Strapi desde que se guardó el dato | Propuesta |
|---|---|
| Campo nuevo publicado | Aparece vacío |
| Campo eliminado o despublicado | Se descarta su valor |
| Cambio de label, help text, mensaje de error, orden o sección | Se conserva el valor |
| Cambio de `required` o de validaciones | Se conserva el valor y se revalida; el error se ve al salir del campo o al intentar avanzar; `isComplete` pasa a falso si deja de cumplir |
| Opción de `select` eliminada | Se descarta el valor; el `select` queda sin elegir |
| Tipo del campo cambiado | Se descarta el valor |
| Cambio de la edad mínima del país | Se revalida la fecha de nacimiento con la nueva edad |
| Valor con un tipo inesperado (almacenamiento manipulado) | Se descarta ese valor |
| Almacenamiento del país corrupto (JSON inválido) | Se descarta todo lo del paso 1 de ese país y se avisa en consola |

## 6. Datos y contratos

Los nombres son orientativos; el modelo definitivo va en `docs/architecture/content-model.md` y los contratos en `docs/architecture/` (Software Architect, G3).

**Lo que US-01 consume de Strapi (solo lectura, D4):**

- `Country`: código (`co`, `cl`), nombre visible, locale, edad mínima (Q-01.2), textos del paso 1 (título, continuar, estado vacío, error genérico, leyendas de sección: REQ-01.13, Q-01.4). Moneda y otros datos los usan US-02 y US-03.
- Campo de formulario, relacionado con un `Country`, con los atributos del PDF (label, type, required, validations, help text, error message, order, country) más los propuestos: identificador técnico (Q-01.13), rol opcional (Q-01.3), sección (Q-01.4) y opciones para `select` (valor estable, etiqueta y orden; regla 2). Solo entradas publicadas.
- Validaciones como estructuras tipadas del catálogo de 5.2, no como texto libre.

**Lo que US-01 guarda en el navegador (D6):**

- `sessionStorage`, una entrada por país. Contiene los valores del paso 1 indexados por el identificador técnico del campo: `string` para `text` y `date` (`YYYY-MM-DD`), `number` para `number`, `boolean` para `checkbox` y el valor de la opción para `select`. No guarda la configuración de Strapi (REQ-01.6). El formato, la clave y si lleva versión de esquema los decide el ADR de persistencia.

**Lo que US-01 expone a US-02 y US-03 (REQ-01.27, REQ-01.28):**

- Por país: la lista de campos vigentes con identificador, tipo, sección, rol, valor y valor visible, más `isComplete`. US-02 la usa para el precio simulado; US-03, para el resumen (secciones asegurado y vehículo) y para enmascarar los campos con rol `documentNumber`.

## 7. Requisitos no funcionales aplicables

- **Accesibilidad:** REQ-01.29 a REQ-01.32. Labels visibles asociados, `aria-describedby` para la ayuda y el error, `aria-invalid`, grupos con leyenda por sección, operación completa con teclado, foco en el encabezado al entrar al paso y en el primer campo inválido al fallar, anuncios de carga, error y vacío. Verificación final manual en G5.
- **Responsive:** REQ-01.33. De 320 px a escritorio sin scroll horizontal.
- **Estados:** carga (REQ-01.3), error con reintento (REQ-01.4), vacío (REQ-01.5), configuración mal formada (REQ-01.7), configuración incompleta para las reglas (REQ-01.22).
- **Seguridad:** REQ-01.35. Solo GET a endpoints públicos permitidos, sin token. El `pattern` viene del admin de Strapi, operado por un equipo de confianza; una regex que no compila se ignora (5.3).
- **Determinismo:** REQ-01.21. Fecha de referencia inyectable; en e2e se fija el reloj del navegador.
- **Configurabilidad:** cualquier cambio de contenido (campo de un tipo existente, orden, textos, opciones, validaciones del catálogo, edad mínima) se ve al recargar sin cambiar código (caso A de `country-content`). Un tipo de campo, tipo de validación o rol nuevo exige código (caso B).

## 8. Plan de verificación

Las rutas exactas dependen de la estructura que fije G3; se indica la ubicación prevista.

| AC / REQ | Tipo de test | Ubicación prevista |
|---|---|---|
| AC-01.17, AC-01.18, AC-01.19 (REQ-01.19 a REQ-01.21) | Unit de funciones puras con fecha inyectada; AC-01.19 con `TZ=America/Bogota` | `frontend/**/*.spec.ts` (validadores) |
| AC-01.15, AC-01.14, AC-01.33 (REQ-01.14, REQ-01.15) | Unit del registro de validadores | `frontend/**/*.spec.ts` |
| AC-01.25, AC-01.20 (REQ-01.7, REQ-01.22), orden y desempate de REQ-01.8 | Unit del mapper DTO → dominio con respuestas de Strapi de ejemplo | `frontend/**/*.spec.ts` (mapper) |
| AC-01.23, AC-01.24, AC-01.29 (REQ-01.26 a REQ-01.28) | Unit de la reconciliación y del contrato expuesto | `frontend/**/*.spec.ts` (store) |
| AC-01.7, AC-01.8, AC-01.9 (REQ-01.3 a REQ-01.5, REQ-01.32) | Unit de componente (DOM) + E2E interceptando la red | `frontend/**/*.spec.ts`, `e2e/` |
| AC-01.1, AC-01.2, AC-01.4, AC-01.12, AC-01.13, AC-01.16, AC-01.32, AC-01.34 | E2E sobre el seed de CO y CL (el flujo completo de un país es obligatorio en el PDF) | `e2e/` |
| AC-01.3, AC-01.10, AC-01.11, AC-01.13 (segunda parte), AC-01.31 | E2E que prepara el cambio con la API de administración de Strapi **desde el proceso Node de Playwright** (credencial en `.env`, nunca en el navegador). Si G3 no lo habilita: Manual en la demo | `e2e/` o `docs/qa/manual-check.md` |
| AC-01.5, AC-01.6, AC-01.21, AC-01.22 | E2E | `e2e/` |
| AC-01.26, AC-01.27 | E2E (consultas por rol y label, solo teclado) + Manual G5 | `e2e/`, `docs/qa/manual-check.md` |
| AC-01.28 | E2E con viewport 320 y 1280 + Manual G5 en móvil | `e2e/`, `docs/qa/manual-check.md` |
| AC-01.30 | E2E (inspección de peticiones) + Review con checklist de seguridad | `e2e/`, `reviews/` |
| REQ-01.6 (sin caché persistente) | Review + E2E (AC-01.3) | `reviews/` |

## 9. Historial

| Versión | Fecha | Cambio | Motivo |
|---|---|---|---|
| 0.1 | 2026-11-22 | Borrador inicial | Fase 3, procedimiento 2.1 de `sdd-traceability` |
