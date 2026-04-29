import { useState } from "react";
import { useEmployees } from "@/hooks/useEmployees";
import { useJobEmployees, useTimeEntries } from "@/hooks/usePayroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Trash2, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { effectiveHourlyRate } from "@/lib/employeeRate";

export default function JobEmployeesPanel({ jobId }: { jobId: string }) {
  const { employees } = useEmployees();
  const activeEmployees = employees.filter((e) => e.active);
  const { jobEmployees, assignEmployee, updateAssignment, removeAssignment } = useJobEmployees(jobId);
  const { entries, addEntry, updateEntry, deleteEntry } = useTimeEntries({ jobId });

  const [selectedEmp, setSelectedEmp] = useState("");
  const [estHours, setEstHours] = useState(0);

  const [logEmp, setLogEmp] = useState("");
  const [logDate, setLogDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [logHours, setLogHours] = useState(0);
  const [logNotes, setLogNotes] = useState("");

  const handleAssign = async () => {
    if (!selectedEmp) return;
    const emp = employees.find((e) => e.id === selectedEmp);
    if (!emp) return;
    if (jobEmployees.some((j) => j.employeeId === selectedEmp)) {
      toast.error("Already assigned");
      return;
    }
    try {
      await assignEmployee({ jobId, employeeId: selectedEmp, estimatedHours: estHours, rate: effectiveHourlyRate(emp) });
      toast.success(`${emp.name} assigned`);
      setSelectedEmp(""); setEstHours(0);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleLogTime = async () => {
    if (!logEmp || logHours <= 0) { toast.error("Pick an employee and hours"); return; }
    const emp = employees.find((e) => e.id === logEmp);
    if (!emp) return;
    try {
      await addEntry({
        employeeId: logEmp, jobId, workDate: logDate,
        hours: logHours, rate: effectiveHourlyRate(emp), notes: logNotes,
        confirmed: false,
      });
      toast.success("Time entry added");
      setLogEmp(""); setLogHours(0); setLogNotes("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const totalActual = entries.reduce((s, e) => s + e.hours, 0);
  const totalCost = entries.reduce((s, e) => s + e.hours * e.rate, 0);
  const totalEstimated = jobEmployees.reduce((s, j) => s + j.estimatedHours, 0);
  const totalEstimatedCost = jobEmployees.reduce((s, j) => s + j.estimatedHours * j.rateAtAssignment, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><UserPlus className="w-5 h-5" /> Assigned Employees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobEmployees.length === 0 ? (
            <p className="text-sm text-muted-foreground">No employees assigned to this job yet.</p>
          ) : (
            <div className="space-y-2">
              {jobEmployees.map((je) => (
                <div key={je.id} className="flex flex-wrap items-center gap-3 border rounded-md p-3">
                  <div className="flex-1 min-w-[140px]">
                    <p className="font-medium">{je.employeeName}</p>
                    <p className="text-xs text-muted-foreground">${je.rateAtAssignment.toFixed(2)}/hr</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Label className="text-xs">Est. hrs</Label>
                    <Input
                      type="number" step="0.25"
                      className="w-24"
                      value={je.estimatedHours}
                      onChange={(e) => updateAssignment(je.id, { estimatedHours: Number(e.target.value) })}
                    />
                  </div>
                  <span className="text-sm font-medium">= ${(je.estimatedHours * je.rateAtAssignment).toFixed(2)}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeAssignment(je.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
              <p className="text-right text-sm pt-2">
                Estimated labour: <span className="font-medium">{totalEstimated.toFixed(2)} hrs · ${totalEstimatedCost.toFixed(2)}</span>
              </p>
            </div>
          )}
          <div className="flex flex-wrap items-end gap-2 border-t pt-3">
            <div className="flex-1 min-w-[180px]">
              <Label>Employee</Label>
              <Select value={selectedEmp} onValueChange={setSelectedEmp}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((e) => <SelectItem key={e.id} value={e.id}>{e.name} (${effectiveHourlyRate(e).toFixed(2)}/hr)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-28">
              <Label>Est. hrs</Label>
              <Input type="number" step="0.25" value={estHours || ""} onChange={(e) => setEstHours(Number(e.target.value))} />
            </div>
            <Button onClick={handleAssign} disabled={!selectedEmp}><Plus className="w-4 h-4 mr-1" /> Assign</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg"><Clock className="w-5 h-5" /> Time Entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hours logged yet.</p>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center gap-3 border rounded-md p-3">
                  <div className="flex-1 min-w-[160px]">
                    <p className="font-medium text-sm">{e.employeeName}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(e.workDate), "d MMM yyyy")} · ${e.rate.toFixed(2)}/hr</p>
                    {e.notes && <p className="text-xs text-muted-foreground italic mt-1">{e.notes}</p>}
                  </div>
                  <Input
                    type="number" step="0.25"
                    className="w-24"
                    value={e.hours}
                    onChange={(ev) => updateEntry(e.id, { hours: Number(ev.target.value) })}
                  />
                  <span className="text-sm font-medium w-20 text-right">${(e.hours * e.rate).toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <Switch checked={e.confirmed} onCheckedChange={(v) => updateEntry(e.id, { confirmed: v })} disabled={!!e.payslipId} />
                    <Label className="text-xs">{e.confirmed ? "Confirmed" : "Unconfirmed"}</Label>
                  </div>
                  {e.payslipId && <Badge variant="secondary">Paid</Badge>}
                  {!e.payslipId && (
                    <Button variant="ghost" size="icon" onClick={() => deleteEntry(e.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  )}
                </div>
              ))}
              <div className="text-right text-sm pt-2 border-t">
                Actual: <span className="font-medium">{totalActual.toFixed(2)} hrs</span> · Cost: <span className="font-medium">${totalCost.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div className="border-t pt-3 grid gap-2 sm:grid-cols-5 items-end">
            <div className="sm:col-span-2">
              <Label>Employee</Label>
              <Select value={logEmp} onValueChange={setLogEmp}>
                <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
                <SelectContent>
                  {(jobEmployees.length > 0 ? activeEmployees.filter((e) => jobEmployees.some((j) => j.employeeId === e.id)) : activeEmployees)
                    .map((e) => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date</Label>
              <Input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
            </div>
            <div>
              <Label>Hours</Label>
              <Input type="number" step="0.25" value={logHours || ""} onChange={(e) => setLogHours(Number(e.target.value))} />
            </div>
            <Button onClick={handleLogTime}><Plus className="w-4 h-4 mr-1" /> Log</Button>
            <div className="sm:col-span-5">
              <Input placeholder="Notes (optional)" value={logNotes} onChange={(e) => setLogNotes(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
