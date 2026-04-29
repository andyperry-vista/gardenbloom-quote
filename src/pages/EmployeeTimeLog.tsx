import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useEmployees } from "@/hooks/useEmployees";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, FileText } from "lucide-react";

type PresetKey = "this_week" | "last_week" | "this_fortnight" | "last_fortnight" | "this_month" | "last_month" | "custom";

function startOfWeek(d: Date): Date {
  // Monday-start week
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0 Sun..6 Sat
  const diff = (day + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function fmt(d: Date) { return d.toISOString().slice(0, 10); }
function fmtDisplay(s: string) {
  const d = new Date(s + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

function rangeForPreset(preset: PresetKey, custom: { from: string; to: string }): { from: string; to: string } {
  const now = new Date();
  if (preset === "this_week") {
    const s = startOfWeek(now);
    return { from: fmt(s), to: fmt(addDays(s, 6)) };
  }
  if (preset === "last_week") {
    const s = addDays(startOfWeek(now), -7);
    return { from: fmt(s), to: fmt(addDays(s, 6)) };
  }
  if (preset === "this_fortnight") {
    const s = startOfWeek(now);
    return { from: fmt(s), to: fmt(addDays(s, 13)) };
  }
  if (preset === "last_fortnight") {
    const s = addDays(startOfWeek(now), -14);
    return { from: fmt(s), to: fmt(addDays(s, 13)) };
  }
  if (preset === "this_month") {
    return { from: fmt(startOfMonth(now)), to: fmt(endOfMonth(now)) };
  }
  if (preset === "last_month") {
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { from: fmt(startOfMonth(lm)), to: fmt(endOfMonth(lm)) };
  }
  return custom;
}

interface Entry {
  id: string;
  workDate: string;
  hours: number;
  rate: number;
  notes: string;
  confirmed: boolean;
  payslipId: string | null;
  jobId: string | null;
  jobNumber: string | null;
  jobNotes: string | null;
  clientName: string | null;
  clientAddress: string | null;
}

export default function EmployeeTimeLog() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { employees } = useEmployees();
  const employee = employees.find((e) => e.id === id);

  const initialPreset = (searchParams.get("preset") as PresetKey) || "this_fortnight";
  const [preset, setPreset] = useState<PresetKey>(initialPreset);
  const [customFrom, setCustomFrom] = useState(searchParams.get("from") || fmt(addDays(new Date(), -14)));
  const [customTo, setCustomTo] = useState(searchParams.get("to") || fmt(new Date()));

  const range = useMemo(() => rangeForPreset(preset, { from: customFrom, to: customTo }), [preset, customFrom, customTo]);

  const { data: entries = [], isLoading } = useQuery<Entry[]>({
    queryKey: ["employee-time-log", id, range.from, range.to],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("id, work_date, hours, rate, notes, confirmed, payslip_id, job_id, jobs(job_number, notes, clients(name, address))")
        .eq("employee_id", id!)
        .gte("work_date", range.from)
        .lte("work_date", range.to)
        .order("work_date", { ascending: false });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any[]).map((r) => ({
        id: r.id,
        workDate: r.work_date,
        hours: Number(r.hours ?? 0),
        rate: Number(r.rate ?? 0),
        notes: r.notes ?? "",
        confirmed: !!r.confirmed,
        payslipId: r.payslip_id,
        jobId: r.job_id,
        jobNumber: r.jobs?.job_number ?? null,
        jobNotes: r.jobs?.notes ?? null,
        clientName: r.jobs?.clients?.name ?? null,
        clientAddress: r.jobs?.clients?.address ?? null,
      }));
    },
  });

  const totals = useMemo(() => {
    let hours = 0, gross = 0, confirmed = 0, paid = 0;
    for (const e of entries) {
      hours += e.hours;
      gross += e.hours * e.rate;
      if (e.confirmed) confirmed += e.hours;
      if (e.payslipId) paid += e.hours;
    }
    return { hours, gross, confirmed, paid, unconfirmed: hours - confirmed };
  }, [entries]);

  const byJob = useMemo(() => {
    const map = new Map<string, { jobId: string | null; jobNumber: string | null; clientName: string | null; clientAddress: string | null; hours: number; gross: number; entries: Entry[] }>();
    for (const e of entries) {
      const key = e.jobId || "__unassigned__";
      const cur = map.get(key) ?? { jobId: e.jobId, jobNumber: e.jobNumber, clientName: e.clientName, clientAddress: e.clientAddress, hours: 0, gross: 0, entries: [] };
      cur.hours += e.hours;
      cur.gross += e.hours * e.rate;
      cur.entries.push(e);
      map.set(key, cur);
    }
    return [...map.values()].sort((a, b) => b.hours - a.hours);
  }, [entries]);

  function applyPreset(p: PresetKey) {
    setPreset(p);
    const params: Record<string, string> = { preset: p };
    if (p === "custom") { params.from = customFrom; params.to = customTo; }
    setSearchParams(params, { replace: true });
  }

  function applyCustom() {
    setSearchParams({ preset: "custom", from: customFrom, to: customTo }, { replace: true });
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/admin/employees"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
          <div>
            <h1 className="font-display text-3xl flex items-center gap-2"><Clock className="w-7 h-7" /> Time Log</h1>
            <p className="text-muted-foreground">{employee?.name ?? "Employee"} — hours by pay period and job</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6 grid gap-3 sm:grid-cols-[200px_1fr_auto] items-end">
            <div>
              <Label>Period</Label>
              <Select value={preset} onValueChange={(v) => applyPreset(v as PresetKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_week">This week</SelectItem>
                  <SelectItem value="last_week">Last week</SelectItem>
                  <SelectItem value="this_fortnight">This fortnight</SelectItem>
                  <SelectItem value="last_fortnight">Last fortnight</SelectItem>
                  <SelectItem value="this_month">This month</SelectItem>
                  <SelectItem value="last_month">Last month</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {preset === "custom" ? (
              <div className="grid grid-cols-2 gap-3">
                <div><Label>From</Label><Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} /></div>
                <div><Label>To</Label><Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} /></div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                {fmtDisplay(range.from)} → {fmtDisplay(range.to)}
              </div>
            )}
            {preset === "custom" && (
              <Button onClick={applyCustom}>Apply</Button>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-4">
          <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Total hours</div><div className="text-2xl font-semibold">{totals.hours.toFixed(2)}</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Gross pay (est.)</div><div className="text-2xl font-semibold">${totals.gross.toFixed(2)}</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Unconfirmed</div><div className="text-2xl font-semibold">{totals.unconfirmed.toFixed(2)}h</div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="text-xs text-muted-foreground">Already on payslip</div><div className="text-2xl font-semibold">{totals.paid.toFixed(2)}h</div></CardContent></Card>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No time entries in this period.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {byJob.map((g) => (
              <Card key={g.jobId ?? "unassigned"}>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {g.jobId ? (
                        <Link to={`/admin/jobs/${g.jobId}`} className="hover:underline">
                          {g.jobNumber || "Job"}{g.clientName ? ` · ${g.clientName}` : ""}
                        </Link>
                      ) : (
                        <span>Unassigned time</span>
                      )}
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{g.hours.toFixed(2)}h</span> · ${g.gross.toFixed(2)}
                    </div>
                  </div>
                  {g.clientAddress && <p className="text-xs text-muted-foreground">{g.clientAddress}</p>}
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {g.entries.map((e) => (
                      <div key={e.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium">{fmtDisplay(e.workDate)}</span>
                          {e.confirmed ? (
                            <Badge variant="secondary" className="text-[10px]"><CheckCircle2 className="w-3 h-3 mr-1" />Confirmed</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]"><AlertCircle className="w-3 h-3 mr-1" />Unconfirmed</Badge>
                          )}
                          {e.payslipId && (
                            <Badge variant="default" className="text-[10px]"><FileText className="w-3 h-3 mr-1" />On payslip</Badge>
                          )}
                          {e.notes && <span className="text-muted-foreground truncate">— {e.notes}</span>}
                        </div>
                        <div className="text-muted-foreground whitespace-nowrap">
                          {e.hours.toFixed(2)}h × ${e.rate.toFixed(2)} = <span className="text-foreground font-medium">${(e.hours * e.rate).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
