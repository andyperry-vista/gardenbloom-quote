import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useJobs } from "@/hooks/useJobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  invoiced: "bg-muted text-muted-foreground",
};

export default function Jobs() {
  const { jobs, isLoading, updateJob } = useJobs();

  const handleStatusChange = (jobId: string, status: string) => {
    const updates: any = { status };
    if (status === "completed") updates.completedDate = format(new Date(), "yyyy-MM-dd");
    updateJob(jobId, updates);
    toast.success(`Status updated to ${status.replace("_", " ")}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-4xl text-foreground">Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage your active and completed jobs</p>
        </div>

        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto my-8" />
        ) : jobs.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <p className="text-muted-foreground">No jobs yet. Accept a quote to create your first job.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>All Jobs</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Link to={`/admin/jobs/${job.id}`} className="flex-1 min-w-0">
                      <p className="font-medium">{job.jobNumber}</p>
                      <p className="text-sm text-muted-foreground">{job.client?.name ?? "Unknown client"} — {job.client?.address ?? ""}</p>
                      {job.scheduledDate && <p className="text-xs text-muted-foreground">Scheduled: {new Date(job.scheduledDate).toLocaleDateString("en-AU")}</p>}
                    </Link>
                    <div className="flex items-center gap-4">
                      {job.quoteTotal && <span className="font-semibold">${job.quoteTotal.toFixed(2)}</span>}
                      <Select value={job.status} onValueChange={(val) => handleStatusChange(job.id, val)}>
                        <SelectTrigger className={`w-32 text-xs h-8 ${statusColors[job.status]}`} onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="invoiced">Invoiced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}