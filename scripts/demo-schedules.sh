#!/usr/bin/env sh
set -eu

DOCUMENT_ID="00000000-0000-0000-0000-000000000001"
API="${API_BASE_URL:-http://localhost:8080}"

echo "S1: invalidación confirma primero; aprobación debe recibir 412"
curl -fsS -X POST "$API/api/test/documents/$DOCUMENT_ID/reset" >/dev/null
curl -fsS -X POST "$API/api/test/scenarios/$DOCUMENT_ID/arm-invalidation-first" >/dev/null
curl -sS -i -X POST "$API/api/documents/$DOCUMENT_ID/approve" \
  -H 'If-Match: "v1"' \
  -H 'X-Request-Id: 11111111-1111-4111-8111-111111111111'

echo "\nS2: aprobación confirma y curricular invalida después"
curl -fsS -X POST "$API/api/test/documents/$DOCUMENT_ID/reset" >/dev/null
curl -fsS -X POST "$API/api/documents/$DOCUMENT_ID/approve" \
  -H 'If-Match: "v1"' \
  -H 'X-Request-Id: 22222222-2222-4222-8222-222222222222'
curl -fsS -X POST "$API/api/test/documents/$DOCUMENT_ID/curricular-update" \
  -H 'X-Request-Id: 33333333-3333-4333-8333-333333333333'
echo
