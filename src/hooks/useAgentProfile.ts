import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentProfile {
  id: string;
  userId: string;
  agencyName: string;
  agentName: string;
  phone: string;
  email: string;
  status: "pending" | "approved" | "suspended";
  referralCode: string;
  commissionRate: number;
  commissionEnabled: boolean;
  createdAt: string;
}

export function useAgentProfile() {
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["agentProfile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("agent_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        userId: data.user_id,
        agencyName: data.agency_name,
        agentName: data.agent_name,
        phone: data.phone ?? "",
        email: data.email ?? "",
        status: data.status as AgentProfile["status"],
        referralCode: data.referral_code,
        commissionRate: Number(data.commission_rate),
        createdAt: data.created_at,
      } as AgentProfile;
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<{ agencyName: string; agentName: string; phone: string; email: string }>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const dbUpdates: Record<string, unknown> = {};
      if (updates.agencyName !== undefined) dbUpdates.agency_name = updates.agencyName;
      if (updates.agentName !== undefined) dbUpdates.agent_name = updates.agentName;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("agent_profiles").update(dbUpdates as any).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agentProfile"] }),
  });

  return { profile, isLoading, updateProfile: updateProfile.mutateAsync };
}

export function useAllAgentProfiles() {
  return useQuery({
    queryKey: ["allAgentProfiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((d: any): AgentProfile => ({
        id: d.id,
        userId: d.user_id,
        agencyName: d.agency_name,
        agentName: d.agent_name,
        phone: d.phone ?? "",
        email: d.email ?? "",
        status: d.status,
        referralCode: d.referral_code,
        commissionRate: Number(d.commission_rate),
        createdAt: d.created_at,
      }));
    },
  });
}

export function useUpdateAgentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("agent_profiles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["allAgentProfiles"] }),
  });
}
