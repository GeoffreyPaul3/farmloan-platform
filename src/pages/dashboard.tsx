
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Wheat, DollarSign, TrendingUp, Plus, UserPlus, Package, MapPin } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showQuickActions, setShowQuickActions] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [
        clubsResult,
        farmersResult,
        loansResult,
        deliveriesResult,
        auditResult
      ] = await Promise.all([
        supabase.from("farmer_groups").select("id").eq("status", "active"),
        supabase.from("farmers").select("id").eq("status", "active"),
        supabase.from("loans").select("outstanding_balance").eq("status", "active"),
        supabase.from("deliveries").select("weight, gross_amount"),
        supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10)
      ]);

      const totalLoans = loansResult.data?.reduce((sum, loan) => sum + loan.outstanding_balance, 0) || 0;
      const totalWeight = deliveriesResult.data?.reduce((sum, delivery) => sum + delivery.weight, 0) || 0;

      return {
        activeClubs: clubsResult.data?.length || 0,
        registeredFarmers: farmersResult.data?.length || 0,
        outstandingLoans: totalLoans,
        cottonDelivered: totalWeight,
        recentActivity: auditResult.data || []
      };
    },
  });

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'club':
        navigate('/clubs');
        break;
      case 'farmer':
        navigate('/clubs'); // Navigate to clubs where farmers are managed
        break;
      case 'delivery':
        navigate('/deliveries');
        break;
      case 'visit':
        navigate('/field-visits');
        break;
      default:
        break;
    }
    setShowQuickActions(false);
  };

  if (statsLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Cotton Club Management Platform Overview
            </p>
          </div>
          <Dialog open={showQuickActions} onOpenChange={setShowQuickActions}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Quick Actions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Quick Actions</DialogTitle>
                <DialogDescription>
                  Jump to common tasks
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col"
                  onClick={() => handleQuickAction('club')}
                >
                  <Users className="h-6 w-6 mb-2" />
                  Register Club
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col"
                  onClick={() => handleQuickAction('farmer')}
                >
                  <UserPlus className="h-6 w-6 mb-2" />
                  Add Farmer
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col"
                  onClick={() => handleQuickAction('delivery')}
                >
                  <Package className="h-6 w-6 mb-2" />
                  Record Delivery
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col"
                  onClick={() => handleQuickAction('visit')}
                >
                  <MapPin className="h-6 w-6 mb-2" />
                  Field Visit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clubs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeClubs}</div>
              <p className="text-xs text-muted-foreground">
                Registered farmer groups
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered Farmers</CardTitle>
              <Wheat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.registeredFarmers}</div>
              <p className="text-xs text-muted-foreground">
                Active cotton farmers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Loans</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.outstandingLoans.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Total loan balance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cotton Delivered</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.cottonDelivered.toFixed(1)} kg</div>
              <p className="text-xs text-muted-foreground">
                Total cotton received
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system changes and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentActivity.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>{format(new Date(activity.created_at), "MMM dd, HH:mm")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{activity.table_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          activity.action === 'INSERT' ? 'default' :
                          activity.action === 'UPDATE' ? 'secondary' : 'destructive'
                        }>
                          {activity.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{activity.user_id}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
