import { Link } from "react-router-dom";
import { useQuotes } from "@/hooks/useQuotes";
import { useJobs } from "@/hooks/useJobs";
import { useInvoices } from "@/hooks/useInvoices";
import { useQuoteRequests } from "@/hooks/useQuoteRequests";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FilePlus, DollarSign, FileText, TrendingUp, Briefcase, AlertTriangle, CalendarDays, Inbox, CheckCircle, Eye } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  accepted: "bg-success/10 text-success",
  declined: "bg-destructive/10 text-destructive",
};

export default function Dashboard() {
  const { quotes } = useQuotes();
  const { jobs } = useJobs();
  const { invoices } = useInvoices();

  const totalQuoted = quotes.reduce((sum, q) => sum + q.grandTotal, 0);
  const acceptedTotal = quotes.filter((q) => q.status === "accepted").reduce((sum, q) => sum + q.grandTotal, 0);
  const overdueInvoices = invoices.filter((i) => i.status === "overdue" || (i.status !== "paid" && i.dueDate && new Date(i.dueDate) < new Date()));
  const upcomingJobs = jobs.filter((j) => j.status === "scheduled" || j.status === "in_progress");
  const paidTotal = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.totalWithGst, 0);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl text-foreground">Mayura</h1>
            <p className="text-muted-foreground mt-1">Garden Service — Dashboard</p>
          </div>
          <Link to="/admin/quotes/new">
            <Button><FilePlus className="w-4 h-4 mr-2" /> New Quote</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quotes</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{quotes.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Quoted</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">${totalQuoted.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{upcomingJobs.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (Paid)</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">${paidTotal.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</div></CardContent>
          </Card>
        </div>

        {overdueInvoices.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /> Overdue Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdueInvoices.map((inv) => (
                  <Link key={inv.id} to={`/admin/invoices/${inv.id}`} className="flex justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{inv.invoiceNumber} — {inv.client?.name}</span>
                    <span className="text-destructive font-semibold">${inv.totalWithGst.toFixed(2)}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {upcomingJobs.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Upcoming Jobs</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingJobs.slice(0, 5).map((job) => (
                  <Link key={job.id} to={`/admin/jobs/${job.id}`} className="flex justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <span className="font-medium">{job.jobNumber}</span>
                      <span className="text-sm text-muted-foreground ml-2">{job.client?.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString("en-AU") : "Unscheduled"}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Recent Quotes</CardTitle></CardHeader>
          <CardContent>
            {quotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No quotes yet. Create your first garden styling quote!</p>
                <Link to="/admin/quotes/new"><Button><FilePlus className="w-4 h-4 mr-2" /> Create Quote</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.slice(0, 10).map((quote) => (
                  <Link key={quote.id} to={`/admin/quotes/${quote.id}`} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium">{quote.client.name}</p>
                      <p className="text-sm text-muted-foreground">{quote.client.address}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">${quote.grandTotal.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</span>
                      <Badge className={statusColors[quote.status]} variant="secondary">{quote.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
