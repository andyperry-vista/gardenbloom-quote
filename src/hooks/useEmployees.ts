import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  hourlyRate: number;
  payBasis: "hourly" | "salary";
  annualSalary: number;
  standardHoursPerWeek: number;
  superRate: number;
  superFund: string;
  superMemberNumber: string;
  bsb: string;
  accountNumber: string;
  taxFileNumber: string;
  employmentType: string;
  startDate: string | null;
  active: boolean;
  notes: string;
  createdAt: string;
  linkedUserId: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function map(r: any): Employee {
  return {
    id: r.id,
    name: r.name,
    email: r.email ?? "",
    phone: r.phone ?? "",
    address: r.address ?? "",
    hourlyRate: Number(r.hourly_rate ?? 0),
    payBasis: (r.pay_basis === "salary" ? "salary" : "hourly"),
    annualSalary: Number(r.annual_salary ?? 0),
    standardHoursPerWeek: Number(r.standard_hours_per_week ?? 38),
    superRate: Number(r.super_rate ?? 11.5),
    superFund: r.super_fund ?? "",
    superMemberNumber: r.super_member_number ?? "",
    bsb: r.bsb ?? "",
    accountNumber: r.account_number ?? "",
    taxFileNumber: r.tax_file_number ?? "",
    employmentType: r.employment_type ?? "casual",
    startDate: r.start_date,
    active: !!r.active,
    notes: r.notes ?? "",
    createdAt: r.created_at,
    linkedUserId: r.linked_user_id ?? null,
  };
}

export function useEmployees() {
  const qc = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data, error } = await supabase.from("employees").select("*").order("name");
      if (error) throw error;
      return data.map(map);
    },
  });

  const create = useMutation({
    mutationFn: async (e: Partial<Employee>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("employees").insert({
        user_id: user.id,
        name: e.name ?? "",
        email: e.email ?? "",
        phone: e.phone ?? "",
        address: e.address ?? "",
        hourly_rate: e.hourlyRate ?? 0,
        pay_basis: e.payBasis ?? "hourly",
        annual_salary: e.annualSalary ?? 0,
        standard_hours_per_week: e.standardHoursPerWeek ?? 38,
        super_rate: e.superRate ?? 11.5,
        super_fund: e.superFund ?? "",
        super_member_number: e.superMemberNumber ?? "",
        bsb: e.bsb ?? "",
        account_number: e.accountNumber ?? "",
        tax_file_number: e.taxFileNumber ?? "",
        employment_type: e.employmentType ?? "casual",
        start_date: e.startDate ?? null,
        active: e.active ?? true,
        notes: e.notes ?? "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Employee> }) => {
      const u: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.name !== undefined) u.name = updates.name;
      if (updates.email !== undefined) u.email = updates.email;
      if (updates.phone !== undefined) u.phone = updates.phone;
      if (updates.address !== undefined) u.address = updates.address;
      if (updates.hourlyRate !== undefined) u.hourly_rate = updates.hourlyRate;
      if (updates.payBasis !== undefined) u.pay_basis = updates.payBasis;
      if (updates.annualSalary !== undefined) u.annual_salary = updates.annualSalary;
      if (updates.standardHoursPerWeek !== undefined) u.standard_hours_per_week = updates.standardHoursPerWeek;
      if (updates.superRate !== undefined) u.super_rate = updates.superRate;
      if (updates.superFund !== undefined) u.super_fund = updates.superFund;
      if (updates.superMemberNumber !== undefined) u.super_member_number = updates.superMemberNumber;
      if (updates.bsb !== undefined) u.bsb = updates.bsb;
      if (updates.accountNumber !== undefined) u.account_number = updates.accountNumber;
      if (updates.taxFileNumber !== undefined) u.tax_file_number = updates.taxFileNumber;
      if (updates.employmentType !== undefined) u.employment_type = updates.employmentType;
      if (updates.startDate !== undefined) u.start_date = updates.startDate;
      if (updates.active !== undefined) u.active = updates.active;
      if (updates.notes !== undefined) u.notes = updates.notes;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("employees").update(u as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });

  return {
    employees,
    isLoading,
    createEmployee: create.mutateAsync,
    updateEmployee: (id: string, updates: Partial<Employee>) => update.mutate({ id, updates }),
    deleteEmployee: (id: string) => remove.mutate(id),
  };
}
