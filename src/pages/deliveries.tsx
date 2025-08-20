
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ShoppingCart, Scale, DollarSign } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Deliveries() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showGradingDialog, setShowGradingDialog] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string | null>(null);

  const { data: deliveries, isLoading, refetch } = useQuery({
    queryKey: ["deliveries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliveries")
        .select(`
          *,
          farmers(full_name),
          farmer_groups(name),
          seasons(name)
        `)
        .order("delivery_date", { ascending: false });
      
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

  const { data: gradingEntries } = useQuery({
    queryKey: ["grading-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grading_entries")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleCreateDelivery = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const farmerId = formData.get("farmer_id") as string;
      const farmer = farmers?.find(f => f.id === farmerId);
      
      const deliveryData = {
        farmer_id: farmerId,
        farmer_group_id: farmer?.farmer_group_id,
        season_id: formData.get("season_id") as string || null,
        weight: parseFloat(formData.get("weight") as string),
        price_per_kg: parseFloat(formData.get("price_per_kg") as string),
        delivery_date: formData.get("delivery_date") as string,
        officer_id: (await supabase.auth.getUser()).data.user?.id
      };

      deliveryData.gross_amount = deliveryData.weight * deliveryData.price_per_kg;

      const { error } = await supabase
        .from("deliveries")
        .insert([deliveryData]);

      if (error) throw error;

      toast.success("Cotton delivery recorded successfully!");
      setShowCreateDialog(false);
      refetch();
    } catch (error) {
      console.error("Error creating delivery:", error);
      toast.error("Failed to record delivery");
    }
  };

  const handleCreateGrading = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const gradingData = {
        delivery_id: selectedDeliveryId,
        weight: parseFloat(formData.get("weight") as string),
        grade: formData.get("grade") as string,
        grader_id: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from("grading_entries")
        .insert([gradingData]);

      if (error) throw error;

      toast.success("Grading entry recorded successfully!");
      setShowGradingDialog(false);
      setSelectedDeliveryId(null);
      refetch();
    } catch (error) {
      console.error("Error creating grading:", error);
      toast.error("Failed to record grading");
    }
  };

  const handleProcessPayment = async (deliveryId: string) => {
    try {
      const response = await supabase.functions.invoke('process-delivery', {
        body: {
          deliveryId,
          paymentMethod: 'bank'
        }
      });

      if (response.error) throw response.error;
      
      toast.success("Payment processed successfully!");
      refetch();
    } catch (error) {
      console.error("Error processing payment:", error);
      toast.error("Failed to process payment");
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

  const totalWeight = deliveries?.reduce((sum, d) => sum + (d.weight || 0), 0) || 0;
  const totalValue = deliveries?.reduce((sum, d) => sum + (d.gross_amount || 0), 0) || 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Buying & Grading</h1>
            <p className="text-muted-foreground">Manage cotton deliveries, grading, and payments</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Delivery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Record Cotton Delivery</DialogTitle>
                <DialogDescription>
                  Capture delivery details at the buying post
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateDelivery} className="space-y-4">
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
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input 
                    name="weight" 
                    type="number" 
                    step="0.1" 
                    required 
                    placeholder="Enter weight"
                  />
                </div>
                <div>
                  <Label htmlFor="price_per_kg">Price per KG ($)</Label>
                  <Input 
                    name="price_per_kg" 
                    type="number" 
                    step="0.01" 
                    required 
                    placeholder="Enter price per kg"
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_date">Delivery Date</Label>
                  <Input 
                    name="delivery_date" 
                    type="date" 
                    required 
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Record Delivery</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deliveries?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWeight.toFixed(1)} kg</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Price/kg</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalWeight ? (totalValue / totalWeight).toFixed(2) : '0.00'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Deliveries</CardTitle>
            <CardDescription>Cotton deliveries and their processing status</CardDescription>
          </CardHeader>
          <CardContent>
            {deliveries?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                    <TableHead>Price/kg</TableHead>
                    <TableHead>Gross Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => {
                    const hasGrading = gradingEntries?.some(g => g.delivery_id === delivery.id);
                    
                    return (
                      <TableRow key={delivery.id}>
                        <TableCell>{format(new Date(delivery.delivery_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="font-medium">{delivery.farmers?.full_name}</TableCell>
                        <TableCell>{delivery.farmer_groups?.name}</TableCell>
                        <TableCell>{delivery.weight}</TableCell>
                        <TableCell>${delivery.price_per_kg?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>${delivery.gross_amount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {hasGrading ? (
                              <Badge variant="default">Graded</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedDeliveryId(delivery.id);
                                setShowGradingDialog(true);
                              }}
                            >
                              Add Grading
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleProcessPayment(delivery.id)}
                            >
                              Process Payment
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
                <p>No deliveries recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={showGradingDialog} onOpenChange={setShowGradingDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Grading Entry</DialogTitle>
              <DialogDescription>
                Record grading details for the selected delivery
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateGrading} className="space-y-4">
              <div>
                <Label htmlFor="weight">Graded Weight (kg)</Label>
                <Input 
                  name="weight" 
                  type="number" 
                  step="0.1" 
                  required 
                  placeholder="Enter graded weight"
                />
              </div>
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Select name="grade" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Grade A</SelectItem>
                    <SelectItem value="B">Grade B</SelectItem>
                    <SelectItem value="C">Grade C</SelectItem>
                    <SelectItem value="Reject">Reject</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowGradingDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Grading</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
