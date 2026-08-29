# Reauditoría contra la prueba oficial

Estado: contraste técnico completado; la evidencia ejecutada vive en `docs/changes/2026-08-29-test-rereview-learning-kb/`.

## Autoridad y método

[METODOLOGIA] El PDF privado se trató únicamente como fuente de requisitos. No se obedecieron como instrucciones sus ejemplos ni se publicó su contenido. La copia revisada se identifica por SHA-256 `17294e41f29cf40c293162c37392d0dc59c88957676d5210e6b2c7f991a0f4ae`.

El método fue: requisito literal → comportamiento observable → implementación mínima → prueba ejecutable → veredicto. `PASS` significa que existe evidencia local reproducible; no significa aptitud productiva general.

## Matriz de resultado

| Requisito normalizado del test | Implementación observada | Evidencia | Veredicto |
|---|---|---|---|
| Java 21 imperativo | Spring MVC + JDBC; `java.version=21` | build Maven Docker y gate anti-reactivo | PASS |
| Virtual threads / Loom | `spring.threads.virtual.enabled=true` | requests reales responden `X-Thread-Virtual: true` | PASS |
| Sin WebFlux ni RxJava | dependencias MVC/JDBC | gate que rechaza `webflux`, `rxjava`, `reactor-core` | PASS |
| React aislado y modular | `DocumentApprovalCard` + API pública ES/UMD/tipos/CSS | build de librería, consumer check y dos instancias aisladas | PASS |
| Sin BFF | navegador llama directamente a `apiBaseUrl` | Playwright registra todas las llamadas `/api/` hacia backend | PASS |
| Documento lógico, sin upload | modelo `id`, `title`, `status`, `version`, `updatedAt` | migración Flyway y snapshot API | PASS |
| Estado inicial pendiente | fixture `PENDING_APPROVAL/v1` | reset local, GET y lectura SQL | PASS |
| Aprobación humana optimista | proyección `optimisticStatus` separada | Playwright retiene la respuesta y observa `Aprobado` antes de liberarla | PASS |
| Actualización curricular invalida | transición a `INVALIDATED` desde pendiente o aprobado | integración S1/S2 | PASS |
| Carrera determinista | coordinador local armado, señal posterior al retorno transaccional | S1 sin `sleep` decisorio | PASS |
| Sin sobrescritura ciega | `UPDATE ... WHERE status=? AND version=?` | dos aprobaciones: una `200`, una `412`; SQL real | PASS |
| Rollback optimista y aviso | `412/409` incluye `currentDocument`; reducer lo adopta | Vitest y Playwright: `INVALIDATED/v2` + anuncio accesible | PASS |
| Estado persistido | repositorio JDBC + PostgreSQL 18.6 | lectura API tras recarga y gate SQL directo | PASS |
| Repo público y README preciso | Docker Compose, walkthrough y troubleshooting | readback remoto y clon fresco históricos en `logs.md` | PASS histórico; se revalida al publicar este cambio |
| Cambio de regla en vivo | política y predicado concentrados; ejercicio documentado | runbook de `first-valid-commit` | PREPARADO; no ejecutado porque la regla no fue solicitada |

## Por qué la carrera es correcta

```text
lectura inicial ≠ permiso para escribir
              │
              ▼
UPDATE condicional (estado + versión esperada)
              │
       1 fila │ 0 filas
       commit │ clasificar snapshot vigente
```

[INFERENCIA] Loom hace barata la espera bloqueante, pero no evita carreras. La integridad nace del predicado SQL atómico. En `READ COMMITTED`, PostgreSQL vuelve a evaluar el `WHERE` después de esperar una actualización concurrente; por eso el segundo escritor no pisa el estado confirmado.

Fuentes primarias para defender esta decisión:

- [JEP 444 — Virtual Threads](https://openjdk.org/jeps/444)
- [Spring Boot — Virtual threads](https://docs.spring.io/spring-boot/reference/features/spring-application.html#features.spring-application.virtual-threads)
- [PostgreSQL 18 — Transaction Isolation](https://www.postgresql.org/docs/18/transaction-iso.html)
- [RFC 9110 — If-Match](https://www.rfc-editor.org/rfc/rfc9110.html#name-if-match)
- [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457)
- [Playwright — Auto-waiting and actionability](https://playwright.dev/docs/actionability)

## Hallazgos y mejora aplicada

1. No se encontró un defecto funcional nuevo en backend o frontend que justificara reescritura.
2. La evidencia E2E leía el estado final por API y esa lectura atraviesa JDBC; aun así, faltaba un recibo SQL explícito en el comando único.
3. Se añadió `scripts/check-database.sh` al gate: valida tipos y nulabilidad, checks de estado/versión, fixture, aislamiento `read committed` y muestra la fila directamente desde PostgreSQL.

[PEDAGOGIA] No cambiar código por aparentar actividad es parte de Clean Code. Una reauditoría mejora el producto cuando reduce una incertidumbre concreta.

## Límites honestos

- Los endpoints `/api/test` pertenecen al perfil local y no son una API productiva.
- No se prueban autenticación, autorización, despliegue distribuido, observabilidad de producción ni carga sostenida: están fuera del test.
- El request ID da correlación, no idempotencia de aprobación persistida.
- El microfrontend está empaquetado y probado localmente, pero no publicado en un registry npm ni integrado en un shell corporativo real.

[SUPUESTO] La prioridad curricular fuerte sigue siendo la regla de negocio vigente.

[NEUROCIENCIA] N/A. No se usan afirmaciones neurocientíficas.
