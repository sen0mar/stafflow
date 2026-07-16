-- Remove only exact non-unique duplicates of the retained unique indexes.
-- Abort before either drop when any table, name, method, column order, validity,
-- uniqueness, expression, predicate, or included-column detail is unexpected.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index AS definition
    JOIN pg_catalog.pg_class AS index_relation
      ON index_relation.oid = definition.indexrelid
    JOIN pg_catalog.pg_class AS table_relation
      ON table_relation.oid = definition.indrelid
    JOIN pg_catalog.pg_namespace AS namespace
      ON namespace.oid = table_relation.relnamespace
    JOIN pg_catalog.pg_am AS access_method
      ON access_method.oid = index_relation.relam
    WHERE namespace.nspname = current_schema()
      AND table_relation.relname = 'AttendanceRecord'
      AND index_relation.relname = 'AttendanceRecord_employeeId_date_idx'
      AND access_method.amname = 'btree'
      AND definition.indisunique = FALSE
      AND definition.indisprimary = FALSE
      AND definition.indisvalid = TRUE
      AND definition.indisready = TRUE
      AND definition.indnkeyatts = 2
      AND definition.indnatts = 2
      AND definition.indpred IS NULL
      AND definition.indexprs IS NULL
      AND (
        SELECT array_agg(attribute.attname ORDER BY key.ordinality)
        FROM unnest(definition.indkey) WITH ORDINALITY AS key(attnum, ordinality)
        JOIN pg_catalog.pg_attribute AS attribute
          ON attribute.attrelid = table_relation.oid
          AND attribute.attnum = key.attnum
      ) = ARRAY['employeeId', 'date']::name[]
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'Duplicate-index migration aborted: AttendanceRecord_employeeId_date_idx is absent or its definition is unexpected.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index AS definition
    JOIN pg_catalog.pg_class AS index_relation
      ON index_relation.oid = definition.indexrelid
    JOIN pg_catalog.pg_class AS table_relation
      ON table_relation.oid = definition.indrelid
    JOIN pg_catalog.pg_namespace AS namespace
      ON namespace.oid = table_relation.relnamespace
    JOIN pg_catalog.pg_am AS access_method
      ON access_method.oid = index_relation.relam
    WHERE namespace.nspname = current_schema()
      AND table_relation.relname = 'AttendanceRecord'
      AND index_relation.relname = 'AttendanceRecord_employeeId_date_key'
      AND access_method.amname = 'btree'
      AND definition.indisunique = TRUE
      AND definition.indisprimary = FALSE
      AND definition.indisvalid = TRUE
      AND definition.indisready = TRUE
      AND definition.indnkeyatts = 2
      AND definition.indnatts = 2
      AND definition.indpred IS NULL
      AND definition.indexprs IS NULL
      AND (
        SELECT array_agg(attribute.attname ORDER BY key.ordinality)
        FROM unnest(definition.indkey) WITH ORDINALITY AS key(attnum, ordinality)
        JOIN pg_catalog.pg_attribute AS attribute
          ON attribute.attrelid = table_relation.oid
          AND attribute.attnum = key.attnum
      ) = ARRAY['employeeId', 'date']::name[]
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'Duplicate-index migration aborted: AttendanceRecord_employeeId_date_key is absent or its definition is unexpected.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index AS definition
    JOIN pg_catalog.pg_class AS index_relation
      ON index_relation.oid = definition.indexrelid
    JOIN pg_catalog.pg_class AS table_relation
      ON table_relation.oid = definition.indrelid
    JOIN pg_catalog.pg_namespace AS namespace
      ON namespace.oid = table_relation.relnamespace
    JOIN pg_catalog.pg_am AS access_method
      ON access_method.oid = index_relation.relam
    WHERE namespace.nspname = current_schema()
      AND table_relation.relname = 'Payslip'
      AND index_relation.relname = 'Payslip_employeeId_year_month_idx'
      AND access_method.amname = 'btree'
      AND definition.indisunique = FALSE
      AND definition.indisprimary = FALSE
      AND definition.indisvalid = TRUE
      AND definition.indisready = TRUE
      AND definition.indnkeyatts = 3
      AND definition.indnatts = 3
      AND definition.indpred IS NULL
      AND definition.indexprs IS NULL
      AND (
        SELECT array_agg(attribute.attname ORDER BY key.ordinality)
        FROM unnest(definition.indkey) WITH ORDINALITY AS key(attnum, ordinality)
        JOIN pg_catalog.pg_attribute AS attribute
          ON attribute.attrelid = table_relation.oid
          AND attribute.attnum = key.attnum
      ) = ARRAY['employeeId', 'year', 'month']::name[]
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'Duplicate-index migration aborted: Payslip_employeeId_year_month_idx is absent or its definition is unexpected.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_index AS definition
    JOIN pg_catalog.pg_class AS index_relation
      ON index_relation.oid = definition.indexrelid
    JOIN pg_catalog.pg_class AS table_relation
      ON table_relation.oid = definition.indrelid
    JOIN pg_catalog.pg_namespace AS namespace
      ON namespace.oid = table_relation.relnamespace
    JOIN pg_catalog.pg_am AS access_method
      ON access_method.oid = index_relation.relam
    WHERE namespace.nspname = current_schema()
      AND table_relation.relname = 'Payslip'
      AND index_relation.relname = 'Payslip_employeeId_year_month_key'
      AND access_method.amname = 'btree'
      AND definition.indisunique = TRUE
      AND definition.indisprimary = FALSE
      AND definition.indisvalid = TRUE
      AND definition.indisready = TRUE
      AND definition.indnkeyatts = 3
      AND definition.indnatts = 3
      AND definition.indpred IS NULL
      AND definition.indexprs IS NULL
      AND (
        SELECT array_agg(attribute.attname ORDER BY key.ordinality)
        FROM unnest(definition.indkey) WITH ORDINALITY AS key(attnum, ordinality)
        JOIN pg_catalog.pg_attribute AS attribute
          ON attribute.attrelid = table_relation.oid
          AND attribute.attnum = key.attnum
      ) = ARRAY['employeeId', 'year', 'month']::name[]
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'Duplicate-index migration aborted: Payslip_employeeId_year_month_key is absent or its definition is unexpected.';
  END IF;
END $$;

DROP INDEX "AttendanceRecord_employeeId_date_idx";
DROP INDEX "Payslip_employeeId_year_month_idx";

COMMIT;
