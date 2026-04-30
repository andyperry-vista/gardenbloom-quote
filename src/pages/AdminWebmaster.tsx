import { Navigate, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Loader2, ExternalLink, ShieldCheck, UserCheck, HardHat, Globe,
  LayoutDashboard, FilePlus, Inbox, Package, PackageCheck, Briefcase,
  CalendarDays, FileText, Wrench, Users, Calculator, Settings as SettingsIcon,
  Home, FileSearch, Image as ImageIcon, Receipt, Phone, Clock, LogOut,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Area {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface Portal {
  key: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  entry: string;
  badge: string;
  badgeVariant: "default" | "secondary" | "outline" | "destructive";
  blurb: string;
  areas: Area[];
}

const portals: Portal[] = [
  {
    key: "admin",
    name: "Admin / Manager Portal",
    icon: ShieldCheck,
    entry: "/admin",
    badge: "Admin",
    badgeVariant: "default",
    blurb: "Full operational backoffice — quotes, jobs, invoices, payroll, and team management.",
    areas: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, description: "KPIs and recent activity overview." },
      { to: "/admin/quotes/new", label: "New Quote", icon: FilePlus, description: "Create a new quote from scratch or a package." },
      { to: "/admin/quote-requests", label: "Quote Requests", icon: Inbox, description: "Inbound quote requests from the public site." },
      { to: "/admin/materials", label: "Materials", icon: Package, description: "Materials catalog and pricing." },
      { to: "/admin/packages", label: "Packages", icon: PackageCheck, description: "Reusable service package templates." },
      { to: "/admin/jobs", label: "Jobs", icon: Briefcase, description: "All scheduled, in-progress, and completed jobs." },
      { to: "/admin/calendar", label: "Calendar", icon: CalendarDays, description: "Schedule view of all jobs." },
      { to: "/admin/invoices", label: "Invoices", icon: FileText, description: "Tax invoices and payment tracking." },
      { to: "/admin/tools", label: "Email Tools", icon: Wrench, description: "Send transactional and follow-up emails." },
      { to: "/admin/clients", label: "Clients", icon: Users, description: "Client directory." },
      { to: "/admin/agents", label: "Agents", icon: UserCheck, description: "Real estate agent partners." },
      { to: "/admin/employees", label: "Employees", icon: HardHat, description: "Staff records, rates, and invites." },
      { to: "/admin/payroll", label: "Payroll", icon: Calculator, description: "Time entries, payslips, and PAYG." },
      { to: "/admin/team", label: "Team & Roles", icon: ShieldCheck, description: "Grant admin / manager / webmaster roles." },
      { to: "/admin/settings", label: "Settings", icon: SettingsIcon, description: "Business and app-wide settings." },
    ],
  },
  {
    key: "agent",
    name: "Agent Portal",
    icon: UserCheck,
    entry: "/agent",
    badge: "Real Estate Agent",
    badgeVariant: "secondary",
    blurb: "What approved real estate agents see when they log in to refer clients.",
    areas: [
      { to: "/agent", label: "Agent Dashboard", icon: LayoutDashboard, description: "Agent's home with quick actions." },
      { to: "/agent/request", label: "Request Quote", icon: FilePlus, description: "Submit a new quote request for a property." },
      { to: "/agent/jobs", label: "My Referred Jobs", icon: Briefcase, description: "Jobs originating from this agent." },
      { to: "/agent/gallery", label: "Before/After Gallery", icon: ImageIcon, description: "Showcase of completed transformations." },
      { to: "/agent/referrals", label: "Referrals & Commission", icon: Receipt, description: "Commission tracking and payouts." },
      { to: "/agent/contact", label: "Contact", icon: Phone, description: "Get in touch with the team." },
    ],
  },
  {
    key: "employee",
    name: "Employee Portal",
    icon: HardHat,
    entry: "/employee",
    badge: "Field Staff",
    badgeVariant: "outline",
    blurb: "Mobile-first portal for field staff to view jobs and log hours.",
    areas: [
      { to: "/employee", label: "Employee Home", icon: Home, description: "Daily summary and quick links." },
      { to: "/employee/jobs", label: "My Jobs", icon: Briefcase, description: "Assigned jobs list." },
      { to: "/employee/hours", label: "My Hours", icon: Clock, description: "Logged hours and pay summary." },
    ],
  },
  {
    key: "public",
    name: "Public Site",
    icon: Globe,
    entry: "/",
    badge: "Public",
    badgeVariant: "outline",
    blurb: "What anonymous visitors see — landing page and quote request flow.",
    areas: [
      { to: "/", label: "Landing Page", icon: Home, description: "Marketing home with services and lead capture." },
      { to: "/admin/login", label: "Admin Login", icon: ShieldCheck, description: "Staff sign-in entry." },
      { to: "/agent/login", label: "Agent Login", icon: UserCheck, description: "Real estate agent sign-in / signup." },
      { to: "/employee/login", label: "Employee Login", icon: HardHat, description: "Field staff sign-in." },
      { to: "/unsubscribe", label: "Unsubscribe", icon: FileSearch, description: "Email unsubscribe handler." },
    ],
  },
];

export default function AdminWebmaster() {
  const perms = usePermissions();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      setSigningOut(false);
      return;
    }
    navigate("/webmaster/login", { replace: true });
  };

  if (perms.loading) {
    return (
      <AppLayout>
        <div className="py-12 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!perms.isWebmaster) return <Navigate to="/admin" replace />;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <Crown className="w-8 h-8 text-primary mt-1 shrink-0" />
            <div>
              <h1 className="font-display text-3xl">Webmaster Console</h1>
              <p className="text-muted-foreground mt-1">
                Every area of the site, grouped by portal. As webmaster you can open and preview each one directly — guards will let you through. Use <em>View as</em> to open a portal in a new tab the way that role experiences it.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
            Sign Out
          </Button>
        </div>

        {portals.map((p) => (
          <Card key={p.key}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <p.icon className="w-6 h-6 text-primary" />
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {p.name}
                      <Badge variant={p.badgeVariant}>{p.badge}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{p.blurb}</p>
                  </div>
                </div>
                <Button asChild variant="default" size="sm">
                  <a href={p.entry} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View as {p.badge}
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2">
                {p.areas.map((a) => (
                  <div
                    key={a.to}
                    className="flex items-start gap-3 border rounded-md p-3 hover:bg-muted/40 transition-colors"
                  >
                    <a.icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{a.label}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <Link to={a.to}>Open</Link>
                          </Button>
                          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                            <a href={a.to} target="_blank" rel="noopener noreferrer" aria-label={`Open ${a.label} in new tab`}>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/70 mt-1 truncate">{a.to}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
