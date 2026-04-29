import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TimeSlot } from "@/lib/timeSlot";

export interface Job {
  id: string;
  quoteId: string | null;
  clientId: string | null;
  jobNumber: string;
  status: "scheduled" | "in_progress" | "completed" | "invoiced";
  scheduledDate: string | null;
  timeSlot: TimeSlot;
  sortOrder: number;
  completedDate: string | null;
  notes: string;
  createdAt: string;
  client?: { name: string; address: string; email: string; phone: string };
  quoteTotal?: number;
}

type JobUpdates = Partial<{
  status: string;
  scheduledDate: string;
  timeSlot: TimeSlot;
  sortOrder: number;
  completedDate: string;
  notes: string;
}>;

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((r: any): Job => ({
        id: r.id,
        quoteId: r.quote_id,
        clientId: r.client_id,
        jobNumber: r.job_number,
        status: r.status,
        scheduledDate: r.scheduled_date,
        timeSlot: (r.time_slot ?? "all_day") as TimeSlot,
        completedDate: r.completed_date,
        notes: r.notes ?? "",
        createdAt: r.created_at,
        client: r.clients ?? undefined,
        quoteTotal: r.quotes?.grand_total ? Number(r.quotes.grand_total) : undefined,
      }));
    },
  });

  const createJobMut = useMutation({
    mutationFn: async (params: { quoteId: string; clientId: string; scheduledDate?: string; timeSlot?: TimeSlot; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("jobs")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({
          user_id: user.id,
          quote_id: params.quoteId,
          client_id: params.clientId,
          scheduled_date: params.scheduledDate ?? null,
          time_slot: params.timeSlot ?? "all_day",
          notes: params.notes ?? "",
        } as any)
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
    mutationFn: async ({ id, updates }: { id: string; updates: JobUpdates }) => {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.scheduledDate !== undefined) dbUpdates.scheduled_date = updates.scheduledDate;
      if (updates.timeSlot !== undefined) dbUpdates.time_slot = updates.timeSlot;
      if (updates.completedDate !== undefined) dbUpdates.completed_date = updates.completedDate;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("jobs").update(dbUpdates as any).eq("id", id);
      if (error) throw error;
    },
    onMutate: async ({ id, updates }) => {
      await qc.cancelQueries({ queryKey: ["jobs"] });
      const previous = qc.getQueryData<Job[]>(["jobs"]);
      qc.setQueryData<Job[]>(["jobs"], (old) =>
        old?.map((j) =>
          j.id === id
            ? {
                ...j,
                ...(updates.status !== undefined && { status: updates.status as Job["status"] }),
                ...(updates.scheduledDate !== undefined && { scheduledDate: updates.scheduledDate }),
                ...(updates.timeSlot !== undefined && { timeSlot: updates.timeSlot }),
                ...(updates.completedDate !== undefined && { completedDate: updates.completedDate }),
                ...(updates.notes !== undefined && { notes: updates.notes }),
              }
            : j
        ) ?? []
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(["jobs"], ctx.previous);
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
    updateJob: (id: string, updates: JobUpdates, options?: Parameters<typeof updateJobMut.mutate>[1]) => updateJobMut.mutate({ id, updates }, options),
    deleteJob: (id: string) => deleteJobMut.mutate(id),
  };
}

