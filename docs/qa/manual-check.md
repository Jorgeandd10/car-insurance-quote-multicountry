# Prueba manual G5

| Campo | Valor |
|---|---|
| Gate | G5 (prueba manual con teclado y móvil, sin IA) |
| Quién la ejecuta | Humano |
| Fecha | 2026-11-23 |
| Commit probado (`git rev-parse --short HEAD`) | `e2713d2` (pila levantada desde ese commit; comprobado por el orquestador antes de la prueba: `/api/countries` 200, `/admin` 200) |
| Navegador y versión | Chrome (versión no indicada por el humano) |
| Dispositivo móvil (modelo, SO, navegador) o viewport usado | No indicado por el humano |
| Lector de pantalla (opcional: NVDA, Narrador, VoiceOver, TalkBack) | No indicado por el humano |

> Plantilla preparada por el QA Engineer en la Fase 5; el resultado del humano está en "Resultado registrado". Cada paso indica el AC que respalda. En "Resultado" escribe `OK`, `Falla` o `No ejecutado`; en "Notas", lo observado (y, si falla, qué esperabas y qué obtuviste).
>
> Los AC de cambio de contenido (AC-01.3, AC-01.10, AC-01.31, AC-02.4, AC-02.21, AC-02.25, AC-03.15) ya están automatizados por intercepción en `e2e/` (G3-3). Este documento registra la integración real con Strapi, que la intercepción no prueba (ADR-0007, "Consecuencias negativas").

## Resultado registrado (2026-11-23)

El humano ejecutó la prueba siguiendo la versión paso a paso de esta plantilla que el orquestador le dio por chat (mismas partes 0–4 y mismos pasos). Resultado comunicado por el humano, literal:

> "NO pues los reusltados es que todo quedo ok, no salio ningun error de lo q me pediste q probara"

Su primer mensaje de resultado ("Ya hice toda la prueba, y quedo super check") pegaba el texto de **ejemplo** que le había dado el orquestador (incluida una falla ficticia en 1.13). El orquestador no lo registró como evidencia y pidió confirmación; la cita anterior es esa confirmación.

Lectura del orquestador:

- Partes 1, 2 y 4: **OK** en todos los pasos, sin defectos. La parte 4 incluye la restauración del seed (4.7).
- El humano no detalló el dispositivo móvil o el viewport usado, la versión del navegador ni si ejecutó la parte 3, que era opcional. Las tablas siguientes no se rellenan paso a paso para no atribuirle detalles que no dio.
- **F-00.14** (anuncio de los "cargando" por sección con lector de pantalla) no queda verificado de forma explícita. Sigue **Accepted** como limitación conocida y se documenta en el README.

## 0. Preparación

| # | Paso | AC | Resultado | Notas |
|---|---|---|---|---|
| 0.1 | En la raíz del repositorio: `docker compose up -d` (con `.env` creado desde `.env.example`). Esperar a que `http://localhost:8080/api/countries` responda 200. | AC-01.34 | | |
| 0.2 | Abrir una ventana nueva o privada del navegador (`sessionStorage` vacío). | — | | |
| 0.3 | Para el móvil real: averiguar la IP del equipo en la red local y abrir `http://<IP>:8080` en el móvil (el puerto 8080 se publica en todas las interfaces; nota 2 de `phase-4-implementation-notes.md`). | AC-01.28, AC-02.29, AC-03.35 | | |

## 1. Recorrido completo de Colombia solo con teclado (sin ratón ni touchpad)

Datos ficticios: tipo "Cédula de ciudadanía", número `1234567890`, nacimiento `10/05/2000`, ciudad Bogotá, autorización marcada, placa `ABC123`, Marca A, año `2018`.

| # | Paso | AC | Resultado | Notas |
|---|---|---|---|---|
| 1.1 | Abrir `http://localhost:8080/`. Con Tab llegar al enlace "Colombia" y pulsar Enter. | AC-01.5 | | |
| 1.2 | En el paso 1 el foco está en el título y el indicador marca el paso 1. El foco es siempre visible. | AC-01.27 | | |
| 1.3 | Con Tab y Shift+Tab recorrer los 8 campos en orden (tipo, número, fecha, ciudad, autorización, placa, marca, año). Elegir opciones de los select con flechas, marcar la casilla con Espacio y escribir la fecha con el teclado. | AC-01.27, AC-01.1 | | |
| 1.4 | Dejar el número de documento como `12AB` y pulsar Enter en un campo de texto: se queda en el paso 1, ve el mensaje configurado junto al campo y el foco va al primer campo inválido. | AC-01.2, AC-01.16, AC-01.27 | | |
| 1.5 | Corregir el número (`1234567890`) y pulsar Enter en el campo de placa: pasa al paso 2 sin usar el ratón. | AC-01.27, AC-01.32 | | |
| 1.6 | En el paso 2 el foco está en el título. Con Tab llegar al grupo de planes, cambiar con flechas a "Plan Plus" (marcado como "Recomendado"), confirmar con Espacio. | AC-02.26, AC-02.2, AC-02.28 | | |
| 1.7 | Comprobar que los precios se ven en pesos colombianos sin decimales ("$ 1.320.000" para Plan Plus). | AC-02.8 | | |
| 1.8 | Tab hasta "Volver" y Enter: los datos del paso 1 siguen ahí. Volver a continuar con el teclado y comprobar que "Plan Plus" sigue elegido. | AC-01.4, AC-02.30 | | |
| 1.9 | Tab hasta "Continuar" y Enter: llega al resumen con el foco en el título. | AC-02.26, AC-03.34 | | |
| 1.10 | En el resumen: datos del asegurado y del vehículo con sus etiquetas, documento como `******7890`, tipo de documento en claro, plan y precio final. | AC-03.1, AC-03.5, AC-03.8 | | |
| 1.11 | Recorrer con Tab y Shift+Tab: "Editar datos", "Cambiar plan", región de términos, casilla, selector de resultado, "Pagar". Desplazar los términos con flechas o AvPág. | AC-03.33 | | |
| 1.12 | Con "Pagar" deshabilitado, marcar la casilla con Espacio: "Pagar" se habilita. Desmarcar: se deshabilita. Volver a marcar. | AC-03.2, AC-03.12 | | |
| 1.13 | Con flechas elegir "Pago rechazado" y pulsar Enter en "Pagar": durante ~1,5 s se ve "Procesando el pago…" y el botón no reacciona; después aparece el mensaje de rechazo, se sigue en el resumen con los datos y la casilla marcada. | AC-03.4, AC-03.23, AC-03.26 | | |
| 1.14 | Con flechas elegir "Pago aprobado" y pulsar Enter en "Pagar" (mantener Enter pulsado un momento): se ve la confirmación con el número `CO-AAAAMMDD-XXXXXX`, el plan y el precio pagado, una sola vez. | AC-03.3, AC-03.22, AC-03.25, AC-03.31 | | |
| 1.15 | Usar "atrás" del navegador (Alt+Flecha izquierda): no aparece un resumen con "Pagar"; se ve el paso 1 vacío. | AC-03.29 | | |

## 2. Móvil real o viewport de 375 px

Si no hay móvil real, usar las herramientas de desarrollo del navegador con un dispositivo de 375 px de ancho (y opcionalmente 320 px). Indicar arriba qué se usó.

| # | Paso | AC | Resultado | Notas |
|---|---|---|---|---|
| 2.1 | Paso 1: no hay desplazamiento horizontal; todos los campos y "Continuar" se ven y se pueden usar con el dedo; el teclado del móvil para el año es numérico y la fecha abre el selector nativo. | AC-01.28 | | |
| 2.2 | Paso 2: los planes se apilan en una columna, sin desplazamiento horizontal; cada plan, su precio y "Continuar" son alcanzables. | AC-02.29 | | |
| 2.3 | Resumen: una columna, sin desplazamiento horizontal; los términos se leen y se desplazan; la casilla, las opciones de pago y los botones son fáciles de tocar (≥ 24×24 px). Prestar atención a la casilla de términos a 320 px (defecto D-E2E-1 de `docs/qa/e2e-report.md`). | AC-03.35 | | |
| 2.4 | Pagar con "Pago aprobado": la confirmación se ve completa sin desplazamiento horizontal. | AC-03.35 | | |
| 2.5 | Repetir un recorrido corto en `/cl` (RUT `12345678-5`, patente `BCDF12`): precios en pesos chilenos ("$38.985" para Plan Full con año 2012 y nacimiento 15/03/2004) y RUT enmascarado `*****678-5`. | AC-01.34, AC-02.8, AC-03.6 | | |

## 3. Lector de pantalla (opcional)

| # | Paso | AC | Resultado | Notas |
|---|---|---|---|---|
| 3.1 | Paso 1: cada campo se anuncia con su etiqueta y su ayuda; al fallar la validación se anuncia el error asociado. | AC-01.26 | | |
| 3.2 | Paso 2: el grupo se anuncia con "Planes disponibles"; cada opción con nombre, "Recomendado" si aplica, precio y estado seleccionado. | AC-02.27 | | |
| 3.3 | Resumen: la casilla se anuncia con su etiqueta; "Pagar" deshabilitado lee la indicación de aceptar los términos; "Procesando el pago…" se anuncia; el rechazo se anuncia como alerta. | AC-03.34 | | |
| 3.4 | Confirmación: el foco está en el título y el número de cotización se lee. | AC-03.34 | | |

## 4. Cambio real en el admin de Strapi (G3-3)

El admin solo escucha en `127.0.0.1`. No hay administrador sembrado: el primer acceso registra al superadmin (nota 5 de `phase-4-implementation-notes.md`). Usar datos ficticios y una contraseña que no se reutilice; **no** guardarla en el repositorio.

| # | Paso | AC | Resultado | Notas |
|---|---|---|---|---|
| 4.1 | Abrir `http://127.0.0.1:1337/admin` y crear el superadmin (nombre y correo ficticios). | — | | |
| 4.2 | Content Manager → Form Field → crear un campo nuevo para Colombia: key `co_licenseNumber`, label "Número de licencia de conducción", type `text`, required `true`, section `policyholder`, order `6`, mensaje de error "Ingresa el número de tu licencia.", relación country = Colombia. **Publicar**. | AC-01.3 | | |
| 4.3 | En la app, recargar `http://localhost:8080/co/form` (F5): el campo nuevo aparece después de la autorización, sin cambiar código ni reconstruir. Dejarlo vacío y continuar: se ve su mensaje y no avanza. | AC-01.3, REQ-01.6 | | |
| 4.4 | Con un plan elegido en el paso 2 (por ejemplo "Plan Total"), en el admin: Content Manager → Plan → "Plan Total" de Colombia → `active` = `false` → **Publicar**. | AC-02.25, AC-02.21 | | |
| 4.5 | Recargar `http://localhost:8080/co/plans`: "Plan Total" ya no aparece, ningún plan queda elegido y se anuncia "El plan que elegiste ya no está disponible." | AC-02.25, AC-02.21 | | |
| 4.6 | (Opcional) Cambiar el multiplicador de una banda de factores de precio de Colombia, publicar y recargar el paso 2: los precios cambian. | AC-02.25 | | |
| 4.7 | Dejar el seed como estaba: despublicar o borrar el campo de 4.2 y volver a activar "Plan Total" (o recrear el volumen de Strapi). Anotar cómo se restauró. | — | | |

## 5. Cierre

| Campo | Valor |
|---|---|
| Veredicto (Aprobada / Rechazada / Modificada) | Aprobada |
| Defectos encontrados (pasos, esperado, obtenido) | Ninguno |
| Firma o iniciales | Confirmación del humano por chat (cita en "Resultado registrado") |
