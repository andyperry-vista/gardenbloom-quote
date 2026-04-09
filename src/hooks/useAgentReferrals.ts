import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentReferral {
  id: string;
  agentId: string;
  jobId: string;
  invoiceId: string | null;
  commissionAmount: number;
  status: "pending" | "earned" | "paid";
  paidDate: string | null;
  createdAt: string;
}

export function useAgentReferrals(agentId?: string) {
  const qc = useQueryClient();

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["agentReferrals", agentId],
    enabled: !!agentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_referrals")
        .select("*")
        .eq("agent_id", agentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((r: any): AgentReferral => ({
        id: r.id,
        agentId: r.agent_id,
        jobId: r.job_id,
        invoiceId: r.invoice_id,
        commissionAmount: Number(r.commission_amount),
        status: r.status,
        paidDate: r.paid_date,
        createdAt: r.created_at,
      }));
    },
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("agent_referrals")
        .update({ status: "paid", paid_date: new Date().toISOString().split("T")[0] })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agentReferrals"] }),
  });

  return { referrals, isLoading, markPaid: markPaid.mutateAsync };
}
