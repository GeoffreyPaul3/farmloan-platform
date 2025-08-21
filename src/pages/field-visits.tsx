
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Camera, FileText } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

export default function FieldVisits() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{lat: number, lng: number} | null>(null);

  const { data: fieldVisits, isLoading, refetch } = useQuery({
    queryKey: ["field-visits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("field_visits")
        .select(`
          *,
          farmers!field_visits_farmer_id_fkey(full_name),
          farmer_groups!field_visits_farmer_group_id_fkey(name),
          seasons(name)
        `)
        .order("visit_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: farmers } = useQuery({
    queryKey: ["farmers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmers")
        .select("*, farmer_groups(name)")
        .order("full_name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: seasons } = useQuery({
    queryKey: ["seasons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("start_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          toast.success("GPS location captured!");
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Failed to get GPS location");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
    }
  };

  const handleCreateVisit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const farmerId = formData.get("farmer_id") as string;
      const farmer = farmers?.find(f => f.id === farmerId);
      
      const visitData = {
        farmer_id: farmerId,
        farmer_group_id: farmer?.farmer_group_id,
        season_id: formData.get("season_id") as string || null,
        visit_date: formData.get("visit_date") as string,
        crop_stage: formData.get("crop_stage") as "sowing" | "vegetative" | "flowering" | "boll_formation" | "maturity" | "harvest",
        observations: formData.get("observations") as string,
        expected_yield: parseFloat(formData.get("expected_yield") as string) || null,
        gps_lat: gpsLocation?.lat,
        gps_lng: gpsLocation?.lng,
        photos: [],
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from("field_visits")
        .insert([visitData]);

      if (error) throw error;

      toast.success("Field visit recorded successfully!");
      setShowCreateDialog(false);
      setGpsLocation(null);
      refetch();
    } catch (error) {
      console.error("Error creating field visit:", error);
      toast.error("Failed to record field visit");
    }
  };

  const getCropStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'seedling': return 'bg-green-100 text-green-800';
      case 'vegetative': return 'bg-blue-100 text-blue-800';
      case 'flowering': return 'bg-yellow-100 text-yellow-800';
      case 'fruiting': return 'bg-orange-100 text-orange-800';
      case 'maturity': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const totalVisits = fieldVisits?.length || 0;
  const totalExpectedYield = fieldVisits?.reduce((sum, v) => sum + (v.expected_yield || 0), 0) || 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Field Monitoring</h1>
            <p className="text-muted-foreground">Track field visits, crop progress, and yield forecasts</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Visit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Field Visit</DialogTitle>
                <DialogDescription>
                  Document field conditions and observations
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateVisit} className="space-y-4">
                <div>
                  <Label htmlFor="farmer_id">Farmer</Label>
                  <Select name="farmer_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select farmer" />
                    </SelectTrigger>
                    <SelectContent>
                      {farmers?.map((farmer) => (
                        <SelectItem key={farmer.id} value={farmer.id}>
                          {farmer.full_name} ({farmer.farmer_groups?.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="season_id">Season (Optional)</Label>
                  <Select name="season_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Select season" />
                    </SelectTrigger>
                    <SelectContent>
                      {seasons?.map((season) => (
                        <SelectItem key={season.id} value={season.id}>
                          {season.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="visit_date">Visit Date</Label>
                  <Input 
                    name="visit_date" 
                    type="date" 
                    required 
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="crop_stage">Crop Stage</Label>
                  <Select name="crop_stage">
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seedling">Seedling</SelectItem>
                      <SelectItem value="vegetative">Vegetative</SelectItem>
                      <SelectItem value="flowering">Flowering</SelectItem>
                      <SelectItem value="fruiting">Fruiting</SelectItem>
                      <SelectItem value="maturity">Maturity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expected_yield">Expected Yield (kg)</Label>
                  <Input 
                    name="expected_yield" 
                    type="number" 
                    step="0.1" 
                    placeholder="Enter expected yield"
                  />
                </div>
                <div>
                  <Label htmlFor="observations">Observations</Label>
                  <Textarea 
                    name="observations" 
                    placeholder="Record field observations, conditions, recommendations..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button type="button" variant="outline" onClick={getCurrentLocation}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Capture GPS
                  </Button>
                  {gpsLocation && (
                    <Badge variant="default">
                      GPS: {gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}
                    </Badge>
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Record Visit</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalVisits}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Expected Yield</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalExpectedYield.toFixed(1)} kg</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Yield/Visit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalVisits ? (totalExpectedYield / totalVisits).toFixed(1) : '0.0'} kg
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Field Visits</CardTitle>
            <CardDescription>Field monitoring activities and observations</CardDescription>
          </CardHeader>
          <CardContent>
            {fieldVisits?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Crop Stage</TableHead>
                    <TableHead>Expected Yield</TableHead>
                    <TableHead>GPS</TableHead>
                    <TableHead>Observations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>{format(new Date(visit.visit_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="font-medium">{visit.farmers?.full_name}</TableCell>
                      <TableCell>{visit.farmer_groups?.name}</TableCell>
                      <TableCell>
                        {visit.crop_stage && (
                          <Badge className={getCropStageColor(visit.crop_stage)}>
                            {visit.crop_stage}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{visit.expected_yield ? `${visit.expected_yield} kg` : '-'}</TableCell>
                      <TableCell>
                        {visit.gps_lat && visit.gps_lng ? (
                          <Badge variant="outline">
                            <MapPin className="h-3 w-3 mr-1" />
                            GPS
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {visit.observations || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>No field visits recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
