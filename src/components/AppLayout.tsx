import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FilePlus, Package, LogOut, Wrench, Settings, Briefcase, FileText, CalendarDays, Menu, X, Users, UserCheck, PackageCheck, ChevronDown, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import mayuraLogo from "@/assets/mayura-logo-horizontal.png";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef, useEffect } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";
import NotificationBell from "@/components/NotificationBell";

const navGroups = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  {
    label: "Work",
    icon: Briefcase,
    children: [
      { to: "/admin/quote-requests", label: "Quote Requests", icon: Inbox },
      { to: "/admin/quotes/new", label: "New Quote", icon: FilePlus },
      { to: "/admin/clients", label: "Clients", icon: Users },
      { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
      { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Finance",
    icon: FileText,
    children: [
      { to: "/admin/invoices", label: "Invoices", icon: FileText },
    ],
  },
  {
    label: "Resources",
    icon: Package,
    children: [
      { to: "/admin/materials", label: "Materials", icon: Package },
      { to: "/admin/packages", label: "Packages", icon: PackageCheck },
    ],
  },
  {
    label: "Admin",
    icon: Settings,
    children: [
      { to: "/admin/agents", label: "Agents", icon: UserCheck },
      { to: "/admin/tools", label: "Tools", icon: Wrench },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

// All flat items for mobile
const allNavItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/quote-requests", label: "Quote Requests", icon: Inbox },
  { to: "/admin/quotes/new", label: "New Quote", icon: FilePlus },
  { to: "/admin/clients", label: "Clients", icon: Users },
  { to: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { to: "/admin/invoices", label: "Invoices", icon: FileText },
  { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/admin/materials", label: "Materials", icon: Package },
  { to: "/admin/tools", label: "Tools", icon: Wrench },
  { to: "/admin/agents", label: "Agents", icon: UserCheck },
  { to: "/admin/packages", label: "Packages", icon: PackageCheck },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

function NavDropdown({ group, pathname }: { group: typeof navGroups[1]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const children = "children" in group ? group.children : [];
  const isChildActive = children?.some((c) => pathname === c.to);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
          isChildActive
            ? "bg-accent text-accent-foreground"
            : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
        }`}
      >
        <group.icon className="w-4 h-4 shrink-0" />
        {group.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-popover border rounded-lg shadow-lg py-1 min-w-[180px] z-50">
          {children?.map((item) => {
            const isActive = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-popover-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
          <Link to="/admin" className="flex items-center gap-3 shrink-0">
            <img src={mayuraLogo} alt="Mayura Garden Services" className="h-9 w-auto" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navGroups.map((group) =>
              "to" in group ? (
                <Link
                  key={group.label}
                  to={group.to}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    location.pathname === group.to
                      ? "bg-accent text-accent-foreground"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  }`}
                >
                  <group.icon className="w-4 h-4 shrink-0" />
                  {group.label}
                </Link>
              ) : (
                <NavDropdown key={group.label} group={group} pathname={location.pathname} />
              )
            )}
            <NotificationBell />
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
              {allNavItems.map((item) => {
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

      <main className="container py-6 pb-24 md:pb-8 animate-fade-in">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
