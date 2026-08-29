# Bitácora de implementación

[METODOLOGIA] Registro cronológico append-only. Las salidas se resumen, se conservan exit codes y no se escriben secretos, datos personales ni rutas privadas.

## 2026-08-28 — Diseño y fuente

- Fuente oficial identificada y contrastada con el notebook del encargo.
- `SHA-256`: `17294e41f29cf40c293162c37392d0dc59c88957676d5210e6b2c7f991a0f4ae`.
- [INFERENCIA] Se eligió prioridad fuerte curricular; el arbitraje se concentra en política de dominio y predicado SQL.
- [NEUROCIENCIA] N/A.

## 2026-08-28 — Preparación local

1. `docker info`
   - Primer estado: daemon no disponible.
   - Acción: iniciar Docker Desktop y esperar disponibilidad.
   - Resultado: Docker Server `29.2.1`, exit `0`.
2. Inicialización Git
   - Se detectó inmediatamente una inicialización accidental en el directorio padre, sin commits.
   - Acción recuperable: mover únicamente ese `.git` nuevo a la papelera y crear el repositorio en la carpeta objetivo.
   - Resultado: rama local `main`, cero archivos previos afectados.
3. `npm install --package-lock-only` para frontend y E2E
   - Resultado: lockfiles fijados; auditoría reportó `0 vulnerabilities`, exit `0`.

## 2026-08-28 — Backend

1. Primer build con versión `4.1.1.RELEASE`
   - Resultado: `404` en Maven Central, exit distinto de `0`.
   - Aprendizaje: Spring Boot moderno publica `4.1.1` sin sufijo; `pom.xml` corregido.
2. Primer PostgreSQL 18
   - Resultado: fallo por montar la ruta histórica de datos, exit distinto de `0`.
   - Aprendizaje: imagen 18 requiere volumen en `/var/lib/postgresql`; Compose corregido.
3. Compilación inicial
   - Resultado: import incompatible de Jackson y proxy CGLIB sobre clase final, exit distinto de `0`.
   - Acción: usar el stack JSON provisto por Spring y permitir el proxy transaccional del repositorio.
4. Primera ejecución S1
   - Resultado: aprobación `200` inesperada.
   - Causa: `AtomicReference.compareAndSet` recibió dos instancias UUID iguales por valor pero distintas por identidad.
   - Acción: validar igualdad de valor y usar como esperado la misma referencia leída.
5. Suite backend contra PostgreSQL 18.6 real
   - Resultado: `7 tests`, `0 failures`, `0 errors`, exit `0`.
   - Evidencia: S1 `412/INVALIDATED-v2`; S2 `200 + 200/INVALIDATED-v3`; request MVC en virtual thread.

## 2026-08-28 — Frontend

1. Primera compilación
   - Resultado: tipos CSS Modules ausentes y opción TypeScript incompatible, exit distinto de `0`.
   - Acción: agregar tipos Vite y simplificar configuración.
2. Suite inicial
   - Resultado: `5 tests`, todos verdes, exit `0`.
3. Hardening
   - Se agregó reinicio explícito ante cambio de documento, bloqueo sincrónico de doble clic y generación de declaraciones TypeScript del microfrontend.
   - Guardian detectó callbacks y refresh tardíos asociados al documento anterior. Se añadió identidad de destino/request, timeout real de ocho segundos y pruebas de fallo tardío.
   - Validación secundaria con Node local: `13 tests`, `0 failures`; build de app, librería, CSS, declaraciones y consumer check verdes. El gate Docker sigue siendo la autoridad de cierre.
   - [PEDAGOGIA] Los comentarios se reservan para invariantes no obvias: linearización, señal commit-aware y reconciliación; no repiten la sintaxis.

## 2026-08-28 — Docker y E2E

- `docker compose up --build --detach db backend frontend`
  - Resultado: PostgreSQL, backend y frontend saludables; exit `0`.
- Playwright E2E
  - Primer intento: la imagen oficial multi-browser agotó el espacio asignado a Docker durante la extracción; BuildKit devolvió `input/output error`, exit distinto de `0`.
  - Acción: sustituirla por Node Alpine + Chromium, conservando Playwright y el mismo test. No se eliminaron recursos Docker ajenos.
  - Estado al escribir esta entrada: Docker Desktop requiere recuperar su VM tras el error; el resultado final se añadirá tras el gate.

## Convención de cierre

[SUPUESTO] Una construcción local verde no equivale a publicación. Las siguientes entradas separarán explícitamente: verificación completa, revisión independiente, commit, creación remota, lectura remota y clon fresco.

## 2026-08-28 — Reanudación del gate Docker

1. Docker Desktop se recuperó terminando el backend atascado y relanzando la aplicación; Server `29.2.1`, sin borrar imágenes ni volúmenes.
2. Primera repetición de `./scripts/verify.sh`
   - El backend informó `7 tests`: evidencia de que Compose reutilizaba una imagen anterior a las pruebas añadidas.
   - Acción: interrumpir el falso verde y añadir `--build` a cada servicio de prueba/E2E.
   - [METODOLOGIA] Un resultado verde sobre código obsoleto no satisface el gate; la verificación completa se repite desde código actual.
3. Segunda repetición desde imagen reconstruida
   - Backend actual: `12 tests`, `0 failures`, `0 errors` contra PostgreSQL `18.6`, exit `0`.
   - Frontend: `npm ci` completó con `0 vulnerabilities`, pero BuildKit no pudo confirmar la capa por `input/output error`.
   - Espacio del volumen del host después del fallo: aproximadamente `205 MiB`; Docker volvió a quedar sin daemon.
   - Estado: gate incompleto. E2E, publicación y clon fresco permanecen pendientes; no se presenta el backend verde como cierre total.

## 2026-08-29 — Gate local completo

1. Precondiciones
   - Espacio disponible: aproximadamente `45 GiB`.
   - Docker Desktop respondió `OK`; Server `29.2.1`.
2. Diagnóstico E2E
   - La UI no emitía la aprobación desde `host.docker.internal` porque `crypto.randomUUID()` no está disponible en todo origen HTTP no seguro.
   - Acción: UUID v4 con fallback criptográfico `getRandomValues`; prueba unitaria añadida.
   - Chromium registra el `412` gestionado como error de recurso. El E2E afirma primero el status `412` y solo excluye esa línea automática; cualquier otro error de consola continúa fallando la prueba.
3. `./scripts/verify.sh`
   - Backend: `12 tests`, `0 failures`, `0 errors`, PostgreSQL `18.6`.
   - Frontend: `14 tests`, `0 failures`; app, ES/UMD, CSS, declaraciones y consumer check verdes.
   - Playwright: `1 passed`; UI `INVALIDATED/v2`, persistencia confirmada y API directa sin BFF.
   - Gate anti-reactivo: sin coincidencias.
   - Resultado: `VERIFICATION_OK`, exit `0`.
4. [METODOLOGIA] La publicación sigue separada de este resultado local; commit, push, readback y clon fresco tendrán recibos propios.
5. Guardian final read-only
   - Resultado: `0 P1 / 0 P2`.
   - Privacidad: sin PDF, secretos, rutas privadas ni PII detectados.
   - Veredicto: apto para publicación, condicionado a recibos de commit, push, readback y clon fresco.

## 2026-08-29 — Commit y publicación

1. Commit de implementación
   - SHA: `62ad80f2b1c65bb91f84c1cc0bd0994e374684f6`.
   - Árbol limpio y `git diff --check` sin hallazgos después de normalizar finales de archivo.
2. Publicación
   - Repositorio: `https://github.com/JaviMontano/reto-orquestacion-asincrona`.
   - Visibilidad leída de vuelta mediante API: `PUBLIC`.
   - Rama por defecto: `main`.
   - `git ls-remote` devolvió el mismo SHA del commit de implementación.
   - `README.md` remoto leído mediante API; blob `4b700e9bd038d409aad97356a6c87cb8aad97d89`.
3. CI
   - Workflow `verify` detectado en estado inicial `queued`, run `33252866699`.
4. [METODOLOGIA] Este apéndice documental produce un commit de cierre posterior; el clon fresco y el readback final se ejecutan contra ese HEAD, no contra el SHA anterior.

## 2026-08-29 — Clon fresco y cierre reproducible

1. Clon fresco del HEAD remoto
   - Directorio temporal: omitido deliberadamente para no publicar rutas privadas.
   - SHA clonado: `cd10b8d58b19f8d64cdf49e4541fe21a02608eb7`.
   - El SHA coincidió con `origin/main` en el momento del clon.
2. `./scripts/verify.sh` ejecutado desde el clon
   - Backend: `12 tests`, `0 failures`, `0 errors` contra PostgreSQL `18.6`.
   - Frontend: `14 tests`, `0 failures`; builds de app y librería, declaraciones y consumer check verdes.
   - Playwright: `1 passed` con conflicto `412`, reconciliación a `INVALIDATED/v2` y persistencia final confirmada.
   - Resultado: `VERIFICATION_OK`, exit `0`.
3. [METODOLOGIA] El commit que incorpora este recibo solo modifica documentación. Tras publicarlo se repiten el readback del SHA final y el gate desde un segundo clon fresco; su evidencia externa se informa en el cierre sin generar una cadena infinita de commits de recibos.

## 2026-08-29 — Hallazgo del segundo clon fresco

1. El segundo clon confirmó el SHA remoto `d8a775776af30516fd5d6a4c9515c305257f715b`, pero el gate detectó una prueba frontend intermitente: `13 passed, 1 failed`.
2. Causa: el test de fallo de red tardío encontraba el botón desde el primer render y podía intentar pulsarlo mientras seguía deshabilitado, antes de recibir el snapshot inicial. El fallo estaba en la coordinación del test, no en la reconciliación del componente.
3. Corrección: ambos tests de respuesta tardía esperan el estado autoritativo `PENDING_APPROVAL` antes del clic. No se redujeron aserciones ni tiempos límite.
4. Evidencia posterior:
   - Suite frontend Docker: una ejecución visible y cinco repeticiones consecutivas, todas con `14 passed`.
   - Gate integral local: backend `12 passed`, frontend `14 passed`, Playwright `1 passed`, package consumer y gate anti-reactivo verdes.
   - Resultado: `VERIFICATION_OK`, exit `0`.
5. [PEDAGOGIA] Un control visible no implica que ya sea interactivo; las pruebas deben sincronizarse con el estado observable que habilita la acción, no con la mera presencia del nodo.

## 2026-08-29 — Reauditoría del test y evidencia SQL

1. Fuente y alcance
   - El PDF oficial se volvió a extraer y verificar con SHA-256 `17294e41f29cf40c293162c37392d0dc59c88957676d5210e6b2c7f991a0f4ae`.
   - [METODOLOGIA] Se trató como requisitos no confiables hasta normalizarlos; no como instrucciones operativas, ni se versionó su contenido.
   - Se contrastaron Java/Loom, exclusiones reactivas, React modular, ausencia de BFF, modelo lógico, carrera determinista, control de versión, reconciliación optimista, Docker y preparación para cambio en vivo.
2. Hallazgo
   - No apareció un defecto nuevo de backend, frontend o transición que justificara reescritura.
   - La lectura E2E posterior ya atravesaba JDBC, pero el comando único no mostraba una consulta SQL independiente de la API.
3. Mejora mínima
   - Se añadió `scripts/check-database.sh` y el gate pasó de siete a ocho fases.
   - El chequeo valida los cinco campos tipados, nulabilidad, restricciones de estado/versión, fixture determinista y aislamiento `read committed`, y devuelve la fila vigente mediante `psql`.
4. `./scripts/verify.sh`
   - Backend PostgreSQL 18.6: `12 tests`, `0 failures`, `0 errors`.
   - Frontend Vitest: `15 passed`.
   - Playwright Chromium: `3 passed`; aprobación optimista, recarga, reset, S1, S2, ETag, API directa, consola limpia y persistencia.
   - PostgreSQL directo: `DATABASE_INTEGRITY_OK`, fila final `INVALIDATED/v3`, `read committed`.
   - Gate anti-reactivo: sin coincidencias.
   - Resultado: `VERIFICATION_OK`, exit `0`.
5. [PEDAGOGIA] Se agregaron una matriz de reauditoría y una ruta de aprendizaje que separa evidencia, límites y ejercicios para cerrar gaps sin atribuir experiencia manual inexistente.
6. NotebookLM
   - Inventario previo: `53` fuentes.
   - Se añadirán después del commit validado estos logs y artefactos propios, más documentación primaria no duplicada.
7. Publicación intermedia y CI
   - Commit: `ab7da02968e67896ec1909274b4cc8ad85f0ce2b`.
   - `git ls-remote` devolvió el mismo SHA y el documento de auditoría remoto pudo leerse.
   - GitHub Actions run `33254130010`: `success`; job Docker `1m52s`.
   - Hallazgo no bloqueante: `actions/checkout@v4` produjo advertencia por runtime Node deprecado.
   - Acción: actualizar a `actions/checkout@v7`, versión vigente indicada por el repositorio oficial, y exigir un nuevo resultado CI antes del cierre.
8. CI actualizada
   - Commit de mantenimiento: `752db36edaea0451e91e40b1450877def07d0ecf`.
   - GitHub Actions run `33254233483`: `success`; job Docker `1m54s`.
   - `actions/checkout@v7` ejecutó setup y post-run correctamente; la advertencia anterior desapareció.
   - [METODOLOGIA] El siguiente commit solo cierra recibos documentales y usa `[skip ci]`; la última mutación ejecutable ya quedó validada por el run anterior.

[NEUROCIENCIA] N/A.
