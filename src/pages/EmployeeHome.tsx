import EmployeeLayout from "@/components/EmployeeLayout";
import { useEmployeeSelf } from "@/hooks/useEmployeeSelf";
import { useEmployeeJobs } from "@/hooks/useEmployeeJobs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { Link } from "react-router-dom";

const slotLabel: Record<string, string> = { am: "AM", pm: "PM", all_day: "All day" };

function dayLabel(d: string | null) {
  if (!d) return "Unscheduled";
  const dt = parseISO(d);
  if (isToday(dt)) return "Today";
  if (isTomorrow(dt)) return "Tomorrow";
  return format(dt, "EEE d MMM");
}

export default function EmployeeHome() {
  const { data: self } = useEmployeeSelf();
  const { data: jobs = [], isLoading } = useEmployeeJobs();

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const upcoming = jobs.filter((j) => j.status !== "completed" && (!j.scheduledDate || j.scheduledDate >= todayStr));
  const today = upcoming.filter((j) => j.scheduledDate === todayStr);
  const later = upcoming.filter((j) => j.scheduledDate !== todayStr);

  return (
    <EmployeeLayout>
      <div className="space-y-5">
        <div>
          <p className="text-sm text-muted-foreground">G'day,</p>
          <h1 className="text-2xl font-bold">{self?.name?.split(" ")[0] || "Crew"}</h1>
        </div>

        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="text-xs opacity-80">Jobs today</p>
              <p className="text-3xl font-bold">{today.length}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Upcoming</p>
              <p className="text-3xl font-bold">{upcoming.length}</p>
            </div>
          </CardContent>
        </Card>

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Today</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : today.length === 0 ? (
            <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No jobs today. Enjoy 🌿</CardContent></Card>
          ) : (
            <div className="space-y-2">{today.map((j) => <JobCard key={j.id} job={j} />)}</div>
          )}
        </section>

        {later.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Coming up</h2>
            <div className="space-y-2">{later.slice(0, 8).map((j) => <JobCard key={j.id} job={j} />)}</div>
          </section>
        )}
      </div>
    </EmployeeLayout>
  );
}

function JobCard({ job }: { job: ReturnType<typeof useEmployeeJobs>["data"] extends (infer T)[] | undefined ? T : never }) {
  return (
    <Link to={`/employee/jobs/${job.id}`}>
      <Card className="active:scale-[0.99] transition-transform">
        <CardContent className="py-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">{job.jobNumber}</span>
            <Badge variant="outline" className="text-[10px]">{slotLabel[job.timeSlot] || job.timeSlot}</Badge>
          </div>
          <p className="font-semibold">{job.clientName || "Client"}</p>
          {job.clientAddress && (
            <p className="text-sm text-muted-foreground flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {job.clientAddress}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {dayLabel(job.scheduledDate)}</span>
            {job.estimatedHours > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.estimatedHours}h est.</span>}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
