# Spec — repositorio preparado para trabajo agéntico

## Comportamiento requerido

1. Un agente nuevo puede descubrir propósito, proceso, comando de prueba e invariantes desde la raíz.
2. Ningún cambio de código comienza sin entendimiento, intake, plan y spec registrados.
3. Las preguntas se reservan para decisiones materiales; los supuestos no bloqueantes quedan explícitos.
4. El código existente conserva sus rutas y contratos.
5. El README permite ejecutar y explicar una demostración en vivo solo con Docker.
6. El README diferencia capacidad demostrada, método asistido y experiencia todavía no adquirida.
7. El gate falla si falta `AGENTS.md` o un paquete de cambio está incompleto.

## Criterios de aceptación

- `./scripts/check-agentic-workflow.sh` termina con `AGENTIC_WORKFLOW_OK`.
- `./scripts/verify.sh` conserva `VERIFICATION_OK`.
- Todos los enlaces locales del README apuntan a archivos existentes.
- No hay cambios funcionales en backend, frontend, base de datos o E2E.
- No se publica contenido privado del notebook, rutas locales, secretos ni PII.

## Límite metodológico

[INFERENCIA] La estructura mejora descubribilidad y trazabilidad. No prueba por sí sola que un agente comprendió el dominio; esa afirmación requiere resultados de pruebas y revisión humana.
