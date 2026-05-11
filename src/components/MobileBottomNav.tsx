import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Briefcase, Mail, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { label: "Quotes", icon: FileText, path: "/admin/quote-requests" },
  { label: "Jobs", icon: Briefcase, path: "/admin/jobs" },
  { label: "Emails", icon: Mail, path: "/admin/tools" },
  { label: "Clients", icon: Users, path: "/admin/clients" },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-bottom md:hidden">
      <div className="flex items-stretch justify-around h-16">
        {tabs.map((tab) => {
          const active =
            tab.path === "/admin"
              ? pathname === "/admin"
              : pathname === tab.path || pathname.startsWith(`${tab.path}/`);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              aria-current={active ? "page" : undefined}
              aria-label={tab.label}
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
                  "flex items-center justify-center rounded-full transition-all",
                  active ? "bg-primary/10 px-3 py-1" : "px-2 py-1"
                )}
              >
                <tab.icon className={cn("w-5 h-5", active ? "text-primary" : "")} />
              </span>
              <span className={cn(active && "font-semibold")}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
