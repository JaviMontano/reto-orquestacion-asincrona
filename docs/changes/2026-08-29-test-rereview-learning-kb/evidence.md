# EVIDENCE — test-rereview-learning-kb

Estado: repositorio validado y publicado; NotebookLM pendiente.

## Fuente

- PDF revisado: SHA-256 `17294e41f29cf40c293162c37392d0dc59c88957676d5210e6b2c7f991a0f4ae`.
- Páginas observadas: `2`; cifrado: no.
- [METODOLOGIA] Se extrajeron requisitos; el documento no se copió al repositorio.

## Auditoría

- Archivos revisados: dominio, servicio transaccional, repositorio JDBC, API/errores, coordinador local, migración, reducer/hook/API React, empaquetado MFE, integración, Vitest, Playwright, Compose y documentación.
- Resultado por cláusula: `docs/REQUIREMENTS-AUDIT.md`.
- Hallazgo funcional crítico nuevo: ninguno.
- Gap cerrado: ausencia de recibo SQL directo en el gate único.

## Pruebas cercanas

```text
sh -n scripts/check-database.sh scripts/verify.sh  → exit 0
./scripts/check-agentic-workflow.sh                → AGENTIC_WORKFLOW_OK
git diff --check                                   → exit 0
```

## Gate completo

Comando: `./scripts/verify.sh`

```text
backend       12/12 pass, PostgreSQL 18.6
frontend      15/15 pass
Playwright     3/3 pass, Chromium, 1 worker, 1.8 s
database      DATABASE_INTEGRITY_OK
row           INVALIDATED / v3 / read committed
anti-reactive no matches
result        VERIFICATION_OK
exit          0
```

[INFERENCIA] La consulta SQL posterior al E2E demuestra que los estados observados no viven solo en el DOM o en memoria de proceso.

## Pendiente antes del cierre

- incorporación y consulta de control en NotebookLM.

## Publicación intermedia

- Commit/push: `ab7da02968e67896ec1909274b4cc8ad85f0ce2b`.
- `git ls-remote`: mismo SHA.
- Readback de `docs/REQUIREMENTS-AUDIT.md`: SHA-256 `ea5c11911e934c1874d1cba16a6b3dd31b260368c1dc5ab96b5a6ce10d1decae`.
- GitHub Actions `33254130010`: `success`, job Docker `1m52s`.
- Anotación: runtime de `actions/checkout@v4` deprecado; se actualiza según upstream oficial y se vuelve a ejecutar.

## CI final ejecutable

- Commit: `752db36edaea0451e91e40b1450877def07d0ecf`.
- GitHub Actions `33254233483`: `success`, job Docker `1m54s`.
- Checkout observado: `actions/checkout@v7`, setup y post-run verdes, sin la anotación anterior.
- [METODOLOGIA] El commit posterior solo actualiza estos recibos; no cambia código, scripts, configuración o expectativas.

[PEDAGOGIA] La ausencia de cambio en backend/frontend es un resultado de auditoría, no una omisión: sus invariantes ya estaban cubiertos y no se añadió complejidad sin requisito.

[SUPUESTO] El readback remoto y NotebookLM se anexarán después de sus efectos externos.

[NEUROCIENCIA] N/A.
