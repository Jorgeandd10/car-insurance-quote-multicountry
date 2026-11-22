# Prompt de arranque — Claude Code (sesión 01)

> Pega todo lo que está debajo de la línea como primer mensaje de Claude Code, abierto en la raíz del repositorio.

---

Vas a actuar como orquestador principal de este proyecto. Es una prueba técnica frontend donde se evalúa sobre todo el **proceso de desarrollo agéntico** (65 %) y después la aplicación (35 %).

## Fuentes (léelas completas antes de responder)

1. `docs/assessment/Technical assessment -Frontend.pdf`: **fuente principal de requisitos**. Manda sobre todo lo demás.
2. `docs/assessment/master-prompt.md`: contexto operativo, rol, metodología, fases y reglas de comportamiento. Síguelo.
3. `docs/phase-1/analysis.md`: entregable de la Fase 1, hecho en una sesión previa de claude.ai. Contiene la arquitectura propuesta, el equipo de agentes, los riesgos y las decisiones D1–D11 **pendientes de aprobación**.

No inventes requisitos que no estén en el PDF ni lo contradigas.

## Estado actual

- Fase 1: el análisis está hecho, pero el gate **G0 está pendiente**. Nada está aprobado todavía.
- La Fase 1 se hizo en un sandbox cloud sin Docker. Esta es la primera sesión en la máquina local.
- D1 ya está decidida por mí: trabajamos en Claude Code local sobre este repositorio GitHub privado.

## Tu tarea en esta sesión (solo esto)

1. **Verifica el entorno local real**: Node (Angular 22 exige `^22.22.3 || ^24.15.0 || >=26`), npm, Git, Docker y que el daemon esté corriendo (`docker info`), Docker Compose, y Chrome o Chromium para Playwright. Reporta las versiones con la salida real de los comandos. Si algo falta, dímelo; no lo instales sin preguntar.
2. **Contrasta el análisis de la Fase 1 con el entorno local.** Señala qué riesgos desaparecen (por ejemplo Docker), cuáles siguen y si alguna recomendación debería cambiar. Si cambias una recomendación, márcalo explícitamente.
3. Verifica con fuentes oficiales lo que el análisis dejó pendiente: si **Signal Forms** es estable en Angular 22 (afecta a D5) y cuál es el test runner por defecto de Angular 22.
4. Preséntame las decisiones **D2–D11** en una tabla breve (decisión, recomendación, alternativa y su impacto) para que las apruebe, rechace o ajuste una a una.
5. **Detente y espera mi respuesta.** No crees agentes, skills, specs ni código todavía.

Cuando yo responda, registra cada decisión (aprobada, rechazada o modificada, con mi motivo literal) en `docs/decision-log.md`, actualiza el estado de `docs/phase-1/analysis.md`, haz commit y propón el plan de la Fase 2.

## Reglas permanentes

- Comunícate conmigo en español. Nombres de tecnologías, clases y archivos en inglés.
- Sé conciso. Prioriza soluciones simples, robustas y mantenibles. No añadas dependencias sin justificarlas.
- No declares que algo funciona sin haberlo ejecutado. No inventes resultados de pruebas, aprobaciones ni evidencias.
- Ante un error, analiza la causa antes de proponer una corrección.
- Nunca edites nada dentro de `logs/`: son evidencias originales.
- Commits pequeños con Conventional Commits. No hagas push sin que te lo pida.
- No modifiques decisiones aprobadas sin señalar el cambio.
- Mantén la documentación actualizada durante el desarrollo, no solo al final.
