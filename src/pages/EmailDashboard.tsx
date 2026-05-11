import { useEffect, useMemo, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  message_id: string | null;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
};
type Stats = { total: number; sent: number; failed: number; suppressed: number; pending: number };

const RANGE_OPTIONS = [
  { label: "Last 24 hours", value: "1" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
];

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  if (s === "sent") return "default";
  if (s === "dlq" || s === "failed" || s === "bounced") return "destructive";
  if (s === "suppressed" || s === "complained") return "secondary";
  return "outline";
}

export default function EmailDashboard() {
  const [rangeDays, setRangeDays] = useState("7");
  const [template, setTemplate] = useState<string>("__all__");
  const [status, setStatus] = useState<string>("__all__");
  const [rows, setRows] = useState<Row[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, sent: 0, failed: 0, suppressed: 0, pending: 0 });
  const [loading, setLoading] = useState(false);

  const startISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - Number(rangeDays));
    return d.toISOString();
  }, [rangeDays]);

  async function fetchData() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-email-log", {
        body: {
          start: startISO,
          template: template === "__all__" ? null : template,
          status: status === "__all__" ? null : status,
          limit: 100,
        },
      });
      if (error) throw error;
      setRows(data.rows ?? []);
      setStats(data.stats ?? { total: 0, sent: 0, failed: 0, suppressed: 0, pending: 0 });
      setTemplates(data.templates ?? []);
    } catch (e) {
      toast.error("Failed to load email log");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays, template, status]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Mail className="w-7 h-7 text-primary" /> Emails
            </h1>
            <p className="text-muted-foreground">Sent emails, deliveries, and failures</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="Sent" value={stats.sent} tone="success" />
          <StatCard label="Failed" value={stats.failed} tone="destructive" />
          <StatCard label="Suppressed" value={stats.suppressed} tone="muted" />
          <StatCard label="Pending" value={stats.pending} tone="muted" />
        </div>

        {/* Filters */}
        <Card className="p-4 flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Time range</label>
            <Select value={rangeDays} onValueChange={setRangeDays}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Template</label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All templates</SelectItem>
                {templates.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="dlq">Failed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
                <SelectItem value="suppressed">Suppressed</SelectItem>
                <SelectItem value="complained">Complained</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
                )}
                {!loading && rows.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No emails in this range.</TableCell></TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.template_name}</TableCell>
                    <TableCell className="text-sm">{r.recipient_email}</TableCell>
                    <TableCell><Badge variant={statusVariant(r.status)}>{r.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-destructive max-w-[280px] truncate" title={r.error_message ?? ""}>
                      {r.error_message ?? ""}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "success" | "destructive" | "muted" }) {
  const toneClass =
    tone === "success" ? "text-primary" :
    tone === "destructive" ? "text-destructive" :
    tone === "muted" ? "text-muted-foreground" : "text-foreground";
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
    </Card>
  );
}
