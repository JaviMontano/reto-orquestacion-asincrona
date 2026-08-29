# SPEC — test-rereview-learning-kb

Estado: lista para ejecución.

## Comportamiento observable

- El backend usa Java 21 imperativo con Spring MVC/JDBC y atiende requests en virtual threads.
- PostgreSQL conserva `id`, `title`, `status`, `version` y timestamp; estado y versión tienen restricciones explícitas.
- Aprobación e invalidación escriben mediante compare-and-set SQL: versión esperada y estado permitido deben coincidir.
- S1 produce invalidación autoritativa y aprobación `412`; S2 produce aprobación y luego invalidación con versiones monótonas.
- El frontend es consumible como módulo independiente, no usa BFF y separa snapshot, intención y proyección optimista.
- Ante `412/409`, timeout, cambio de documento o respuesta tardía, la UI nunca regresa la versión y muestra el estado autoritativo.
- Playwright comprueba navegador, API y persistencia, sin errores de consola ni esperas decisorias por tiempo.

## Auditoría y aprendizaje

- Cada cláusula del PDF aparece en una matriz con evidencia concreta o `coverage_gap`.
- La guía de aprendizaje separa: lo que el sistema demuestra, lo que el autor puede explicar con apoyo y lo que todavía no debe afirmar como habilidad autónoma.
- Cada gap incluye un ejercicio reproducible y un criterio de cierre observable.
- El README enlaza auditoría, ruta de aprendizaje y proceso agentic sin duplicar su contenido.

## NotebookLM

- `logs.md` se incorpora como fuente después del commit final.
- Se incorporan artefactos propios de auditoría/aprendizaje y fuentes primarias oficiales que no estén ya en el inventario.
- La carga se verifica mediante conteo/identificadores y una consulta fundamentada en las fuentes añadidas.
- No se carga el PDF local ni contenido privado exportado del cuaderno.

## Casos borde mínimos

- Falta o formato inválido de `If-Match`, versión obsoleta, transición prohibida, doble aprobación, invalidación repetida, documento inexistente y rollback.
- Doble clic, timeout sin retry automático, respuesta tardía y dos instancias del microfrontend aisladas.
- Reset y schedules S1/S2 dejan estado final comprobable en API y PostgreSQL.

## Criterios de aceptación

1. Auditoría del PDF completa, sin requisitos inventados.
2. Tests backend, frontend, paquete y E2E verdes dentro del gate reproducible.
3. `git diff --check`, privacidad y workflow agentic verdes.
4. Commit publicado, CI verde y SHA remoto leído.
5. NotebookLM muestra las nuevas fuentes y responde una consulta de control con ellas.

[INFERENCIA] No se exige cambiar código si el contraste demuestra que ya cumple; documentación y pruebas solo se amplían cuando aumenten evidencia o capacidad de aprendizaje.

[NEUROCIENCIA] N/A.
