import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "./pages/LandingPage";
import AdminLogin from "./pages/AdminLogin";
import AdminGuard from "./components/AdminGuard";
import Dashboard from "./pages/Dashboard";
import QuoteEditor from "./pages/QuoteEditor";
import QuoteView from "./pages/QuoteView";
import Materials from "./pages/Materials";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
          <Route path="/admin/materials" element={<AdminGuard><Materials /></AdminGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
