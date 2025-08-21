import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Shield, 
  Settings, 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Plus,
  Edit,
  Trash2,
  Download
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'staff';
  approved: boolean;
  phone?: string;
  created_at: string;
}

interface UserFormData {
  email: string;
  full_name: string;
  role: 'admin' | 'staff';
  phone: string;
}

interface SystemStats {
  users: number;
  clubs: number;
  farmers: number;
  loans: number;
  deliveries: number;
}

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

export default function Admin() {
  const { user } = useAuth();
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>({
    email: "",
    full_name: "",
    role: "staff",
    phone: ""
  });
  const queryClient = useQueryClient();

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ approved: true })
        .eq("user_id", userId);
      
      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      toast.success("User approved successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (error) => {
      toast.error("Failed to approve user");
      console.error("Approve user error:", error);
    }
  });

  // Reject user mutation
  const rejectUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("profiles")
        .update({ approved: false })
        .eq("user_id", userId);
      
      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      toast.success("User rejected successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
    onError: (error) => {
      toast.error("Failed to reject user");
      console.error("Reject user error:", error);
    }
  });

  // Check if user is admin
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      return data as UserProfile | null;
    },
    enabled: !!user?.id,
  });

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as UserProfile[];
    },
  });

  // Fetch system stats
  const { data: systemStats } = useQuery({
    queryKey: ["system-stats"],
    queryFn: async (): Promise<SystemStats> => {
      const [usersRes, clubsRes, farmersRes, loansRes, deliveriesRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: 'exact', head: true }),
        supabase.from("farmer_groups").select("*", { count: 'exact', head: true }),
        supabase.from("farmers").select("*", { count: 'exact', head: true }),
        supabase.from("loans").select("*", { count: 'exact', head: true }),
        supabase.from("deliveries").select("*", { count: 'exact', head: true }),
      ]);

      return {
        users: usersRes.count || 0,
        clubs: clubsRes.count || 0,
        farmers: farmersRes.count || 0,
        loans: loansRes.count || 0,
        deliveries: deliveriesRes.count || 0,
      };
    },
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as AuditLog[];
    },
  });

  // Map user_id -> profile for recent activity
  const uniqueUserIds = Array.from(new Set((recentActivity || []).map(a => a.user_id)));
  const { data: activityUsers } = useQuery({
    queryKey: ["activity-users", uniqueUserIds],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", uniqueUserIds);
      return (data || []) as Pick<UserProfile, 'user_id' | 'full_name' | 'email'>[];
    },
    enabled: uniqueUserIds.length > 0,
  });
  const userIdToDisplayName: Record<string, string> = (activityUsers || []).reduce((acc, u) => {
    acc[u.user_id] = u.full_name || u.email || u.user_id;
    return acc;
  }, {} as Record<string, string>);

  // User management mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      const { error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: "tempPassword123!",
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role,
          phone: userData.phone,
        }
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User created successfully");
      setShowUserDialog(false);
      setUserForm({ email: "", full_name: "", role: "staff", phone: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => {
      toast.error("Failed to create user");
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: UserFormData }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: userData.full_name,
          role: userData.role,
          phone: userData.phone,
        })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User updated successfully");
      setShowUserDialog(false);
      setEditingUser(null);
      setUserForm({ email: "", full_name: "", role: "staff", phone: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => {
      toast.error("Failed to update user");
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: () => {
      toast.error("Failed to delete user");
    }
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(userForm);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUserMutation.mutate({ userId: editingUser.user_id, userData: userForm });
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      phone: user.phone || ""
    });
    setShowUserDialog(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const exportData = async (tableName: 'farmers' | 'farmer_groups' | 'loans' | 'deliveries') => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*");
      
      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("No data to export");
        return;
      }

      const csvContent = "data:text/csv;charset=utf-8," + 
        Object.keys(data[0]).join(",") + "\n" +
        data.map(row => Object.values(row).join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${tableName}_export.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${tableName} data exported successfully`);
    } catch {
      toast.error("Failed to export data");
    }
  };

  // Redirect if not admin
  if (userProfile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded"></div>
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
            <h1 className="text-3xl font-bold text-foreground">System Administration</h1>
            <p className="text-muted-foreground">Manage users, monitor system activity, and configure settings</p>
          </div>
        </div>

        {/* Pending Approvals Alert */}
        {users?.filter(u => !u.approved && u.role === 'staff').length > 0 && (
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <AlertTriangle className="h-5 w-5" />
                Pending Staff Approvals
              </CardTitle>
              <CardDescription className="text-orange-700 dark:text-orange-300">
                {users.filter(u => !u.approved && u.role === 'staff').length} staff member(s) awaiting approval
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* System Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.users}</div>
              <p className="text-xs text-muted-foreground">
                Active system users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Farmer Groups</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.clubs}</div>
              <p className="text-xs text-muted-foreground">
                Registered groups
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Farmers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.farmers}</div>
              <p className="text-xs text-muted-foreground">
                Registered farmers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.loans}</div>
              <p className="text-xs text-muted-foreground">
                Total loans
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deliveries</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats?.deliveries}</div>
              <p className="text-xs text-muted-foreground">
                Processed deliveries
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="activity">System Activity</TabsTrigger>
            <TabsTrigger value="data">Data Management</TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>Manage system users and their permissions</CardDescription>
                  </div>
                  <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingUser(null);
                        setUserForm({ email: "", full_name: "", role: "staff", phone: "" });
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingUser ? "Edit User" : "Create New User"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingUser ? "Update user information" : "Add a new user to the system"}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={userForm.email}
                            onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                            disabled={!!editingUser}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            type="text"
                            value={userForm.full_name}
                            onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={userForm.phone}
                            onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select
                            value={userForm.role}
                            onValueChange={(value: 'admin' | 'staff') => setUserForm(prev => ({ ...prev, role: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="staff">Staff</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" onClick={() => setShowUserDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">
                            {editingUser ? "Update User" : "Create User"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.approved ? "default" : "secondary"}>
                            {user.approved ? "Approved" : "Pending Approval"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {!user.approved && user.role === 'staff' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => approveUserMutation.mutate(user.user_id)}
                                  disabled={approveUserMutation.isPending}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => rejectUserMutation.mutate(user.user_id)}
                                  disabled={rejectUserMutation.isPending}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.user_id !== userProfile?.user_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user.user_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent System Activity</CardTitle>
                <CardDescription>Monitor recent changes and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Table</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity?.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          {new Date(activity.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            activity.action === 'INSERT' ? 'default' :
                            activity.action === 'UPDATE' ? 'secondary' : 'destructive'
                          }>
                            {activity.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{activity.table_name}</TableCell>
                        <TableCell>{userIdToDisplayName[activity.user_id] || activity.user_id}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Management Tab */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Export data and manage system information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Export Data</h3>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        onClick={() => exportData('farmers')}
                        className="w-full justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Farmers
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => exportData('farmer_groups')}
                        className="w-full justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Clubs
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => exportData('loans')}
                        className="w-full justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Loans
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => exportData('deliveries')}
                        className="w-full justify-start"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Deliveries
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold">System Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Database Size:</span>
                        <span className="text-muted-foreground">Calculating...</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Storage Used:</span>
                        <span className="text-muted-foreground">Calculating...</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Backup:</span>
                        <span className="text-muted-foreground">Not configured</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}