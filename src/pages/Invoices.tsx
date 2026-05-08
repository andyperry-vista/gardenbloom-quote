import { Link, useSearchParams } from "react-router-dom";
import { Loader2, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AppLayout from "@/components/AppLayout";

const statusColors: Record<string, string> = {
  unpaid: "bg-warning/10 text-warning",
  sent: "bg-primary/10 text-primary",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
] as const;

export default function Invoices() {
  const { invoices, isLoading } = useInvoices();
  const [searchParams, setSearchParams] = useSearchParams();
  const validStatuses = FILTERS.map((f) => f.value);
  const initial = searchParams.get("status");
  const [filter, setFilterState] = useState<string>(
    initial && validStatuses.includes(initial as typeof validStatuses[number]) ? initial : "all"
  );
  const setFilter = (next: string) => {
    setFilterState(next);
    const params = new URLSearchParams(searchParams);
    if (next === "all") params.delete("status");
    else params.set("status", next);
    setSearchParams(params, { replace: true });
  };

  const filtered = useMemo(
    () => (filter === "all" ? invoices : invoices.filter((i) => i.status === filter)),
    [invoices, filter]
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-4xl text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Track invoices and payments</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {FILTERS.map((f) => {
            const count = f.value === "all" ? invoices.length : invoices.filter((i) => i.status === f.value).length;
            return (
              <Button
                key={f.value}
                size="sm"
                variant={filter === f.value ? "default" : "outline"}
                onClick={() => setFilter(f.value)}
              >
                {f.label} <span className="ml-1 opacity-70">({count})</span>
              </Button>
            );
          })}
        </div>

        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto my-8" />
        ) : filtered.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <p className="text-muted-foreground">
                {invoices.length === 0
                  ? "No invoices yet. Generate one from a completed job."
                  : "No invoices match this filter."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {filter === "all" ? "All Invoices" : FILTERS.find((f) => f.value === filter)?.label} ({filtered.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filtered.map((inv) => (
                  <Link
                    key={inv.id}
                    to={`/admin/invoices/${inv.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{inv.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">{inv.client?.name ?? "Unknown"} {inv.job ? `• ${inv.job.job_number}` : ""}</p>
                      {inv.dueDate && <p className="text-xs text-muted-foreground">Due: {new Date(inv.dueDate).toLocaleDateString("en-AU")}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">${inv.totalWithGst.toFixed(2)}</span>
                      <Badge className={statusColors[inv.status]} variant="secondary">{inv.status}</Badge>
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
