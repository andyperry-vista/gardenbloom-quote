import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ClientRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export function useClients() {
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data.map((r): ClientRecord => ({
        id: r.id,
        name: r.name,
        email: r.email ?? "",
        phone: r.phone ?? "",
        address: r.address ?? "",
        createdAt: r.created_at,
      }));
    },
  });

  const updateClientMut = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ name: string; email: string; phone: string; address: string }> }) => {
      const { error } = await supabase
        .from("clients")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const deleteClientMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clients"] }),
  });

  return {
    clients,
    isLoading,
    updateClient: (id: string, updates: Partial<{ name: string; email: string; phone: string; address: string }>) => updateClientMut.mutate({ id, updates }),
    deleteClient: (id: string) => deleteClientMut.mutate(id),
  };
}
