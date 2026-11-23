# Decision log

Registro de las decisiones humanas tomadas en cada gate. Cada entrada guarda la propuesta, el veredicto y el motivo **literal** del humano.

- Estados: `Aprobada` · `Rechazada` · `Modificada` · `Reemplazada`.
- Una decisión aprobada no se cambia sin una nueva entrada que la referencie y explique el cambio.
- Los rechazos en cualquier gate se registran aquí con el feedback para el agente productor.

## G0 — Estrategia (Fase 1)

- Fecha: 2026-11-22
- Aprobador: Jorge (humano)
- Fuente de las propuestas: [`docs/phase-1/analysis.md`](phase-1/analysis.md), sección 7, y la revisión hecha en la sesión local de Claude Code (verificación del entorno y de fuentes oficiales).

| # | Decisión | Resolución aprobada | Estado | Motivo literal del humano |
|---|---|---|---|---|
| D1 | Entorno de trabajo y repo | Claude Code local sobre el repositorio GitHub privado propio | Modificada (visibilidad: ver "Cambio de D1") | "D1 ya está decidida por mí: trabajamos en Claude Code local sobre este repositorio GitHub privado." |
| D2 | Versión de Angular | Angular 22 (22.3.0 al 2026-11-22) | Aprobada | "Apruebo todas" |
| D3 | Estrategia multipaís | Colección `Country` + relaciones (sin i18n de Strapi); país en la URL (`/co`, `/cl`) | Aprobada | "Apruebo todas" |
| D4 | Acceso a Strapi | Rol público solo `find`/`findOne` + proxy nginx GET-only con allowlist; sin tokens en el navegador ni BFF | Aprobada | "Apruebo todas" |
| D5 | Formularios | **Signal Forms** (estable en v22). Se documenta en un ADR | Aprobada (recomendación modificada antes del gate, ver nota) | "Apruebo todas" |
| D6 | Persistencia | `sessionStorage` por país | Aprobada | "Apruebo todas" |
| D7 | Pasos del wizard | 3 pasos + pantalla de confirmación | Aprobada | "Apruebo todas" |
| D8 | Regla de precio | Factores por país configurables en Strapi + función pura documentada | Aprobada | "Apruebo todas" |
| D9 | Pago simulado | Pasarela mock con resultado elegido (éxito/rechazo), sin campos de tarjeta | Aprobada | "Apruebo todas" |
| D10 | SDD | Variante propia y ligera mediante una Skill (no Spec Kit) | Aprobada | "Apruebo todas" |
| D11 | Agentes y Skills | 6 agentes (Requirements Analyst, Software Architect, Strapi Developer, Angular Developer, QA Engineer, Code Reviewer con checklist de seguridad) + Skills `sdd-traceability` y `country-content` | Aprobada | "Apruebo todas" |

El humano aprobó D2–D11 en bloque, sin motivo específico por decisión.

### Nota sobre D5 (cambio de recomendación antes del gate)

- Recomendación original (Fase 1, claude.ai): Reactive Forms tipados, salvo que Signal Forms fuera estable en v22.
- Verificación (sesión local, 2026-11-22): la tabla comparativa oficial de angular.dev marca Signal Forms como "Stable (v22+)" (https://angular.dev/guide/forms/signals/comparison).
- Cambio: el orquestador recomendó Signal Forms, señalando el cambio de forma explícita. El humano lo aprobó.
- Pendiente: el ADR de formularios (Fase 3) debe recoger alternativas y consecuencias.

## G1 — Flujo agéntico (Fase 2)

- Fecha: 2026-11-22
- Aprobador: Jorge (humano)
- Presentado: `CLAUDE.md`, `.claude/agents/` (6), `.claude/skills/` (`sdd-traceability`, `country-content` en esqueleto), `FLOW.md` (borrador), `docs/traceability.md`, `.gitattributes`.

| # | Decisión | Resolución aprobada | Estado | Motivo literal del humano |
|---|---|---|---|---|
| G1-a | Proteger `logs/` | Hook `PreToolUse` (PowerShell) que bloquea `Write` y `Edit` dentro de `logs/` | Aprobada | "Apruebo G1" |
| G1-b | Modelo de cada agente | `model: inherit` en los 6 subagentes (Opus 5.5) | Aprobada | "Apruebo G1" |
| G1-c | Ramas | Una rama y un PR por fase hacia `main`; cada push se pide antes al humano | Aprobada | "Apruebo G1" |
| G1-d | Alcance de `strapi-developer` (aclara D11) | Además de `cms/`, es dueño de `docker-compose.yml`, nginx y `.env.example` | Aprobada | "Apruebo G1" |
| G1-e | Copia de logs | Al cerrar cada sesión, copiar el JSONL original tal cual a `logs/sessions/` (solo se añaden archivos) | Aprobada | "Apruebo G1" |

El humano aprobó G1 en bloque, sin motivo específico por decisión.

### G1-f — Datos personales en las transcripciones (2026-11-22)

- **Contexto:** al preparar la copia de G1-e, la revisión de la transcripción encontró el email real del humano (lo añade Claude Code como contexto de la sesión). No hay tokens ni credenciales. El PDF exige a la vez "logs sin editar" y "sin datos personales reales en el repositorio".
- **Opciones presentadas:** (1) redactar solo el email en una copia hecha fuera de `logs/` y documentar la sustitución con SHA-256 del original y de la copia; (2) copiar sin cambios.
- **Resolución:** opción 1. Única transformación permitida: sustituir las cadenas listadas en un archivo de redacción que vive **fuera** del repositorio. Ningún archivo de `logs/` se modifica después de colocarlo. El manifiesto con hashes va en `docs/logs-manifest.md`.
- **Estado:** Aprobada.
- **Motivo literal del humano:** "Redactar solo email"

### Cierre de G1 — revisión y merge del PR (2026-11-22)

- **Evidencia:** [PR #1](https://github.com/Jorgeandd10/car-insurance-quote-multicountry/pull/1), 20 commits y 53 archivos de `phase-2/agentic-flow` hacia `main`.
- **Revisión humana** (review de GitHub, estado `COMMENTED`; GitHub no permite aprobar un PR propio): "G0/G1 reviewed: decisions, CLAUDE.md, agents, skills, and FLOW.md. OK to merge."
- **Merge:** hecho por el humano con merge commit `29eccf5` (conserva los commits y sus IDs).
- **Estado:** G1 cerrado. Comienza la Fase 3 en `phase-3/specs-adrs`.

## Cambio de D1 — Visibilidad del repositorio (2026-11-22)

- **Contexto:** al abrir el PR de la Fase 2, el orquestador detectó que el repositorio es **público** (API de GitHub: `private=False visibility=public`), mientras D1 decía "privado", y lo señaló al humano tras el primer push de `phase-2/agentic-flow`.
- **Resolución:** el repositorio es **público**. Se mantiene el resto de D1 (Claude Code local, repositorio GitHub propio).
- **Motivo literal del humano:** "El tema de ponerlo publico no creoq  deba, pq cuando me pasaron la prueba, el reclutador decia lo sig: \"Para enviar, responde a este correo antes de la fecha límite con la URL de tu repositorio, que debe ser pública.\""
- **Consecuencias:** todo lo que se suba es visible. Refuerza G1-f (redacción de datos personales en los logs), la regla de no versionar `.env` ni credenciales y el uso exclusivo de datos ficticios. Compatible con el PDF ("public or private and shared").
- **Estado:** Aprobada.

## G2 — Specs de US-01, US-02 y US-03 (Fase 3)

- Fecha: 2026-11-22
- Aprobador: Jorge (humano)
- Presentado: `specs/US-01/spec.md`, `specs/US-02/spec.md`, `specs/US-03/spec.md` (Draft, commits `c27274b`, `b5a3852`, `fa038a7`) y la revisión del orquestador [`reviews/000-G2-specs-cross-consistency.md`](../reviews/000-G2-specs-cross-consistency.md) (F-00.1–F-00.6). Las 60 preguntas abiertas se agruparon en 13 decisiones.

| # | Decisión | Resolución aprobada | Preguntas / hallazgos | Estado | Motivo literal del humano |
|---|---|---|---|---|---|
| G2-1 | Identificar documento, fecha de nacimiento y año del vehículo | Roles de campo (`documentNumber`, `birthDate`, `vehicleYear`) asignados en Strapi; reglas, precio y enmascarado se enlazan al rol | Q-01.3, Q-03.1, Q-02.4; F-00.1, F-00.2 | Aprobada | "Apruebo todo" |
| G2-2 | Textos fijos en código (excepción a `CLAUDE.md` §11) | Solo "cargando", "error de carga", "reintentar" y "país no disponible", en español. Todo lo demás desde Strapi. Texto ausente en Strapi = error de configuración con el mensaje genérico | Q-01.6, Q-02.13, Q-03.14; F-00.3, F-00.4 | Aprobada | "Apruebo todo" |
| G2-3 | Entrada al país | `/` = selección entre países publicados; código desconocido o despublicado = "país no disponible"; `/CO` → `/co` | Q-01.1 | Aprobada | "Apruebo todo" |
| G2-4 | Mayoría de edad y año del vehículo | Lógica en código, siempre aplicada; edad mínima por país en Strapi (18 CO y CL); año en `[añoActual − 20, añoActual + 1]` inclusivo, fijo en código | Q-01.2, Q-01.9 | Aprobada | "Apruebo todo" |
| G2-5 | Falta el campo de un rol obligatorio | Formulario "no disponible"; nunca se salta una regla del PDF | Q-01.7 | Aprobada | "Apruebo todo" |
| G2-6 | Secciones | Atributo de sección por campo (`policyholder` · `vehicle`), secciones en orden fijo | Q-01.4, Q-03.3 | Aprobada | "Apruebo todo" |
| G2-7 | Validaciones configurables | `text`: `minLength`, `maxLength`, `pattern`; `number`: `min`, `max`, `integer`; `select`/`date`/`checkbox`: solo `required` + reglas por rol | Q-01.5 | Aprobada | "Apruebo todo" |
| G2-8 | Regla de precio | `Math.round(basePrice × Π multiplicadores)`; operandos `vehicleAge` y `ageInYears` con tramos por país en Strapi (§6.3 de US-02) | Q-02.3, Q-02.6 | Aprobada | "Apruebo todo" |
| G2-9 | Precio entre pasos 2 y 3 | Solo se persiste el id del plan; el resumen recalcula con la misma función | Q-02.12, Q-03.6 | Aprobada | "Apruebo todo" |
| G2-10 | Acceso a un paso sin el anterior | Redirección al paso que falta; `isComplete` se calcula con la configuración vigente, no se persiste una señal | Q-01.18, Q-02.10, Q-03.8; F-00.5 | Aprobada | "Apruebo todo" |
| G2-11 | Plan no disponible o en otra moneda | Plan desactivado: se deselecciona con aviso y se vuelve al paso 2; plan con moneda distinta a la del país: no se muestra | Q-02.11, Q-02.2 | Aprobada | "Apruebo todo" |
| G2-12 | Resultado del pago simulado | Opciones visibles aprobado (por defecto) / rechazado dentro del paso 3, en un bloque "pasarela simulada" | Q-03.15 | Aprobada | "Apruebo todo" |
| G2-13 | Resto de preguntas abiertas | Se aprueban tal cual las propuestas de cada spec | Resto de Q-01, Q-02, Q-03 | Aprobada | "Apruebo todo" |

Además se corrige F-00.6 (AC-02.8 debe usar U+00A0 en el ejemplo de COP), que es un hecho verificado y no una decisión.

## G3 — ADRs y arquitectura (Fase 3)

- Fecha: 2026-11-22
- Aprobador: Jorge (humano)
- Presentado: `docs/adr/0001`–`0007` (Proposed, commit `2b21fdc`), `docs/architecture/` y la revisión del orquestador [`reviews/001-G3-architecture-check.md`](../reviews/001-G3-architecture-check.md) (F-00.8–F-00.11).
- Antes de decidir, el humano preguntó por el avance y el tiempo restante y pidió una recomendación sobre G3-3. El orquestador **cambió su recomendación** de 3a (token manual) a 3c (intercepción + comprobación manual en G5), porque el token manual dejaba 5 AC "No ejecutados" para quien clone el repositorio.

| # | Decisión | Resolución aprobada | Estado | Motivo literal del humano |
|---|---|---|---|---|
| G3-1 | ADR-0001 a 0007 | Aceptados, con el ajuste de G3-3 en ADR-0003 y ADR-0007 | Aprobada | "Apruebo G3 con G3-3 en intercepción" |
| G3-2 | Permisos del rol público (precisa D4, F-00.8) | Solo `find`, sin `findOne` | Aprobada | "Apruebo G3 con G3-3 en intercepción" |
| G3-3 | e2e con cambios de contenido (F-00.9) | **Opción 3c: solo intercepción (`page.route`)**. Sin token de escritura. El cambio real en Strapi (campo nuevo, plan desactivado) se comprueba a mano en G5 y se registra en `docs/qa/manual-check.md` | Modificada (recomendación inicial: 3a) | "Apruebo G3 con G3-3 en intercepción" |
| G3-4 | Unicidad de `key` | `unique` de Strapi + prefijo de país | Aprobada | "Apruebo G3 con G3-3 en intercepción" |
| G3-5 | Textos de interfaz obligatorios en Strapi | Sí; los AC de texto ausente se prueban por intercepción | Aprobada | "Apruebo G3 con G3-3 en intercepción" |
| G3-6 | Términos | Atributo de `Country` | Aprobada | "Apruebo G3 con G3-3 en intercepción" |
| G3-7 | Factores de precio | Componente repetible de `Country` | Aprobada | "Apruebo G3 con G3-3 en intercepción" |
| G3-8 | Formato de términos | Blocks de Strapi + render propio | Aprobada | "Apruebo G3 con G3-3 en intercepción" |
| G3-9 | Guards | Funcionales + indicador global "cargando" | Aprobada | "Apruebo G3 con G3-3 en intercepción" |
| G3-10 | Huecos funcionales cubiertos por el arquitecto | Se acepta su lectura (contenido global ausente → "error de carga" + "reintentar"; banda con rol/operando incompatibles se descarta; error en vivo tras el primer blur; "—" desde Strapi; mismas leyendas de sección en paso 1 y resumen) | Aprobada | "Apruebo G3 con G3-3 en intercepción" |

### Cierre de la Fase 3 — revisión y merge del PR #2 (2026-11-22)

- **Evidencia:** [PR #2](https://github.com/Jorgeandd10/car-insurance-quote-multicountry/pull/2), 21 commits y 21 archivos de `phase-3/specs-adrs` hacia `main`.
- **Revisión humana** (review de GitHub, `COMMENTED`): "OK to merge."
- **Merge:** hecho por el humano con merge commit `3708a48` (padres `29eccf5` y `1c2f366`).
- **Plazo comunicado por el humano:** entrega hasta el 2026-11-23 a las 23:59 (UTC-5).
- **Ajuste pedido por el humano para los próximos PR:** "para el proximo merge pasame tambien los comentarios para el review del merge". A partir de la Fase 4, cada PR irá acompañado del texto de review listo para pegar.

## Plan de las Fases 4–6 (2026-11-22, 20:40 UTC-5)

- **Presentado:** plan hasta el plazo del 2026-11-23 23:59.
  - 4a en paralelo: `strapi-developer` (cms, seed, nginx, Docker) y `angular-developer` (base del frontend).
  - 4b–4d: US-01, US-02 y US-03 en secuencia; integración; demo y PR de la Fase 4 la mañana del 23.
  - Fase 5: e2e y review 002 en paralelo, G4 y G5.
  - Fase 6: documentación final y G6, con objetivo antes de las 20:00 del 23.
  - Commits solo en local durante la noche; push al abrir cada PR con permiso del humano (G1-c).
- **Ajustes respecto al flujo de `FLOW.md`:** una sola demo al final de la Fase 4 en lugar de una por historia, y una sola review (002) para las tres historias.
- **Estado:** Aprobado.
- **Motivo literal del humano:** "Aprobado, arranca"

## Cierre de la Fase 4 — demo, revisión y merge del PR #3 (2026-11-23)

- **Evidencia:** [PR #3](https://github.com/Jorgeandd10/car-insurance-quote-multicountry/pull/3), 9 commits de `phase-4/implementation` hacia `main`. Merge commit `f69ae34` (padres `3708a48` y `b423202`), hecho por el humano.
- **Revisión humana** (review de GitHub, `COMMENTED`), texto preparado por el orquestador y pegado por el humano: "Phase 4 reviewed (implementation): - Demo on http://localhost:8080 (docker compose up): country selection, CO form, plans, summary, approved and rejected payment, confirmation. - Verified orchestrator evidence: 457/457 unit tests, curl checks on nginx/Strapi (draft blocked, writes 403/405, no-store, CSP), no .env committed. - Reviewed docs/qa/phase-4-implementation-notes.md: implementer decisions 1–18 accepted [or: rejected n, m → findings for review 002]. …OK to merge."
- **Interpretación del orquestador:** el texto conserva la alternativa de la plantilla. Se registran las 18 decisiones de `docs/qa/phase-4-implementation-notes.md` como **aceptadas**, y se le pide al humano que avise si alguna no lo está.
- **Modelo de los subagentes de la Fase 5:** el humano no respondió a la propuesta de usar Sonnet; G1-b se mantiene (`model: inherit`).

## G4 — Triage de la review 002 (2026-11-23)

- Presentado: [`reviews/002-phase-4-implementation.md`](../reviews/002-phase-4-implementation.md) (commit `2dac3aa`). El orquestador reprodujo F-00.12 antes del gate.

| Hallazgo | Severidad | Decisión | Responsable | Motivo literal del humano |
|---|---|---|---|---|
| F-00.12 | Major (seguridad) | Corregir: `proxy_pass` con la URI normalizada y verificación con `curl` | `strapi-developer` | "Apruebo el triage de G4" |
| F-03.1 | Major | Corregir: reevaluar `isComplete` tras el reintento y `canPay` exige datos válidos | `angular-developer` | "Apruebo el triage de G4" |
| F-02.1 | Minor | Corregir junto con F-03.1 | `angular-developer` | "Apruebo el triage de G4" |
| F-03.2 | Minor | Corregir el seed: RUT con y sin puntos | `strapi-developer` | "Apruebo el triage de G4" |
| F-00.13 | Nit | Corregir (regex de caché de nginx) | `strapi-developer` | "Apruebo el triage de G4" |
| F-00.14 | Nit | Aceptar; comprobar en G5 | — | "Apruebo el triage de G4" |

## G5 — Prueba manual con teclado y móvil, sin IA (2026-11-23)

- **Presentado:** guía paso a paso por chat derivada de [`docs/qa/manual-check.md`](qa/manual-check.md) (partes 0–4), sobre la pila levantada desde `e2713d2`.
- **Primer mensaje del humano:** pegaba el texto de ejemplo del orquestador, con una falla ficticia en 1.13. El orquestador no lo registró y pidió los resultados reales.
- **Estado:** Aprobado. Sin defectos.
- **Motivo literal del humano:** "NO pues los reusltados es que todo quedo ok, no salio ningun error de lo q me pediste q probara"
- **Alcance no detallado por el humano:** dispositivo o viewport, versión del navegador y la parte 3 (lector de pantalla, opcional). F-00.14 sigue Accepted como limitación conocida; se documenta en el README.

## Cierre de la Fase 5 — merge del PR #4 (2026-11-23)

- **Evidencia:** [PR #4](https://github.com/Jorgeandd10/car-insurance-quote-multicountry/pull/4), 9 commits de `phase-5/validation` hacia `main`. Merge commit `95c2c0c` (padres `f69ae34` y `2daa00d`), hecho por el humano. Árbol de `main` idéntico al de la rama.
- **Revisión humana** (review de GitHub, `COMMENTED`), texto preparado por el orquestador y pegado por el humano: "Phase 5 reviewed (validation): … G5 manual check done by me without AI … approved, no defects … OK to merge."

## D12 — Estilo visual inspirado en SURA (2026-11-23)

- **Propuesta del humano**, antes de la Fase 6: rediseñar los estilos de la app con un aspecto similar al sitio de SURA (https://www.sura.co/seguros/empresas-sura/tecnologia-y-transformacion-digital), porque la prueba es para SURA.
- **Estado:** Aprobado (decisión del propio humano).
- **Motivo literal del humano:** "la prueba tecnica es para sura tech, entonces si quisiera como que usaramos un estilo similar al q ellos tienen para venderles mi propuesta de prueba tecnica"
- **Referencia medida por el orquestador** (estilos calculados del sitio con Claude in Chrome): azul primario `#2D6DF6`, azul oscuro `#0033A0`, texto de botón `#26328C`, acento amarillo `#E3E829`, superficie `#DFEAFF`, texto `#1C1C24` y `#3F3F41`, botones en píldora (radio 28 px), tarjetas con radio 8 px y sin sombra, fuente propietaria `SuraSans`.
- **Límites que fija el orquestador** (no cambian ninguna decisión aprobada):
  - Solo CSS y marcado de presentación; sin cambios de comportamiento, specs ni contenido de Strapi.
  - Sin logotipos, imágenes ni la fuente `SuraSans` de SURA: no son nuestros. Se usa una pila de fuentes del sistema; la CSP (`font-src` por defecto `'self'`) no cambia.
  - Ningún texto nuevo en código (G2-2) y ninguna dependencia nueva.
  - Se mantienen los requisitos de accesibilidad de las specs: contraste AA (texto normal ≥ 4,5:1), foco visible, objetivos táctiles de 24 px o más, sin desplazamiento horizontal desde 320 px.
- **Verificación prevista:** unit tests, build, e2e completos contra la pila reconstruida y capturas a 375 px y escritorio.

## D13 — Ampliación de D12: logo, tipografía, ilustración y experiencia de uso (2026-11-23)

- **Contexto:** el humano revisó el resultado de D12 ("Me gusta") y pidió acercarlo más al sitio de SURA.
- **Motivo literal del humano:** "Me gusta pero podemos hacerlo mas amigable y similar, te adjunto una imagen q puedes agregar para hacerlo mas amigable, lo puedes poner con las letras blancas para q se vea por encima de l fondo azul q dejaste [...] quiero que uses el mismo eestilo de tipo de letra que usan en la url q te suministre [...] diseñes una imagen relavionada con lo q vamo s ahacer, puedes poner un automovil [...] piknsa en la edperienica de usuario, el paso de vistas q haya un lazy loadigna, etc pero que se vea el profesionalimos, los estilos de los inputs, de los dropdowns, hazlo bien"
- **Estado:** Aprobado (decisión del propio humano).
- **Cambios respecto a los límites de D12, señalados de forma explícita:**
  1. **Logo:** D12 excluía logotipos. Ahora se usa en la banda superior el logo "Seguros SURA" que aportó el humano, convertido a blanco por el orquestador. Es decorativo (`alt=""`), porque un texto alternativo sería texto en código (G2-2). El logo es marca de SURA y se usa a petición del humano, solo como presentación de la prueba técnica.
  2. **Tipografía:** la fuente `SuraSans` es propietaria y no se copia de su sitio. Se usa **Figtree**, una sans geométrica con licencia OFL de aspecto parecido, autoalojada con el paquete npm `@fontsource-variable/figtree`. Es una dependencia nueva, justificada aquí; la CSP no cambia porque la fuente se sirve desde `'self'`.
  3. **Ilustración:** se crea una ilustración SVG original (auto y protección) para la pantalla de selección de país. La imagen del sitio de SURA es solo referencia y no se copia. Es decorativa y sin texto.
- **Experiencia de uso:**
  - Transición suave al entrar en cada vista, que respeta `prefers-reduced-motion`.
  - Esqueletos de carga que mantienen el texto "cargando" de G2-2.
  - Inputs y desplegables con estilo propio y estados hover, foco, error y deshabilitado.
  - Las rutas ya eran *lazy* (ADR-0001).
- **Lo que no cambia:** comportamiento, specs, contenido de Strapi, ningún texto nuevo en código, accesibilidad (AA, foco visible, objetivos de 24 px o más, sin scroll horizontal desde 320 px) e `infra/`.

## D14 — Volver a la selección de país y tarjeta de plan pulsable (2026-11-23)

- **Contexto:** el humano revisó D13 en la app ("Esta quedando muy bien") y planteó tres cuestiones.
- **Motivo literal del humano:**
  - "Si acceso a Chile o Colombia, pero quiero devolverme no hay un bootn para regresar a la vista principal, no consideras que sea necesario un boton asi?"
  - "la idea es q se le pueda dar click a cualquier parte de la \"card\" delm plan que vaya a escoger, y se seleccione [...] tiene q ser en cualquier parte de este"
- **Análisis del orquestador:** el PDF solo pide volver entre pasos (AC "Keep data when going back") y las specs no cubren volver a la selección de país. Aun así es una mejora clara de usabilidad, y es barata: los datos ya se guardan por país (D6).
- **Estado:** Aprobado (petición del propio humano).
- **Cambios en specs aprobadas en G2, señalados de forma explícita:**
  - US-01 v0.4: REQ-01.36 y AC-01.36, el enlace "cambiar de país". Su texto viene de Strapi en un campo nuevo obligatorio, `wizardTexts.changeCountryLabel` (G2-2, G3-5), así que también cambian el modelo de contenido y el seed.
  - US-02 v0.4: REQ-02.34 y AC-02.34, toda la tarjeta del plan selecciona el plan. El control sigue siendo el `radio` nativo.
- **Tercera cuestión (pasarela de pago):** no cambia nada. Ver la respuesta al humano: el PDF dice "a button that leads to a confirmation screen or a mock gateway. Do not integrate real payment gateways or use real card data", y D9 y REQ-03.20 excluyen los campos de tarjeta.

## D15 — Favicon de marca y alcance del cierre (2026-11-23)

- **Propuestas del orquestador:**
  - Extras: review 003; un país nuevo solo con contenido, con un e2e; CI con GitHub Actions.
  - Pulido de experiencia de uso: favicon; botones fijos en móvil; animaciones de pago y confirmación; ilustraciones en los estados de error.
- **Decisión del humano, literal:**
  - Sobre los extras: "de lo unico q propusiste solo aprobaria el extra 1 del review 003, de resto no".
  - Sobre el pulido: "te adjunto la imagen del favicon, muy buena propuesta esa. De hecho es la unica q apruebo de todas esas. Entonces haz eso y ya podemos proceder con el review 003".
- **Estado:** Aprobado. Solo el favicon y la review 003; el resto se rechaza (motivo del humano: el tiempo hasta el envío).
- **Implementación** (orquestador, cambio de dos archivos y assets):
  - `frontend/public/favicon.ico` (PNG de 32 px incrustado en un ICO).
  - `frontend/public/brand/icon-32.png`, `icon-192.png` y `apple-touch-icon.png`, generados con el canvas de Chrome a partir de la imagen del humano.
  - `<link>` en `src/index.html` y `theme-color`.
  - Verificado: build OK, y la pila reconstruida sirve los tres iconos con 200.

### Verificaciones que respaldan las decisiones

- Test runner por defecto de Angular: Vitest con `jsdom` (https://angular.dev/guide/testing, https://angular.dev/cli/test). Coincide con la propuesta de calidad del análisis.
- Entorno local: ver [`docs/phase-1/analysis.md`](phase-1/analysis.md), sección "Entorno verificado (local)".
