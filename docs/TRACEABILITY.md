# Matriz de trazabilidad

[METODOLOGIA] Esta matriz vincula cada requisito normalizado con su implementación y evidencia ejecutable. La autoridad exacta se identifica por el SHA-256 publicado en `README.md`; el documento privado no se copia.

| Requisito normalizado | Implementación | Prueba o gate | Evidencia esperada |
|---|---|---|---|
| Java 21 y virtual threads | `backend/pom.xml`, `application.yml`, `DocumentController` | `DocumentRaceIntegrationTest` | `X-Thread-Virtual: true` |
| Transiciones explícitas | `domain/TransitionPolicy.java` | `TransitionPolicyTest` | permitidas/prohibidas verdes |
| Aprobación versionada | `ETagParser`, `DocumentService`, `JdbcDocumentRepository` | integración MVC/PostgreSQL | stale `412` con snapshot |
| Invalidación curricular fuerte | `TransitionPolicy` + SQL `invalidate` | S1 y S2 integración | finales `v2` y `v3` |
| Linearización atómica | `JdbcDocumentRepository` | carreras contra PostgreSQL 18 | un único `UPDATE` efectivo |
| S1 sin sleeps decisorios | `LocalRaceCoordinator` | integración + Playwright | commit curricular interno antes del HTTP de aprobación |
| API de problemas | `ApiExceptionHandler`, `ProblemResponse` | integración MVC | `application/problem+json` |
| Optimismo reconciliado | reducer + `useDocumentApproval` | Vitest + Playwright | conflicto adopta `INVALIDATED/v2` |
| Respuesta tardía segura | `pendingRequestId`, `documentChanged`, comparación decimal | Vitest | no regresión de documento/versión |
| Contrato microfrontend | `public-api.ts`, Vite library build, declaraciones TS | build frontend + Vitest | ES, UMD y `.d.ts` |
| Instancias aisladas | hook/reducer local por componente | Vitest | dos tarjetas independientes |
| Stack reproducible | `compose.yaml`, Dockerfiles | `docker compose config`, E2E | servicios saludables |
| Ciclo completo en navegador | `conflict.spec.ts`, `document-lifecycle.spec.ts` | Playwright sobre stack Docker | aprobación optimista, recarga, reset, S1, S2, ETag, persistencia y consola limpia |
| Sin stack reactivo | dependencias backend | gate `scripts/verify.sh` | grep sin coincidencias |
| Privacidad | `.gitignore` + documentación normalizada | escaneo previo a commit | sin PDF, PII ni rutas locales |

[PEDAGOGIA] Para diagnosticar un fallo, empieza por la fila del requisito, reproduce su prueba aislada y solo después ejecuta el gate completo.

[INFERENCIA] La matriz demuestra cobertura implementada, no aprobación productiva, seguridad integral ni equivalencia con un entorno distribuido real.

[SUPUESTO] Los endpoints bajo `/api/test` son herramientas locales de demostración y no se desplegarían en un perfil productivo.

[NEUROCIENCIA] N/A.
