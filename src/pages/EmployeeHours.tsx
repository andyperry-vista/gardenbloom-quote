import EmployeeLayout from "@/components/EmployeeLayout";
import { useEmployeeSelf } from "@/hooks/useEmployeeSelf";
import { useTimeEntries } from "@/hooks/usePayroll";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";

export default function EmployeeHours() {
  const { data: self } = useEmployeeSelf();
  const { entries } = useTimeEntries({ employeeId: self?.id });

  const now = new Date();
  const wkStart = startOfWeek(now, { weekStartsOn: 1 });
  const wkEnd = endOfWeek(now, { weekStartsOn: 1 });
  const thisWeek = entries.filter((e) => isWithinInterval(parseISO(e.workDate), { start: wkStart, end: wkEnd }));

  const weekHours = thisWeek.reduce((s, e) => s + e.hours, 0);
  const weekPay = thisWeek.reduce((s, e) => s + e.hours * e.rate, 0);
  const unconfirmed = entries.filter((e) => !e.confirmed && !e.payslipId).length;

  return (
    <EmployeeLayout>
      <h1 className="text-xl font-bold mb-4">My Hours</h1>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">This week</p>
            <p className="text-2xl font-bold">{weekHours.toFixed(2)}h</p>
            <p className="text-xs text-muted-foreground">${weekPay.toFixed(2)} gross</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">To confirm</p>
            <p className="text-2xl font-bold">{unconfirmed}</p>
            <p className="text-xs text-muted-foreground">entries pending</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Recent entries</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hours logged yet. Open a job to add some.</p>
          ) : entries.slice(0, 30).map((e) => (
            <div key={e.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{format(parseISO(e.workDate), "EEE d MMM")} · {e.hours}h</p>
                <p className="text-xs text-muted-foreground truncate">
                  {e.jobNumber || "—"} · ${(e.hours * e.rate).toFixed(2)}
                </p>
              </div>
              {e.payslipId ? <Badge variant="secondary" className="text-[10px]">Paid</Badge>
                : e.confirmed ? <Badge className="text-[10px]">Confirmed</Badge>
                : <Badge variant="outline" className="text-[10px]">Pending</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>
    </EmployeeLayout>
  );
}
