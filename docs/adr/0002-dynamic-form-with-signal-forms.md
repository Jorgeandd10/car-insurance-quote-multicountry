# ADR-0002 — Formulario dinámico del paso 1 con Signal Forms

| Campo | Valor |
|---|---|
| Estado | Accepted (2026-11-22, G3) |
| Fecha | 2026-11-22 |
| Autor | Software Architect (subagente) |
| Decisores | Humano (G3) |
| Motivado por | D5, D2 · G2-1, G2-4, G2-5, G2-7, G2-13 · REQ-01.7, REQ-01.8, REQ-01.10, REQ-01.11, REQ-01.14, REQ-01.15, REQ-01.16, REQ-01.17, REQ-01.19, REQ-01.20, REQ-01.21, REQ-01.22, REQ-01.29, REQ-01.30 |

## Contexto y problema

El paso 1 se genera en tiempo de ejecución a partir de la configuración del país en Strapi: los campos, su tipo (`text`, `number`, `select`, `date`, `checkbox`), si son obligatorios, sus validaciones tipadas (catálogo G2-7), su rol (G2-1) y un único mensaje de error por campo. D5 fijó Signal Forms (`@angular/forms/signals`), que la tabla comparativa oficial marca como "Stable (v22+)". Este ADR concreta cómo construir ese formulario cuando las claves y las reglas llegan por HTTP, y qué partes de la API se usan.

## Factores de decisión

- La configuración llega de forma asíncrona y cambia sin desplegar (REQ-01.6).
- Validaciones tipadas de un catálogo cerrado, más reglas por rol siempre activas (G2-4, G2-5).
- Un mensaje por campo, visible al salir del campo o al intentar avanzar (REQ-01.16).
- Funciones puras testeables sin Angular (`CLAUDE.md` §8; REQ-01.21).
- Accesibilidad: `<label>`, `aria-describedby`, `aria-invalid`, foco en el primer campo inválido (REQ-01.17, REQ-01.29).
- Usar solo API estable en v22, sin dependencias nuevas.

## Verificación de la API (angular.dev, 2026-11-22)

| Necesidad | API de Signal Forms | Estado verificado |
|---|---|---|
| Crear el formulario a partir de un modelo | `form(model, schema, options)` | Estable desde v22.0 |
| Crear el formulario fuera del constructor | `FormOptions.injector` | Estable desde v22.0 (interfaz `FormOptions`) |
| Enlazar un control nativo | Directiva `FormField`, input `formField` (`[formField]="..."`) | Estable desde v22.0 |
| Enviar desde `<form>` (incluido Enter) | `[formRoot]` + `FormOptions.submission` (`action`, `onInvalid`) | Guía "Form submission": `FormRoot` pone `novalidate`, evita la navegación y llama a `submit` si hay opción `submission` |
| Claves dinámicas | Modelo `Record<string, ...>` + schema que recorre la configuración | Guía oficial "Dynamic forms with JSON" |
| Validadores incorporados | `required`, `min`, `max`, `minLength`, `maxLength`, `pattern` | Guía "Validation" |
| Validadores propios | `validate(path, ({ value }) => error \| null)` | Guía "Validation" |
| Estado por campo | `value()`, `valid()`, `invalid()`, `errors()`, `touched()`, `markAsTouched()` | Guía "Field state management": `touched()` pasa a `true` al hacer foco y blur |
| Marcar todo como tocado al enviar | `submit()` marca los campos interactivos como tocados | Guía "Form submission" |
| Foco en un campo | `fieldTree().focusBoundControl()` | Guía "Form submission" (ejemplo de `onInvalid`) |
| Tipos nativos | text, number (convierte entre string y number), checkbox (boolean), select con opciones dinámicas, date | Guía "Forms with signals" (essentials). `<select multiple>` no está soportado |

**Huecos de la documentación que hay que comprobar con un spike al empezar US-01** (ninguno bloquea la decisión):

1. **Valor de un `<input type="number">` vacío.** La guía de formularios dinámicos inicializa los numéricos a `null`, pero no documenta qué valor escribe el control al vaciarlo (`null` o `NaN`). El validador de `required` trata `null`, `undefined`, `''`, `false` y `NaN` como vacío, así que cualquiera de los dos funciona, y el mapper de salida normaliza `NaN` a `null`.
2. **`<input type="date">` con un modelo `string`.** La guía dice que los controles de fecha "also accept `Date`", pero no si conservan un `string` `YYYY-MM-DD`. Se exige un `string` para no desplazar la fecha por zona horaria (REQ-01.21; la propia guía de validación avisa del desplazamiento con `Date`). Si el spike muestra que el control escribe un `Date`, se usa un control propio que implemente `FormValueControl<string>` (guía "Custom controls"), sin dependencias.
3. **`aria-invalid` y `aria-describedby`.** La referencia de `FormField` no dice que los ponga, así que se enlazan a mano en la plantilla.

Ninguna API necesaria está marcada como experimental. La única propiedad experimental encontrada (`FormOptions.experimentalWebMcpTool`) no se usa.

## Opciones consideradas

1. **Signal Forms con modelo plano `Record<key, FieldValue>` y schema generado desde la configuración**, siguiendo la guía oficial "Dynamic forms with JSON".
2. **Signal Forms con modelo anidado por sección** (`{ policyholder: {...}, vehicle: {...} }`).
3. **Reactive Forms tipados** (`FormRecord` + `ValidatorFn`).
4. **Formulario propio solo con `signal`/`computed`**, sin `@angular/forms`.

Sub-decisión sobre **cómo modelar las validaciones en Strapi** (afecta al contrato):

- **V1.** Componente repetible `form.validation-rule` con `kind` (enum) y parámetros `value` (decimal) y `pattern` (string).
- **V2.** Dynamic zone con un componente por tipo de validación.
- **V3.** Campo JSON libre.

## Decisión

Opción elegida: **1 (Signal Forms, modelo plano) + V1**.

### Construcción

1. `FormStepPage` espera a que la configuración del país esté lista (ADR-0004). Solo entonces renderiza `DynamicForm` con la configuración ya mapeada (`FormConfig`) como `input.required`.
2. `DynamicForm` crea el formulario en `ngOnInit` (los inputs ya están disponibles) con `form(model, buildStep1Schema(config, ctx), { injector, submission })`. El `injector` se obtiene con `inject(Injector)` en el campo de la clase. La configuración se trata como inmutable durante la vida del componente: si se recarga (reintento), el componente se vuelve a crear porque el `@if` lo destruye.
3. **Modelo:** `signal<Step1Model>()`, donde `Step1Model = Record<FieldKey, string | number | boolean | null>`. Valores iniciales por tipo: `text` → `''`, `number` → `null`, `select` → `''`, `date` → `''`, `checkbox` → `false`. Sobre ellos se aplican los valores restaurados y reconciliados (ADR-0004). Las claves cumplen `^[a-z][a-zA-Z0-9_]*$` (content-model), así que `Object.keys` conserva el orden de inserción, aunque el orden de pantalla no depende de eso.
4. **Accesores tipados** por tipo (`asText(key): FieldTree<string>`, `asNumber`, `asBoolean`...), con el cast deliberado que documenta la guía oficial ("deliberate escape hatches"). El cast está cubierto por un test del mapper: el tipo del campo determina el valor inicial.
5. **Plantilla:** `<form [formRoot]="f">`, `@for (section of sections(); track section.id)` dentro de `<fieldset><legend>`, y `@for (field of section.fields; track field.key)` con un `@switch (field.type)` que pinta el control nativo con `[formField]`. `select`: `<select>` con una primera `<option value="">` vacía, sin texto (G2-2 y Q-01.17: no hay placeholders), y las opciones en el orden de Strapi.

### Validación (schema generado)

Para cada campo de la configuración, en orden:

| Origen | Cómo se aplica | Función pura (sin Angular) |
|---|---|---|
| `required` (Strapi) | `required(path)` incorporado (refleja `required` en el control nativo) y, en `text`, además `validate(path, notBlank)` | `isBlank(value)`: un texto de solo espacios cuenta como vacío (REQ-01.14). `checkbox` obligatorio = `true`, que el `required` incorporado ya cubre porque trata `false` como vacío |
| `minLength` / `maxLength` (`text`) | `validate(path, ...)` | `hasMinLength(trimmed, n)`, `hasMaxLength(trimmed, n)` sobre el valor recortado (Q-01.16) |
| `pattern` (`text`) | `validate(path, ...)` | `matchesFully(trimmed, regex)`. El mapper compila `new RegExp('^(?:' + source + ')$')` sin flags; si no compila, la validación se ignora con aviso (5.3) |
| `min` / `max` / `integer` (`number`) | `validate(path, ...)` | `isAtLeast`, `isAtMost`, `isInteger` |
| Rol `vehicleYear` (`number`) | `validate(path, ...)`, siempre activo | `isVehicleYearValid(year, today)`: `año(today) − 20 ≤ year ≤ año(today) + 1`, entero (REQ-01.19) |
| Rol `birthDate` (`date`) | `validate(path, ...)`, siempre activo | `isOfLegalAge(birthDate, today, minimumAge)`, con fecha futura inválida y la regla del 29 de febrero (REQ-01.20) |
| `select` | `validate(path, ...)` implícito | El valor, si no está vacío, debe ser una opción vigente |

- Los validadores propios **no se reimplementan sobre los incorporados** cuando estos no recortan espacios (`minLength`, `pattern`). Por eso se usan funciones puras envueltas en `validate()`. Todas viven en `frontend/src/app/domain/` y `features/form-step/validation/`, y tienen unit tests nombrados por AC (AC-01.14, AC-01.15, AC-01.17, AC-01.18, AC-01.19, AC-01.33).
- **"Hoy"** se obtiene de un token `CLOCK` (`() => Date`) y se convierte en una fecha local `YYYY-MM-DD` (`todayLocal`). Los validadores reciben la fecha como parámetro (REQ-01.21).
- El `kind` del error no se muestra nunca. **Un único mensaje por campo** (REQ-01.16): `field.errorMessage` si no está vacío y, si lo está, el mensaje genérico del país.
- **Visibilidad del error:** `state.touched() && state.invalid()`. `touched()` pasa a `true` al salir del campo (blur) y `submit()` marca todos los campos interactivos. Interpretación de "no mientras se escribe" (REQ-01.16): el error no aparece antes del primer blur o del primer intento de avanzar. Después se actualiza en vivo, así que desaparece en cuanto el valor es válido. Si el humano prefiere congelarlo hasta el siguiente blur, es un cambio local (una señal `errorShown` por campo) que no afecta a esta decisión.
- **G2-5 (REQ-01.22)** no se valida en el formulario: lo decide el mapper de la configuración. Si falta un campo válido con uno de los roles obligatorios, `FormConfig.status = 'unavailable'` y `DynamicForm` no llega a crearse.

### Envío, avance y foco

- `submission.action`: guarda los valores normalizados (ADR-0004) y navega a `/:country/plans`.
- `submission.onInvalid`: recorre la lista ordenada de campos (sección y luego `order`), localiza el primero con `invalid()` y llama a `focusBoundControl()`. No se usa `errorSummary()` para el orden, porque el orden de pantalla lo define la configuración (REQ-01.17).
- Enter en un campo de texto envía el `<form>` de forma nativa, lo que equivale a "continuar" (REQ-01.30). El botón continuar es `type="submit"` y está siempre habilitado.

### Accesibilidad (enlaces manuales)

- `id` del control `f-{key}`; `<label for="f-{key}">`; ayuda `help-{key}`; error `err-{key}`.
- `[attr.aria-describedby]` con `help-{key}` y, solo si el error es visible, `err-{key}`. `[attr.aria-invalid]` vale `'true'` o `null`. Para `checkbox` y `select` el `required` nativo lo pone `FormField`, y se comprueba en un unit de DOM.

### Validaciones en Strapi (V1)

Componente repetible `form.validation-rule { kind: enumeration[minLength, maxLength, pattern, min, max, integer], value: decimal?, pattern: string? }` dentro de `form-field.validations`. El mapper comprueba que cada regla tenga los parámetros de su `kind` y que el `kind` corresponda al tipo del campo (5.2 y 5.3). Lo que no cuadra se ignora con aviso.

## Consecuencias

- **Positivas:**
  - Sigue el patrón documentado por Angular para formularios dirigidos por JSON, con API estable en v22.
  - Toda la lógica de negocio queda en funciones puras con tests deterministas. El schema es solo un adaptador.
  - Cambiar en Strapi un campo, el orden, una opción o una validación del catálogo no exige código (caso A de `country-content`). Un tipo de validación nuevo es un caso B localizado: un valor en el enum `kind`, una función pura y una línea del registro.
  - El modelo plano por clave encaja con la persistencia por identificador técnico (ADR-0004) y con la reconciliación de 5.4. Mover un campo de sección no mueve el valor.
- **Negativas:**
  - Los casts de los accesores tipados cambian la garantía estructural del compilador por un invariante en tiempo de ejecución (lo advierte la propia guía). Se mitiga con tests del mapper y del valor inicial por tipo.
  - El formulario no reacciona a cambios de configuración en caliente: hay que recrearlo. Es coherente con Q-01.20 (una carga por recarga de la app).
  - Signal Forms es estable solo desde v22 y hay menos ejemplos y respuestas de la comunidad que para Reactive Forms. Hay tres huecos de documentación que exigen un spike.
  - Con V1, el admin muestra los campos `value` y `pattern` para cualquier `kind`, y el negocio puede rellenar el equivocado. El mapper lo ignora con aviso, pero el negocio no recibe aviso en el admin.
  - Se duplica el catálogo `kind` (enum de Strapi y tipo de TypeScript).
- **Riesgos y mitigación:**
  - *ReDoS por un `pattern` malicioso:* el patrón lo escribe un equipo de confianza en el admin (US-01 §7). Se acepta el riesgo y se documenta.
  - *Los resultados del spike contradicen una suposición:* las alternativas son locales (control propio con `FormValueControl`) y no cambian la decisión. Si apareciera un bloqueo real de Signal Forms, la opción 3 exige una nueva entrada en el decision log que reemplace a D5.

### Confirmación

- Unit: registro de validadores (AC-01.14, AC-01.15, AC-01.33), reglas por rol con fecha inyectada (AC-01.17, AC-01.18 y AC-01.19 con `TZ=America/Bogota`, ADR-0007), mapper (AC-01.20, AC-01.25) y DOM del formulario (AC-01.26: `aria-describedby`, `aria-invalid`, `fieldset`/`legend`).
- E2E: AC-01.2, AC-01.12, AC-01.16 (foco en el primer inválido) y AC-01.27 (solo teclado y Enter).
- Review: `grep -rE "ReactiveFormsModule|FormGroup|FormControl|NgModel" frontend/src` sin resultados; ningún texto de error escrito en el código.

## Pros y contras de las opciones

### 1. Signal Forms, modelo plano (elegida)

- A favor: cumple D5; patrón oficial; claves estables; validación reactiva sin suscripciones; encaja con zoneless.
- En contra: casts en los accesores; API joven; huecos de documentación (number vacío, date como string).

### 2. Signal Forms, modelo anidado por sección

- A favor: la estructura del modelo refleja la pantalla, y el resumen podría leer las secciones directamente.
- En contra: si el negocio cambia la sección de un campo, su valor cambia de ruta en el modelo. Eso complica la reconciliación (5.4 dice que un cambio de sección conserva el valor) y la persistencia. El orden de secciones es fijo y se puede derivar sin anidar.

### 3. Reactive Forms tipados (`FormRecord`)

- A favor: API madura y muy documentada para formularios dinámicos; `addControl`/`removeControl` en caliente; la comparativa oficial la recomienda para "complex, dynamic forms" cuando se necesita estabilidad probada.
- En contra: **contradice D5**. Mezcla Observables con un estado que en el resto de la app son signals. Solo se consideraría como plan de contingencia con una nueva decisión humana.

### 4. Formulario propio con signals

- A favor: control total y ninguna API nueva que aprender.
- En contra: reimplementa `touched`, el envío, los atributos nativos y el foco; más código que mantener y probar; contradice D5.

### V1. Componente repetible con `kind` (elegida)

- A favor: populate simple (`populate[n]=validations`); orden y lista visibles en un solo bloque del admin; todas las reglas comparten forma, así que el mapper es simple.
- En contra: parámetros irrelevantes visibles según el `kind`; la coherencia la comprueba la app y no Strapi.

### V2. Dynamic zone, un componente por tipo de validación

- A favor: cada tipo muestra solo sus parámetros; el tipado es más estricto en el admin.
- En contra: `integer` no tiene parámetros, y un componente sin atributos no está documentado como válido. El populate de dynamic zones con varios componentes es más verboso (`populate[dz][on][...]`). La documentación de filtros indica que no se puede filtrar por dynamic zones (aquí no hace falta, pero limita la evolución).

### V3. JSON libre

- A favor: máxima flexibilidad.
- En contra: no es "tipado" (lo pide el PDF y lo prohíbe US-01 §6: "no como texto libre"); el admin no ayuda al negocio.

## Referencias

Consultadas el 2026-11-22:

- Signal Forms, comparativa (estado "Stable (v22+)"): https://angular.dev/guide/forms/signals/comparison
- Signal Forms, visión general (importaciones, `FormField`): https://angular.dev/guide/forms/signals/overview
- Formularios dinámicos con JSON (modelo `Record`, schema en bucle, `[formField]`, `[formRoot]`, casts): https://angular.dev/guide/forms/signals/dynamic-forms-with-json
- Validación (validadores incorporados, `validate`, forma del error, `touched() && invalid()`): https://angular.dev/guide/forms/signals/validation
- Estado de campo (`touched` en blur, `markAsTouched`): https://angular.dev/guide/forms/signals/field-state-management
- Envío (`submit`, `FormRoot`, `onInvalid`, `focusBoundControl`): https://angular.dev/guide/forms/signals/form-submission
- Modelos (`undefined` excluido del árbol, `null` para vacíos, controles de fecha y `Date`): https://angular.dev/guide/forms/signals/models
- Controles nativos (number, checkbox, select dinámico, sin `select multiple`): https://angular.dev/essentials/signal-forms
- Controles propios (`FormValueControl`, `FormCheckboxControl`): https://angular.dev/guide/forms/signals/custom-controls
- API `form` (estable desde v22.0): https://angular.dev/api/forms/signals/form
- API `FormOptions` (`injector`, `submission`; `experimentalWebMcpTool` experimental): https://angular.dev/api/forms/signals/FormOptions
- API `FormField` (input `formField`, estable desde v22.0): https://angular.dev/api/forms/signals/FormField
- Strapi 5, populate de componentes y dynamic zones: https://docs.strapi.io/cms/api/rest/populate-select
- Strapi 5, filtros (sin filtro por dynamic zones): https://docs.strapi.io/cms/api/rest/filters
