# Evidencia — Playwright front, back y datos

Estado: verificado localmente.

## Línea base

- Stack Docker construido sin instalar dependencias en el host.
- E2E existente S1: `1 passed`.

## Hallazgo real

La primera suite ampliada obtuvo `2 passed, 1 failed`.

- Backend: el reset respondió `200`, `ETag: "v1"` y persistió `PENDING_APPROVAL/v1`.
- Frontend: continuó mostrando `APPROVED/v2`.
- Causa: el reducer trataba el reset deliberado a `v1` como si fuera una respuesta tardía y rechazaba la versión menor.
- Corrección: acción explícita `resetSucceeded`, separada de la adopción monotónica normal.
- La protección contra snapshots tardíos continúa probada.

## Pruebas posteriores

1. Frontend unitario Docker
   - `15 tests`, `0 failures`.
   - Incluye aceptación del reset deliberado y rechazo de snapshots tardíos menores.
2. Playwright ampliado, tres ejecuciones consecutivas
   - Cada ejecución: `3 passed`, un worker, cero retries.
   - Aprobación: optimismo observable antes de liberar la respuesta, `200`, `ETag: "v2"`, UI/API `APPROVED/v2` y persistencia tras recarga.
   - Reset UI: `200`, `ETag: "v1"`, UI/API `PENDING_APPROVAL/v1`.
   - S1: aprobación `412`, UI/API `INVALIDATED/v2`, aviso `STALE_VERSION`.
   - S2: aprobación `200/v2`, invalidación `200/v3`, refresh UI a `INVALIDATED/v3`.
3. Lectura SQL directa posterior a S2
   - PostgreSQL devolvió `INVALIDATED|3` para el documento de prueba.
4. Gate integral `./scripts/verify.sh`
   - Backend: `12 tests`, `0 failures`, PostgreSQL 18.6.
   - Frontend: `15 tests`, `0 failures`.
   - Playwright: `3 passed`.
   - Contrato agéntico, package consumer y gate anti-reactivo: verdes.
   - Resultado: `VERIFICATION_OK`, exit `0`.
5. Sesión Playwright interactiva independiente
   - Snapshot accesible inicial: `PENDING_APPROVAL/v1` y cuatro controles disponibles.
   - Clic real **Aprobar**: `APPROVED/v2`, mensaje `Documento aprobado.`, botones de aprobación deshabilitados.
   - Clic real **Restablecer**: regreso visible a `PENDING_APPROVAL/v1`.
   - Red: GET `200`, approve `200`, reset `200`, siempre contra `localhost:8080`.
   - Consola: `0` errores y `0` warnings.
6. Readback y limpieza final
   - API: `200`, `ETag: "v1"`, `X-Thread-Virtual: true`, `PENDING_APPROVAL/v1`.
   - PostgreSQL: `PENDING_APPROVAL|1`, consistente con la UI después del reset.
   - Contenedores, red y volumen de la demo: eliminados; `docker compose ps --all` quedó vacío.

## Dependencias

[METODOLOGIA] No fue necesario instalar software adicional en macOS. Docker construyó Node, Playwright y Chromium desde los lockfiles e imágenes declaradas.

[PEDAGOGIA] El navegador mostró una discrepancia que las pruebas de reducer existentes no cubrían: una regla correcta para respuestas tardías no debía aplicarse al reset local que recrea intencionalmente la versión uno.
