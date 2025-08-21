
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Index from "./pages/Index";
import Dashboard from "./pages/dashboard";
import Auth from "./pages/auth";
import NotFound from "./pages/NotFound";
import Clubs from "./pages/clubs";
import Seasons from "./pages/seasons";
import Inputs from "./pages/inputs";
import FieldVisits from "./pages/field-visits";
import Deliveries from "./pages/deliveries";
import Payments from "./pages/payments";
import Equipment from "./pages/equipment";
import Uploads from "./pages/uploads";
import Audit from "./pages/audit";
import Reports from "./pages/reports";
import Admin from "./pages/admin";
import Profile from "./pages/profile";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clubs" element={<Clubs />} />
                <Route path="/seasons" element={<Seasons />} />
                <Route path="/inputs" element={<Inputs />} />
                <Route path="/field-visits" element={<FieldVisits />} />
                <Route path="/deliveries" element={<Deliveries />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/equipment" element={<Equipment />} />
                <Route path="/uploads" element={<Uploads />} />
                <Route path="/audit" element={<Audit />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
