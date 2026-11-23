# ADR-0006 — Formato y render seguro de los términos y condiciones

| Campo | Valor |
|---|---|
| Estado | Proposed |
| Fecha | 2026-11-22 |
| Autor | Software Architect (subagente) |
| Decisores | Humano (G3) |
| Motivado por | D4 · G2-13 (Q-03.11, Q-03.12, Q-03.13) · REQ-03.15, REQ-03.16, REQ-03.18 · AC-03.13, AC-03.14, AC-03.15 · `CLAUDE.md` §6 |

## Contexto y problema

Los términos varían por país y los gestiona el negocio desde Strapi (contexto de US-03). REQ-03.16 exige que admitan párrafos y listas y que el render no ejecute ni inserte HTML o scripts del contenido (AC-03.14: `<img src=x onerror=alert(1)>` no debe ejecutarse ni insertarse). Q-03.11 deja al arquitecto el formato concreto.

## Factores de decisión

- Seguridad: ningún HTML crudo del CMS en el DOM.
- Párrafos y listas como mínimo; el negocio los edita sin conocer una sintaxis.
- Sin dependencias nuevas (`CLAUDE.md` §6).
- Detectar "texto vacío" de forma fiable (REQ-03.18).

## Opciones consideradas

1. **Rich text "Blocks" de Strapi 5** (atributo `blocks`, JSON estructurado) pintado con un componente Angular recursivo que solo emite elementos conocidos e interpola el texto.
2. **Rich text Markdown** (`richtext`) convertido a HTML con una librería (p. ej. `marked`) y enlazado con `[innerHTML]` (sanitizado por Angular o por `DOMPurify`).
3. **Texto plano** (`text`) con una mini-sintaxis propia: una línea en blanco separa párrafos y las líneas que empiezan por `- ` forman listas.

## Decisión

Opción elegida: **1. Blocks + render propio por interpolación**.

- Atributo `termsAndConditions` de tipo Rich text (Blocks) en `Country` (ADR-0001), opcional en Strapi. Si está vacío, aparece el estado "términos no disponibles" (REQ-03.18).
- El mapper convierte el JSON en un **árbol de dominio cerrado**:

  | Nodo de Strapi | Dominio | Render |
  |---|---|---|
  | `paragraph` | `{ kind: 'paragraph', children: Inline[] }` | `<p>` |
  | `heading` (`level`) | `{ kind: 'heading', level, children }` | `<h3>`–`<h6>` (nivel + 2, máximo 6), para no romper la jerarquía del resumen (`h1` de la página, `h2` de la sección) |
  | `list` (`format`: ordenada o no) | `{ kind: 'list', ordered, items: Inline[][] }` | `<ol>` / `<ul>` con `<li>` |
  | `quote` | `paragraph` | `<p>` |
  | `text` (con `bold`, `italic`, `underline`, `strikethrough`, `code`) | `{ kind: 'text', text, marks }` | `<strong>`, `<em>`, `<u>`, `<s>`, `<code>` anidados; el texto, con `{{ }}` |
  | `link` (`url`) | Solo su texto (`kind: 'text'`) | Sin `<a>`: no hace falta navegar desde los términos y así se evita validar URLs |
  | `code`, `image` o cualquier tipo desconocido | Se extrae el texto plano de sus hijos como `paragraph`, o se omite si no tiene texto, con aviso en consola | — |

- El componente `TermsBlocks` (`features/summary-step/terms/`) recorre el árbol con `@switch` y `@for`. **No usa `[innerHTML]`, ni `bypassSecurityTrust*`, ni `DomSanitizer`.** Todo el texto se pinta por interpolación, que Angular escapa. Una cadena `<img src=x onerror=...>` aparece como texto literal.
- "Vacío" = el árbol no tiene ningún texto tras recortar espacios (REQ-03.18).
- La región: `<section aria-labelledby>` con `tabindex="0"`, `max-height` y `overflow-y: auto`, desplazable con el teclado (REQ-03.16, REQ-03.34). No se obliga a llegar al final (Q-03.13).

## Consecuencias

- **Positivas:**
  - La seguridad no depende de un sanitizador: el contenido nunca se interpreta como HTML. AC-03.14 se cumple por construcción.
  - Editor visual en el admin (párrafos, listas, negrita) sin sintaxis que aprender.
  - Sin dependencias. El árbol de dominio es testeable con fixtures JSON.
- **Negativas:**
  - Renderer propio que mantener. Strapi solo ofrece un renderer oficial para React (`@strapi/blocks-react-renderer`), que no sirve en Angular.
  - Se pierde lo que el árbol no soporta: enlaces clicables, imágenes y bloques de código. Si el negocio los necesita, es un caso B.
  - La forma exacta del JSON de los nodos de lista (`list-item`, valores de `format`) no está en la documentación de Strapi consultada; solo en el renderer oficial de React, que dice que `list` recibe `format`. El mapper debe validarse contra la respuesta real del seed.
- **Riesgos y mitigación:**
  - *Cambio del formato Blocks en una versión menor de Strapi:* los nodos desconocidos se degradan a texto plano con aviso. El unit del mapper usa una fixture capturada del Strapi 5.63 del proyecto.

### Confirmación

- Unit: mapper de Blocks (párrafo, lista ordenada y no ordenada, modificadores, enlace, nodo desconocido, vacío) y DOM de `TermsBlocks` con la cadena de AC-03.14: no existe ningún `img` en el DOM y el texto aparece literal.
- E2E: AC-03.2 (texto del seed de CO y de CL), AC-03.15 (cambio y recarga, ADR-0003), AC-03.13 por intercepción.
- Review: `grep -rn "innerHTML\|bypassSecurityTrust\|DomSanitizer" frontend/src` sin resultados.

## Pros y contras de las opciones

### 1. Blocks + render propio (elegida)

- A favor: sin HTML crudo; editor visual; estructura explícita; detección de vacío exacta.
- En contra: código de render propio; JSON más verboso en el seed.

### 2. Markdown + librería + `[innerHTML]`

- A favor: formato conocido y seed legible; renderer ya hecho.
- En contra: dependencia nueva (dos, con `DOMPurify`). Se inserta HTML generado a partir de contenido del CMS, así que la seguridad depende del sanitizador de Angular, que "keeps safe markup": AC-03.14 pide que no se inserte ningún elemento del contenido. El Markdown admite HTML en línea.

### 3. Texto plano con mini-sintaxis

- A favor: sin dependencias; render trivial por interpolación.
- En contra: sintaxis propia que el negocio debe conocer y que el admin no ayuda a respetar; sin negrita ni listas ordenadas; parser propio igualmente.

## Referencias

Consultadas el 2026-11-22:

- Strapi 5, Content-type Builder (Rich Text Blocks frente a Markdown; recomienda el renderer de React): https://docs.strapi.io/cms/features/content-type-builder
- Strapi, renderer oficial de Blocks para React (bloques `paragraph`, `heading`, `list`, `quote`, `code`, `image`, `link`; modificadores `bold`, `italic`, `underline`, `strikethrough`, `code`): https://github.com/strapi/blocks-react-renderer
- Angular, seguridad (la interpolación escapa el contenido; riesgos de `innerHTML` y `bypassSecurityTrust`): https://angular.dev/best-practices/security
