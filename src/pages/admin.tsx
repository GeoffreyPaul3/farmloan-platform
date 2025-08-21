import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  Building2
} from "lucide-react";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  approved: boolean;
  created_at: string;
}

interface ClubAssignment {
  id: string;
  user_id: string;
  farmer_group_id: string;
  assigned_by: string;
  created_at: string;
  profiles: Profile;
  farmer_groups: {
    id: string;
    name: string;
    location: string;
  };
}

export default function Admin() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Fetch all users/profiles
  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    }
  });

  // Fetch farmer groups for assignments
  const { data: farmerGroups } = useQuery({
    queryKey: ['admin-farmer-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('farmer_groups')
        .select('id, name, location')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Fetch club assignments
  const { data: assignments } = useQuery({
    queryKey: ['admin-club-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('club_assignments')
        .select(`
          *,
          profiles(id, email, full_name, role),
          farmer_groups(id, name, location)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any;
    }
  });

  // Approve user mutation
  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ approved: true })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast.success("User approved successfully");
    },
    onError: (error) => {
      console.error('Error approving user:', error);
      toast.error("Failed to approve user");
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role: role as any })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast.success("Role updated successfully");
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast.error("Failed to update role");
    }
  });

  // Assign to club mutation
  const assignToClubMutation = useMutation({
    mutationFn: async ({ userId, farmerGroupId }: { userId: string; farmerGroupId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('club_assignments')
        .insert({
          user_id: userId,
          farmer_group_id: farmerGroupId,
          assigned_by: user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-club-assignments'] });
      setShowAssignDialog(false);
      setSelectedUserId(null);
      setSelectedClubId("");
      toast.success("User assigned to club successfully");
    },
    onError: (error) => {
      console.error('Error assigning user to club:', error);
      toast.error("Failed to assign user to club");
    }
  });

  const handleAssignToClub = () => {
    if (!selectedUserId || !selectedClubId) return;
    assignToClubMutation.mutate({ 
      userId: selectedUserId, 
      farmerGroupId: selectedClubId 
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'manager':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  const getStatusColor = (approved: boolean) => {
    return approved 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  };

  const pendingApprovals = profiles?.filter(p => !p.approved).length || 0;
  const totalUsers = profiles?.length || 0;
  const totalAssignments = assignments?.length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground mt-2">
              Manage users, roles, and system settings
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Total Users</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Pending Approvals</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Club Assignments</p>
                  <p className="text-2xl font-bold">{totalAssignments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">{totalUsers - pendingApprovals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="assignments">Club Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Approve users and manage their roles and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profilesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : profiles && profiles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell>
                            <div className="font-medium">{profile.full_name}</div>
                            {profile.phone && (
                              <div className="text-sm text-muted-foreground">{profile.phone}</div>
                            )}
                          </TableCell>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={getRoleColor(profile.role)}>
                                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                              </Badge>
                              <Select
                                value={profile.role}
                                onValueChange={(value) => 
                                  updateRoleMutation.mutate({ 
                                    userId: profile.user_id, 
                                    role: value 
                                  })
                                }
                              >
                                <SelectTrigger className="w-24 h-6 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="staff">Staff</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(profile.approved)}>
                              {profile.approved ? (
                                <>
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Approved
                                </>
                              ) : (
                                <>
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {!profile.approved && (
                                <Button
                                  size="sm"
                                  onClick={() => approveUserMutation.mutate(profile.user_id)}
                                  disabled={approveUserMutation.isPending}
                                >
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUserId(profile.user_id);
                                  setShowAssignDialog(true);
                                }}
                              >
                                <Building2 className="h-3 w-3 mr-1" />
                                Assign Club
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No users found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Club Assignments</CardTitle>
                <CardDescription>
                  View and manage user assignments to farmer clubs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignments && assignments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Assigned Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments?.map((assignment: any) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div className="font-medium">{assignment.profiles?.full_name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{assignment.profiles?.email || 'Unknown'}</div>
                          </TableCell>
                          <TableCell className="font-medium">{assignment.farmer_groups?.name || 'Unknown'}</TableCell>
                          <TableCell>{assignment.farmer_groups?.location || 'Unknown'}</TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(assignment.profiles?.role || 'staff')}>
                              {(assignment.profiles?.role || 'staff').charAt(0).toUpperCase() + (assignment.profiles?.role || 'staff').slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(assignment.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No club assignments found
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Assign to Club Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign User to Club</DialogTitle>
              <DialogDescription>
                Select a farmer club to assign the user to
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="club">Select Club</Label>
                <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a club..." />
                  </SelectTrigger>
                  <SelectContent>
                    {farmerGroups?.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name} - {group.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleAssignToClub}
                  disabled={!selectedClubId || assignToClubMutation.isPending}
                  className="flex-1"
                >
                  {assignToClubMutation.isPending ? "Assigning..." : "Assign"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAssignDialog(false)}
                  disabled={assignToClubMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}