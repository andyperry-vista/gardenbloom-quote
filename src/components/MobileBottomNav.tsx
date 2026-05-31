import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Briefcase, Mail, IdCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuoteRequests } from "@/hooks/useQuoteRequests";
import { useJobs } from "@/hooks/useJobs";

type TabKey = "card" | "quotes" | "jobs" | "emails" | "dashboard";

const tabs: { key: TabKey; label: string; icon: typeof LayoutDashboard; path: string }[] = [
  { key: "card", label: "Card", icon: IdCard, path: "/admin/card" },
  { key: "quotes", label: "Quotes", icon: FileText, path: "/admin/quote-requests" },
  { key: "jobs", label: "Jobs", icon: Briefcase, path: "/admin/jobs" },
  { key: "emails", label: "Emails", icon: Mail, path: "/admin/emails" },
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const { requests } = useQuoteRequests();
  const { jobs } = useJobs();

  const pendingQuotes = requests.filter((r) => r.status === "new").length;
  const pendingJobs = jobs.filter((j) => j.status === "scheduled" || j.status === "in_progress").length;

  const badgeFor: Partial<Record<TabKey, number>> = {
    quotes: pendingQuotes,
    jobs: pendingJobs,
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-bottom md:hidden">
      <div className="flex items-stretch justify-around h-16">
        {tabs.map((tab) => {
          const active =
            pathname === tab.path || pathname.startsWith(`${tab.path}/`);
          const count = badgeFor[tab.key] ?? 0;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-current={active ? "page" : undefined}
              aria-label={count > 0 ? `${tab.label} (${count} pending)` : tab.label}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 flex-1 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-10 rounded-b-full bg-primary"
                />
              )}
              <span
                className={cn(
                  "relative flex items-center justify-center rounded-full transition-all",
                  active ? "bg-primary/10 px-3 py-1" : "px-2 py-1"
                )}
              >
                <tab.icon className={cn("w-5 h-5", active ? "text-primary" : "")} />
                {count > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold leading-[18px] text-center shadow-sm"
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </span>
              <span className={cn(active && "font-semibold")}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
