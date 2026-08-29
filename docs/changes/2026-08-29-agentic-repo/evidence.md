# Evidencia — repositorio preparado para trabajo agéntico

Estado: verificado localmente.

## Fuente y criterio

- NotebookLM revisado en modo lectura: 121 fuentes sobre ICM, contexto, modularidad y supervisión humana.
- La consulta del cuaderno no devolvió referencias estructuradas, por lo que sus afirmaciones no se tomaron como autoridad automática.
- Se contrastó directamente el resumen público de `arXiv:2603.16021v2`: la propuesta está dirigida a workflows secuenciales con revisión humana y reconoce que los frameworks siguen siendo apropiados para sistemas concurrentes complejos.
- [INFERENCIA] Para este repo, un paquete documental por cambio es suficiente; mover el código estable a carpetas numeradas añadiría duplicación.

## Validaciones ejecutadas

1. `sh -n scripts/new-change.sh scripts/check-agentic-workflow.sh scripts/verify.sh`
   - Resultado: exit `0`.
2. `./scripts/check-agentic-workflow.sh`
   - Resultado: `AGENTIC_WORKFLOW_OK`, exit `0`.
3. Prueba aislada de `new-change.sh` en un directorio temporal
   - Resultado: creó exactamente `intake.md`, `plan.md`, `spec.md` y `evidence.md`.
4. Verificación de enlaces locales del README
   - Resultado: los cinco destinos existen.
5. Escaneo de privacidad sobre los archivos nuevos
   - Resultado: sin rutas locales, claves privadas, contraseñas ni API keys.
6. `./scripts/verify.sh`
   - Contrato agéntico: `AGENTIC_WORKFLOW_OK`.
   - Backend: `12 tests`, `0 failures`, `0 errors` contra PostgreSQL 18.6.
   - Frontend: `14 tests`, `0 failures`.
   - Playwright: `1 passed`.
   - Package consumer y gate anti-reactivo: verdes.
   - Resultado final: `VERIFICATION_OK`, exit `0`.

## Alcance confirmado

No se modificaron backend, frontend, SQL, API ni E2E. El cambio afecta documentación, scaffolding de trabajo y el gate que comprueba su presencia.
