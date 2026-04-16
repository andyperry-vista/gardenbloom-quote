import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  message: string;
  photoUrls: string[];
  referralCode: string;
  referralAgentName: string | null;
  referralAgencyName: string | null;
  status: string;
  createdAt: string;
  analyzerResult?: string;
}

export function useQuoteRequests() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["quote_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch agent profiles to match referral codes
      const { data: agents } = await supabase
        .from("agent_profiles")
        .select("referral_code, agent_name, agency_name");
      const agentMap = new Map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (agents || []).map((a: any) => [a.referral_code, { agentName: a.agent_name, agencyName: a.agency_name }])
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || []).map((r: any) => {
        const code = r.referral_code || "";
        const agent = code ? agentMap.get(code) : null;
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone || "",
          address: r.address || "",
          message: r.message || "",
          photoUrls: (r.photo_urls as string[]) || [],
          referralCode: code,
          referralAgentName: agent?.agentName || null,
          referralAgencyName: agent?.agencyName || null,
          status: r.status,
          createdAt: r.created_at,
          analyzerResult: r.analyzer_result,
        };
      }) as QuoteRequest[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("quote_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quote_requests"] }),
  });

  const runAnalyzer = useMutation({
    mutationFn: async ({ id, photoUrls }: { id: string; photoUrls: string[] }) => {
      const { data, error } = await supabase.functions.invoke("garden-value-analyzer", {
        body: { quoteRequestId: id, photoUrls },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quote_requests"] }),
  });

  return {
    requests,
    isLoading,
    updateStatus: (id: string, status: string) => updateStatus.mutateAsync({ id, status }),
    runAnalyzer: (id: string, photoUrls: string[]) => runAnalyzer.mutateAsync({ id, photoUrls }),
    isAnalyzing: runAnalyzer.isPending,
    analyzingId: runAnalyzer.variables?.id,
  };
}
