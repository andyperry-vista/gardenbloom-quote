import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Briefcase, Clock, LogOut } from "lucide-react";
import mayuraLogo from "@/assets/mayura-logo-horizontal.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const tabs = [
  { to: "/employee", label: "Today", icon: LayoutGrid },
  { to: "/employee/jobs", label: "Jobs", icon: Briefcase },
  { to: "/employee/hours", label: "Hours", icon: Clock },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="bg-primary sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/employee" className="flex items-center gap-2">
            <img src={mayuraLogo} alt="Mayura" className="h-8 w-auto" />
            <span className="text-primary-foreground/70 text-xs">Crew</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 pt-4 pb-24 max-w-2xl mx-auto w-full animate-fade-in">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-3 max-w-2xl mx-auto">
          {tabs.map((t) => {
            const active = location.pathname === t.to ||
              (t.to !== "/employee" && location.pathname.startsWith(t.to));
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <t.icon className={`w-5 h-5 ${active ? "scale-110" : ""} transition-transform`} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
