import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Labour from "./pages/Labour";
import { LabourDetails } from "./pages/LabourDetails";
import { CustomerDetails } from "./pages/CustomerDetails";
import { DailyWorkers } from "./pages/DailyWorkers";
import Production from "./pages/Production";
import Customers from "./pages/Customers";
import Expenses from "./pages/Expenses";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

import { YearProvider } from "@/contexts/YearContext";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <YearProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
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
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </YearProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
