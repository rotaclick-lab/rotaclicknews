-- Adiciona 'RUNNING' como status válido para suportar jobs assíncronos
ALTER TABLE public.antt_ingestion_runs
  DROP CONSTRAINT IF EXISTS antt_ingestion_runs_status_check;

ALTER TABLE public.antt_ingestion_runs
  ADD CONSTRAINT antt_ingestion_runs_status_check
  CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL', 'RUNNING'));
