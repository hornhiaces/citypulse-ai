import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModeProvider } from "@/lib/modeContext";
import { AppLayout } from "@/components/AppLayout";
import OverviewPage from "./pages/OverviewPage";
import BriefingPage from "./pages/BriefingPage";
import MapPage from "./pages/MapPage";
import SafetyPage from "./pages/SafetyPage";
import InfrastructurePage from "./pages/InfrastructurePage";
import EconomicPage from "./pages/EconomicPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ModeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/briefing" element={<BriefingPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/safety" element={<SafetyPage />} />
              <Route path="/infrastructure" element={<InfrastructurePage />} />
              <Route path="/economic" element={<EconomicPage />} />
              <Route path="/recommendations" element={<RecommendationsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </ModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
