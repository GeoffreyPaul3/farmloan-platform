
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
import AuditTrail from "./pages/audit-trail";
import { ProtectedRoute } from "@/components/ProtectedRoute";

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
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/clubs" element={<ProtectedRoute><Clubs /></ProtectedRoute>} />
                <Route path="/seasons" element={<ProtectedRoute><Seasons /></ProtectedRoute>} />
                <Route path="/inputs" element={<ProtectedRoute><Inputs /></ProtectedRoute>} />
                <Route path="/field-visits" element={<ProtectedRoute><FieldVisits /></ProtectedRoute>} />
                <Route path="/deliveries" element={<ProtectedRoute><Deliveries /></ProtectedRoute>} />
                <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
                <Route path="/equipment" element={<ProtectedRoute><Equipment /></ProtectedRoute>} />
                <Route path="/uploads" element={<ProtectedRoute><Uploads /></ProtectedRoute>} />
                <Route path="/audit" element={<ProtectedRoute><Audit /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/audit-trail" element={<ProtectedRoute><AuditTrail /></ProtectedRoute>} />
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
