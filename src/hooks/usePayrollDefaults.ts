import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_PAYROLL_DEFAULTS, type PayrollDefaults } from "@/lib/employeeRate";

const KEY = "payroll_defaults";

export function usePayrollDefaults() {
  const qc = useQueryClient();

  const { data: defaults = DEFAULT_PAYROLL_DEFAULTS, isLoading } = useQuery({
    queryKey: ["user_settings", KEY],
    queryFn: async (): Promise<PayrollDefaults> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return DEFAULT_PAYROLL_DEFAULTS;
      const { data, error } = await supabase
        .from("user_settings")
        .select("value")
        .eq("user_id", user.id)
        .eq("key", KEY)
        .maybeSingle();
      if (error) throw error;
      if (!data?.value) return DEFAULT_PAYROLL_DEFAULTS;
      try {
        return { ...DEFAULT_PAYROLL_DEFAULTS, ...JSON.parse(data.value) };
      } catch {
        return DEFAULT_PAYROLL_DEFAULTS;
      }
    },
  });

  const save = useMutation({
    mutationFn: async (next: PayrollDefaults) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const value = JSON.stringify(next);
      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .eq("user_id", user.id)
        .eq("key", KEY)
        .maybeSingle();
      if (existing?.id) {
        const { error } = await supabase
          .from("user_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_settings")
          .insert({ user_id: user.id, key: KEY, value });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_settings", KEY] }),
  });

  return { defaults, isLoading, saveDefaults: save.mutateAsync };
}
