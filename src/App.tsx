import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModeProvider } from "@/lib/modeContext";
import { AppLayout } from "@/components/AppLayout";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const OverviewPage = lazy(() => import("./pages/OverviewPage"));
const BriefingPage = lazy(() => import("./pages/BriefingPage"));
const MapPage = lazy(() => import("./pages/MapPage"));
const SafetyPage = lazy(() => import("./pages/SafetyPage"));
const InfrastructurePage = lazy(() => import("./pages/InfrastructurePage"));
const EconomicPage = lazy(() => import("./pages/EconomicPage"));
const RecommendationsPage = lazy(() => import("./pages/RecommendationsPage"));
const TransparencyPage = lazy(() => import("./pages/TransparencyPage"));
const ROIPage = lazy(() => import("./pages/ROIPage"));

const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-10 w-64 rounded-lg" />
      <Skeleton className="h-4 w-96 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ModeProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/briefing" element={<BriefingPage />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/safety" element={<SafetyPage />} />
                <Route path="/infrastructure" element={<InfrastructurePage />} />
                <Route path="/economic" element={<EconomicPage />} />
                <Route path="/recommendations" element={<RecommendationsPage />} />
                <Route path="/transparency" element={<TransparencyPage />} />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AppLayout>
        </BrowserRouter>
      </ModeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
