import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmployeeSelf } from "@/hooks/useEmployeeSelf";

export interface AssignedJob {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string | null;
  completedDate: string | null;
  notes: string;
  timeSlot: string;
  clientName: string | null;
  clientAddress: string | null;
  estimatedHours: number;
  rateAtAssignment: number;
}

export function useEmployeeJobs() {
  const { data: self } = useEmployeeSelf();
  return useQuery({
    queryKey: ["employee_jobs", self?.id],
    enabled: !!self?.id,
    queryFn: async (): Promise<AssignedJob[]> => {
      if (!self?.id) return [];
      const { data, error } = await supabase
        .from("job_employees")
        .select("estimated_hours, rate_at_assignment, jobs ( id, job_number, status, scheduled_date, completed_date, notes, time_slot, clients ( name, address ) )")
        .eq("employee_id", self.id);
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || [])
        .filter((r: any) => r.jobs)
        .map((r: any) => ({
          id: r.jobs.id,
          jobNumber: r.jobs.job_number,
          status: r.jobs.status,
          scheduledDate: r.jobs.scheduled_date,
          completedDate: r.jobs.completed_date,
          notes: r.jobs.notes ?? "",
          timeSlot: r.jobs.time_slot ?? "all_day",
          clientName: r.jobs.clients?.name ?? null,
          clientAddress: r.jobs.clients?.address ?? null,
          estimatedHours: Number(r.estimated_hours ?? 0),
          rateAtAssignment: Number(r.rate_at_assignment ?? 0),
        }))
        .sort((a, b) => {
          const da = a.scheduledDate || "9999";
          const db = b.scheduledDate || "9999";
          return da.localeCompare(db);
        });
    },
  });
}
