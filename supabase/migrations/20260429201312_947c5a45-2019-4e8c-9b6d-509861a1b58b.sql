ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS jobs_schedule_sort_idx ON public.jobs (scheduled_date, time_slot, sort_order);