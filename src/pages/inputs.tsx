
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
import { Plus, Package, TrendingDown, Users, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";

export default function Inputs() {
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showDistributionDialog, setShowDistributionDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);

  const { data: inputItems, refetch: refetchItems } = useQuery({
    queryKey: ["input-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("input_items")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: inputStock, refetch: refetchStock } = useQuery({
    queryKey: ["input-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("input_stock")
        .select(`
          *,
          input_items(name, unit, category),
          seasons(name)
        `)
        .order("received_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: inputDistributions, refetch: refetchDistributions } = useQuery({
    queryKey: ["input-distributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("input_distributions")
        .select(`
          *,
          input_items(name, unit, category),
          farmer_groups(name),
          farmers(full_name),
          seasons(name)
        `)
        .order("distribution_date", { ascending: false });
      
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

  const { data: farmerGroups } = useQuery({
    queryKey: ["farmer-groups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("farmer_groups")
        .select("*")
        .order("name");
      
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

  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const itemData = {
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        unit: formData.get("unit") as string,
        sku: formData.get("sku") as string || null,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from("input_items")
        .insert([itemData]);

      if (error) throw error;

      toast.success("Input item created successfully!");
      setShowItemDialog(false);
      refetchItems();
    } catch (error) {
      console.error("Error creating input item:", error);
      toast.error("Failed to create input item");
    }
  };

  const handleAddStock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const stockData = {
        item_id: formData.get("item_id") as string,
        quantity: parseFloat(formData.get("quantity") as string),
        unit_cost: parseFloat(formData.get("unit_cost") as string) || null,
        source: formData.get("source") as string || null,
        season_id: formData.get("season_id") as string || null,
        received_date: formData.get("received_date") as string,
        notes: formData.get("notes") as string || null,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from("input_stock")
        .insert([stockData]);

      if (error) throw error;

      toast.success("Stock added successfully!");
      setShowStockDialog(false);
      refetchStock();
    } catch (error) {
      console.error("Error adding stock:", error);
      toast.error("Failed to add stock");
    }
  };

  const handleRecordDistribution = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const distributionData = {
        item_id: formData.get("item_id") as string,
        farmer_group_id: formData.get("farmer_group_id") as string,
        farmer_id: formData.get("farmer_id") as string || null,
        quantity: parseFloat(formData.get("quantity") as string),
        season_id: formData.get("season_id") as string || null,
        distribution_date: formData.get("distribution_date") as string,
        notes: formData.get("notes") as string || null,
        distributed_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from("input_distributions")
        .insert([distributionData]);

      if (error) throw error;

      toast.success("Distribution recorded successfully!");
      setShowDistributionDialog(false);
      refetchDistributions();
    } catch (error) {
      console.error("Error recording distribution:", error);
      toast.error("Failed to record distribution");
    }
  };

  const totalStock = inputStock?.reduce((sum, s) => sum + s.quantity, 0) || 0;
  const totalValue = inputStock?.reduce((sum, s) => sum + (s.quantity * (s.unit_cost || 0)), 0) || 0;
  const totalDistributed = inputDistributions?.reduce((sum, d) => sum + d.quantity, 0) || 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inputs & Stock</h1>
            <p className="text-muted-foreground">Manage farming inputs, stock levels, and distributions</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Input Item</DialogTitle>
                  <DialogDescription>
                    Add a new input item to the catalog
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateItem} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Item Name</Label>
                    <Input name="name" required placeholder="e.g., NPK Fertilizer" />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fertilizer">Fertilizer</SelectItem>
                        <SelectItem value="pesticide">Pesticide</SelectItem>
                        <SelectItem value="herbicide">Herbicide</SelectItem>
                        <SelectItem value="seed">Seed</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select name="unit" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilograms</SelectItem>
                        <SelectItem value="liters">Liters</SelectItem>
                        <SelectItem value="bags">Bags</SelectItem>
                        <SelectItem value="pieces">Pieces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sku">SKU (Optional)</Label>
                    <Input name="sku" placeholder="Product code" />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowItemDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Item</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Stock
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Stock</DialogTitle>
                  <DialogDescription>
                    Record new stock received
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddStock} className="space-y-4">
                  <div>
                    <Label htmlFor="item_id">Input Item</Label>
                    <Select name="item_id" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select item" />
                      </SelectTrigger>
                      <SelectContent>
                        {inputItems?.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.name} ({item.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input name="quantity" type="number" step="0.1" required placeholder="Enter quantity" />
                  </div>
                  <div>
                    <Label htmlFor="unit_cost">Unit Cost ($)</Label>
                    <Input name="unit_cost" type="number" step="0.01" placeholder="Cost per unit" />
                  </div>
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Input name="source" placeholder="Supplier name" />
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
                    <Label htmlFor="received_date">Received Date</Label>
                    <Input 
                      name="received_date" 
                      type="date" 
                      required 
                      defaultValue={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea name="notes" placeholder="Additional notes..." rows={2} />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowStockDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Add Stock</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Items in Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inputItems?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Stock Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStock.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Distributed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDistributed.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stock" className="w-full">
          <TabsList>
            <TabsTrigger value="stock">Stock Levels</TabsTrigger>
            <TabsTrigger value="distributions">Distributions</TabsTrigger>
            <TabsTrigger value="items">Item Catalog</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <CardTitle>Current Stock</CardTitle>
                <CardDescription>Available input stock and inventory levels</CardDescription>
              </CardHeader>
              <CardContent>
                {inputStock?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Cost</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inputStock.map((stock) => (
                        <TableRow key={stock.id}>
                          <TableCell className="font-medium">{stock.input_items?.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{stock.input_items?.category}</Badge>
                          </TableCell>
                          <TableCell>{stock.quantity} {stock.input_items?.unit}</TableCell>
                          <TableCell>${stock.unit_cost?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>${((stock.quantity || 0) * (stock.unit_cost || 0)).toFixed(2)}</TableCell>
                          <TableCell>{format(new Date(stock.received_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{stock.source || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4" />
                    <p>No stock recorded yet</p>
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
                  <Dialog open={showDistributionDialog} onOpenChange={setShowDistributionDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Users className="h-4 w-4 mr-2" />
                        Record Distribution
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Record Distribution</DialogTitle>
                        <DialogDescription>
                          Track input distribution to clubs/farmers
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleRecordDistribution} className="space-y-4">
                        <div>
                          <Label htmlFor="item_id">Input Item</Label>
                          <Select name="item_id" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {inputItems?.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.name} ({item.unit})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="farmer_group_id">Club</Label>
                          <Select name="farmer_group_id" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select club" />
                            </SelectTrigger>
                            <SelectContent>
                              {farmerGroups?.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="farmer_id">Specific Farmer (Optional)</Label>
                          <Select name="farmer_id">
                            <SelectTrigger>
                              <SelectValue placeholder="Select farmer" />
                            </SelectTrigger>
                            <SelectContent>
                              {farmers?.map((farmer) => (
                                <SelectItem key={farmer.id} value={farmer.id}>
                                  {farmer.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input name="quantity" type="number" step="0.1" required placeholder="Enter quantity" />
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
                          <Label htmlFor="distribution_date">Distribution Date</Label>
                          <Input 
                            name="distribution_date" 
                            type="date" 
                            required 
                            defaultValue={new Date().toISOString().split('T')[0]}
                          />
                        </div>
                        <div>
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea name="notes" placeholder="Distribution notes..." rows={2} />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setShowDistributionDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Record Distribution</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {inputDistributions?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Farmer</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Acknowledged</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inputDistributions.map((distribution) => (
                        <TableRow key={distribution.id}>
                          <TableCell>{format(new Date(distribution.distribution_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="font-medium">{distribution.input_items?.name}</TableCell>
                          <TableCell>{distribution.farmer_groups?.name}</TableCell>
                          <TableCell>{distribution.farmers?.full_name || '-'}</TableCell>
                          <TableCell>{distribution.quantity} {distribution.input_items?.unit}</TableCell>
                          <TableCell>
                            {distribution.acknowledgement_received ? (
                              <Badge variant="default">Yes</Badge>
                            ) : (
                              <Badge variant="secondary">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingDown className="h-12 w-12 mx-auto mb-4" />
                    <p>No distributions recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="items">
            <Card>
              <CardHeader>
                <CardTitle>Item Catalog</CardTitle>
                <CardDescription>Manage input items and categories</CardDescription>
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
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inputItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>{item.sku || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={item.active ? "default" : "secondary"}>
                              {item.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                    <p>No input items in catalog yet</p>
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
