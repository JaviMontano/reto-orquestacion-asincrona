#!/usr/bin/env sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Uso: $0 nombre-del-cambio" >&2
  exit 2
fi

slug=$1
case "$slug" in
  *[!a-z0-9-]*|'')
    echo "El nombre solo puede contener minúsculas, números y guiones" >&2
    exit 2
    ;;
esac

change_dir="docs/changes/$(date +%F)-$slug"
if [ -e "$change_dir" ]; then
  echo "Ya existe: $change_dir" >&2
  exit 1
fi

mkdir -p "$change_dir"
for phase in intake plan spec evidence; do
  title=$(printf '%s' "$phase" | tr '[:lower:]' '[:upper:]')
  {
    printf '# %s — %s\n\n' "$title" "$slug"
    printf 'Estado: pendiente.\n'
  } >"$change_dir/$phase.md"
done

echo "CHANGE_PACKET_CREATED=$change_dir"
