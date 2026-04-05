import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FilePlus, Package } from "lucide-react";
import mayuraLogo from "@/assets/mayura-logo.png";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/quotes/new", label: "New Quote", icon: FilePlus },
  { to: "/materials", label: "Materials", icon: Package },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-primary sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
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
          </nav>
        </div>
      </header>
      <main className="container py-8 animate-fade-in">{children}</main>
    </div>
  );
}
