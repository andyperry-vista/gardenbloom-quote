import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface JobEmployee {
  id: string;
  jobId: string;
  employeeId: string;
  estimatedHours: number;
  rateAtAssignment: number;
  employeeName?: string;
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  jobId: string | null;
  workDate: string;
  hours: number;
  rate: number;
  notes: string;
  confirmed: boolean;
  payslipId: string | null;
  employeeName?: string;
  jobNumber?: string;
}

export interface PayslipLine {
  id: string;
  payslipId: string;
  jobId: string | null;
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

export interface Payslip {
  id: string;
  employeeId: string;
  payslipNumber: string;
  periodStart: string;
  periodEnd: string;
  jobId: string | null;
  hoursTotal: number;
  gross: number;
  taxWithheld: number;
  net: number;
  superAmount: number;
  ytdGross: number;
  ytdTax: number;
  ytdSuper: number;
  status: string;
  notes: string;
  issuedAt: string | null;
  createdAt: string;
  employeeName?: string;
  lines?: PayslipLine[];
}

export function useJobEmployees(jobId?: string) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["job_employees", jobId],
    enabled: !!jobId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_employees")
        .select("*, employees(name)")
        .eq("job_id", jobId!);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((r: any): JobEmployee => ({
        id: r.id,
        jobId: r.job_id,
        employeeId: r.employee_id,
        estimatedHours: Number(r.estimated_hours ?? 0),
        rateAtAssignment: Number(r.rate_at_assignment ?? 0),
        employeeName: r.employees?.name,
      }));
    },
  });

  const assign = useMutation({
    mutationFn: async (params: { jobId: string; employeeId: string; estimatedHours: number; rate: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("job_employees").insert({
        user_id: user.id,
        job_id: params.jobId,
        employee_id: params.employeeId,
        estimated_hours: params.estimatedHours,
        rate_at_assignment: params.rate,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job_employees", jobId] }),
  });

  const updateAssignment = useMutation({
    mutationFn: async ({ id, estimatedHours, rate }: { id: string; estimatedHours?: number; rate?: number }) => {
      const u: Record<string, unknown> = {};
      if (estimatedHours !== undefined) u.estimated_hours = estimatedHours;
      if (rate !== undefined) u.rate_at_assignment = rate;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("job_employees").update(u as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job_employees", jobId] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["job_employees", jobId] }),
  });

  return {
    jobEmployees: data,
    isLoading,
    assignEmployee: assign.mutateAsync,
    updateAssignment: (id: string, updates: { estimatedHours?: number; rate?: number }) =>
      updateAssignment.mutate({ id, ...updates }),
    removeAssignment: (id: string) => remove.mutate(id),
  };
}

export function useTimeEntries(filter?: { jobId?: string; employeeId?: string }) {
  const qc = useQueryClient();
  const key = ["time_entries", filter ?? {}];
  const { data = [], isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      let q = supabase
        .from("time_entries")
        .select("*, employees(name), jobs(job_number)")
        .order("work_date", { ascending: false });
      if (filter?.jobId) q = q.eq("job_id", filter.jobId);
      if (filter?.employeeId) q = q.eq("employee_id", filter.employeeId);
      const { data, error } = await q;
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((r: any): TimeEntry => ({
        id: r.id,
        employeeId: r.employee_id,
        jobId: r.job_id,
        workDate: r.work_date,
        hours: Number(r.hours ?? 0),
        rate: Number(r.rate ?? 0),
        notes: r.notes ?? "",
        confirmed: !!r.confirmed,
        payslipId: r.payslip_id,
        employeeName: r.employees?.name,
        jobNumber: r.jobs?.job_number,
      }));
    },
  });

  const create = useMutation({
    mutationFn: async (entry: { employeeId: string; jobId?: string | null; workDate: string; hours: number; rate: number; notes?: string; confirmed?: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("time_entries").insert({
        user_id: user.id,
        employee_id: entry.employeeId,
        job_id: entry.jobId ?? null,
        work_date: entry.workDate,
        hours: entry.hours,
        rate: entry.rate,
        notes: entry.notes ?? "",
        confirmed: entry.confirmed ?? false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time_entries"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<TimeEntry> }) => {
      const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.workDate !== undefined) u.work_date = updates.workDate;
      if (updates.hours !== undefined) u.hours = updates.hours;
      if (updates.rate !== undefined) u.rate = updates.rate;
      if (updates.notes !== undefined) u.notes = updates.notes;
      if (updates.confirmed !== undefined) u.confirmed = updates.confirmed;
      if (updates.jobId !== undefined) u.job_id = updates.jobId;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("time_entries").update(u as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time_entries"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["time_entries"] }),
  });

  return {
    entries: data,
    isLoading,
    addEntry: create.mutateAsync,
    updateEntry: (id: string, updates: Partial<TimeEntry>) => update.mutate({ id, updates }),
    deleteEntry: (id: string) => remove.mutate(id),
  };
}

export function usePayslips(employeeId?: string) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["payslips", employeeId],
    queryFn: async () => {
      let q = supabase
        .from("payslips")
        .select("*, employees(name), payslip_lines(*)")
        .order("period_end", { ascending: false });
      if (employeeId) q = q.eq("employee_id", employeeId);
      const { data, error } = await q;
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((r: any): Payslip => ({
        id: r.id,
        employeeId: r.employee_id,
        payslipNumber: r.payslip_number,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        jobId: r.job_id,
        hoursTotal: Number(r.hours_total ?? 0),
        gross: Number(r.gross ?? 0),
        taxWithheld: Number(r.tax_withheld ?? 0),
        net: Number(r.net ?? 0),
        superAmount: Number(r.super_amount ?? 0),
        ytdGross: Number(r.ytd_gross ?? 0),
        ytdTax: Number(r.ytd_tax ?? 0),
        ytdSuper: Number(r.ytd_super ?? 0),
        status: r.status,
        notes: r.notes ?? "",
        issuedAt: r.issued_at,
        createdAt: r.created_at,
        employeeName: r.employees?.name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lines: (r.payslip_lines ?? []).map((l: any): PayslipLine => ({
          id: l.id,
          payslipId: l.payslip_id,
          jobId: l.job_id,
          description: l.description ?? "",
          hours: Number(l.hours ?? 0),
          rate: Number(l.rate ?? 0),
          amount: Number(l.amount ?? 0),
        })),
      }));
    },
  });

  const create = useMutation({
    mutationFn: async (params: {
      employeeId: string;
      periodStart: string;
      periodEnd: string;
      jobId?: string | null;
      hoursTotal: number;
      gross: number;
      taxWithheld: number;
      net: number;
      superAmount: number;
      ytdGross: number;
      ytdTax: number;
      ytdSuper: number;
      status?: string;
      notes?: string;
      lines: Array<{ jobId?: string | null; description: string; hours: number; rate: number; amount: number }>;
      timeEntryIds: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: ps, error } = await supabase.from("payslips").insert({
        user_id: user.id,
        employee_id: params.employeeId,
        period_start: params.periodStart,
        period_end: params.periodEnd,
        job_id: params.jobId ?? null,
        hours_total: params.hoursTotal,
        gross: params.gross,
        tax_withheld: params.taxWithheld,
        net: params.net,
        super_amount: params.superAmount,
        ytd_gross: params.ytdGross,
        ytd_tax: params.ytdTax,
        ytd_super: params.ytdSuper,
        status: params.status ?? "draft",
        notes: params.notes ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any).select("id").single();
      if (error) throw error;
      const psId = ps.id as string;

      if (params.lines.length > 0) {
        const { error: lerr } = await supabase.from("payslip_lines").insert(
          params.lines.map((l) => ({
            user_id: user.id,
            payslip_id: psId,
            job_id: l.jobId ?? null,
            description: l.description,
            hours: l.hours,
            rate: l.rate,
            amount: l.amount,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          })) as any,
        );
        if (lerr) throw lerr;
      }

      if (params.timeEntryIds.length > 0) {
        const { error: terr } = await supabase
          .from("time_entries")
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .update({ payslip_id: psId } as any)
          .in("id", params.timeEntryIds);
        if (terr) throw terr;
      }

      return psId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payslips"] });
      qc.invalidateQueries({ queryKey: ["time_entries"] });
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Payslip> }) => {
      const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.status !== undefined) u.status = updates.status;
      if (updates.notes !== undefined) u.notes = updates.notes;
      if (updates.issuedAt !== undefined) u.issued_at = updates.issuedAt;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("payslips").update(u as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payslips"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      // Unlink time entries first
      await supabase
        .from("time_entries")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ payslip_id: null } as any)
        .eq("payslip_id", id);
      await supabase.from("payslip_lines").delete().eq("payslip_id", id);
      const { error } = await supabase.from("payslips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payslips"] });
      qc.invalidateQueries({ queryKey: ["time_entries"] });
    },
  });

  return {
    payslips: data,
    isLoading,
    createPayslip: create.mutateAsync,
    updatePayslip: (id: string, updates: Partial<Payslip>) => update.mutate({ id, updates }),
    deletePayslip: (id: string) => remove.mutate(id),
  };
}
