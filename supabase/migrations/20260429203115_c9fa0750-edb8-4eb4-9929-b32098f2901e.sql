ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS pay_basis text NOT NULL DEFAULT 'hourly',
  ADD COLUMN IF NOT EXISTS annual_salary numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS standard_hours_per_week numeric NOT NULL DEFAULT 38;