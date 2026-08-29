#!/usr/bin/env sh
set -eu

for required in AGENTS.md README.md docs/changes/README.md; do
  if [ ! -s "$required" ]; then
    echo "Falta archivo operativo: $required" >&2
    exit 1
  fi
done

found_packet=false
for change_dir in docs/changes/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-*; do
  [ -d "$change_dir" ] || continue
  found_packet=true
  for phase in intake plan spec evidence; do
    if [ ! -s "$change_dir/$phase.md" ]; then
      echo "Paquete incompleto: $change_dir/$phase.md" >&2
      exit 1
    fi
  done
done

if [ "$found_packet" != true ]; then
  echo "No existe ningún paquete de cambio" >&2
  exit 1
fi

echo "AGENTIC_WORKFLOW_OK"
