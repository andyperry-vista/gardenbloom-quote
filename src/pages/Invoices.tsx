import { Link } from "react-router-dom";
import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/components/AppLayout";

const statusColors: Record<string, string> = {
  unpaid: "bg-warning/10 text-warning",
  sent: "bg-primary/10 text-primary",
  paid: "bg-success/10 text-success",
  overdue: "bg-destructive/10 text-destructive",
};

export default function Invoices() {
  const { invoices, isLoading } = useInvoices();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-4xl text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Track invoices and payments</p>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : invoices.length === 0 ? (
          <Card className="py-16 text-center">
            <CardContent>
              <p className="text-muted-foreground">No invoices yet. Generate one from a completed job.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>All Invoices</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invoices.map((inv) => (
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
