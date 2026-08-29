#!/usr/bin/env sh
set -eu

# Consulta PostgreSQL directamente: una respuesta HTTP no sustituye evidencia del esquema.
docker compose exec -T db psql \
  --username orchestration \
  --dbname orchestration \
  --set ON_ERROR_STOP=1 <<'SQL'
DO $database_gate$
DECLARE
  required_columns integer;
  required_checks integer;
  seed_rows integer;
BEGIN
  SELECT count(*) INTO required_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'documents'
    AND (
      (column_name = 'id' AND data_type = 'uuid' AND is_nullable = 'NO') OR
      (column_name = 'title' AND data_type = 'character varying' AND is_nullable = 'NO') OR
      (column_name = 'status' AND data_type = 'character varying' AND is_nullable = 'NO') OR
      (column_name = 'version' AND data_type = 'bigint' AND is_nullable = 'NO') OR
      (column_name = 'updated_at' AND data_type = 'timestamp with time zone' AND is_nullable = 'NO')
    );

  IF required_columns <> 5 THEN
    RAISE EXCEPTION 'documents schema does not expose the five required typed columns';
  END IF;

  SELECT count(*) INTO required_checks
  FROM pg_constraint
  WHERE conrelid = 'public.documents'::regclass
    AND contype = 'c'
    AND (
      pg_get_constraintdef(oid) LIKE '%PENDING_APPROVAL%' OR
      pg_get_constraintdef(oid) LIKE '%version >= 1%'
    );

  IF required_checks <> 2 THEN
    RAISE EXCEPTION 'documents status/version constraints are missing';
  END IF;

  SELECT count(*) INTO seed_rows
  FROM documents
  WHERE id = '00000000-0000-0000-0000-000000000001';

  IF seed_rows <> 1 THEN
    RAISE EXCEPTION 'the deterministic document fixture is missing or duplicated';
  END IF;

  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION 'unexpected transaction isolation: %', current_setting('transaction_isolation');
  END IF;
END
$database_gate$;

SELECT 'DATABASE_INTEGRITY_OK' AS result,
       id,
       status,
       version,
       current_setting('transaction_isolation') AS isolation
FROM documents
WHERE id = '00000000-0000-0000-0000-000000000001';
SQL
