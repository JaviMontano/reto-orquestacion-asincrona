# Cambios guiados por evidencia

Cada solicitud que modifique comportamiento o documentación relevante vive en una carpeta:

```text
docs/changes/YYYY-MM-DD-slug/
├── intake.md    # qué entendimos, preguntas, supuestos y alcance
├── plan.md      # cómo se hará, riesgos, archivos y pruebas
├── spec.md      # comportamiento observable y aceptación
└── evidence.md  # qué se ejecutó y qué quedó demostrado
```

El flujo es secuencial:

```text
entendimiento → intake → plan → spec → ejecución → evidencia
```

## Crear un paquete

```bash
./scripts/new-change.sh nombre-del-cambio
```

El script solo crea la estructura. El agente o la persona debe completar cada documento y respetar los gates de `AGENTS.md`.

## Gestión de lo ya realizado

- `PLAN.md` y `logs.md` conservan la entrega inicial y no se reescriben como si fuera trabajo nuevo.
- `docs/TRACEABILITY.md` mantiene la relación estable requisito → implementación → prueba.
- Cada evolución posterior conserva su propia intención y evidencia aquí.
- Un paquete cerrado no se borra: sirve para entender por qué cambió el sistema.

[INFERENCIA] Se adopta una idea mínima de ICM: contexto acotado y revisión humana por etapa. No se trasladan los fuentes Java/React a carpetas de workflow porque eso duplicaría la arquitectura técnica existente.
