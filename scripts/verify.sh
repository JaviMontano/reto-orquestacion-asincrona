#!/usr/bin/env sh
set -eu

cleanup() {
  docker compose --profile test --profile e2e down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "[1/7] Validando contrato de trabajo agéntico"
./scripts/check-agentic-workflow.sh

echo "[2/7] Validando configuración Docker"
docker compose config --quiet

echo "[3/7] Ejecutando backend contra PostgreSQL real"
docker compose --profile test run --rm --build backend-test

echo "[4/7] Ejecutando frontend unitario"
docker compose --profile test run --rm --build frontend-test

echo "[5/7] Construyendo y levantando el stack"
docker compose up --build --detach db backend frontend

echo "[6/7] Ejecutando Playwright E2E"
docker compose --profile e2e run --rm --build e2e

echo "[7/7] Gate anti-reactivo"
if grep -R -i -E 'webflux|rxjava|reactor-core' backend/pom.xml backend/src; then
  echo "Se detectó una dependencia o uso reactivo prohibido" >&2
  exit 1
fi

echo "VERIFICATION_OK"
