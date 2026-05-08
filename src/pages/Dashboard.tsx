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
  const { requests: quoteRequests, updateStatus } = useQuoteRequests();

  const newRequests = quoteRequests.filter((r) => r.status === "new");
  const totalQuoted = quotes.reduce((sum, q) => sum + q.grandTotal, 0);
  const acceptedTotal = quotes.filter((q) => q.status === "accepted").reduce((sum, q) => sum + q.grandTotal, 0);
  const overdueInvoices = invoices.filter((i) => i.status === "overdue" || (i.status !== "paid" && i.dueDate && new Date(i.dueDate) < new Date()));
  const upcomingJobs = jobs.filter((j) => j.status === "scheduled" || j.status === "in_progress");
  const paidTotal = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.totalWithGst, 0);

  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-foreground">Mayura</h1>
            <p className="text-muted-foreground mt-1">Garden Service — Dashboard</p>
          </div>
          <Link to="/admin/quotes/new" className="sm:w-auto">
            <Button className="w-full sm:w-auto"><FilePlus className="w-4 h-4 mr-2" /> New Quote</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Link to="/admin/quote-requests?status=new" aria-label="View new quote requests">
            <Card className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Quotes</CardTitle>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{quotes.length}</div></CardContent>
            </Card>
          </Link>
          <Link to="/admin/quote-requests" aria-label="View all quote requests">
            <Card className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Quoted</CardTitle>
                <DollarSign className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">${totalQuoted.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</div></CardContent>
            </Card>
          </Link>
          <Link to="/admin/jobs?status=in_progress" aria-label="View in-progress jobs">
            <Card className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
                <Briefcase className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{upcomingJobs.length}</div></CardContent>
            </Card>
          </Link>
          <Link to="/admin/invoices?status=paid" aria-label="View paid invoices">
            <Card className="hover:shadow-md hover:border-primary/40 transition-all cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (Paid)</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">${paidTotal.toLocaleString("en-AU", { minimumFractionDigits: 2 })}</div></CardContent>
            </Card>
          </Link>
        </div>

        {newRequests.length > 0 && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Inbox className="w-4 h-4" /> New Quote Requests
                <Badge variant="secondary" className="ml-2">{newRequests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {newRequests.map((req) => (
                  <div key={req.id} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium">{req.name}</span>
                        <span className="text-sm text-muted-foreground break-all">{req.email}</span>
                        {req.phone && <span className="text-sm text-muted-foreground">· {req.phone}</span>}
                      </div>
                      {req.address && <p className="text-sm text-muted-foreground">{req.address}</p>}
                      {req.message && <p className="text-sm text-foreground/80 line-clamp-2">{req.message}</p>}
                      {req.photoUrls && req.photoUrls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {req.photoUrls.slice(0, 4).map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="relative block w-14 h-14 rounded-md overflow-hidden border hover:ring-2 hover:ring-primary transition-all">
                              <img src={url} alt={`Garden photo ${i + 1}`} className="w-full h-full object-cover" />
                            </a>
                          ))}
                          {req.photoUrls.length > 4 && (
                            <div className="w-14 h-14 rounded-md border flex items-center justify-center bg-muted text-xs text-muted-foreground font-medium">
                              +{req.photoUrls.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">{new Date(req.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <div className="flex gap-2 sm:ml-4 sm:shrink-0 w-full sm:w-auto">
                      <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => updateStatus(req.id, "contacted")}>
                        <Eye className="w-3 h-3 mr-1" /> Contacted
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 sm:flex-none" onClick={() => updateStatus(req.id, "converted")}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Done
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {overdueInvoices.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /> Overdue Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdueInvoices.map((inv) => (
                  <Link key={inv.id} to={`/admin/invoices/${inv.id}`} className="flex flex-col sm:flex-row sm:justify-between gap-1 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium break-words">{inv.invoiceNumber} — {inv.client?.name}</span>
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
                  <Link key={job.id} to={`/admin/jobs/${job.id}`} className="flex flex-col sm:flex-row sm:justify-between gap-1 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
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
                  <Link key={quote.id} to={`/admin/quotes/${quote.id}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium">{quote.client.name}</p>
                      <p className="text-sm text-muted-foreground break-words">{quote.client.address}</p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
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
