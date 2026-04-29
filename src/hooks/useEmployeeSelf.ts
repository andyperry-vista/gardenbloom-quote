import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmployeeSelf {
  id: string;
  name: string;
  email: string;
  hourlyRate: number;
  payBasis: "hourly" | "salary";
  annualSalary: number;
  standardHoursPerWeek: number;
}

export function useEmployeeSelf() {
  return useQuery({
    queryKey: ["employee_self"],
    queryFn: async (): Promise<EmployeeSelf | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("employees")
        .select("id, name, email, hourly_rate, pay_basis, annual_salary, standard_hours_per_week")
        .eq("linked_user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        name: data.name,
        email: data.email ?? "",
        hourlyRate: Number(data.hourly_rate ?? 0),
        payBasis: (data.pay_basis === "salary" ? "salary" : "hourly"),
        annualSalary: Number(data.annual_salary ?? 0),
        standardHoursPerWeek: Number(data.standard_hours_per_week ?? 38),
      };
    },
  });
}
