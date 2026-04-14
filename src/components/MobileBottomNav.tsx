import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Briefcase, Receipt, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Home", icon: LayoutDashboard, path: "/admin" },
  { label: "Quotes", icon: FileText, path: "/admin/quote-requests" },
  { label: "Jobs", icon: Briefcase, path: "/admin/jobs" },
  { label: "Invoices", icon: Receipt, path: "/admin/invoices" },
  { label: "Clients", icon: Users, path: "/admin/clients" },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-bottom md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = pathname === tab.path || (tab.path !== "/admin" && pathname.startsWith(tab.path));
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <tab.icon className={cn("w-5 h-5", active && "text-primary")} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
