import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  items: any[];
  basePrice: number;
  isActive: boolean;
  createdAt: string;
}

function mapRow(r: any): ServicePackage {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    items: Array.isArray(r.items) ? r.items : [],
    basePrice: Number(r.base_price),
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

export function useServicePackages(activeOnly = false) {
  const qc = useQueryClient();

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["servicePackages", activeOnly],
    queryFn: async () => {
      let query = supabase.from("service_packages").select("*").order("created_at", { ascending: false });
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return data.map(mapRow);
    },
  });

  const createPackage = useMutation({
    mutationFn: async (params: { name: string; description: string; items: any[]; basePrice: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("service_packages").insert({
        user_id: user.id,
        name: params.name,
        description: params.description,
        items: params.items as any,
        base_price: params.basePrice,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicePackages"] }),
  });

  const updatePackage = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ name: string; description: string; items: any[]; basePrice: number; isActive: boolean }> }) => {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.items !== undefined) dbUpdates.items = updates.items;
      if (updates.basePrice !== undefined) dbUpdates.base_price = updates.basePrice;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      const { error } = await supabase.from("service_packages").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicePackages"] }),
  });

  const deletePackage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_packages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["servicePackages"] }),
  });

  return {
    packages,
    isLoading,
    createPackage: createPackage.mutateAsync,
    updatePackage: (id: string, updates: any) => updatePackage.mutate({ id, updates }),
    deletePackage: (id: string) => deletePackage.mutate(id),
  };
}
