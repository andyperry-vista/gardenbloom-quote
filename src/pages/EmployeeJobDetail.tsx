import EmployeeLayout from "@/components/EmployeeLayout";
import { useParams, Link } from "react-router-dom";
import { useEmployeeJobs } from "@/hooks/useEmployeeJobs";
import { useEmployeeSelf } from "@/hooks/useEmployeeSelf";
import { useTimeEntries } from "@/hooks/usePayroll";
import { effectiveHourlyRate } from "@/lib/employeeRate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, MapPin, Calendar, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { toast } from "sonner";

export default function EmployeeJobDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: jobs = [] } = useEmployeeJobs();
  const { data: self } = useEmployeeSelf();
  const job = jobs.find((j) => j.id === id);
  const { entries, addEntry, updateEntry, deleteEntry } = useTimeEntries({ jobId: id, employeeId: self?.id });

  const [hours, setHours] = useState(0);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  if (!job) {
    return (
      <EmployeeLayout>
        <Link to="/employee/jobs" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-4"><ChevronLeft className="w-4 h-4" /> Back</Link>
        <Card><CardContent className="py-8 text-center text-muted-foreground">Job not found or not assigned to you.</CardContent></Card>
      </EmployeeLayout>
    );
  }

  const myEntries = entries.filter((e) => e.employeeId === self?.id);
  const totalHours = myEntries.reduce((s, e) => s + e.hours, 0);

  const handleAdd = async () => {
    if (!self) return;
    if (hours <= 0) { toast.error("Enter hours worked"); return; }
    setSaving(true);
    try {
      await addEntry({
        employeeId: self.id,
        jobId: job.id,
        workDate: date,
        hours,
        rate: effectiveHourlyRate(self),
        notes,
        confirmed: true, // employee-confirmed by default
      });
      toast.success("Hours logged");
      setHours(0); setNotes("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSaving(false); }
  };

  return (
    <EmployeeLayout>
      <Link to="/employee/jobs" className="text-sm text-muted-foreground inline-flex items-center gap-1 mb-3"><ChevronLeft className="w-4 h-4" /> All jobs</Link>

      <Card className="mb-4">
        <CardContent className="py-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground">{job.jobNumber}</span>
            <Badge variant={job.status === "completed" ? "secondary" : "default"} className="text-[10px]">{job.status}</Badge>
          </div>
          <h1 className="text-xl font-bold">{job.clientName || "Client"}</h1>
          {job.clientAddress && <p className="text-sm text-muted-foreground flex items-start gap-1"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />{job.clientAddress}</p>}
          {job.scheduledDate && <p className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {format(parseISO(job.scheduledDate), "EEE d MMM yyyy")}</p>}
          {job.notes && <p className="text-sm border-t pt-2 mt-2 whitespace-pre-wrap">{job.notes}</p>}
          {job.estimatedHours > 0 && (
            <p className="text-xs text-muted-foreground pt-1">Estimated: {job.estimatedHours}h · Logged: {totalHours.toFixed(2)}h</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-3"><CardTitle className="text-base">Log hours</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11" />
            </div>
            <div>
              <Label className="text-xs">Hours</Label>
              <Input type="number" inputMode="decimal" step="0.25" value={hours || ""} onChange={(e) => setHours(Number(e.target.value))} className="h-11" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="What you worked on…" />
          </div>
          <Button onClick={handleAdd} disabled={saving} className="w-full h-11">
            <Plus className="w-4 h-4 mr-1" /> Add entry
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">My entries</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {myEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hours logged yet.</p>
          ) : myEntries.map((e) => (
            <div key={e.id} className="flex items-center gap-2 border rounded-lg p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{format(parseISO(e.workDate), "EEE d MMM")} · {e.hours}h</p>
                {e.notes && <p className="text-xs text-muted-foreground truncate">{e.notes}</p>}
                <div className="flex items-center gap-2 mt-1">
                  {e.payslipId ? (
                    <Badge variant="secondary" className="text-[10px]">Paid</Badge>
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateEntry(e.id, { confirmed: !e.confirmed })}
                      className="inline-flex items-center gap-1 text-xs"
                    >
                      <Switch checked={e.confirmed} className="scale-75" />
                      <span className="text-muted-foreground">{e.confirmed ? "Confirmed" : "Tap to confirm"}</span>
                      {e.confirmed && <CheckCircle2 className="w-3 h-3 text-primary" />}
                    </button>
                  )}
                </div>
              </div>
              {!e.payslipId && (
                <Button variant="ghost" size="icon" onClick={() => deleteEntry(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </EmployeeLayout>
  );
}
