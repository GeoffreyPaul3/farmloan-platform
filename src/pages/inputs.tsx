
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function Inputs() {
  const { user } = useAuth();
  const [showCreateItemDialog, setShowCreateItemDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showDistributionDialog, setShowDistributionDialog] = useState(false);

  const { data: inputItems, refetch: refetchItems } = useQuery({
    queryKey: ["input-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("input_items")
        .select("*")
        .eq("active", true)
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: stockLevels } = useQuery({
    queryKey: ["input-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("input_stock")
        .select(`
          *,
          input_items(name, category, unit)
        `)
        .order("received_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: distributions } = useQuery({
    queryKey: ["input-distributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("input_distributions")
        .select(`
          *,
          input_items(name, category, unit),
          farmer_groups(name),
          farmers(full_name)
        `)
        .order("distribution_date", { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate stock summary
  const stockSummary = stockLevels?.reduce((acc, stock) => {
    const key = stock.item_id;
    if (!acc[key]) {
      acc[key] = {
        item: stock.input_items,
        totalQuantity: 0,
        entries: 0
      };
    }
    acc[key].totalQuantity += stock.quantity;
    acc[key].entries += 1;
    return acc;
  }, {} as Record<string, any>);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inputs & Stock</h1>
            <p className="text-muted-foreground">Manage farm inputs, stock levels, and distributions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Input Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inputItems?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Stock Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stockLevels?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Distributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{distributions?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {Object.values(stockSummary || {}).filter(item => item.totalQuantity < 10).length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="items">
          <TabsList>
            <TabsTrigger value="items">Input Items</TabsTrigger>
            <TabsTrigger value="stock">Stock Levels</TabsTrigger>
            <TabsTrigger value="distributions">Distributions</TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Input Items</CardTitle>
                    <CardDescription>Manage fertilizers, pesticides, seeds, and other inputs</CardDescription>
                  </div>
                  <Dialog open={showCreateItemDialog} onOpenChange={setShowCreateItemDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Input Item</DialogTitle>
                        <DialogDescription>Create a new input item for tracking</DialogDescription>
                      </DialogHeader>
                      <InputItemForm onSuccess={() => {
                        setShowCreateItemDialog(false);
                        refetchItems();
                      }} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {inputItems?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Stock Level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inputItems.map((item) => {
                        const stockInfo = stockSummary?.[item.id];
                        const totalStock = stockInfo?.totalQuantity || 0;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.category}</Badge>
                            </TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell>{item.sku || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span>{totalStock}</span>
                                {totalStock < 10 && (
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4" />
                    <p>No input items created yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Stock Levels</CardTitle>
                    <CardDescription>Track input stock receipts and current levels</CardDescription>
                  </div>
                  <Button onClick={() => setShowStockDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Stock
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {stockLevels?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Received Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockLevels.map((stock) => (
                        <TableRow key={stock.id}>
                          <TableCell className="font-medium">{stock.input_items?.name}</TableCell>
                          <TableCell>{stock.quantity} {stock.input_items?.unit}</TableCell>
                          <TableCell>{stock.unit_cost ? `$${stock.unit_cost}` : 'N/A'}</TableCell>
                          <TableCell>{stock.source || 'N/A'}</TableCell>
                          <TableCell>{new Date(stock.received_date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>No stock entries yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distributions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Input Distributions</CardTitle>
                    <CardDescription>Track input distributions to clubs and farmers</CardDescription>
                  </div>
                  <Button onClick={() => setShowDistributionDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Record Distribution
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {distributions?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Farmer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Acknowledged</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {distributions.map((dist) => (
                        <TableRow key={dist.id}>
                          <TableCell className="font-medium">{dist.input_items?.name}</TableCell>
                          <TableCell>{dist.quantity} {dist.input_items?.unit}</TableCell>
                          <TableCell>{dist.farmer_groups?.name}</TableCell>
                          <TableCell>{dist.farmers?.full_name || 'Club-wide'}</TableCell>
                          <TableCell>{new Date(dist.distribution_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={dist.acknowledgement_received ? 'default' : 'secondary'}>
                              {dist.acknowledgement_received ? 'Yes' : 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4" />
                    <p>No distributions recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

function InputItemForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    unit: 'kg',
    sku: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from("input_items")
        .insert({
          ...formData,
          created_by: user?.id,
        });

      if (error) throw error;
      
      toast.success("Input item created successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error creating input item:", error);
      toast.error("Failed to create input item");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Item Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      
      <div>
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fertilizer">Fertilizer</SelectItem>
            <SelectItem value="pesticide">Pesticide</SelectItem>
            <SelectItem value="seed">Seed</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="sku">SKU (Optional)</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit">Create Item</Button>
      </div>
    </form>
  );
}
