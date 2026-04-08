import { Link } from "react-router-dom";
import { useJobs } from "@/hooks/useJobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  invoiced: "bg-muted text-muted-foreground",
};

export default function Jobs() {
  const { jobs, isLoading } = useJobs();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-4xl text-foreground">Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage your active and completed jobs</p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
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
                  <Link
                    key={job.id}
                    to={`/admin/jobs/${job.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{job.jobNumber}</p>
                      <p className="text-sm text-muted-foreground">{job.client?.name ?? "Unknown client"} — {job.client?.address ?? ""}</p>
                      {job.scheduledDate && <p className="text-xs text-muted-foreground">Scheduled: {new Date(job.scheduledDate).toLocaleDateString("en-AU")}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      {job.quoteTotal && <span className="font-semibold">${job.quoteTotal.toFixed(2)}</span>}
                      <Badge className={statusColors[job.status]} variant="secondary">{job.status.replace("_", " ")}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
