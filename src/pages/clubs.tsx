
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Users, FileText, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function Clubs() {
  const { user } = useAuth();
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: clubs, isLoading, refetch } = useQuery({
    queryKey: ["clubs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_groups")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: farmers } = useQuery({
    queryKey: ["farmers", selectedClub?.id],
    queryFn: async () => {
      if (!selectedClub?.id) return [];
      
      const { data, error } = await supabase
        .from("farmers")
        .select("*")
        .eq("farmer_group_id", selectedClub.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClub?.id,
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
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
            <h1 className="text-3xl font-bold text-foreground">Cotton Clubs</h1>
            <p className="text-muted-foreground">Manage farmer groups and club registrations</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Club
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Club</DialogTitle>
                <DialogDescription>
                  Register a new cotton farmer club with complete details
                </DialogDescription>
              </DialogHeader>
              <ClubForm onSuccess={() => {
                setShowCreateDialog(false);
                refetch();
              }} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Clubs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clubs?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Clubs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clubs?.filter(c => c.status === 'active').length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clubs?.reduce((sum, club) => sum + (club.total_members || 0), 0) || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Credit Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clubs?.length ? 
                  (clubs.reduce((sum, club) => sum + (club.credit_score || 0), 0) / clubs.length).toFixed(1)
                  : '0.0'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Clubs Directory</CardTitle>
                <CardDescription>Select a club to view details</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {clubs?.map((club) => (
                    <div
                      key={club.id}
                      className={`p-4 border-b border-border cursor-pointer hover:bg-accent transition-colors ${
                        selectedClub?.id === club.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedClub(club)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{club.name}</h3>
                          <p className="text-sm text-muted-foreground">{club.location}</p>
                        </div>
                        <Badge variant={club.status === 'active' ? 'default' : 'secondary'}>
                          {club.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {selectedClub ? (
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Club Details</TabsTrigger>
                  <TabsTrigger value="members">Members ({farmers?.length || 0})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        {selectedClub.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Club Type</Label>
                          <p className="text-sm text-muted-foreground">{selectedClub.club_type || 'Not specified'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Total Members</Label>
                          <p className="text-sm text-muted-foreground">{selectedClub.total_members || 0}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Village Headman</Label>
                          <p className="text-sm text-muted-foreground">{selectedClub.village_headman || 'Not specified'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Traditional Authority</Label>
                          <p className="text-sm text-muted-foreground">{selectedClub.traditional_authority || 'Not specified'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">EPA</Label>
                          <p className="text-sm text-muted-foreground">{selectedClub.epa || 'Not specified'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Credit Score</Label>
                          <p className="text-sm text-muted-foreground">{selectedClub.credit_score || 0}</p>
                        </div>
                      </div>
                      
                      {selectedClub.chairperson_name && (
                        <div className="border-t pt-4">
                          <Label className="text-sm font-medium">Chairperson</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm">{selectedClub.chairperson_name}</span>
                            {selectedClub.chairperson_phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {selectedClub.chairperson_phone}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {selectedClub.contract_path && (
                        <div className="border-t pt-4">
                          <Label className="text-sm font-medium">Contract</Label>
                          <div className="flex items-center gap-2 mt-2">
                            <FileText className="h-4 w-4" />
                            <Button variant="link" className="p-0 h-auto">
                              View Contract
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="members">
                  <Card>
                    <CardHeader>
                      <CardTitle>Club Members</CardTitle>
                      <CardDescription>
                        Farmers registered under {selectedClub.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {farmers?.length ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>National ID</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Farm Size</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {farmers.map((farmer) => (
                              <TableRow key={farmer.id}>
                                <TableCell className="font-medium">{farmer.full_name}</TableCell>
                                <TableCell>{farmer.national_id || 'Not provided'}</TableCell>
                                <TableCell>{farmer.phone}</TableCell>
                                <TableCell>{farmer.farm_size_acres ? `${farmer.farm_size_acres} acres` : 'Not specified'}</TableCell>
                                <TableCell>
                                  <Badge variant={farmer.status === 'active' ? 'default' : 'secondary'}>
                                    {farmer.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No members registered yet
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Select a club to view details</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ClubForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    club_type: '',
    location: '',
    village_headman: '',
    group_village_headman: '',
    traditional_authority: '',
    epa: '',
    chairperson_name: '',
    chairperson_phone: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    total_members: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("farmer_groups")
        .insert({
          ...formData,
          created_by: user?.id,
          status: 'active',
        });

      if (error) throw error;
      
      toast.success("Club created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error creating club:", error);
      toast.error("Failed to create club");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Club Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="club_type">Club Type</Label>
          <Input
            id="club_type"
            value={formData.club_type}
            onChange={(e) => setFormData({ ...formData, club_type: e.target.value })}
            placeholder="Association, Cooperative, etc."
          />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="village_headman">Village Headman</Label>
          <Input
            id="village_headman"
            value={formData.village_headman}
            onChange={(e) => setFormData({ ...formData, village_headman: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="traditional_authority">Traditional Authority</Label>
          <Input
            id="traditional_authority"
            value={formData.traditional_authority}
            onChange={(e) => setFormData({ ...formData, traditional_authority: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="epa">EPA</Label>
          <Input
            id="epa"
            value={formData.epa}
            onChange={(e) => setFormData({ ...formData, epa: e.target.value })}
            placeholder="Extension Planning Area"
          />
        </div>
        <div>
          <Label htmlFor="chairperson_name">Chairperson Name</Label>
          <Input
            id="chairperson_name"
            value={formData.chairperson_name}
            onChange={(e) => setFormData({ ...formData, chairperson_name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="chairperson_phone">Chairperson Phone</Label>
          <Input
            id="chairperson_phone"
            value={formData.chairperson_phone}
            onChange={(e) => setFormData({ ...formData, chairperson_phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="contact_person">Contact Person</Label>
          <Input
            id="contact_person"
            value={formData.contact_person}
            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input
            id="contact_phone"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="total_members">Initial Member Count</Label>
          <Input
            id="total_members"
            type="number"
            value={formData.total_members}
            onChange={(e) => setFormData({ ...formData, total_members: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit">Create Club</Button>
      </div>
    </form>
  );
}
