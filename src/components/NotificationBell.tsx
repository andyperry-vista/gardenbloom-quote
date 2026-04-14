import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface ActivityItem {
  id: string;
  type: "quote_request" | "job" | "invoice";
  title: string;
  subtitle: string;
  time: string;
  read: boolean;
  link: string;
}

export default function NotificationBell() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [open, setOpen] = useState(false);

  const fetchActivity = async () => {
    const items: ActivityItem[] = [];

    // Fetch recent quote requests
    const { data: requests } = await supabase
      .from("quote_requests")
      .select("id, name, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    if (requests) {
      for (const r of requests) {
        items.push({
          id: `qr-${r.id}`,
          type: "quote_request",
          title: `Quote request from ${r.name}`,
          subtitle: r.status === "new" ? "New — awaiting response" : `Status: ${r.status}`,
          time: r.created_at,
          read: r.status !== "new",
          link: "/admin/quote-requests",
        });
      }
    }

    // Fetch recent jobs
    const { data: jobs } = await supabase
      .from("jobs")
      .select("id, job_number, status, updated_at, client_id, clients(name)")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (jobs) {
      for (const j of jobs) {
        const clientName = (j as any).clients?.name || "Unknown";
        items.push({
          id: `job-${j.id}`,
          type: "job",
          title: `${j.job_number} — ${clientName}`,
          subtitle: `Status: ${j.status}`,
          time: j.updated_at,
          read: true,
          link: `/admin/jobs/${j.id}`,
        });
      }
    }

    // Fetch recent invoices
    const { data: invoices } = await supabase
      .from("invoices")
      .select("id, invoice_number, status, updated_at, client_id, clients(name)")
      .order("updated_at", { ascending: false })
      .limit(5);

    if (invoices) {
      for (const inv of invoices) {
        const clientName = (inv as any).clients?.name || "Unknown";
        items.push({
          id: `inv-${inv.id}`,
          type: "invoice",
          title: `${inv.invoice_number} — ${clientName}`,
          subtitle: `Status: ${inv.status}`,
          time: inv.updated_at,
          read: inv.status !== "overdue",
          link: `/admin/invoices/${inv.id}`,
        });
      }
    }

    // Sort by time descending and take top 10
    items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setActivities(items.slice(0, 10));
  };

  useEffect(() => {
    fetchActivity();

    // Subscribe to realtime changes on quote_requests
    const channel = supabase
      .channel("notification-bell")
      .on("postgres_changes", { event: "*", schema: "public", table: "quote_requests" }, () => fetchActivity())
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => fetchActivity())
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => fetchActivity())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const unreadCount = activities.filter((a) => !a.read).length;

  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const typeIcon: Record<string, string> = {
    quote_request: "📩",
    job: "🔧",
    invoice: "📄",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition-colors">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-[400px] overflow-y-auto">
        <div className="px-4 py-3 border-b">
          <h4 className="text-sm font-semibold text-foreground">Recent Activity</h4>
        </div>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
        ) : (
          <div className="divide-y">
            {activities.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                onClick={() => setOpen(false)}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors ${!item.read ? "bg-primary/5" : ""}`}
              >
                <span className="text-base mt-0.5">{typeIcon[item.type]}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${!item.read ? "font-semibold text-foreground" : "text-foreground"}`}>
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-0.5">{formatTime(item.time)}</span>
              </Link>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
