# Ruta honesta para aprender y sustentar el reto

Esta guía no intenta convertir una ejecución asistida en una credencial. Convierte el repositorio en práctica deliberada: predecir, comprobar, explicar y modificar con una evidencia observable.

## Qué puedo decir hoy

[PEDAGOGIA] Una formulación responsable es:

> No tengo todavía experiencia profesional sostenida programando Java o PostgreSQL. Sí puedo descomponer el problema, leer y revisar la solución con apoyo, consultar fuentes primarias, formular predicciones, ejecutar pruebas, explicar la evidencia y cerrar gaps mediante cambios pequeños y verificados.

Evita decir “domino Java/PostgreSQL” o “lo hice todo manualmente”. También evita reducir el trabajo a “la IA lo hizo”: las decisiones, gates, revisión y capacidad de explicar son parte del resultado, pero no sustituyen práctica autónoma.

## Mapa mental mínimo

| Pregunta | Respuesta corta | Archivo para comprobarla |
|---|---|---|
| ¿Cuál es el dato autoritativo? | La fila confirmada en PostgreSQL | `V1__create_documents.sql` |
| ¿Dónde se decide quién gana? | En el `UPDATE` condicional | `JdbcDocumentRepository.java` |
| ¿Qué hace Loom? | Permite esperar I/O con virtual threads; no da integridad | `application.yml`, test del header |
| ¿Qué evita aprobar una versión vieja? | `If-Match` + versión en el `WHERE` | `ETagParser.java`, repositorio JDBC |
| ¿Qué es optimista? | Solo la proyección visual mientras llega respuesta | `state.ts` |
| ¿Cómo vuelve la UI a la verdad? | Adopta `currentDocument` o hace un GET fresco | `useDocumentApproval.ts` |
| ¿Cómo sé que no es azar? | S1 usa una barrera commit-aware, no una pausa | `LocalRaceCoordinator.java` |

## Escalera de práctica

### Nivel 1 — Predecir sin tocar código

1. Restablece el fixture.
2. Antes de ejecutar S1, escribe: códigos HTTP, estado y versión final.
3. Haz lo mismo para S2.
4. Ejecuta `./scripts/demo-schedules.sh` y compara.

Cierre: predecir correctamente `S1 = 412 + INVALIDATED/v2` y `S2 = 200, 200 + INVALIDATED/v3`, explicando por qué cada transición consume una versión.

### Nivel 2 — Seguir una request completa

Traza con el editor:

```text
botón → useDocumentApproval → api.ts → DocumentController
      → DocumentService → JdbcDocumentRepository → PostgreSQL
      → snapshot/problem → reducer → mensaje visible
```

Cierre: señalar dónde se valida `If-Match`, dónde ocurre la transacción y dónde se retira el optimismo.

### Nivel 3 — Diagnosticar con evidencia

Rompe deliberadamente una expectativa en una rama de práctica, ejecuta primero la prueba cercana y explica: requisito, predicción, mensaje real, causa, corrección mínima y gate final.

Cierre: poder distinguir un fallo de test, de UI, de contrato HTTP y de persistencia.

### Nivel 4 — Cambiar la regla en vivo

Implementa `first-valid-commit` mediante un paquete nuevo:

1. especifica que `APPROVED → INVALIDATED` queda prohibido;
2. cambia `TransitionPolicy`;
3. cambia el predicado SQL de invalidación;
4. actualiza S2 a `200`, luego `409`, final `APPROVED/v2`;
5. ajusta trazabilidad y corre `./scripts/verify.sh`.

Cierre: política, SQL, HTTP, pruebas y explicación coinciden. No memorices líneas; conserva el invariante.

### Nivel 5 — Reconstruir una parte sin asistencia

En un directorio desechable, implementa solo uno de estos ejercicios y luego compara:

- parser de `ETag` con tests;
- `TransitionPolicy` con tabla de casos;
- reducer que rechaza una versión anterior;
- migración SQL con checks de estado y versión.

Cierre: explicar diferencias y corregirlas sin copiar la solución completa.

## Ledger de gaps

| Gap actual | Riesgo al sustentar | Práctica para cerrarlo | Evidencia de cierre |
|---|---|---|---|
| Sintaxis y tooling Java/Spring | confundir anotaciones con garantías | recorrer controller → service → repository y modificar un caso | test cercano verde + explicación propia |
| Transacciones PostgreSQL | atribuir integridad a Loom | ejecutar S1 y leer el `WHERE` junto a docs de `READ COMMITTED` | predecir fila afectada `1/0` |
| HTTP condicional | confundir `409` y `412` | provocar missing, malformed, stale y transición prohibida | tabla status/causa correcta |
| Estado React | confundir optimismo con verdad | retener una respuesta en Playwright y observar ambas fases | explicar snapshot/intención/proyección |
| Automatización E2E | usar sleeps o UI visible como prueba suficiente | leer locators, auto-wait y comprobación de API | test estable + consola limpia |
| Cambio en vivo | editar varios lugares sin contrato | intake → plan → spec → cambio mínimo → gate | paquete cerrado y diff explicable |

## Guion de sustentación de cinco minutos

1. Problema: dos operaciones compiten por una fila versionada.
2. Invariante: una transición solo confirma si el estado vigente permite la operación; aprobación además exige la versión observada.
3. Decisión: MVC/JDBC sobre virtual threads mantiene flujo imperativo; PostgreSQL decide integridad.
4. Demostración: S1 y S2, señalando HTTP, versión y fila final.
5. Frontend: el optimismo es reversible y una respuesta vieja no puede regresar el estado.
6. Honestidad: qué está probado, qué está fuera de alcance y qué practicaría después.

[METODOLOGIA] Si una pregunta supera lo comprobado, responde “no lo sé todavía”, formula cómo lo verificarías y ejecuta el experimento más pequeño. Eso es más defendible que improvisar certeza.

[INFERENCIA] La capacidad transferible aquí no es recordar Spring: es mantener alineados requisito, invariante, implementación y evidencia mientras se reduce un gap técnico.

[SUPUESTO] Estos gaps describen el punto de partida declarado por el autor y deben actualizarse con evidencia, no con autopercepción.

[NEUROCIENCIA] N/A. La ruta se justifica por práctica y verificabilidad, no por claims neurocientíficos.
