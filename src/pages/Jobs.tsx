import { Link } from "react-router-dom";
import { Loader2, Search, ArrowUpDown, Eye, Play, CheckCircle2, FileText, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useJobs } from "@/hooks/useJobs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";
import { PullToRefresh } from "@/components/PullToRefresh";
import { toast } from "sonner";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  invoiced: "bg-muted text-muted-foreground",
};

// "new" maps to scheduled (newly created/accepted, not yet started).
const filters = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "invoiced", label: "Invoiced" },
] as const;

const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "scheduled_asc", label: "Scheduled (soonest)" },
  { value: "scheduled_desc", label: "Scheduled (latest)" },
  { value: "value_desc", label: "Quote value (high → low)" },
  { value: "value_asc", label: "Quote value (low → high)" },
] as const;
type SortKey = (typeof sortOptions)[number]["value"];

export default function Jobs() {
  const { jobs, isLoading, isFetching, refetch, updateJob } = useJobs();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

    if (q) {
      list = list.filter((j) =>
        j.jobNumber.toLowerCase().includes(q) ||
        (j.client?.name ?? "").toLowerCase().includes(q) ||
        (j.client?.address ?? "").toLowerCase().includes(q)
      );
    }

    const farFuture = 8640000000000000;
    const sorted = [...list].sort((a, b) => {
      switch (sort) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "scheduled_asc": {
          const ad = a.scheduledDate ? new Date(a.scheduledDate).getTime() : farFuture;
          const bd = b.scheduledDate ? new Date(b.scheduledDate).getTime() : farFuture;
          return ad - bd;
        }
        case "scheduled_desc": {
          const ad = a.scheduledDate ? new Date(a.scheduledDate).getTime() : -1;
          const bd = b.scheduledDate ? new Date(b.scheduledDate).getTime() : -1;
          return bd - ad;
        }
        case "value_desc":
          return (b.quoteTotal ?? 0) - (a.quoteTotal ?? 0);
        case "value_asc":
          return (a.quoteTotal ?? 0) - (b.quoteTotal ?? 0);
      }
    });
    return sorted;
  }, [jobs, filter, search, sort]);

  const handleStatusChange = (jobId: string, status: string) => {
    const updates: Partial<{ status: string; completedDate: string }> = { status };
    if (status === "completed") updates.completedDate = format(new Date(), "yyyy-MM-dd");
    updateJob(jobId, updates, {
      onSuccess: async () => {
        toast.success(`Status updated to ${status.replace(/_/g, " ")}`);
        await refetch();
      },
      onError: () => toast.error("Failed to update job status"),
    });
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success("Jobs refreshed");
  };

  return (
    <AppLayout>
      <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-foreground">Jobs</h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage your active and completed jobs</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 shrink-0"
            onClick={handleRefresh}
            disabled={isFetching}
            aria-label="Refresh jobs"
          >
            <RefreshCw className={`w-4 h-4 sm:mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Search + sort row — stacks on phones */}
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by job #, client or address…"
              className="pl-9 h-11"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              inputMode="search"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-full sm:w-56 h-11">
              <ArrowUpDown className="w-4 h-4 mr-1 opacity-60" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter chips — horizontally scrollable on phones, no wrap */}
        <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex gap-2 min-w-max sm:flex-wrap sm:min-w-0">
            {filters.map((f) => {
              const count = f.value === "all"
                ? jobs.length
                : jobs.filter((j) => j.status === f.value).length;
              const active = filter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  aria-pressed={active}
                >
                  {f.label}
                  <span className="ml-1.5 opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto my-8" />
        ) : filteredJobs.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <p className="text-muted-foreground">
                {jobs.length === 0
                  ? "No jobs yet. Accept a quote to create your first job."
                  : "No jobs match your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {filter === "all" ? "All Jobs" : filters.find((f) => f.value === filter)?.label} ({filteredJobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredJobs.map((job) => {
                  const nextAction =
                    job.status === "scheduled"
                      ? { label: "Start", icon: Play, next: "in_progress" }
                      : job.status === "in_progress"
                      ? { label: "Complete", icon: CheckCircle2, next: "completed" }
                      : job.status === "completed"
                      ? { label: "Mark Invoiced", icon: FileText, next: "invoiced" }
                      : null;
                  return (
                    <div
                      key={job.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Link to={`/admin/jobs/${job.id}`} className="flex-1 min-w-0 block">
                        <p className="font-medium">{job.jobNumber}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {job.client?.name ?? "Unknown client"} — {job.client?.address ?? ""}
                        </p>
                        {job.scheduledDate && (
                          <p className="text-xs text-muted-foreground">
                            Scheduled: {new Date(job.scheduledDate).toLocaleDateString("en-AU")}
                          </p>
                        )}
                      </Link>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 flex-wrap">
                        {job.quoteTotal != null && (
                          <span className="font-semibold">${job.quoteTotal.toFixed(2)}</span>
                        )}
                        <Select value={job.status} onValueChange={(val) => handleStatusChange(job.id, val)}>
                          <SelectTrigger
                            className={`w-32 text-xs h-9 ${statusColors[job.status]}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="invoiced">Invoiced</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1.5">
                          {nextAction && (
                            <Button
                              size="sm"
                              className="h-9"
                              onClick={() => handleStatusChange(job.id, nextAction.next)}
                            >
                              <nextAction.icon className="w-4 h-4 sm:mr-1.5" />
                              <span className="hidden sm:inline">{nextAction.label}</span>
                            </Button>
                          )}
                          <Button asChild size="sm" variant="outline" className="h-9">
                            <Link to={`/admin/jobs/${job.id}`} aria-label="View job details">
                              <Eye className="w-4 h-4 sm:mr-1.5" />
                              <span className="hidden sm:inline">View</span>
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      </PullToRefresh>
    </AppLayout>
  );
}
