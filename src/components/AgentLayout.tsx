import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FilePlus, Briefcase, Image, DollarSign, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import mayuraLogo from "@/assets/mayura-logo-horizontal.png";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

const navItems = [
  { to: "/agent", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agent/request", label: "New Request", icon: FilePlus },
  { to: "/agent/jobs", label: "My Jobs", icon: Briefcase },
  { to: "/agent/gallery", label: "Gallery", icon: Image },
  { to: "/agent/referrals", label: "Referrals", icon: DollarSign },
];

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <Link to="/agent" className="flex items-center gap-3 shrink-0">
            <img src={mayuraLogo} alt="Mayura Garden Services" className="h-9 w-auto" />
            <span className="text-primary-foreground/70 text-xs font-medium hidden sm:block">Agent Portal</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 ml-1">
              <LogOut className="w-4 h-4" />
              <span className="ml-1.5">Logout</span>
            </Button>
          </nav>

          <Button variant="ghost" size="icon" className="lg:hidden text-primary-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden border-t border-primary-foreground/10 bg-primary pb-3">
            <nav className="container grid grid-cols-2 gap-1 pt-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 justify-start col-span-2">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </nav>
          </div>
        )}
      </header>

      <main className="container py-8 animate-fade-in">{children}</main>
    </div>
  );
}
