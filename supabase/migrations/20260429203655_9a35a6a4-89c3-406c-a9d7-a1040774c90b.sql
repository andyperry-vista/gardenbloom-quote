
-- 1. Add 'employee' to app_role enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
                 WHERE t.typname = 'app_role' AND e.enumlabel = 'employee') THEN
    ALTER TYPE public.app_role ADD VALUE 'employee';
  END IF;
END$$;

-- 2. Link an auth user to an employee record (admin invites the user)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS linked_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_employees_linked_user_id ON public.employees(linked_user_id);

-- 3. Helper: does the calling user own (employee) any record we're checking?
CREATE OR REPLACE FUNCTION public.is_linked_employee(_employee_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees
    WHERE id = _employee_id
      AND linked_user_id = auth.uid()
  )
$$;

-- 4. Employees: allow the linked user to read their own record
DROP POLICY IF EXISTS "Linked employees can view own record" ON public.employees;
CREATE POLICY "Linked employees can view own record"
ON public.employees
FOR SELECT
TO authenticated
USING (linked_user_id = auth.uid());

-- 5. job_employees: allow the linked employee to read assignments of their jobs
DROP POLICY IF EXISTS "Linked employees can view own assignments" ON public.job_employees;
CREATE POLICY "Linked employees can view own assignments"
ON public.job_employees
FOR SELECT
TO authenticated
USING (public.is_linked_employee(employee_id));

-- 6. jobs: allow the linked employee to read jobs they're assigned to
DROP POLICY IF EXISTS "Linked employees can view assigned jobs" ON public.jobs;
CREATE POLICY "Linked employees can view assigned jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.job_employees je
    JOIN public.employees e ON e.id = je.employee_id
    WHERE je.job_id = jobs.id
      AND e.linked_user_id = auth.uid()
  )
);

-- 7. clients: allow linked employee to read clients of their assigned jobs
DROP POLICY IF EXISTS "Linked employees can view assigned clients" ON public.clients;
CREATE POLICY "Linked employees can view assigned clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.jobs j
    JOIN public.job_employees je ON je.job_id = j.id
    JOIN public.employees e ON e.id = je.employee_id
    WHERE j.client_id = clients.id
      AND e.linked_user_id = auth.uid()
  )
);

-- 8. time_entries: allow linked employee to view, create, and update own (when not paid)
DROP POLICY IF EXISTS "Linked employees can view own time entries" ON public.time_entries;
CREATE POLICY "Linked employees can view own time entries"
ON public.time_entries
FOR SELECT
TO authenticated
USING (public.is_linked_employee(employee_id));

DROP POLICY IF EXISTS "Linked employees can insert own time entries" ON public.time_entries;
CREATE POLICY "Linked employees can insert own time entries"
ON public.time_entries
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_linked_employee(employee_id)
  AND payslip_id IS NULL
);

DROP POLICY IF EXISTS "Linked employees can update own unpaid time entries" ON public.time_entries;
CREATE POLICY "Linked employees can update own unpaid time entries"
ON public.time_entries
FOR UPDATE
TO authenticated
USING (public.is_linked_employee(employee_id) AND payslip_id IS NULL)
WITH CHECK (public.is_linked_employee(employee_id) AND payslip_id IS NULL);
