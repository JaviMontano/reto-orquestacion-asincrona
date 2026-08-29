# Reto de orquestación asíncrona

Implementación reproducible de una carrera entre aprobación humana y actualización curricular. El objetivo no es enseñar muchas tecnologías a la vez, sino hacer visible una decisión difícil: cómo evitar que dos operaciones concurrentes sobrescriban el estado de un documento.

```text
React + actualización optimista
          │ If-Match + request-id
          ▼
Spring MVC sobre virtual threads
          │ transacción JDBC
          ▼
PostgreSQL + UPDATE condicional
          ╰─ punto de linearización
```

[METODOLOGIA] La solución usa Java 21, Spring MVC/JDBC, PostgreSQL y React/TypeScript. Loom atiende I/O bloqueante; la integridad la preservan la versión esperada, la transición permitida y el `UPDATE` atómico en PostgreSQL.

## Qué demuestra — y qué no

Este repositorio sí demuestra:

- una solución completa ejecutada en Docker;
- carreras S1 y S2 reproducibles sin `sleep` decisorio;
- pruebas backend, frontend y E2E;
- trazabilidad entre requisito, implementación y evidencia;
- un método de trabajo asistido: entender, preguntar, planear, especificar, ejecutar y comprobar.

No demuestra que su autor pueda reconstruir de memoria toda la solución, programarla manualmente sin apoyo o presentarse como desarrollador experto en Java y PostgreSQL.

[SUPUESTO] Java y PostgreSQL son tecnologías conocidas desde hace tiempo, pero no forman parte todavía de una experiencia profesional práctica sostenida. La afirmación responsable es más concreta: puedo revisar el código, explicar sus decisiones, formular hipótesis, consultar documentación, ejecutar pruebas, aprender de los fallos y verificar el comportamiento con evidencia.

## Probarlo en vivo

Requisito único: Docker Desktop activo. No hace falta instalar Java, Maven, Node ni PostgreSQL en el host.

### Demo visual

```bash
docker compose up --build
```

Cuando los servicios estén saludables:

- interfaz: <http://localhost:3000>
- API: <http://localhost:8080/api/documents/00000000-0000-0000-0000-000000000001>
- PostgreSQL: interno a Compose, sin puerto publicado

Recorrido recomendado:

1. Pulsa **Restablecer** y luego **Aprobar**: la UI proyecta optimismo y confirma `APPROVED/v2`.
2. Pulsa **Restablecer** y luego **Aprobar con conflicto**: la invalidación confirma primero; aprobación recibe `412`; la UI converge a `INVALIDATED/v2`.
3. Ejecuta `./scripts/demo-schedules.sh`: el terminal reproduce S1 y S2 con resultados deterministas.

| Carrera | Orden observado | Resultado final |
|---|---|---|
| S1 | invalidación confirma; aprobación queda stale (`412`) | `INVALIDATED/v2` |
| S2 | aprobación confirma; invalidación curricular confirma después | `INVALIDATED/v3` |

Para detener la demo:

```bash
docker compose down
```

Para eliminar también sus datos:

```bash
docker compose down --volumes
```

### Gate completo

```bash
./scripts/verify.sh
```

El gate valida el contrato agéntico y Compose, prueba el backend contra PostgreSQL real, ejecuta Vitest, construye app y microfrontend, levanta el stack, ejecuta Playwright, consulta directamente esquema/fila en PostgreSQL y rechaza dependencias reactivas. El resultado válido termina en:

```text
AGENTIC_WORKFLOW_OK
VERIFICATION_OK
```

Al terminar elimina los contenedores y volúmenes creados por la verificación.

## Cómo leer el repositorio

```text
.
├── AGENTS.md          # contrato operativo para agentes
├── backend/           # dominio, aplicación, API, JDBC y pruebas Java
├── frontend/          # tarjeta React, estado, API y pruebas
├── e2e/               # recorrido Playwright contra el stack real
├── scripts/           # demo, verificación y creación de cambios
├── docs/
│   ├── changes/       # intake, plan, spec y evidencia por evolución
│   ├── LEARNING-PATH.md
│   ├── REQUIREMENTS-AUDIT.md
│   └── TRACEABILITY.md
├── compose.yaml
├── PLAN.md            # decisiones de la entrega inicial, ya cerrada
└── logs.md            # bitácora histórica de la entrega inicial
```

[INFERENCIA] El cuaderno ICM revisado propone usar el sistema de archivos como arquitectura interpretable para flujos secuenciales con revisión humana. Aquí se adopta solo lo necesario: contexto y evidencia por cambio. El código no se mueve a carpetas de etapas porque `backend/`, `frontend/` y `e2e/` ya expresan mejor sus responsabilidades técnicas.

La estructura ayuda a encontrar el contexto correcto; no garantiza que un agente entienda el dominio ni que el código funcione. Las pruebas y la revisión siguen siendo la autoridad.

Para revisar el reto cláusula por cláusula, abre la [reauditoría contra la prueba](docs/REQUIREMENTS-AUDIT.md). Para aprender sin exagerar experiencia, sigue la [ruta de práctica y sustentación](docs/LEARNING-PATH.md).

## Cómo solicitar y gestionar un cambio

La regla del repositorio está en [AGENTS.md](AGENTS.md). Todo cambio material sigue este orden:

```text
validar lo entendido
        ↓
intake: preguntas o supuestos
        ↓
plan: archivos, riesgos y pruebas
        ↓
spec: comportamiento y aceptación
        ↓
ejecución mínima
        ↓
evidencia ejecutada
```

Crear el paquete:

```bash
./scripts/new-change.sh nombre-del-cambio
```

Se genera `docs/changes/YYYY-MM-DD-nombre-del-cambio/` con `intake.md`, `plan.md`, `spec.md` y `evidence.md`. Los cambios terminados permanecen como historial legible; no se mezclan reescribiendo el plan original.

[PEDAGOGIA] Las preguntas se hacen cuando una respuesta cambia materialmente la solución. Si no hay bloqueo, se registran supuestos y se continúa. Una spec describe lo esperado; solo la evidencia ejecutada permite declarar que ocurrió.

## Mi método para trabajar con tecnología nueva

No comienzo escribiendo código a ciegas. El método usado aquí es:

1. Traducir el problema a estados, invariantes y ejemplos observables.
2. Localizar el punto que decide la integridad; en este caso, el `UPDATE` SQL condicional.
3. Leer primero contratos y pruebas, y después la implementación mínima relacionada.
4. Consultar documentación primaria cuando una API, versión o semántica no es segura.
5. Formular una predicción antes de ejecutar: status HTTP, versión y estado final.
6. Ejecutar una prueba pequeña, estudiar el fallo y registrar qué cambió en el entendimiento.
7. Repetir el escenario en Docker y navegador antes de afirmar que funciona.
8. Explicar con lenguaje simple qué sé, qué inferí y qué todavía necesito practicar.

Ese proceso no reemplaza experiencia profesional acumulada. Sí permite aprender con rigor y evita presentar como habilidad manual aquello que fue logrado mediante herramientas, documentación, pruebas y asistencia agéntica.

## Diseño técnico esencial

### Regla curricular fuerte

```text
PENDING_APPROVAL -> APPROVED
PENDING_APPROVAL -> INVALIDATED
APPROVED         -> INVALIDATED
INVALIDATED      -> terminal
```

Una aprobación solo confirma cuando versión y estado esperado coinciden. En S2, la invalidación posterior consume una nueva versión: no hay sobrescritura ciega.

### Contrato HTTP

| Método y ruta | Contrato |
|---|---|
| `GET /api/documents/{id}` | snapshot y `ETag: "v<n>"` |
| `POST /api/documents/{id}/approve` | requiere `If-Match` y `X-Request-Id` UUID |
| `POST /api/test/documents/{id}/curricular-update` | simula el evento curricular local |
| `POST /api/test/documents/{id}/reset` | restablece el fixture |
| `POST /api/test/scenarios/{id}/arm-invalidation-first` | arma S1 sin pausas arbitrarias |

Los errores usan `application/problem+json`: `428`, `400`, `404`, `412`, `409` y `500`. Cuando se conoce, el conflicto incluye `currentDocument`.

### Microfrontend

```tsx
import { DocumentApprovalCard } from '@jmontano/document-approval-mfe'
import '@jmontano/document-approval-mfe/style.css'

<DocumentApprovalCard
  documentId="00000000-0000-0000-0000-000000000001"
  apiBaseUrl="https://api.example.com"
/>
```

El estado separa snapshot autoritativo, intención pendiente y proyección optimista. Las versiones decimales se comparan sin convertirlas a `Number`; las respuestas tardías no pueden regresar de documento o versión; una mutación incierta no se reintenta automáticamente.

## Aprender modificando una regla

Un ejercicio útil es cambiar a **first-valid-commit**:

1. Crea el paquete con `./scripts/new-change.sh first-valid-commit`.
2. Especifica que `APPROVED → INVALIDATED` deja de ser válido.
3. Actualiza `TransitionPolicy` y el predicado SQL de invalidación.
4. Cambia S2: aprobación `200`, invalidación `409`, final `APPROVED/v2`.
5. Ajusta pruebas y trazabilidad.
6. Ejecuta `./scripts/verify.sh`.

Este ejercicio obliga a mantener alineadas política, persistencia, API, UI, pruebas y explicación.

## Diagnóstico rápido

- Docker no responde: abre Docker Desktop y espera a que `docker info` termine correctamente.
- Puertos `3000` o `8080` ocupados: cambia el mapeo izquierdo en `compose.yaml` o detén el proceso identificado.
- Estado persistido inesperado: `docker compose down --volumes`.
- Poco espacio: inspecciona `docker system df`; no borres recursos ajenos sin identificar su dueño.
- Un `412` en S1 es el comportamiento esperado, no un fallo del sistema.

## Evidencia y privacidad

Los requisitos originales se normalizaron desde un PDF privado identificado por:

```text
SHA-256 17294e41f29cf40c293162c37392d0dc59c88957676d5210e6b2c7f991a0f4ae
```

No se versionan el PDF, contenido privado del notebook, rutas locales ni datos personales. Consulta:

- [trazabilidad requisito → código → prueba](docs/TRACEABILITY.md)
- [reauditoría contra el test](docs/REQUIREMENTS-AUDIT.md)
- [ruta de aprendizaje y sustentación](docs/LEARNING-PATH.md)
- [proceso y cambios](docs/changes/README.md)
- [plan inicial cerrado](PLAN.md)
- [bitácora inicial](logs.md)

[NEUROCIENCIA] N/A. Ninguna decisión se justifica mediante afirmaciones neurocientíficas.

[SUPUESTO] Un repositorio público no equivale a una licencia abierta. No se incluye licencia de reutilización por defecto.
