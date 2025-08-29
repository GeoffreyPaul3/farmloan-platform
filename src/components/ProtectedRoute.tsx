import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  requireAdmin?: boolean;
  children: React.ReactNode;
}

export function ProtectedRoute({ requireAdmin = false, children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["protected-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("approved, role")
        .eq("user_id", user.id)
        .single();
      return data as { approved: boolean; role: 'admin' | 'staff' } | null;
    },
    enabled: !!user?.id,
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile?.approved) {
    return <Navigate to="/auth?status=pending" replace />;
  }

  if (requireAdmin && profile.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}


