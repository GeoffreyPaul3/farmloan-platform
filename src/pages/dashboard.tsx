
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, DollarSign, TrendingUp, AlertTriangle, Package, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [clubsRes, farmersRes, loansRes, deliveriesRes, inputsRes] = await Promise.all([
        supabase.from("farmer_groups").select("*"),
        supabase.from("farmers").select("*"),
        supabase.from("loans").select("*"),
        supabase.from("deliveries").select("*"),
        supabase.from("input_distributions").select("*")
      ]);

      return {
        clubs: clubsRes.data || [],
        farmers: farmersRes.data || [],
        loans: loansRes.data || [],
        deliveries: deliveriesRes.data || [],
        inputs: inputsRes.data || []
      };
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
  });

  const totalOutstanding = stats?.loans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
  const totalDeliveries = stats?.deliveries.reduce((sum, d) => sum + (d.weight || 0), 0) || 0;
  const totalValue = stats?.deliveries.reduce((sum, d) => sum + (d.gross_amount || 0), 0) || 0;

  // Sample chart data
  const chartData = [
    { name: 'Clubs', value: stats?.clubs.length || 0 },
    { name: 'Farmers', value: stats?.farmers.length || 0 },
    { name: 'Loans', value: stats?.loans.length || 0 },
    { name: 'Deliveries', value: stats?.deliveries.length || 0 },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Cotton Club Management Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of clubs, farmers, loans, and cotton deliveries
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clubs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.clubs.filter(c => c.status === 'active').length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Total: {stats?.clubs.length || 0} clubs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registered Farmers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.farmers.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active: {stats?.farmers.filter(f => f.status === 'active').length || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Outstanding Loans</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalOutstanding.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.loans.filter(l => l.outstanding_balance > 0).length || 0} active loans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cotton Delivered</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDeliveries.toFixed(0)} kg</div>
              <p className="text-xs text-muted-foreground">
                Value: ${totalValue.toFixed(0)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>System Overview</CardTitle>
              <CardDescription>Key metrics across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Register New Club</p>
                  <p className="text-xs text-muted-foreground">Add farmer group</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <Package className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Record Input Distribution</p>
                  <p className="text-xs text-muted-foreground">Track supplies</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Process Delivery</p>
                  <p className="text-xs text-muted-foreground">Cotton buying</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Important notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 border border-orange-200 bg-orange-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium text-sm">Low Stock Alert</p>
                  <p className="text-xs text-muted-foreground">Several input items are running low</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border border-blue-200 bg-blue-50 rounded-lg">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium text-sm">Pending Farmer Registrations</p>
                  <p className="text-xs text-muted-foreground">5 farmers awaiting approval</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity?.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {activity.action}
                    </Badge>
                    <span className="text-sm">{activity.table_name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.created_at).toLocaleTimeString()}
                  </span>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
