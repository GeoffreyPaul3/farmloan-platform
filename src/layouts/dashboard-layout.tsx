import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check admin approval status for authenticated users
  useEffect(() => {
    const fetchApproval = async () => {
      if (!user) {
        setIsApproved(null);
        setApprovalLoading(false);
        return;
      }
      setApprovalLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("approved")
        .eq("user_id", user.id)
        .single();

      if (error) {
        setIsApproved(false);
      } else {
        setIsApproved(!!data?.approved);
      }
      setApprovalLoading(false);
    };

    fetchApproval();
  }, [user]);

  const handleMobileMenuToggle = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const handleMobileClose = () => {
    setMobileSidebarOpen(false);
  };

  if (loading || approvalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading Farm Manager...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Block access if user is not yet approved by admin
  if (isApproved === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full border rounded-lg p-8 text-center space-y-4">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-muted">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">Awaiting Administrator Approval</h1>
          <p className="text-sm text-muted-foreground">
            Your account has been created and is pending review. You will be able to access the system once an administrator approves your account.
          </p>
          <div className="pt-2">
            <Button onClick={() => signOut?.()} variant="secondary" className="w-full">Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMobileMenuToggle={handleMobileMenuToggle} />
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar 
          mobileOpen={mobileSidebarOpen}
          onMobileClose={handleMobileClose}
          isMobile={isMobile}
        />
        <main className="flex-1 overflow-auto md:ml-0">
          {children}
        </main>
      </div>
    </div>
  );
}