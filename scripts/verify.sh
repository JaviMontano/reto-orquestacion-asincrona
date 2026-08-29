#!/usr/bin/env sh
set -eu

cleanup() {
  docker compose --profile test --profile e2e down --volumes --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "[1/6] Validando configuración Docker"
docker compose config --quiet

echo "[2/6] Ejecutando backend contra PostgreSQL real"
docker compose --profile test run --rm --build backend-test

echo "[3/6] Ejecutando frontend unitario"
docker compose --profile test run --rm --build frontend-test

echo "[4/6] Construyendo y levantando el stack"
docker compose up --build --detach db backend frontend

echo "[5/6] Ejecutando Playwright E2E"
docker compose --profile e2e run --rm --build e2e

echo "[6/6] Gate anti-reactivo"
if grep -R -i -E 'webflux|rxjava|reactor-core' backend/pom.xml backend/src; then
  echo "Se detectó una dependencia o uso reactivo prohibido" >&2
  exit 1
fi

echo "VERIFICATION_OK"
