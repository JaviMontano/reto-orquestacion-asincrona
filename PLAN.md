# Plan de implementación y decisiones

Estado: implementación local verificada; publicación en curso · Actualizado: 2026-08-29

## 1. Autoridad y alcance

- [METODOLOGIA] Fuente de autoridad: PDF local verificado por SHA-256 `17294e41f29cf40c293162c37392d0dc59c88957676d5210e6b2c7f991a0f4ae` y contrastado previamente con el notebook indicado por el solicitante.
- [INFERENCIA] Se publican requisitos normalizados y trazabilidad, no el PDF, el contenido completo del notebook, rutas privadas ni datos personales.
- [SUPUESTO] El archivo solicitado como “`.m` de plan” se materializa como este `PLAN.md`.
- [PEDAGOGIA] La entrega debe permitir predecir el resultado de cada carrera, reproducirlo sin azar, localizar el punto de integridad y modificar la regla.
- [NEUROCIENCIA] N/A. No se emplean afirmaciones neurocientíficas.

Fuera de alcance: autenticación, broker, BFF, CRUD genérico, WebFlux, RxJava, Redux, CQRS y event sourcing.

## 2. Requisitos normalizados

1. Backend Java 21 con concurrencia basada en virtual threads.
2. Estado persistente, versión monotónica y transición atómica.
3. Aprobación humana optimista, protegida por versión esperada.
4. Actualización curricular capaz de invalidar inmediatamente.
5. Dos órdenes de carrera reproducibles y explicables.
6. Microfrontend React modular, aislable y resiliente ante respuestas tardías.
7. Ejecución local completa mediante Docker.
8. Pruebas unitarias, integración real y E2E.
9. Código simple, comentarios de intención y documentación paso a paso.

## 3. Decisiones cerradas

### Prioridad fuerte curricular

La máquina de estados permite:

```text
PENDING_APPROVAL -> APPROVED
PENDING_APPROVAL -> INVALIDATED
APPROVED         -> INVALIDATED
```

`INVALIDATED` es terminal.

[INFERENCIA] La prioridad fuerte satisface “invalidarlo inmediatamente” y permite demostrar tanto invalidación-primero como aprobación-primero. El cambio didáctico a `first-valid-commit` queda acotado a política, SQL y expectativas de prueba.

### Punto de linearización

[METODOLOGIA] La operación decisiva es un `UPDATE` SQL condicional dentro de una transacción `READ COMMITTED`; el contador `version` se incrementa en la misma sentencia. No hay read-modify-write ciego.

[INFERENCIA] Loom reduce el coste de espera del I/O bloqueante, pero no protege estado compartido ni reemplaza precondiciones HTTP, transacciones o predicados SQL.

### Contrato HTTP

- GET devuelve snapshot, `ETag` y `Cache-Control: no-store`.
- Approve requiere `If-Match: "v<n>"` y `X-Request-Id` UUID.
- La versión JSON es string decimal para no perder precisión en JavaScript.
- Los errores usan `application/problem+json` y, ante conflicto conocido, `currentDocument`.

### Estado del cliente

- `authoritative`: último snapshot confirmado.
- `pendingRequestId`: intención en vuelo.
- `optimisticStatus`: proyección visual, nunca autoridad.
- Snapshot menor que la versión visible: descartado.
- Respuesta de request anterior o documento anterior: descartada.
- Resultado de red incierto: retirar optimismo, GET fresco, ningún retry automático.

## 4. Etapas y criterios de salida

| Etapa | Trabajo | Criterio de salida |
|---|---|---|
| 1 | Fuente, privacidad y estructura | Hash registrado; material privado ausente |
| 2 | Dominio y persistencia | Política y SQL condicional probados |
| 3 | API y carreras | S1/S2 coordinados sin sleeps decisorios |
| 4 | Microfrontend | Éxito, conflicto, incertidumbre y tardíos probados |
| 5 | Docker y E2E | Stack saludable y recorrido navegador verde |
| 6 | Documentación | README, PLAN, logs y trazabilidad coherentes |
| 7 | Guardian | Hallazgos críticos corregidos o gap explícito |
| 8 | Publicación | Push, lectura remota y clon fresco verificados |

## 5. Invariantes

1. En el contrato de negocio, `version` solo aumenta y cada transición efectiva consume exactamente una versión. El endpoint local de reset recrea el fixture en `v1` y es la única excepción deliberada.
2. Una aprobación solo confirma si `status=PENDING_APPROVAL` y la versión coincide.
3. Ninguna transición sale de `INVALIDATED`.
4. Una respuesta de red no se confunde con un commit confirmado.
5. La UI nunca reemplaza un snapshot por una versión anterior del mismo documento.
6. El perfil local/test puede coordinar demostraciones; el dominio no depende de él.

## 6. Casos de prueba previstos

- Política: permitidos y prohibidos.
- API: 428, 400, 404, 412, 409 y cabecera de virtual thread.
- Integración PostgreSQL: versión monotónica, S1, S2, doble aprobación, stale, invalidación repetida y rollback.
- Frontend: éxito, 412/409, resultado incierto, doble clic, cambio de documento, respuesta tardía, versión decimal y dos instancias.
- E2E: S1 desde navegador, anuncio accesible, persistencia final, consola limpia y llamadas directas a API.
- Arquitectura: ausencia de dependencias reactivas.

## 7. Trade-offs

- Spring MVC/JDBC sobre WebFlux: menor superficie conceptual para una prueba centrada en Loom y consistencia.
- Coordinador local con `CompletableFuture`: hace S1 determinista y señaliza después del retorno transaccional; no pretende ser infraestructura productiva.
- Sin broker: no existe requisito de entrega distribuida; añadirlo ocultaría la carrera esencial.
- PostgreSQL real en pruebas: más coste que H2, pero evita una falsa equivalencia en locking y SQL.
- Sin licencia: visibilidad pública sin conceder derechos de reutilización implícitos.

## 8. Definition of Done

- `./scripts/verify.sh` termina con `VERIFICATION_OK`.
- Revisión independiente sin P1/P2 abiertos.
- Escaneo de secretos, rutas privadas y material fuente sin hallazgos.
- Repo público accesible y HEAD remoto leído de vuelta.
- Clon fresco ejecuta el comando único de verificación.
- `logs.md` separa diseño, ejecución, fallos aprendidos, commit, publicación y readback.
