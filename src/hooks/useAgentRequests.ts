import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentRequest {
  id: string;
  agentId: string;
  propertyAddress: string;
  propertyType: string;
  servicePackage: string;
  preferredDate: string | null;
  notes: string;
  status: "pending" | "quoted" | "accepted" | "completed";
  quoteId: string | null;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRow(r: any): AgentRequest {
  return {
    id: r.id,
    agentId: r.agent_id,
    propertyAddress: r.property_address,
    propertyType: r.property_type,
    servicePackage: r.service_package,
    preferredDate: r.preferred_date,
    notes: r.notes ?? "",
    status: r.status,
    quoteId: r.quote_id,
    createdAt: r.created_at,
  };
}

export function useAgentRequests(agentId?: string) {
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["agentRequests", agentId],
    queryFn: async () => {
      let query = supabase.from("agent_requests").select("*").order("created_at", { ascending: false });
      if (agentId) query = query.eq("agent_id", agentId);
      const { data, error } = await query;
      if (error) throw error;
      return data.map(mapRow);
    },
  });

  const createRequest = useMutation({
    mutationFn: async (params: { agentId: string; propertyAddress: string; propertyType: string; servicePackage: string; preferredDate?: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("agent_requests")
        .insert({
          agent_id: params.agentId,
          property_address: params.propertyAddress,
          property_type: params.propertyType,
          service_package: params.servicePackage,
          preferred_date: params.preferredDate ?? null,
          notes: params.notes ?? "",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agentRequests"] }),
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ status: string; quoteId: string }> }) => {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.quoteId !== undefined) dbUpdates.quote_id = updates.quoteId;
      const { error } = await supabase.from("agent_requests").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agentRequests"] }),
  });

  return {
    requests,
    isLoading,
    createRequest: createRequest.mutateAsync,
    updateRequest: (id: string, updates: Partial<{ status: string; quoteId: string }>) => updateRequest.mutate({ id, updates }),
  };
}
