# Fase 4 — Notas de implementación para la demo y G4

Decisiones que los subagentes tomaron al implementar y que ninguna spec, ADR o decisión fija. Se presentan al humano para validarlas; las que rechace pasan a la review 002 como hallazgos.

## Verificación del orquestador (2026-11-23)

| Parte | Commit | Comprobado |
|---|---|---|
| Base de Angular (4a) | `40840ed` | `ng build` OK · `ng test` 229/229 |
| US-01 (4b) | `f5e47f1` | `ng build` OK · `ng test` 336/336 (33 archivos) |
| US-02 (4c) | `f411a8b` | `ng build` OK · `ng test` 388/388 (39 archivos) |
| US-03 (4d) | `0cb032c` | `ng build` OK · `ng test` 457/457 (45 archivos) |
| Strapi, nginx, compose (4a) | `078d59a` | `curl` vía nginx: lecturas 200, `status=draft` 400, `%73tatus=draft` solo devuelve publicados, `POST` 403, `/api/users` 404, `no-store` y CSP presentes; sin `.env` en el repo |
| Corrección CSP | `b22d2ad` | El `<script>` en línea del CSS crítico quedaba bloqueado por `script-src 'self'`; ahora hay un `<link>` normal (estilos 200) |
| Integración | — | En Chrome: `/` lista Chile y Colombia desde Strapi; `/co/form` muestra el formulario con estilos; `/co/summary` sin datos redirige a `/co/form` |

`grep` de reglas sin coincidencias en todas las partes (sin `any`, `*ngIf`, `*ngFor`, NgModules ni `bypassSecurityTrust`; la única aparición es un comentario que explica que no se usa).

## Fallos reales encontrados durante la implementación

| Dónde | Fallo | Corrección |
|---|---|---|
| US-01 | Al cambiar de país dentro de la SPA se veía el formulario del país anterior (reutilización de ruta) | `CountryRouteReuseStrategy` |
| US-02 | El nombre accesible de cada plan concatenaba nombre, etiqueta y precio sin separador | `&ngsp;` entre los nodos; AC-02.27 compara el nombre exacto |
| US-02 | Un helper de test normalizaba U+00A0 con `\s` y ocultaba regresiones de AC-02.8 | Solo colapsa espacios ASCII |
| Integración | La CSP bloqueaba los estilos globales | `inlineCritical: false` (`b22d2ad`) |
| Strapi | Build del admin en bucle de GC con 2 GB de heap | `--max-old-space-size=3072` |

## Decisiones para validar

### Backend e infraestructura

1. `POST` a una ruta de la allowlist responde **403** (lo que fija ADR-0003 con `limit_except GET { deny all; }`), no 405.
2. El puerto 8080 se publica en todas las interfaces para poder probar con un móvil real en G5 (ADR-0003 solo limita 1337 a `127.0.0.1`).
3. `published-only` también elimina `hasPublishedVersion`, un alias heredado que Strapi 5.63 sigue convirtiendo en filtro de publicación.
4. Se quitó del template de Strapi el plugin de Strapi Cloud y la telemetría (`uuid`/`installId`).
5. No se crea administrador: el primer acceso a `http://127.0.0.1:1337/admin` registra al superadmin (necesario para G5).

### Frontend

6. `birthDate` y `vehicleYear` son obligatorios aunque Strapi diga `required: false`, para que la regla de edad o de año no se pueda desactivar desde Strapi.
7. El cambio de tipo de un campo solo se detecta si el valor guardado no encaja en el tipo nuevo (ADR-0004 guarda solo valores).
8. La marca visual de obligatorio es un `*` fijo con `aria-hidden` (lo programático es el `required` nativo).
9. Con un texto ausente en Strapi se muestra solo el mensaje genérico, sin `h1`.
10. Los estados vacíos se anuncian con `role="alert"`; quizá encaje mejor `role="status"`.
11. Entrada no interpretable en `number`/`date` (p. ej. "e"): el formulario bloquea el avance, pero `sessionStorage` conserva el último valor válido.
12. Sin plan elegido, el foco va al primer radio del grupo.
13. "Coberturas" y "Beneficios" son `<p>` con `aria-labelledby`, no encabezados.
14. La selección del plan se guarda al elegir, no al continuar.
15. El botón de pagar usa `disabled` nativo mientras faltan los términos, y `aria-disabled` + `aria-busy` durante el proceso, para no perder el foco.
16. El año del vehículo se muestra sin separador de miles ("2018") y las fechas en formato largo ("10 de mayo de 2000").
17. C6 con más de un país, o C3 sin `name`, se tratan como error de contenido.
18. El indicador de pasos no se muestra en la confirmación.

## Pendiente para la Fase 5 (e2e y G5)

AC que jsdom no puede cubrir: envío con Enter (AC-01.27), responsive (AC-01.28, AC-03.35), pestaña nueva (AC-01.21), atrás del navegador tras pagar (AC-03.29), Enter mantenido (AC-03.22), teclado completo (AC-03.33), inspección de red real (AC-03.24) y el cambio real en Strapi (G3-3).
