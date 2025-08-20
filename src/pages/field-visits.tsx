
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, MapPin, Camera, Users } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function FieldVisits() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: fieldVisits, isLoading, refetch } = useQuery({
    queryKey: ["field-visits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("field_visits")
        .select(`
          *,
          farmers(full_name),
          farmer_groups(name),
          seasons(name)
        `)
        .order("visit_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record Field Visit</DialogTitle>
                <DialogDescription>
                  Document field observations, crop stage, and expected yield
                </DialogDescription>
              </DialogHeader>
              <div className="p-4 text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4" />
                <p>Field visit form would be implemented here with GPS capture, photo upload, and crop stage tracking</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{fieldVisits?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fieldVisits?.filter(v => 
                  new Date(v.visit_date).getMonth() === new Date().getMonth()
                ).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Farms Visited</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(fieldVisits?.map(v => v.farmer_id)).size || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Expected Yield</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {fieldVisits?.length ? 
                  (fieldVisits.reduce((sum, v) => sum + (v.expected_yield || 0), 0) / fieldVisits.length).toFixed(1)
                  : '0.0'
                } kg
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Field Visits</CardTitle>
            <CardDescription>Latest field monitoring activities</CardDescription>
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
                    <TableHead>Photos</TableHead>
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
                          <Badge variant="outline">
                            {visit.crop_stage.replace('_', ' ')}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{visit.expected_yield ? `${visit.expected_yield} kg` : 'N/A'}</TableCell>
                      <TableCell>
                        {visit.gps_lat && visit.gps_lng ? (
                          <Badge variant="secondary">
                            <MapPin className="h-3 w-3 mr-1" />
                            GPS
                          </Badge>
                        ) : (
                          'No GPS'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Camera className="h-4 w-4" />
                          {Array.isArray(visit.photos) ? visit.photos.length : 0}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-4" />
                <p>No field visits recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
