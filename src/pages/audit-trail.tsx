import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  Filter, 
  Download, 
  Search,
  Calendar,
  User,
  Database,
  Eye
} from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  user_id: string;
  created_at: string;
  record_id: string;
  old_values: Record<string, unknown>;
  new_values: Record<string, unknown>;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
}

export default function AuditTrail() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  // Fetch audit logs with pagination
  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", searchTerm, selectedAction, selectedTable, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      // Apply filters
      if (selectedAction !== "all") {
        query = query.eq("action", selectedAction);
      }
      if (selectedTable !== "all") {
        query = query.eq("table_name", selectedTable);
      }
      if (searchTerm) {
        query = query.or(`user_id.ilike.%${searchTerm}%,table_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditLog[];
    },
  });

  // Fetch unique user IDs from audit logs
  const uniqueUserIds = Array.from(new Set(auditLogs.map(log => log.user_id)));

  // Fetch user profiles for display names
  const { data: userProfiles = [] } = useQuery({
    queryKey: ["audit-users", uniqueUserIds],
    queryFn: async () => {
      if (uniqueUserIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", uniqueUserIds);
      
      if (error) throw error;
      return data as UserProfile[];
    },
    enabled: uniqueUserIds.length > 0,
  });

  // Create user ID to display name mapping
  const userIdToDisplayName: Record<string, string> = userProfiles.reduce((acc, user) => {
    acc[user.user_id] = user.full_name || user.email || user.user_id;
    return acc;
  }, {} as Record<string, string>);

  // Get unique actions and tables for filters
  const uniqueActions = Array.from(new Set(auditLogs.map(log => log.action)));
  const uniqueTables = Array.from(new Set(auditLogs.map(log => log.table_name)));

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Badge variant="default" className="bg-green-100 text-green-800">INSERT</Badge>;
      case 'UPDATE':
        return <Badge variant="secondary">UPDATE</Badge>;
      case 'DELETE':
        return <Badge variant="destructive">DELETE</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  const getTableIcon = (tableName: string) => {
    switch (tableName) {
      case 'farmers':
        return <User className="h-4 w-4" />;
      case 'farmer_groups':
        return <Database className="h-4 w-4" />;
      case 'loans':
        return <Database className="h-4 w-4" />;
      case 'deliveries':
        return <Database className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportAuditLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Date,Action,Table,User,Record ID\n" +
      auditLogs.map(log => 
        `${formatDate(log.created_at)},"${log.action}","${log.table_name}","${userIdToDisplayName[log.user_id] || log.user_id}","${log.record_id}"`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = auditLogs.filter(log => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const userName = (userIdToDisplayName[log.user_id] || log.user_id).toLowerCase();
      const tableName = log.table_name.toLowerCase();
      const action = log.action.toLowerCase();
      
      return userName.includes(searchLower) || 
             tableName.includes(searchLower) || 
             action.includes(searchLower);
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Audit Trail</h1>
            <p className="text-muted-foreground">Track all system activities and changes</p>
          </div>
          <Button onClick={exportAuditLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search users, tables, actions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Table</label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tables</SelectItem>
                    {uniqueTables.map(table => (
                      <SelectItem key={table} value={table}>{table}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredLogs.length}</div>
              <p className="text-xs text-muted-foreground">
                Tracked activities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueUserIds.length}</div>
              <p className="text-xs text-muted-foreground">
                Users with activity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tables Modified</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueTables.length}</div>
              <p className="text-xs text-muted-foreground">
                Database tables
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {auditLogs.length > 0 ? 
                  new Date(auditLogs[0].created_at).toLocaleDateString() : 
                  'No activity'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Latest activity date
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Audit Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Detailed view of all system activities and changes</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No audit logs found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Record ID</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{formatDate(activity.created_at)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getActionBadge(activity.action)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTableIcon(activity.table_name)}
                            <span className="capitalize">{activity.table_name.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {userIdToDisplayName[activity.user_id] || activity.user_id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {activity.record_id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
