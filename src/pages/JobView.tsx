import { useParams, Link, useNavigate } from "react-router-dom";
import { useJobs } from "@/hooks/useJobs";
import { useInvoices } from "@/hooks/useInvoices";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { toast } from "sonner";
import { useState } from "react";
import { format, addDays } from "date-fns";

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/10 text-primary",
  in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success",
  invoiced: "bg-muted text-muted-foreground",
};

export default function JobView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { jobs, updateJob, deleteJob } = useJobs();
  const { createInvoice } = useInvoices();
  const job = jobs.find((j) => j.id === id);
  const [creating, setCreating] = useState(false);

  if (!job) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Job not found</p>
          <Link to="/admin/jobs"><Button variant="outline">Back to Jobs</Button></Link>
        </div>
      </AppLayout>
    );
  }

  const handleStatusChange = (status: string) => {
    const updates: any = { status };
    if (status === "completed") updates.completedDate = format(new Date(), "yyyy-MM-dd");
    updateJob(job.id, updates);
    toast.success(`Status updated to ${status.replace("_", " ")}`);
  };

  const handleCreateInvoice = async () => {
    if (!job.clientId || !job.quoteTotal) return;
    setCreating(true);
    try {
      const result = await createInvoice({
        jobId: job.id,
        clientId: job.clientId,
        amount: job.quoteTotal,
        dueDate: format(addDays(new Date(), 14), "yyyy-MM-dd"),
      });
      updateJob(job.id, { status: "invoiced" });
      toast.success(`Invoice ${result.invoice_number} created`);
      navigate(`/admin/invoices/${result.id}`);
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = () => {
    deleteJob(job.id);
    navigate("/admin/jobs");
    toast.success("Job deleted");
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/admin/jobs" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <Select value={job.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="destructive" size="icon" onClick={handleDelete}><Trash2 className="w-4 h-4" /></Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{job.jobNumber}</CardTitle>
              <Badge className={statusColors[job.status]} variant="secondary">{job.status.replace("_", " ")}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-muted-foreground text-xs">Client</Label>
                <p className="font-medium">{job.client?.name ?? "—"}</p>
                <p className="text-sm text-muted-foreground">{job.client?.address ?? ""}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Quote Value</Label>
                <p className="font-medium text-lg">${job.quoteTotal?.toFixed(2) ?? "—"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Scheduled Date</Label>
                <Input
                  type="date"
                  value={job.scheduledDate ?? ""}
                  onChange={(e) => updateJob(job.id, { scheduledDate: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Completed Date</Label>
                <Input
                  type="date"
                  value={job.completedDate ?? ""}
                  onChange={(e) => updateJob(job.id, { completedDate: e.target.value })}
                />
              </div>
            </div>
            {job.quoteId && (
              <Link to={`/admin/quotes/${job.quoteId}`} className="text-sm text-primary hover:underline">View linked quote →</Link>
            )}
          </CardContent>
        </Card>

        {(job.status === "completed" || job.status === "in_progress") && (
          <div className="flex justify-end">
            <Button onClick={handleCreateInvoice} disabled={creating || !job.quoteTotal}>
              <FileText className="w-4 h-4 mr-2" />
              Generate Invoice
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
