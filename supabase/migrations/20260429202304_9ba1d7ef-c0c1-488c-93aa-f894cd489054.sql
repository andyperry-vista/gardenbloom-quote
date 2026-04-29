-- Sequence for payslip numbers
CREATE SEQUENCE IF NOT EXISTS public.payslip_number_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_payslip_number()
RETURNS text
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT 'PS-' || LPAD(nextval('public.payslip_number_seq')::text, 4, '0');
$$;

-- Employees
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  hourly_rate NUMERIC NOT NULL DEFAULT 0,
  super_rate NUMERIC NOT NULL DEFAULT 11.5,
  super_fund TEXT DEFAULT '',
  super_member_number TEXT DEFAULT '',
  bsb TEXT DEFAULT '',
  account_number TEXT DEFAULT '',
  tax_file_number TEXT DEFAULT '',
  employment_type TEXT NOT NULL DEFAULT 'casual',
  start_date DATE,
  active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own employees" ON public.employees
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Job <-> Employee assignment (with estimated hours for quotes)
CREATE TABLE public.job_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  estimated_hours NUMERIC NOT NULL DEFAULT 0,
  rate_at_assignment NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (job_id, employee_id)
);

ALTER TABLE public.job_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own job_employees" ON public.job_employees
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_job_employees_job ON public.job_employees(job_id);
CREATE INDEX idx_job_employees_employee ON public.job_employees(employee_id);

-- Time entries (actual hours)
CREATE TABLE public.time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  job_id UUID,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC NOT NULL DEFAULT 0,
  rate NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  confirmed BOOLEAN NOT NULL DEFAULT false,
  payslip_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own time_entries" ON public.time_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_time_entries_employee ON public.time_entries(employee_id);
CREATE INDEX idx_time_entries_job ON public.time_entries(job_id);
CREATE INDEX idx_time_entries_payslip ON public.time_entries(payslip_id);
CREATE INDEX idx_time_entries_date ON public.time_entries(work_date);

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON public.time_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payslips
CREATE TABLE public.payslips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_id UUID NOT NULL,
  payslip_number TEXT NOT NULL DEFAULT generate_payslip_number(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  job_id UUID,
  hours_total NUMERIC NOT NULL DEFAULT 0,
  gross NUMERIC NOT NULL DEFAULT 0,
  tax_withheld NUMERIC NOT NULL DEFAULT 0,
  net NUMERIC NOT NULL DEFAULT 0,
  super_amount NUMERIC NOT NULL DEFAULT 0,
  ytd_gross NUMERIC NOT NULL DEFAULT 0,
  ytd_tax NUMERIC NOT NULL DEFAULT 0,
  ytd_super NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT DEFAULT '',
  issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payslips" ON public.payslips
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_payslips_employee ON public.payslips(employee_id);
CREATE INDEX idx_payslips_period ON public.payslips(period_start, period_end);

CREATE TRIGGER update_payslips_updated_at
  BEFORE UPDATE ON public.payslips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payslip line items (per job breakdown)
CREATE TABLE public.payslip_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  payslip_id UUID NOT NULL,
  job_id UUID,
  description TEXT NOT NULL DEFAULT '',
  hours NUMERIC NOT NULL DEFAULT 0,
  rate NUMERIC NOT NULL DEFAULT 0,
  amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payslip_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payslip_lines" ON public.payslip_lines
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_payslip_lines_payslip ON public.payslip_lines(payslip_id);