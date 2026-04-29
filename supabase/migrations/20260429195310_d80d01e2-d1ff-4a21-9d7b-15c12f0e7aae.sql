-- Add time_slot column to jobs table for morning/afternoon/all-day scheduling
ALTER TABLE public.jobs
  ADD COLUMN time_slot text NOT NULL DEFAULT 'all_day';

ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_time_slot_check
  CHECK (time_slot IN ('morning', 'afternoon', 'all_day'));

CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date_slot
  ON public.jobs (scheduled_date, time_slot);