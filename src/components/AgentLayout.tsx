import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FilePlus, Briefcase, Image, DollarSign, LogOut, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import mayuraLogo from "@/assets/mayura-logo-horizontal.png";
import { supabase } from "@/integrations/supabase/client";
import { useAgentProfile } from "@/hooks/useAgentProfile";

const baseNavItems = [
  { to: "/agent", label: "Dashboard", icon: LayoutDashboard },
  { to: "/agent/request", label: "New Request", icon: FilePlus },
  { to: "/agent/jobs", label: "My Jobs", icon: Briefcase },
  { to: "/agent/gallery", label: "Gallery", icon: Image },
  { to: "/agent/contact", label: "Contact Us", icon: MessageCircle },
];

const referralNavItem = { to: "/agent/referrals", label: "Referrals", icon: DollarSign };

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAgentProfile();

  const navItems = profile?.commissionEnabled
    ? [...baseNavItems, referralNavItem]
    : baseNavItems;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <header className="border-b bg-primary sticky top-0 z-40">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/agent" className="flex items-center gap-3 shrink-0">
            <img src={mayuraLogo} alt="Mayura Garden Services" className="h-8 sm:h-9 w-auto" />
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

          <Button variant="ghost" size="icon" className="lg:hidden text-primary-foreground" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container px-4 py-5 lg:py-8 max-w-3xl mx-auto pb-24 lg:pb-8 animate-fade-in flex-1 w-full">{children}</main>

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className={`grid max-w-3xl mx-auto`} style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
