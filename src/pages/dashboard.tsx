
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Users, DollarSign, TrendingUp, AlertTriangle, Package, ShoppingCart, Calendar, MapPin, CreditCard, Upload, Shield, BarChart3 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [clubsRes, farmersRes, loansRes, deliveriesRes, inputsRes, fieldVisitsRes, seasonsRes] = await Promise.all([
        supabase.from("farmer_groups").select("*"),
        supabase.from("farmers").select("*"),
        supabase.from("loans").select("*"),
        supabase.from("deliveries").select("*"),
        supabase.from("input_distributions").select("*"),
        supabase.from("field_visits").select("*"),
        supabase.from("seasons").select("*")
      ]);

      return {
        clubs: clubsRes.data || [],
        farmers: farmersRes.data || [],
        loans: loansRes.data || [],
        deliveries: deliveriesRes.data || [],
        inputs: inputsRes.data || [],
        fieldVisits: fieldVisitsRes.data || [],
        seasons: seasonsRes.data || []
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

  const { data: alerts } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const alerts = [];
      
      // Check for pending farmer registrations
      const pendingFarmers = stats?.farmers.filter(f => f.status === 'pending') || [];
      if (pendingFarmers.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Pending Farmer Registrations',
          message: `${pendingFarmers.length} farmers awaiting approval`,
          icon: Users
        });
      }

      // Check for overdue loans
      const overdueLoans = stats?.loans.filter(l => 
        l.status === 'active' && 
        l.due_date && 
        new Date(l.due_date) < new Date()
      ) || [];
      if (overdueLoans.length > 0) {
        alerts.push({
          type: 'error',
          title: 'Overdue Loans',
          message: `${overdueLoans.length} loans past due date`,
          icon: DollarSign
        });
      }

      // Check for low stock (if we have input stock data)
      const lowStockItems = stats?.inputs.filter(i => i.quantity < 10) || [];
      if (lowStockItems.length > 0) {
        alerts.push({
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${lowStockItems.length} input items running low`,
          icon: Package
        });
      }

      // Check for recent field visits needed
      const recentVisits = stats?.fieldVisits.filter(v => 
        new Date(v.visit_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ) || [];
      if (recentVisits.length === 0) {
        alerts.push({
          type: 'info',
          title: 'Field Monitoring',
          message: 'No recent field visits recorded',
          icon: MapPin
        });
      }

      return alerts;
    },
    enabled: !!stats
  });

  const totalOutstanding = stats?.loans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0;
  const totalDeliveries = stats?.deliveries.reduce((sum, d) => sum + (d.weight || 0), 0) || 0;
  const totalValue = stats?.deliveries.reduce((sum, d) => sum + (d.gross_amount || 0), 0) || 0;

  // Real chart data
  const chartData = [
    { name: 'Clubs', value: stats?.clubs.length || 0 },
    { name: 'Farmers', value: stats?.farmers.length || 0 },
    { name: 'Loans', value: stats?.loans.length || 0 },
    { name: 'Deliveries', value: stats?.deliveries.length || 0 },
  ];

  // Loan status distribution
  const loanStatusData = stats?.loans.reduce((acc, loan) => {
    acc[loan.status] = (acc[loan.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const pieData = Object.entries(loanStatusData).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count
  }));

  // Monthly delivery trends (last 6 months)
  const monthlyDeliveries = stats?.deliveries.reduce((acc, delivery) => {
    const month = new Date(delivery.created_at).toLocaleDateString('en-US', { month: 'short' });
    acc[month] = (acc[month] || 0) + (delivery.weight || 0);
    return acc;
  }, {} as Record<string, number>) || {};

  const lineData = Object.entries(monthlyDeliveries).map(([month, weight]) => ({
    month,
    weight: weight / 1000 // Convert to tons
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleQuickAction = (route: string) => {
    navigate(route);
  };

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
              <div 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleQuickAction('/clubs')}
              >
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Manage Clubs</p>
                  <p className="text-xs text-muted-foreground">Register farmer groups</p>
                </div>
              </div>
              <div 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleQuickAction('/inputs')}
              >
                <Package className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Input Distribution</p>
                  <p className="text-xs text-muted-foreground">Track supplies</p>
                </div>
              </div>
              <div 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleQuickAction('/deliveries')}
              >
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Process Delivery</p>
                  <p className="text-xs text-muted-foreground">Cotton buying</p>
                </div>
              </div>
              <div 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleQuickAction('/field-visits')}
              >
                <MapPin className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">Field Monitoring</p>
                  <p className="text-xs text-muted-foreground">Visit farmers</p>
                </div>
              </div>
              <div 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleQuickAction('/payments')}
              >
                <CreditCard className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">Payments & Loans</p>
                  <p className="text-xs text-muted-foreground">Manage finances</p>
                </div>
              </div>
              <div 
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleQuickAction('/reports')}
              >
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                <div>
                  <p className="font-medium">View Reports</p>
                  <p className="text-xs text-muted-foreground">Analytics & insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Loan Status Distribution</CardTitle>
              <CardDescription>Current loan portfolio status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Trends</CardTitle>
              <CardDescription>Monthly cotton delivery volume</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
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
              {alerts && alerts.length > 0 ? (
                alerts.map((alert, index) => {
                  const Icon = alert.icon;
                  const alertStyles = {
                    warning: "border-orange-200 bg-orange-50",
                    error: "border-red-200 bg-red-50",
                    info: "border-blue-200 bg-blue-50"
                  };
                  
                  return (
                    <div key={index} className={`flex items-center gap-3 p-3 border rounded-lg ${alertStyles[alert.type as keyof typeof alertStyles]}`}>
                      <Icon className={`h-5 w-5 ${
                        alert.type === 'warning' ? 'text-orange-500' :
                        alert.type === 'error' ? 'text-red-500' : 'text-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.message}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center gap-3 p-3 border border-green-200 bg-green-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">All Systems Normal</p>
                    <p className="text-xs text-muted-foreground">No critical alerts at this time</p>
                  </div>
                </div>
              )}
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
