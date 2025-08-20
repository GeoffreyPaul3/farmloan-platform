
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ShoppingCart, Scale, DollarSign } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Deliveries() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record Cotton Delivery</DialogTitle>
                <DialogDescription>
                  Capture delivery details at the buying post
                </DialogDescription>
              </DialogHeader>
              <div className="p-4 text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
                <p>Delivery recording form would be implemented here with weight, farmer selection, and grading</p>
              </div>
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
      </div>
    </DashboardLayout>
  );
}
