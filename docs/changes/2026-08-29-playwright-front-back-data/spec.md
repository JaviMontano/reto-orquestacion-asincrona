# Spec — Playwright front, back y datos

Estado: cerrado para ejecución.

## Escenarios observables

### E1 — aprobación normal

- Inicio `PENDING_APPROVAL/v1`.
- Al hacer clic, la UI muestra optimismo `Aprobado` antes de recibir la respuesta retenida.
- Backend responde `200` y `ETag: "v2"`.
- UI confirma `APPROVED/v2` y deshabilita nueva aprobación.
- API y una recarga del navegador conservan `APPROVED/v2`.

### E2 — reset desde UI

- Partiendo de un documento aprobado, **Restablecer** devuelve UI y API a `PENDING_APPROVAL/v1`.

### E3 — S1 invalidación primero

- Aprobación optimista compite con invalidación curricular.
- La aprobación responde `412`.
- UI adopta `INVALIDATED/v2`, anuncia `STALE_VERSION` y la API persiste el mismo snapshot.

### E4 — S2 aprobación primero

- Aprobación UI responde `200`, final intermedio `APPROVED/v2`.
- Actualización curricular directa responde `200`, `ETag: "v3"` y persiste `INVALIDATED/v3`.
- **Consultar servidor** hace converger la UI a `INVALIDATED/v3`.

## Invariantes de navegador

- Todas las solicitudes `/api/` originadas por la UI van directamente al backend esperado; no aparece un BFF.
- No hay requests de API fallidas a nivel de transporte.
- La consola queda limpia salvo el mensaje automático de Chromium por el `412` afirmado explícitamente.
- Los tests no dependen de pausas fijas para decidir carreras.

## Aceptación

- Suite Playwright aislada verde al menos tres veces consecutivas.
- Gate completo termina con `VERIFICATION_OK`.
- No se requieren instalaciones en el host si Docker construye las dependencias fijadas en lockfile.
