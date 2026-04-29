import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useEmployees } from "@/hooks/useEmployees";
import { useTimeEntries, usePayslips } from "@/hooks/usePayroll";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Download, FileText, Trash2, Briefcase, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { estimatePAYG, inferPayPeriod } from "@/lib/payg";
import { generatePayslipPdf } from "@/lib/generatePayslipPdf";

export default function Payroll() {
  const [params, setParams] = useSearchParams();
  const empParam = params.get("employee") ?? "";
  const { employees } = useEmployees();
  const [employeeId, setEmployeeId] = useState(empParam);
  const employee = employees.find((e) => e.id === employeeId);

  const today = new Date();
  const [periodStart, setPeriodStart] = useState(format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
  const [periodEnd, setPeriodEnd] = useState(format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"));
  const [mode, setMode] = useState<"period" | "job">("period");
  const [jobFilter, setJobFilter] = useState<string>("");

  // CSV export range (independent of payslip generation period)
  const [exportFrom, setExportFrom] = useState(format(startOfMonth(today), "yyyy-MM-dd"));
  const [exportTo, setExportTo] = useState(format(endOfMonth(today), "yyyy-MM-dd"));

  const { entries: empEntries } = useTimeEntries({ employeeId: employeeId || undefined });
  const { entries: allEntries } = useTimeEntries();
  const { payslips, createPayslip, deletePayslip, updatePayslip } = usePayslips(employeeId || undefined);

  const handleExportCsv = () => {
    if (!exportFrom || !exportTo || exportFrom > exportTo) {
      toast.error("Pick a valid date range");
      return;
    }
    const inRange = allEntries.filter((e) => e.confirmed && e.workDate >= exportFrom && e.workDate <= exportTo);
    if (inRange.length === 0) {
      toast.error("No confirmed time entries in that range");
      return;
    }
    const period = inferPayPeriod(exportFrom, exportTo);
    // Aggregate per employee
    const byEmp = new Map<string, { hours: number; gross: number }>();
    for (const e of inRange) {
      const cur = byEmp.get(e.employeeId) ?? { hours: 0, gross: 0 };
      cur.hours += e.hours;
      cur.gross += e.hours * e.rate;
      byEmp.set(e.employeeId, cur);
    }
    const escape = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = [
      "Employee", "Email", "Pay Basis", "Hours", "Gross Wages ($)",
      "PAYG Estimate ($)", "Net ($)", "Super Rate (%)", "Super ($)", "Super Fund", "Member #", "BSB", "Account",
    ];
    const rows: string[][] = [];
    let totHours = 0, totGross = 0, totTax = 0, totSuper = 0;
    for (const [empId, agg] of byEmp.entries()) {
      const emp = employees.find((x) => x.id === empId);
      if (!emp) continue;
      const tax = estimatePAYG(agg.gross, period, true);
      const sup = agg.gross * (emp.superRate / 100);
      const net = agg.gross - tax;
      totHours += agg.hours; totGross += agg.gross; totTax += tax; totSuper += sup;
      rows.push([
        emp.name, emp.email, emp.payBasis,
        agg.hours.toFixed(2), agg.gross.toFixed(2),
        tax.toFixed(2), net.toFixed(2),
        emp.superRate.toFixed(2), sup.toFixed(2),
        emp.superFund, emp.superMemberNumber, emp.bsb, emp.accountNumber,
      ].map(escape) as string[]);
    }
    rows.sort((a, b) => a[0].localeCompare(b[0]));
    rows.push([
      "TOTAL", "", "",
      totHours.toFixed(2), totGross.toFixed(2),
      totTax.toFixed(2), (totGross - totTax).toFixed(2),
      "", totSuper.toFixed(2), "", "", "", "",
    ].map(escape) as string[]);

    const meta = `Payroll Summary,${exportFrom} to ${exportTo},Period: ${period},Generated: ${format(new Date(), "yyyy-MM-dd HH:mm")}\n`;
    const csv = meta + headers.map(escape).join(",") + "\n" + rows.map((r) => r.join(",")).join("\n") + "\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll-summary_${exportFrom}_to_${exportTo}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${byEmp.size} employee${byEmp.size === 1 ? "" : "s"}`);
  };

  // Eligible entries: confirmed, unpaid, in range (or matching job)
  const eligibleEntries = useMemo(() => {
    if (!employeeId) return [];
    return empEntries.filter((e) => {
      if (!e.confirmed || e.payslipId) return false;
      if (mode === "job") return jobFilter && e.jobId === jobFilter;
      return e.workDate >= periodStart && e.workDate <= periodEnd;
    });
  }, [empEntries, employeeId, mode, periodStart, periodEnd, jobFilter]);

  // Group by job for line items
  const linesByJob = useMemo(() => {
    const map = new Map<string, { jobId: string | null; jobNumber: string; hours: number; rate: number; amount: number; ids: string[] }>();
    for (const e of eligibleEntries) {
      const key = e.jobId ?? "_none";
      const cur = map.get(key) ?? { jobId: e.jobId, jobNumber: e.jobNumber ?? "Unassigned", hours: 0, rate: e.rate, amount: 0, ids: [] };
      cur.hours += e.hours;
      cur.amount += e.hours * e.rate;
      cur.ids.push(e.id);
      map.set(key, cur);
    }
    return Array.from(map.values());
  }, [eligibleEntries]);

  const totals = useMemo(() => {
    const hours = eligibleEntries.reduce((s, e) => s + e.hours, 0);
    const gross = eligibleEntries.reduce((s, e) => s + e.hours * e.rate, 0);
    const period = mode === "job" ? "weekly" : inferPayPeriod(periodStart, periodEnd);
    const tax = estimatePAYG(gross, period, true);
    const net = gross - tax;
    const superAmount = employee ? gross * (employee.superRate / 100) : 0;
    return { hours, gross, tax, net, superAmount };
  }, [eligibleEntries, mode, periodStart, periodEnd, employee]);

  // YTD = sum of issued payslips this financial year + current
  const ytd = useMemo(() => {
    const fyStart = today.getMonth() >= 6
      ? new Date(today.getFullYear(), 6, 1)
      : new Date(today.getFullYear() - 1, 6, 1);
    const fyStartStr = format(fyStart, "yyyy-MM-dd");
    const prior = payslips.filter((p) => p.status !== "draft" && p.periodEnd >= fyStartStr);
    return {
      gross: prior.reduce((s, p) => s + p.gross, 0) + totals.gross,
      tax: prior.reduce((s, p) => s + p.taxWithheld, 0) + totals.tax,
      super: prior.reduce((s, p) => s + p.superAmount, 0) + totals.superAmount,
    };
  }, [payslips, totals, today]);

  const availableJobs = useMemo(() => {
    const map = new Map<string, string>();
    empEntries.forEach((e) => { if (e.jobId && e.jobNumber) map.set(e.jobId, e.jobNumber); });
    return Array.from(map.entries()).map(([id, num]) => ({ id, num }));
  }, [empEntries]);

  const handleCreatePayslip = async () => {
    if (!employee) { toast.error("Select an employee"); return; }
    if (eligibleEntries.length === 0) { toast.error("No eligible time entries"); return; }
    try {
      const id = await createPayslip({
        employeeId: employee.id,
        periodStart: mode === "job" ? eligibleEntries.reduce((min, e) => e.workDate < min ? e.workDate : min, eligibleEntries[0].workDate) : periodStart,
        periodEnd: mode === "job" ? eligibleEntries.reduce((max, e) => e.workDate > max ? e.workDate : max, eligibleEntries[0].workDate) : periodEnd,
        jobId: mode === "job" ? jobFilter : null,
        hoursTotal: totals.hours,
        gross: totals.gross,
        taxWithheld: totals.tax,
        net: totals.net,
        superAmount: totals.superAmount,
        ytdGross: ytd.gross,
        ytdTax: ytd.tax,
        ytdSuper: ytd.super,
        status: "draft",
        lines: linesByJob.map((l) => ({
          jobId: l.jobId,
          description: `Job ${l.jobNumber}`,
          hours: l.hours,
          rate: l.rate,
          amount: l.amount,
        })),
        timeEntryIds: eligibleEntries.map((e) => e.id),
      });
      toast.success(`Payslip created (draft)`);
      // download immediately
      const ps = { ...payslips.find((p) => p.id === id) };
      if (!ps.id) {
        // fallback: build temp object
        await generatePayslipPdf({
          id, employeeId: employee.id, payslipNumber: "DRAFT",
          periodStart, periodEnd, jobId: null,
          hoursTotal: totals.hours, gross: totals.gross, taxWithheld: totals.tax,
          net: totals.net, superAmount: totals.superAmount,
          ytdGross: ytd.gross, ytdTax: ytd.tax, ytdSuper: ytd.super,
          status: "draft", notes: "", issuedAt: null, createdAt: new Date().toISOString(),
          lines: linesByJob.map((l) => ({ id: "", payslipId: id, jobId: l.jobId, description: `Job ${l.jobNumber}`, hours: l.hours, rate: l.rate, amount: l.amount })),
        }, employee);
      }
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const issuePayslip = (id: string) => {
    updatePayslip(id, { status: "issued", issuedAt: new Date().toISOString() });
    toast.success("Payslip marked as issued");
  };

  const downloadPayslip = async (psId: string) => {
    const ps = payslips.find((p) => p.id === psId);
    if (!ps || !employee) return;
    await generatePayslipPdf(ps, employee);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="font-display text-3xl flex items-center gap-2"><Calculator className="w-7 h-7" /> Payroll</h1>
            <p className="text-muted-foreground mt-1">Tally hours, calculate wages and super, generate payslips</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5" /> Export Payroll Summary (CSV)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
            <div><Label>From</Label><Input type="date" value={exportFrom} onChange={(e) => setExportFrom(e.target.value)} /></div>
            <div><Label>To</Label><Input type="date" value={exportTo} onChange={(e) => setExportTo(e.target.value)} /></div>
            <Button onClick={handleExportCsv}><Download className="w-4 h-4 mr-2" /> Download CSV</Button>
            <div className="sm:col-span-3 flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setExportFrom(format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")); setExportTo(format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")); }}>This week</Button>
              <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 7); setExportFrom(format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd")); setExportTo(format(endOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd")); }}>Last week</Button>
              <Button variant="ghost" size="sm" onClick={() => { setExportFrom(format(startOfMonth(today), "yyyy-MM-dd")); setExportTo(format(endOfMonth(today), "yyyy-MM-dd")); }}>This month</Button>
              <Button variant="ghost" size="sm" onClick={() => { const d = new Date(today.getFullYear(), today.getMonth() - 1, 1); setExportFrom(format(startOfMonth(d), "yyyy-MM-dd")); setExportTo(format(endOfMonth(d), "yyyy-MM-dd")); }}>Last month</Button>
              <span className="text-xs text-muted-foreground self-center ml-auto">Includes confirmed time entries only · PAYG estimated for the selected period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Employee</CardTitle></CardHeader>
          <CardContent>
            <Select value={employeeId} onValueChange={(v) => { setEmployeeId(v); setParams({ employee: v }); }}>
              <SelectTrigger className="max-w-md"><SelectValue placeholder="Select an employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name} — ${e.hourlyRate}/hr</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {employee && (
          <Tabs defaultValue="generate">
            <TabsList>
              <TabsTrigger value="generate">Generate Payslip</TabsTrigger>
              <TabsTrigger value="history">History ({payslips.length})</TabsTrigger>
              <TabsTrigger value="entries">Time Entries</TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Pay Period</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Button variant={mode === "period" ? "default" : "outline"} size="sm" onClick={() => setMode("period")}><CalIcon className="w-4 h-4 mr-1" /> Per Period</Button>
                    <Button variant={mode === "job" ? "default" : "outline"} size="sm" onClick={() => setMode("job")}><Briefcase className="w-4 h-4 mr-1" /> Per Job</Button>
                  </div>
                  {mode === "period" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><Label>From</Label><Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} /></div>
                      <div><Label>To</Label><Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} /></div>
                      <div className="sm:col-span-2 flex flex-wrap gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setPeriodStart(format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")); setPeriodEnd(format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd")); }}>This week</Button>
                        <Button variant="ghost" size="sm" onClick={() => { const d = new Date(); d.setDate(d.getDate() - 7); setPeriodStart(format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd")); setPeriodEnd(format(endOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd")); }}>Last week</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setPeriodStart(format(startOfMonth(today), "yyyy-MM-dd")); setPeriodEnd(format(endOfMonth(today), "yyyy-MM-dd")); }}>This month</Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label>Job</Label>
                      <Select value={jobFilter} onValueChange={setJobFilter}>
                        <SelectTrigger><SelectValue placeholder="Select a job" /></SelectTrigger>
                        <SelectContent>
                          {availableJobs.length === 0 && <SelectItem value="_none" disabled>No jobs with confirmed hours</SelectItem>}
                          {availableJobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.num}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Summary ({eligibleEntries.length} entries)</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {linesByJob.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No confirmed unpaid entries match.</p>
                  ) : (
                    <div className="space-y-2">
                      {linesByJob.map((l, i) => (
                        <div key={i} className="flex justify-between text-sm border-b pb-2">
                          <span>Job {l.jobNumber} · {l.hours.toFixed(2)} hrs @ ${l.rate.toFixed(2)}</span>
                          <span className="font-medium">${l.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1 text-right pt-2">
                    <p className="text-sm text-muted-foreground">Hours: <span className="font-medium text-foreground">{totals.hours.toFixed(2)}</span></p>
                    <p className="text-sm text-muted-foreground">Gross: <span className="font-medium text-foreground">${totals.gross.toFixed(2)}</span></p>
                    <p className="text-sm text-muted-foreground">PAYG (est.): <span className="font-medium text-destructive">−${totals.tax.toFixed(2)}</span></p>
                    <p className="text-base font-bold">Net: ${totals.net.toFixed(2)}</p>
                    <p className="text-sm text-accent">Super ({employee.superRate}%): ${totals.superAmount.toFixed(2)}</p>
                  </div>
                  <Button className="w-full" disabled={eligibleEntries.length === 0} onClick={handleCreatePayslip}>
                    <FileText className="w-4 h-4 mr-2" /> Create Payslip (Draft)
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-3">
              {payslips.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No payslips yet.</CardContent></Card>
              ) : payslips.map((p) => (
                <Card key={p.id}>
                  <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.payslipNumber}</span>
                        <Badge variant={p.status === "issued" ? "default" : "secondary"}>{p.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(p.periodStart), "d MMM")} – {format(new Date(p.periodEnd), "d MMM yyyy")} · {p.hoursTotal.toFixed(2)} hrs · Net ${p.net.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => downloadPayslip(p.id)}><Download className="w-4 h-4 mr-1" /> PDF</Button>
                      {p.status === "draft" && <Button size="sm" onClick={() => issuePayslip(p.id)}>Mark Issued</Button>}
                      <Button variant="destructive" size="icon" onClick={() => { if (confirm("Delete payslip?")) deletePayslip(p.id); }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="entries" className="space-y-3">
              {empEntries.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No time entries logged.</CardContent></Card>
              ) : empEntries.map((e) => (
                <Card key={e.id}>
                  <CardContent className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{format(new Date(e.workDate), "d MMM yyyy")}</span>
                        {e.jobNumber && <Badge variant="outline">{e.jobNumber}</Badge>}
                        <Badge variant={e.confirmed ? "default" : "secondary"}>{e.confirmed ? "Confirmed" : "Unconfirmed"}</Badge>
                        {e.payslipId && <Badge variant="secondary">Paid</Badge>}
                      </div>
                      <p className="text-muted-foreground">{e.hours.toFixed(2)} hrs @ ${e.rate.toFixed(2)} = ${(e.hours * e.rate).toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
