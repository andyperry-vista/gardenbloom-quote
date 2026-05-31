import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import LandingPage from "./pages/LandingPage";
import { Navigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy-load non-landing routes to reduce initial JS bundle and improve LCP
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const WebmasterLogin = lazy(() => import("./pages/WebmasterLogin"));
const AdminGuard = lazy(() => import("./components/AdminGuard"));
const AgentGuard = lazy(() => import("./components/AgentGuard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const QuoteEditor = lazy(() => import("./pages/QuoteEditor"));
const QuoteView = lazy(() => import("./pages/QuoteView"));
const Materials = lazy(() => import("./pages/Materials"));
const BusinessTools = lazy(() => import("./pages/BusinessTools"));
const EmailDashboard = lazy(() => import("./pages/EmailDashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const Jobs = lazy(() => import("./pages/Jobs"));
const JobView = lazy(() => import("./pages/JobView"));
const Invoices = lazy(() => import("./pages/Invoices"));
const InvoiceView = lazy(() => import("./pages/InvoiceView"));
const CalendarPage = lazy(() => import("./pages/Calendar"));
const Clients = lazy(() => import("./pages/Clients"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AgentLogin = lazy(() => import("./pages/AgentLogin"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const AgentQuoteRequest = lazy(() => import("./pages/AgentQuoteRequest"));
const AgentJobs = lazy(() => import("./pages/AgentJobs"));
const AgentGallery = lazy(() => import("./pages/AgentGallery"));
const AdminAgents = lazy(() => import("./pages/AdminAgents"));
const AdminPackages = lazy(() => import("./pages/AdminPackages"));
const QuoteRequests = lazy(() => import("./pages/QuoteRequests"));
const AgentContact = lazy(() => import("./pages/AgentContact"));
const Employees = lazy(() => import("./pages/Employees"));
const EmployeeTimeLog = lazy(() => import("./pages/EmployeeTimeLog"));
const Payroll = lazy(() => import("./pages/Payroll"));
const AdminTeam = lazy(() => import("./pages/AdminTeam"));
const AdminWebmaster = lazy(() => import("./pages/AdminWebmaster"));
const EmployeeLogin = lazy(() => import("./pages/EmployeeLogin"));
const EmployeeGuard = lazy(() => import("./components/EmployeeGuard"));
const EmployeeHome = lazy(() => import("./pages/EmployeeHome"));
const EmployeeJobs = lazy(() => import("./pages/EmployeeJobs"));
const EmployeeJobDetail = lazy(() => import("./pages/EmployeeJobDetail"));
const EmployeeHours = lazy(() => import("./pages/EmployeeHours"));
const AdminCard = lazy(() => import("./pages/AdminCard"));

function AdminHome() {
  const isMobile = useIsMobile();
  if (isMobile) return <Navigate to="/admin/card" replace />;
  return <Dashboard />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/webmaster/login" element={<WebmasterLogin />} />
              <Route path="/admin" element={<AdminGuard><AdminHome /></AdminGuard>} />
              <Route path="/admin/card" element={<AdminGuard><AdminCard /></AdminGuard>} />
              <Route path="/admin/dashboard" element={<AdminGuard><Dashboard /></AdminGuard>} />
              <Route path="/admin/quotes/new" element={<AdminGuard><QuoteEditor /></AdminGuard>} />
              <Route path="/admin/quotes/:id" element={<AdminGuard><QuoteView /></AdminGuard>} />
              <Route path="/admin/quotes/:id/edit" element={<AdminGuard><QuoteEditor /></AdminGuard>} />
              <Route path="/admin/jobs" element={<AdminGuard><Jobs /></AdminGuard>} />
              <Route path="/admin/jobs/:id" element={<AdminGuard><JobView /></AdminGuard>} />
              <Route path="/admin/invoices" element={<AdminGuard><Invoices /></AdminGuard>} />
              <Route path="/admin/invoices/:id" element={<AdminGuard><InvoiceView /></AdminGuard>} />
              <Route path="/admin/calendar" element={<AdminGuard><CalendarPage /></AdminGuard>} />
              <Route path="/admin/clients" element={<AdminGuard><Clients /></AdminGuard>} />
              <Route path="/admin/materials" element={<AdminGuard><Materials /></AdminGuard>} />
              <Route path="/admin/tools" element={<AdminGuard><BusinessTools /></AdminGuard>} />
              <Route path="/admin/emails" element={<AdminGuard><EmailDashboard /></AdminGuard>} />
              <Route path="/admin/settings" element={<AdminGuard><Settings /></AdminGuard>} />
              <Route path="/admin/agents" element={<AdminGuard><AdminAgents /></AdminGuard>} />
              <Route path="/admin/packages" element={<AdminGuard><AdminPackages /></AdminGuard>} />
              <Route path="/admin/quote-requests" element={<AdminGuard><QuoteRequests /></AdminGuard>} />
              <Route path="/admin/employees" element={<AdminGuard><Employees /></AdminGuard>} />
              <Route path="/admin/employees/:id/time-log" element={<AdminGuard><EmployeeTimeLog /></AdminGuard>} />
              <Route path="/admin/payroll" element={<AdminGuard><Payroll /></AdminGuard>} />
              <Route path="/admin/team" element={<AdminGuard><AdminTeam /></AdminGuard>} />
              <Route path="/admin/webmaster" element={<AdminGuard><AdminWebmaster /></AdminGuard>} />
              <Route path="/agent/login" element={<AgentLogin />} />
              <Route path="/agent" element={<AgentGuard><AgentDashboard /></AgentGuard>} />
              <Route path="/agent/request" element={<AgentGuard><AgentQuoteRequest /></AgentGuard>} />
              <Route path="/agent/jobs" element={<AgentGuard><AgentJobs /></AgentGuard>} />
              <Route path="/agent/gallery" element={<AgentGuard><AgentGallery /></AgentGuard>} />
              
              <Route path="/agent/contact" element={<AgentGuard><AgentContact /></AgentGuard>} />
              <Route path="/employee/login" element={<EmployeeLogin />} />
              <Route path="/employee" element={<EmployeeGuard><EmployeeHome /></EmployeeGuard>} />
              <Route path="/employee/jobs" element={<EmployeeGuard><EmployeeJobs /></EmployeeGuard>} />
              <Route path="/employee/jobs/:id" element={<EmployeeGuard><EmployeeJobDetail /></EmployeeGuard>} />
              <Route path="/employee/hours" element={<EmployeeGuard><EmployeeHours /></EmployeeGuard>} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
