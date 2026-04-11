import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageContext";
import LandingPage from "./pages/LandingPage";
import AdminLogin from "./pages/AdminLogin";
import AdminGuard from "./components/AdminGuard";
import AgentGuard from "./components/AgentGuard";
import Dashboard from "./pages/Dashboard";
import QuoteEditor from "./pages/QuoteEditor";
import QuoteView from "./pages/QuoteView";
import Materials from "./pages/Materials";
import BusinessTools from "./pages/BusinessTools";
import Settings from "./pages/Settings";
import Unsubscribe from "./pages/Unsubscribe";
import Jobs from "./pages/Jobs";
import JobView from "./pages/JobView";
import Invoices from "./pages/Invoices";
import InvoiceView from "./pages/InvoiceView";
import CalendarPage from "./pages/Calendar";
import Clients from "./pages/Clients";
import NotFound from "./pages/NotFound";
import AgentLogin from "./pages/AgentLogin";
import AgentDashboard from "./pages/AgentDashboard";
import AgentQuoteRequest from "./pages/AgentQuoteRequest";
import AgentJobs from "./pages/AgentJobs";
import AgentGallery from "./pages/AgentGallery";
import AgentReferrals from "./pages/AgentReferrals";
import AdminAgents from "./pages/AdminAgents";
import AdminPackages from "./pages/AdminPackages";
import QuoteRequests from "./pages/QuoteRequests";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminGuard><Dashboard /></AdminGuard>} />
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
            <Route path="/admin/settings" element={<AdminGuard><Settings /></AdminGuard>} />
            <Route path="/admin/agents" element={<AdminGuard><AdminAgents /></AdminGuard>} />
            <Route path="/admin/packages" element={<AdminGuard><AdminPackages /></AdminGuard>} />
            <Route path="/admin/quote-requests" element={<AdminGuard><QuoteRequests /></AdminGuard>} />
            <Route path="/agent/login" element={<AgentLogin />} />
            <Route path="/agent" element={<AgentGuard><AgentDashboard /></AgentGuard>} />
            <Route path="/agent/request" element={<AgentGuard><AgentQuoteRequest /></AgentGuard>} />
            <Route path="/agent/jobs" element={<AgentGuard><AgentJobs /></AgentGuard>} />
            <Route path="/agent/gallery" element={<AgentGuard><AgentGallery /></AgentGuard>} />
            <Route path="/agent/referrals" element={<AgentGuard><AgentReferrals /></AgentGuard>} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
