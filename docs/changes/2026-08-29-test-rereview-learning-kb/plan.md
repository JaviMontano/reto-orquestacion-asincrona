# PLAN — test-rereview-learning-kb

Estado: aprobado por alcance de la solicitud.

## Secuencia

1. [METODOLOGIA] Extraer literalmente los requisitos del PDF y compararlos con trazabilidad, código, esquema, contratos y pruebas.
2. [METODOLOGIA] Registrar hallazgos por severidad y modificar solo lo necesario para cerrar brechas reales.
3. [PEDAGOGIA] Crear una auditoría legible y una ruta de aprendizaje con ejercicios, evidencia y límites honestos.
4. [METODOLOGIA] Ejecutar pruebas cercanas, workflow agentic, gate completo Docker y Playwright; inspeccionar API y datos persistidos.
5. [METODOLOGIA] Revisar privacidad, diff, estado Git, commit, push, CI y lectura remota.
6. [METODOLOGIA] Añadir a NotebookLM los logs finales, artefactos de comprensión y fuentes primarias no duplicadas; realizar inventario y consulta posterior.

## Archivos previstos

- Código/configuración/pruebas: solo si la auditoría detecta una brecha.
- `docs/REQUIREMENTS-AUDIT.md`: cláusula → implementación → prueba → veredicto.
- `docs/LEARNING-PATH.md`: mapa de conceptos, ejercicios y evidencia de progreso.
- `README.md`, `PLAN.md`, `docs/TRACEABILITY.md`: ajustes mínimos de navegación o trazabilidad.
- `logs.md`: entradas append-only de esta reauditoría y sus gates.
- Este paquete: cierre de intake, plan, spec y evidencia.

## Riesgos y mitigaciones

- Docker o espacio insuficiente: comprobar daemon y disco antes del gate; no confundir prueba parcial con E2E.
- Carrera falsamente determinista: verificar coordinación posterior al commit y ausencia de `sleep` decisorio.
- Fuentes duplicadas o no primarias: inventariar primero y añadir solo documentación oficial pertinente.
- Deriva entre código y explicación: derivar auditoría y aprendizaje desde archivos y comandos comprobados.
- Publicación parcial: separar commit local, push, CI, readback remoto y carga a NotebookLM.

## Condición de parada

El trabajo termina solo cuando cada requisito del PDF tiene veredicto y evidencia, el gate Docker/Playwright está verde, el remoto coincide con el commit validado y NotebookLM confirma por inventario y consulta las fuentes nuevas. Un bloqueo externo se declarará con el último gate alcanzado.

[NEUROCIENCIA] N/A.
