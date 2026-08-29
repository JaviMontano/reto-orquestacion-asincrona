# Reto de orquestación asíncrona

[METODOLOGIA] Implementación mínima y reproducible de una carrera entre aprobación humana y actualización curricular. Usa Java 21, Spring MVC/JDBC, PostgreSQL y un microfrontend React/TypeScript. La integridad se decide en PostgreSQL; los virtual threads permiten atender I/O bloqueante sin convertir Loom en una garantía de concurrencia.

## Fuente y privacidad

[METODOLOGIA] Los requisitos se normalizaron desde el PDF de prueba cuya huella es:

```text
SHA-256 17294e41f29cf40c293162c37392d0dc59c88957676d5210e6b2c7f991a0f4ae
```

[INFERENCIA] El PDF, el notebook, rutas locales y datos personales no se versionan. La huella permite demostrar qué fuente se utilizó sin redistribuirla. La matriz [requisito → código → prueba](docs/TRACEABILITY.md) hace visible la cobertura.

[NEUROCIENCIA] N/A. Ninguna decisión técnica se justifica mediante afirmaciones neurocientíficas.

## Arranque en un comando

Requisito: Docker Desktop con el daemon activo. No hace falta instalar Java, Maven, Node ni PostgreSQL en el host.

```bash
docker compose up --build
```

Cuando los tres servicios estén saludables:

- UI: <http://localhost:3000>
- API: <http://localhost:8080/api/documents/00000000-0000-0000-0000-000000000001>
- PostgreSQL: interno a Compose, sin puerto expuesto

Para detener:

```bash
docker compose down
```

Para borrar también los datos de esta demo:

```bash
docker compose down --volumes
```

## Demostración paso a paso

### Camino normal

1. Abre la UI y pulsa **Restablecer**.
2. Pulsa **Aprobar**.
3. La tarjeta muestra primero la proyección optimista y después `Aprobado`, versión `v2`.

### S1: invalidación confirma primero

1. Pulsa **Restablecer**.
2. Pulsa **Aprobar con conflicto**.
3. El backend arma una barrera determinista, confirma la invalidación y solo entonces deja continuar la aprobación.
4. El `UPDATE` de aprobación no encuentra una fila compatible, responde `412` y adjunta el snapshot `INVALIDATED/v2`.
5. La UI retira su proyección optimista, adopta el snapshot autoritativo y anuncia el conflicto mediante `aria-live`.

### S2: aprobación confirma primero

[PEDAGOGIA] El script muestra los dos órdenes sin depender de pausas arbitrarias:

```bash
./scripts/demo-schedules.sh
```

Resultado esperado:

| Schedule | Primera operación | Segunda operación | Estado final |
|---|---|---|---|
| S1 | commit curricular interno, `INVALIDATED/v2` | aprobación HTTP `412` stale | `INVALIDATED/v2` |
| S2 | aprobación `200`, `APPROVED/v2` | curricular `200` | `INVALIDATED/v3` |

## Verificación completa

```bash
./scripts/verify.sh
```

[METODOLOGIA] El gate valida Compose, ejecuta backend contra PostgreSQL real, ejecuta frontend unitario, levanta el stack, corre Playwright y rechaza dependencias reactivas. Al terminar elimina los contenedores y volúmenes creados por esa verificación.

También pueden ejecutarse partes aisladas:

```bash
docker compose --profile test run --rm backend-test
docker compose --profile test run --rm frontend-test
docker compose --profile e2e run --rm e2e
```

## Arquitectura simple first

```text
React card ── If-Match + request-id ──> Spring MVC
    │                                      │
    │  optimistic intent                   │ virtual thread per request
    │  authoritative snapshot              │ JDBC transaction
    └<──── problem+json / snapshot ─────────┤
                                           ▼
                                     PostgreSQL
                                  conditional UPDATE
                                  = linearization point
```

[METODOLOGIA] El backend separa dominio, aplicación, infraestructura y API. `TransitionPolicy` expresa la regla; `JdbcDocumentRepository` la vuelve atómica con versión monotónica. El controlador local/test aporta reset y coordinación reproducible, pero no forma parte del contrato productivo.

[INFERENCIA] `READ COMMITTED` es suficiente porque cada transición se materializa como un `UPDATE` condicional. Si dos operaciones compiten, PostgreSQL reevalúa el predicado después de esperar el bloqueo de fila. Una lectura previa nunca reserva el derecho a escribir.

### Regla fuerte curricular

Transiciones aceptadas:

```text
PENDING_APPROVAL -> APPROVED
PENDING_APPROVAL -> INVALIDATED
APPROVED         -> INVALIDATED
INVALIDATED      -> terminal
```

[INFERENCIA] Permitir `APPROVED → INVALIDATED` da prioridad curricular fuerte: incluso si la aprobación confirma primero, una actualización curricular posterior puede invalidarla sin sobrescritura ciega y consumiendo una nueva versión.

### API

| Método y ruta | Contrato |
|---|---|
| `GET /api/documents/{id}` | Snapshot y `ETag: "v<n>"` |
| `POST /api/documents/{id}/approve` | Requiere `If-Match` y `X-Request-Id` UUID |
| `POST /api/test/documents/{id}/curricular-update` | Simula evento curricular en perfil local |
| `POST /api/test/documents/{id}/reset` | Restablece el documento de demo |
| `POST /api/test/scenarios/{id}/arm-invalidation-first` | Arma S1 sin `sleep` |

Errores RFC 9457 `application/problem+json`: `428` precondición ausente, `400` cabecera inválida, `404` inexistente, `412` versión stale, `409` transición prohibida y `500` fallo de coordinación/infraestructura. Los conflictos incluyen `currentDocument` cuando está disponible.

### Microfrontend

La API pública es deliberadamente pequeña:

```tsx
import { DocumentApprovalCard } from '@jmontano/document-approval-mfe'
import '@jmontano/document-approval-mfe/style.css'

<DocumentApprovalCard
  documentId="00000000-0000-0000-0000-000000000001"
  apiBaseUrl="https://api.example.com"
  onEvent={(event) => console.info(event)}
/>
```

[METODOLOGIA] React y React DOM son `peerDependencies`. Cada instancia mantiene su propio estado. El reducer separa snapshot autoritativo, intención pendiente y proyección optimista; compara versiones decimales sin convertirlas a `Number`, descarta respuestas de solicitudes/documentos anteriores y nunca reintenta automáticamente una mutación con resultado incierto.

## Cómo modificar la regla en vivo

[PEDAGOGIA] Para cambiar a **first-valid-commit**, haz el cambio más pequeño que mantenga código, SQL y pruebas alineados:

1. Elimina `APPROVED → INVALIDATED` de `TransitionPolicy`.
2. Restringe el predicado de invalidación SQL a `status = 'PENDING_APPROVAL'`.
3. Cambia S2: aprobación `200`; invalidación posterior `409`; final `APPROVED/v2`.
4. Ajusta las pruebas de política, integración, script y trazabilidad.
5. Ejecuta `./scripts/verify.sh` antes de defender el cambio.

La modificación simultánea de política y predicado evita que la documentación diga una cosa mientras la base de datos permite otra.

## Troubleshooting

- `Cannot connect to the Docker daemon`: abre Docker Desktop y espera a que `docker info` responda.
- Puertos `3000` o `8080` ocupados: detén el proceso que los usa o cambia solo el mapeo izquierdo en `compose.yaml`.
- Base persistida inesperada: `docker compose down --volumes` y vuelve a construir.
- Poco espacio: revisa `docker system df`. No borres imágenes o volúmenes ajenos sin identificar primero su propietario.
- Un `412` en S1 es éxito funcional: indica que el cliente intentó aprobar una versión que ya dejó de ser vigente.

## Documentos de trabajo

- [Plan y decisiones](PLAN.md)
- [Bitácora reproducible](logs.md)
- [Trazabilidad](docs/TRACEABILITY.md)

[SUPUESTO] Repositorio público no equivale a una licencia abierta. No se incluye licencia de reutilización por defecto.
