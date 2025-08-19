import { motion } from "framer-motion";
import { 
  Users, 
  CreditCard, 
  Wrench, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

// Mock data for dashboard
const stats = [
  {
    title: "Active Farmer Groups",
    value: "247",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    title: "Outstanding Loans",
    value: "$2.4M",
    change: "-8%",
    trend: "down",
    icon: CreditCard,
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    title: "Equipment Issued",
    value: "156",
    change: "+23%",
    trend: "up",
    icon: Wrench,
    color: "text-success",
    bgColor: "bg-success/10"
  },
  {
    title: "Monthly Revenue",
    value: "$180K",
    change: "+15%",
    trend: "up",
    icon: DollarSign,
    color: "text-warning",
    bgColor: "bg-warning/10"
  }
];

const recentLoans = [
  {
    id: "1",
    group: "Green Valley Farmers",
    amount: "$25,000",
    type: "Seasonal",
    status: "approved",
    dueDate: "2024-03-15"
  },
  {
    id: "2", 
    group: "Highland Growers Co-op",
    amount: "$40,000",
    type: "Equipment",
    status: "pending",
    dueDate: "2024-03-20"
  },
  {
    id: "3",
    group: "River Valley Group",
    amount: "$15,000",
    type: "Emergency",
    status: "disbursed",
    dueDate: "2024-02-28"
  }
];

const equipmentStatus = [
  { category: "Tractors", total: 45, available: 32, issued: 13 },
  { category: "Harvesters", total: 28, available: 19, issued: 9 },
  { category: "Irrigation", total: 67, available: 54, issued: 13 },
  { category: "Tools", total: 156, available: 128, issued: 28 }
];

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Welcome back! Here's what's happening with your farm loans and equipment.
            </p>
          </div>
          <Button variant="enterprise" className="shadow-lg">
            <Calendar className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
            >
              <Card className="card-dashboard hover-lift">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm font-medium ${
                      stat.trend === 'up' ? 'text-success' : 'text-destructive'
                    }`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      from last month
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Recent Loans */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="md:col-span-4"
        >
          <Card className="card-dashboard">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Recent Loan Applications
              </CardTitle>
              <CardDescription>
                Latest loan requests from farmer groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentLoans.map((loan, index) => (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{loan.group}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {loan.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Due: {loan.dueDate}
                        </span>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-bold text-foreground">{loan.amount}</p>
                      <Badge 
                        variant={loan.status === 'approved' ? 'default' : 
                                loan.status === 'pending' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {loan.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Equipment Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="md:col-span-3"
        >
          <Card className="card-dashboard">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-success" />
                Equipment Overview
              </CardTitle>
              <CardDescription>
                Current equipment availability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {equipmentStatus.map((equipment, index) => {
                const utilizationRate = (equipment.issued / equipment.total) * 100;
                return (
                  <motion.div
                    key={equipment.category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    className="space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-foreground">
                        {equipment.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {equipment.issued}/{equipment.total}
                      </span>
                    </div>
                    <Progress 
                      value={utilizationRate} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{equipment.available} Available</span>
                      <span>{utilizationRate.toFixed(0)}% Utilized</span>
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Alerts & Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="card-dashboard">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Important Alerts
            </CardTitle>
            <CardDescription>
              Items requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-warning/10 border border-warning/20">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">3 loans overdue for repayment</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Follow up required with River Valley Group and 2 others
                  </p>
                </div>
                <Button variant="outline" size="sm">Review</Button>
              </div>
              
              <div className="flex items-start gap-4 p-4 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Equipment maintenance completed</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    5 tractors are now ready for deployment
                  </p>
                </div>
                <Button variant="outline" size="sm">View</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}