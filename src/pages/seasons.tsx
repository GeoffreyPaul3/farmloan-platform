
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Calendar, CheckCircle, Circle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Seasons() {
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: seasons, isLoading, refetch } = useQuery({
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

  const handleToggleActive = async (seasonId: string, currentStatus: boolean) => {
    try {
      // First, deactivate all other seasons if we're activating this one
      if (!currentStatus) {
        await supabase
          .from("seasons")
          .update({ is_active: false })
          .neq("id", seasonId);
      }

      // Then update the selected season
      const { error } = await supabase
        .from("seasons")
        .update({ is_active: !currentStatus })
        .eq("id", seasonId);

      if (error) throw error;
      
      toast.success(currentStatus ? "Season deactivated" : "Season activated");
      refetch();
    } catch (error) {
      console.error("Error updating season:", error);
      toast.error("Failed to update season");
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

  const activeSeason = seasons?.find(s => s.is_active);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Seasons</h1>
            <p className="text-muted-foreground">Manage farming seasons and periods</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Season
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Season</DialogTitle>
                <DialogDescription>
                  Define a new farming season with start and end dates
                </DialogDescription>
              </DialogHeader>
              <SeasonForm onSuccess={() => {
                setShowCreateDialog(false);
                refetch();
              }} />
            </DialogContent>
          </Dialog>
        </div>

        {activeSeason && (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Active Season: {activeSeason.name}
              </CardTitle>
              <CardDescription>
                {format(new Date(activeSeason.start_date), "MMM dd, yyyy")} - {format(new Date(activeSeason.end_date), "MMM dd, yyyy")}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Seasons</CardTitle>
            <CardDescription>Manage and track farming seasons</CardDescription>
          </CardHeader>
          <CardContent>
            {seasons?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Season Name</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasons.map((season) => (
                    <TableRow key={season.id}>
                      <TableCell className="font-medium">{season.name}</TableCell>
                      <TableCell>{format(new Date(season.start_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{format(new Date(season.end_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant={season.is_active ? 'default' : 'secondary'}>
                          {season.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(season.id, season.is_active)}
                        >
                          {season.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4" />
                <p>No seasons created yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function SeasonForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // If this season is being set as active, deactivate all others first
      if (formData.is_active) {
        await supabase
          .from("seasons")
          .update({ is_active: false })
          .neq("id", "");
      }

      const { error } = await supabase
        .from("seasons")
        .insert({
          ...formData,
          created_by: user?.id,
        });

      if (error) throw error;
      
      toast.success("Season created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error creating season:", error);
      toast.error("Failed to create season");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Season Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., 2024 Cotton Season"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_active"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
        />
        <Label htmlFor="is_active">Set as active season</Label>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit">Create Season</Button>
      </div>
    </form>
  );
}
