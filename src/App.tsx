import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { DashboardLayout } from "@/layouts/dashboard-layout";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/auth";
import Dashboard from "./pages/dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="farm-platform-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              } />
              <Route path="/farmers" element={
                <DashboardLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Farmer Groups</h1>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </div>
                </DashboardLayout>
              } />
              <Route path="/loans" element={
                <DashboardLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Loans Management</h1>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </div>
                </DashboardLayout>
              } />
              <Route path="/equipment" element={
                <DashboardLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Equipment Management</h1>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </div>
                </DashboardLayout>
              } />
              <Route path="/analytics" element={
                <DashboardLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Analytics & Reports</h1>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </div>
                </DashboardLayout>
              } />
              <Route path="/documents" element={
                <DashboardLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Document Management</h1>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </div>
                </DashboardLayout>
              } />
              <Route path="/settings" element={
                <DashboardLayout>
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">System Settings</h1>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </div>
                </DashboardLayout>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
