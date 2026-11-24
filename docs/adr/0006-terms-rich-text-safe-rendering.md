# ADR-0006 — Format and safe rendering of the terms and conditions

| Field | Value |
|---|---|
| Status | Accepted (2026-11-22, G3) |
| Date | 2026-11-22 |
| Author | Software Architect (subagent) |
| Deciders | Human (G3) |
| Motivated by | D4 · G2-13 (Q-03.11, Q-03.12, Q-03.13) · REQ-03.15, REQ-03.16, REQ-03.18 · AC-03.13, AC-03.14, AC-03.15 · `CLAUDE.md` §6 |

## Context and problem

The terms vary per country and the business manages them from Strapi (US-03 context). REQ-03.16 requires that they support paragraphs and lists and that rendering neither executes nor inserts HTML or scripts from the content (AC-03.14: `<img src=x onerror=alert(1)>` must not be executed or inserted). Q-03.11 leaves the concrete format to the architect.

## Decision drivers

- Security: no raw HTML from the CMS in the DOM.
- Paragraphs and lists at a minimum; the business edits them without knowing a syntax.
- No new dependencies (`CLAUDE.md` §6).
- Detect "empty text" reliably (REQ-03.18).

## Considered options

1. **Strapi 5 "Blocks" rich text** (`blocks` attribute, structured JSON) rendered with a recursive Angular component that only emits known elements and interpolates the text.
2. **Markdown rich text** (`richtext`) converted to HTML with a library (e.g. `marked`) and bound with `[innerHTML]` (sanitized by Angular or by `DOMPurify`).
3. **Plain text** (`text`) with a custom mini-syntax: a blank line separates paragraphs and lines starting with `- ` form lists.

## Decision

Chosen option: **1. Blocks + custom rendering by interpolation**.

- `termsAndConditions` attribute of type Rich text (Blocks) on `Country` (ADR-0001), optional in Strapi. If it is empty, the "terms not available" state appears (REQ-03.18).
- The mapper converts the JSON into a **closed domain tree**:

  | Strapi node | Domain | Render |
  |---|---|---|
  | `paragraph` | `{ kind: 'paragraph', children: Inline[] }` | `<p>` |
  | `heading` (`level`) | `{ kind: 'heading', level, children }` | `<h3>`–`<h6>` (level + 2, maximum 6), so as not to break the summary hierarchy (page `h1`, section `h2`) |
  | `list` (`format`: ordered or not) | `{ kind: 'list', ordered, items: Inline[][] }` | `<ol>` / `<ul>` with `<li>` |
  | `quote` | `paragraph` | `<p>` |
  | `text` (with `bold`, `italic`, `underline`, `strikethrough`, `code`) | `{ kind: 'text', text, marks }` | nested `<strong>`, `<em>`, `<u>`, `<s>`, `<code>`; the text, with `{{ }}` |
  | `link` (`url`) | Only its text (`kind: 'text'`) | No `<a>`: there is no need to navigate from the terms and this avoids validating URLs |
  | `code`, `image` or any unknown type | The plain text of its children is extracted as a `paragraph`, or it is omitted if it has no text, with a console warning | — |

- The `TermsBlocks` component (`features/summary-step/terms/`) walks the tree with `@switch` and `@for`. **It does not use `[innerHTML]`, `bypassSecurityTrust*` or `DomSanitizer`.** All text is rendered by interpolation, which Angular escapes. A `<img src=x onerror=...>` string appears as literal text.
- "Empty" = the tree has no text at all after trimming spaces (REQ-03.18).
- The region: `<section aria-labelledby>` with `tabindex="0"`, `max-height` and `overflow-y: auto`, scrollable with the keyboard (REQ-03.16, REQ-03.34). Reaching the end is not required (Q-03.13).

## Consequences

- **Positive:**
  - Security does not depend on a sanitizer: the content is never interpreted as HTML. AC-03.14 is met by construction.
  - Visual editor in the admin (paragraphs, lists, bold) with no syntax to learn.
  - No dependencies. The domain tree is testable with JSON fixtures.
- **Negative:**
  - A custom renderer to maintain. Strapi only offers an official renderer for React (`@strapi/blocks-react-renderer`), which cannot be used in Angular.
  - Whatever the tree does not support is lost: clickable links, images and code blocks. If the business needs them, it is a case B.
  - The exact JSON shape of the list nodes (`list-item`, `format` values) is not in the Strapi documentation consulted; it is only in the official React renderer, which says that `list` receives `format`. The mapper must be validated against the real seed response.
- **Risks and mitigation:**
  - *A change of the Blocks format in a Strapi minor version:* unknown nodes degrade to plain text with a warning. The mapper unit test uses a fixture captured from the project's Strapi 5.63.

### Confirmation

- Unit: Blocks mapper (paragraph, ordered and unordered list, modifiers, link, unknown node, empty) and `TermsBlocks` DOM with the AC-03.14 string: there is no `img` in the DOM and the text appears literally.
- E2E: AC-03.2 (seed text for CO and CL), AC-03.15 (change and reload, ADR-0003), AC-03.13 by interception.
- Review: `grep -rn "innerHTML\|bypassSecurityTrust\|DomSanitizer" frontend/src` with no results.

## Pros and cons of the options

### 1. Blocks + custom rendering (chosen)

- For: no raw HTML; visual editor; explicit structure; exact empty detection.
- Against: custom rendering code; more verbose JSON in the seed.

### 2. Markdown + library + `[innerHTML]`

- For: well-known format and readable seed; ready-made renderer.
- Against: a new dependency (two, with `DOMPurify`). HTML generated from CMS content is inserted, so security depends on Angular's sanitizer, which "keeps safe markup": AC-03.14 requires that no element from the content be inserted. Markdown allows inline HTML.

### 3. Plain text with a mini-syntax

- For: no dependencies; trivial rendering by interpolation.
- Against: a custom syntax that the business must know and that the admin does not help enforce; no bold or ordered lists; a custom parser anyway.

## References

Consulted on 2026-11-22:

- Strapi 5, Content-type Builder (Rich Text Blocks versus Markdown; recommends the React renderer): https://docs.strapi.io/cms/features/content-type-builder
- Strapi, official Blocks renderer for React (blocks `paragraph`, `heading`, `list`, `quote`, `code`, `image`, `link`; modifiers `bold`, `italic`, `underline`, `strikethrough`, `code`): https://github.com/strapi/blocks-react-renderer
- Angular, security (interpolation escapes the content; risks of `innerHTML` and `bypassSecurityTrust`): https://angular.dev/best-practices/security

> Translated into English on 2026-11-23 (D16); no content change.
