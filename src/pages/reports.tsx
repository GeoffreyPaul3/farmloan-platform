
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Reports() {
  const { data: clubs } = useQuery({
    queryKey: ["clubs-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_groups")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: farmers } = useQuery({
    queryKey: ["farmers-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmers")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: loans } = useQuery({
    queryKey: ["loans-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: deliveries } = useQuery({
    queryKey: ["deliveries-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select("*, farmer_groups(name)");
      if (error) throw error;
      return data;
    },
  });

  // Calculate club performance data
  const clubPerformanceData = clubs?.map(club => {
    const clubFarmers = farmers?.filter(f => f.farmer_group_id === club.id) || [];
    const clubDeliveries = deliveries?.filter(d => d.farmer_group_id === club.id) || [];
    const totalWeight = clubDeliveries.reduce((sum, d) => sum + (d.weight || 0), 0);
    
    return {
      name: club.name.length > 15 ? club.name.substring(0, 15) + '...' : club.name,
      members: clubFarmers.length,
      deliveries: totalWeight,
      creditScore: club.credit_score || 0
    };
  }) || [];

  // Loan status distribution
  const loanStatusData = [
    { name: 'Active', value: loans?.filter(l => l.status === 'approved').length || 0 },
    { name: 'Pending', value: loans?.filter(l => l.status === 'pending').length || 0 },
    { name: 'Rejected', value: loans?.filter(l => l.status === 'rejected').length || 0 },
  ];

  // Monthly delivery trends (mock data for demonstration)
  const deliveryTrendData = [
    { month: 'Jan', weight: 1200, value: 24000 },
    { month: 'Feb', weight: 1800, value: 36000 },
    { month: 'Mar', weight: 2200, value: 44000 },
    { month: 'Apr', weight: 2800, value: 56000 },
    { month: 'May', weight: 3200, value: 64000 },
    { month: 'Jun', weight: 2900, value: 58000 },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Clubs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{clubs?.filter(c => c.status === 'active').length || 0}</div>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Farmers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{farmers?.length || 0}</div>
                <Users className="h-4 w-4 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Outstanding Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  ${loans?.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0).toFixed(0) || 0}
                </div>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  {deliveries?.reduce((sum, d) => sum + (d.weight || 0), 0).toFixed(0) || 0} kg
                </div>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance">
          <TabsList>
            <TabsTrigger value="performance">Club Performance</TabsTrigger>
            <TabsTrigger value="loans">Loan Analysis</TabsTrigger>
            <TabsTrigger value="deliveries">Delivery Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Club Performance Metrics</CardTitle>
                <CardDescription>Member count, deliveries, and credit scores by club</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={clubPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="members" fill="#8884d8" name="Members" />
                    <Bar dataKey="deliveries" fill="#82ca9d" name="Deliveries (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Loan Status Distribution</CardTitle>
                  <CardDescription>Current status of all loans in the system</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={loanStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {loanStatusData.map((entry, index) => (
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
                  <CardTitle>Loan Recovery Analysis</CardTitle>
                  <CardDescription>Key metrics for loan performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Loans Disbursed</span>
                    <span className="font-semibold">
                      ${loans?.reduce((sum, l) => sum + (l.amount || 0), 0).toFixed(0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Outstanding Balance</span>
                    <span className="font-semibold text-orange-600">
                      ${loans?.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0).toFixed(0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Recovery Rate</span>
                    <span className="font-semibold text-green-600">
                      {loans?.length ? 
                        (((loans.reduce((sum, l) => sum + (l.amount || 0), 0) - 
                           loans.reduce((sum, l) => sum + (l.outstanding_balance || 0), 0)) / 
                          loans.reduce((sum, l) => sum + (l.amount || 0), 0)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deliveries">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Trends</CardTitle>
                <CardDescription>Cotton delivery volumes and values over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={deliveryTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="weight" stroke="#8884d8" name="Weight (kg)" />
                    <Line type="monotone" dataKey="value" stroke="#82ca9d" name="Value ($)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
