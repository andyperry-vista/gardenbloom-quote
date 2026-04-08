import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Job {
  id: string;
  quoteId: string | null;
  clientId: string | null;
  jobNumber: string;
  status: "scheduled" | "in_progress" | "completed" | "invoiced";
  scheduledDate: string | null;
  completedDate: string | null;
  notes: string;
  createdAt: string;
  client?: { name: string; address: string; email: string; phone: string };
  quoteTotal?: number;
}

export function useJobs() {
  const qc = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*, clients(name, address, email, phone), quotes(grand_total)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data.map((r: any): Job => ({
        id: r.id,
        quoteId: r.quote_id,
        clientId: r.client_id,
        jobNumber: r.job_number,
        status: r.status,
        scheduledDate: r.scheduled_date,
        completedDate: r.completed_date,
        notes: r.notes ?? "",
        createdAt: r.created_at,
        client: r.clients ?? undefined,
        quoteTotal: r.quotes?.grand_total ? Number(r.quotes.grand_total) : undefined,
      }));
    },
  });

  const createJobMut = useMutation({
    mutationFn: async (params: { quoteId: string; clientId: string; scheduledDate?: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("jobs")
        .insert({
          user_id: user.id,
          quote_id: params.quoteId,
          client_id: params.clientId,
          scheduled_date: params.scheduledDate ?? null,
          notes: params.notes ?? "",
        })
        .select("id, job_number")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
  });

  const updateJobMut = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ status: string; scheduledDate: string; completedDate: string; notes: string }> }) => {
      const dbUpdates: any = { updated_at: new Date().toISOString() };
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate;
      if (updates.completedDate !== undefined) dbUpdates.completed_date = updates.completedDate;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      const { error } = await supabase.from("jobs").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const deleteJobMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

  return {
    jobs,
    isLoading,
    createJob: createJobMut.mutateAsync,
    updateJob: (id: string, updates: any) => updateJobMut.mutate({ id, updates }),
    deleteJob: (id: string) => deleteJobMut.mutate(id),
  };
}
