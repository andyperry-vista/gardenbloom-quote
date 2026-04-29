import EmployeeLayout from "@/components/EmployeeLayout";
import { useEmployeeJobs } from "@/hooks/useEmployeeJobs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { MapPin } from "lucide-react";

export default function EmployeeJobs() {
  const { data: jobs = [], isLoading } = useEmployeeJobs();
  const upcoming = jobs.filter((j) => j.status !== "completed");
  const done = jobs.filter((j) => j.status === "completed");

  return (
    <EmployeeLayout>
      <h1 className="text-xl font-bold mb-4">My Jobs</h1>
      <Tabs defaultValue="upcoming">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="done">Completed ({done.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4 space-y-2">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> :
            upcoming.length === 0 ? <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No upcoming jobs assigned.</CardContent></Card> :
            upcoming.map((j) => <Row key={j.id} j={j} />)}
        </TabsContent>
        <TabsContent value="done" className="mt-4 space-y-2">
          {done.length === 0 ? <Card><CardContent className="py-6 text-center text-sm text-muted-foreground">No completed jobs yet.</CardContent></Card> :
            done.map((j) => <Row key={j.id} j={j} />)}
        </TabsContent>
      </Tabs>
    </EmployeeLayout>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Row({ j }: { j: any }) {
  return (
    <Link to={`/employee/jobs/${j.id}`}>
      <Card className="active:scale-[0.99]">
        <CardContent className="py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-muted-foreground">{j.jobNumber}</span>
            <Badge variant={j.status === "completed" ? "secondary" : "default"} className="text-[10px]">{j.status}</Badge>
          </div>
          <p className="font-semibold">{j.clientName || "Client"}</p>
          {j.clientAddress && <p className="text-xs text-muted-foreground flex items-start gap-1 mt-0.5"><MapPin className="w-3 h-3 mt-0.5 shrink-0" />{j.clientAddress}</p>}
          {j.scheduledDate && <p className="text-xs text-muted-foreground mt-1">{format(parseISO(j.scheduledDate), "EEE d MMM yyyy")}</p>}
        </CardContent>
      </Card>
    </Link>
  );
}
