
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, FileText, Upload } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Clubs() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMemberDialog, setShowMemberDialog] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);

  const { data: clubs, isLoading, refetch } = useQuery({
    queryKey: ["farmer-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_groups")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: farmers, refetch: refetchFarmers } = useQuery({
    queryKey: ["farmers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmers")
        .select(`
          *,
          farmer_groups(name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleCreateClub = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const clubData = {
        name: formData.get("name") as string,
        club_type: formData.get("club_type") as string,
        location: formData.get("location") as string,
        chairperson_name: formData.get("chairperson_name") as string || null,
        chairperson_phone: formData.get("chairperson_phone") as string || null,
        village_headman: formData.get("village_headman") as string || null,
        group_village_headman: formData.get("group_village_headman") as string || null,
        traditional_authority: formData.get("traditional_authority") as string || null,
        epa: formData.get("epa") as string || null,
        notes: formData.get("notes") as string || null,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from("farmer_groups")
        .insert([clubData]);

      if (error) throw error;

      toast.success("Club created successfully!");
      setShowCreateDialog(false);
      refetch();
    } catch (error) {
      console.error("Error creating club:", error);
      toast.error("Failed to create club");
    }
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const memberData = {
        full_name: formData.get("full_name") as string,
        national_id: formData.get("national_id") as string || null,
        phone: formData.get("phone") as string,
        gender: formData.get("gender") as string || null,
        date_of_birth: formData.get("date_of_birth") as string || null,
        farm_size_acres: parseFloat(formData.get("farm_size_acres") as string) || null,
        farmer_group_id: selectedClubId,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from("farmers")
        .insert([memberData]);

      if (error) throw error;

      toast.success("Member added successfully!");
      setShowMemberDialog(false);
      setSelectedClubId(null);
      refetchFarmers();
      refetch();
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("Failed to add member");
    }
  };

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

  const totalClubs = clubs?.length || 0;
  const activeClubs = clubs?.filter(c => c.status === 'active').length || 0;
  
  // Calculate total members more accurately
  const totalMembers = clubs?.reduce((sum, club) => {
    // Use total_members field, but if it's 0 or null, count actual farmers
    if (club.total_members && club.total_members > 0) {
      return sum + club.total_members;
    } else {
      // Count actual farmers in this club
      const clubFarmers = farmers?.filter(f => f.farmer_group_id === club.id) || [];
      return sum + clubFarmers.length;
    }
  }, 0) || 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cotton Clubs</h1>
            <p className="text-muted-foreground">Manage farmer clubs and member registration</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Register Club
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register New Club</DialogTitle>
                <DialogDescription>
                  Create a new farmer club registration
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClub} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Club Name</Label>
                    <Input name="name" required placeholder="Enter club name" />
                  </div>
                  <div>
                    <Label htmlFor="club_type">Club Type</Label>
                    <Select name="club_type">
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Association">Association</SelectItem>
                        <SelectItem value="Cooperative">Cooperative</SelectItem>
                        <SelectItem value="Group">Group</SelectItem>
                        <SelectItem value="Society">Society</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input name="location" required placeholder="Village/Area location" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="chairperson_name">Chairperson Name</Label>
                    <Input name="chairperson_name" placeholder="Chairperson name" />
                  </div>
                  <div>
                    <Label htmlFor="chairperson_phone">Chairperson Phone</Label>
                    <Input name="chairperson_phone" placeholder="Chairperson phone" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="village_headman">Village Headman</Label>
                    <Input name="village_headman" placeholder="Village headman name" />
                  </div>
                  <div>
                    <Label htmlFor="group_village_headman">Group Village Headman</Label>
                    <Input name="group_village_headman" placeholder="GVH name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="traditional_authority">Traditional Authority</Label>
                    <Input name="traditional_authority" placeholder="TA name" />
                  </div>
                  <div>
                    <Label htmlFor="epa">EPA</Label>
                    <Input name="epa" placeholder="Extension Planning Area" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea name="notes" placeholder="Additional notes..." rows={3} />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Register Club</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClubs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Clubs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeClubs}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMembers}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clubs" className="w-full">
          <TabsList>
            <TabsTrigger value="clubs">Registered Clubs</TabsTrigger>
            <TabsTrigger value="members">Club Members</TabsTrigger>
          </TabsList>
          
          <TabsContent value="clubs">
            <Card>
              <CardHeader>
                <CardTitle>Registered Clubs</CardTitle>
                <CardDescription>All farmer clubs in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {clubs?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Club Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Contact Person</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clubs.map((club) => (
                        <TableRow key={club.id}>
                          <TableCell className="font-medium">{club.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{club.club_type}</Badge>
                          </TableCell>
                          <TableCell>{club.location}</TableCell>
                          <TableCell>{club.contact_person}</TableCell>
                          <TableCell>
                            {(() => {
                              // Use total_members field, but if it's 0 or null, count actual farmers
                              if (club.total_members && club.total_members > 0) {
                                return club.total_members;
                              } else {
                                // Count actual farmers in this club
                                const clubFarmers = farmers?.filter(f => f.farmer_group_id === club.id) || [];
                                return clubFarmers.length;
                              }
                            })()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={club.status === 'active' ? 'default' : 'secondary'}>
                              {club.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedClubId(club.id);
                                setShowMemberDialog(true);
                              }}
                            >
                              Add Member
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4" />
                    <p>No clubs registered yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle>Club Members</CardTitle>
                <CardDescription>Registered farmers across all clubs</CardDescription>
              </CardHeader>
              <CardContent>
                {farmers?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>National ID</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Farm Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {farmers.map((farmer) => (
                        <TableRow key={farmer.id}>
                          <TableCell className="font-medium">{farmer.full_name}</TableCell>
                          <TableCell>{farmer.farmer_groups?.name}</TableCell>
                          <TableCell>{farmer.national_id || '-'}</TableCell>
                          <TableCell>{farmer.phone}</TableCell>
                          <TableCell>{farmer.farm_size_acres ? `${farmer.farm_size_acres} acres` : '-'}</TableCell>
                          <TableCell>
                            <Badge variant={farmer.status === 'active' ? 'default' : 'secondary'}>
                              {farmer.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(farmer.join_date), "MMM dd, yyyy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>No members registered yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showMemberDialog} onOpenChange={setShowMemberDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Club Member</DialogTitle>
              <DialogDescription>
                Register a new farmer to the selected club
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Full Name</Label>
                <Input name="full_name" required placeholder="Enter full name" />
              </div>
              <div>
                <Label htmlFor="national_id">National ID (Optional)</Label>
                <Input name="national_id" placeholder="National ID number" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input name="phone" required placeholder="Phone number" />
              </div>
              <div>
                <Label htmlFor="gender">Gender</Label>
                <Select name="gender">
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date_of_birth">Date of Birth (Optional)</Label>
                <Input name="date_of_birth" type="date" />
              </div>
              <div>
                <Label htmlFor="farm_size_acres">Farm Size (Acres)</Label>
                <Input name="farm_size_acres" type="number" step="any" placeholder="Farm size in acres" />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowMemberDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Member</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
