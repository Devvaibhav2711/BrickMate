import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { YearProvider } from "@/contexts/YearContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { keepSupabaseAlive } from "@/lib/keepAlive";

// Lazy load pages for code splitting - reduces initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Labour = lazy(() => import("./pages/Labour"));
const LabourDetails = lazy(() => import("./pages/LabourDetails").then(m => ({ default: m.LabourDetails })));
const CustomerDetails = lazy(() => import("./pages/CustomerDetails").then(m => ({ default: m.CustomerDetails })));
const DailyWorkers = lazy(() => import("./pages/DailyWorkers").then(m => ({ default: m.DailyWorkers })));
const Production = lazy(() => import("./pages/Production"));
const Customers = lazy(() => import("./pages/Customers"));
const Expenses = lazy(() => import("./pages/Expenses"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const Login = lazy(() => import("./pages/Login"));

// Optimized QueryClient with better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Cache for 30 minutes
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Only retry once on failure
      refetchOnMount: false, // Don't refetch if data exists
    },
  },
});

const App = () => {
  // Keep Supabase alive - runs automatically every 5 days
  useEffect(() => {
    keepSupabaseAlive();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <YearProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppLayout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route element={<ProtectedRoute />}>
                      <Route path="/" element={<Index />} />
                      <Route path="/labour" element={<Labour />} />
                      <Route path="/labour/:id" element={<LabourDetails />} />
                      <Route path="/daily-workers" element={<DailyWorkers />} />
                      <Route path="/production" element={<Production />} />
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/customer/:id" element={<CustomerDetails />} />
                      <Route path="/expenses" element={<Expenses />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </Suspense>
              </AppLayout>
            </BrowserRouter>
          </TooltipProvider>
        </YearProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
