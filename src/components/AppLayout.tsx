import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FilePlus, Package, LogOut, Wrench, Settings, Briefcase, FileText, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import mayuraLogo from "@/assets/mayura-logo.png";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/quotes/new", label: "New Quote", icon: FilePlus },
  { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { to: "/admin/invoices", label: "Invoices", icon: FileText },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/materials", label: "Materials", icon: Package },
  { to: "/admin/tools", label: "Tools", icon: Wrench },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/admin" className="flex items-center gap-3">
            <img
              src={mayuraLogo}
              alt="Mayura Garden Service"
              className="h-10 w-auto rounded"
            />
            <div className="hidden sm:block">
              <span className="text-lg font-semibold text-primary-foreground tracking-wider uppercase leading-none">
                Mayura
              </span>
              <span className="block text-[10px] text-primary-foreground/70 tracking-[0.2em] uppercase">
                Pre-Sale Gardening
              </span>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 ml-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Logout</span>
            </Button>
          </nav>
        </div>
      </header>
      <main className="container py-8 animate-fade-in">{children}</main>
    </div>
  );
}
