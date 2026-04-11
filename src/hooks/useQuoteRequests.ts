import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
      return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone || "",
        address: r.address || "",
        message: r.message || "",
        photoUrls: (r.photo_urls as string[]) || [],
        referralCode: r.referral_code || "",
        status: r.status,
        createdAt: r.created_at,
      })) as QuoteRequest[];
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

  return { requests, isLoading, updateStatus: (id: string, status: string) => updateStatus.mutateAsync({ id, status }) };
}
