# Plan — Playwright front, back y datos

Estado: aprobado por la solicitud actual.

1. Ejecutar el E2E actual como línea base.
2. Comparar su cobertura con los comportamientos prometidos en README y trazabilidad.
3. Añadir escenarios Playwright para aprobación normal, optimismo, persistencia tras recarga, reset y aprobación-primero seguida de invalidación curricular.
4. Mantener S1 y sus comprobaciones de `412`, consola y acceso directo a API.
5. Ejecutar la suite E2E aislada varias veces para detectar flakiness.
6. Ejecutar `./scripts/verify.sh` completo.
7. Registrar evidencia, revisar privacidad, publicar y esperar CI.

## Riesgos

- Confundir presencia del control con estado interactivo: esperar snapshot autoritativo antes del clic.
- Observar optimismo después de una respuesta demasiado rápida: retener solo la respuesta en Playwright, sin alterar el backend.
- Dejar datos entre tests: restablecer el fixture antes de cada escenario y usar un único worker.

## Condición de parada

No declarar cumplimiento hasta que UI, status HTTP, ETag y lectura API posterior coincidan en todos los escenarios.
