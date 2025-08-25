
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
import { Plus, Package, TrendingDown, Users, AlertTriangle, Edit, DollarSign } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { InputsSearch, type SearchFilters } from "@/components/search/inputs-search";

export default function Inputs() {
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showDistributionDialog, setShowDistributionDialog] = useState(false);
  const [showCashPaymentDialog, setShowCashPaymentDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedClubId, setSelectedClubId] = useState<string>("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    searchTerm: '',
    category: 'all',
    season: 'all',
    farmerGroup: 'all'
  });

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

  // Get stock summary with consolidated quantities
  const { data: stockSummary, refetch: refetchStockSummary } = useQuery({
    queryKey: ["input-stock-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("input_stock_summary")
        .select("*")
        .order("item_name");
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate available stock levels for each item (fallback to old method)
  const availableStock = useMemo(() => {
    const stockMap = new Map();
    if (stockSummary) {
      // Use the new consolidated stock summary
      stockSummary.forEach(item => {
        stockMap.set(item.item_id, item.total_quantity);
      });
    } else if (inputStock) {
      // Fallback to old method
      inputStock.forEach(stock => {
        const itemId = stock.item_id;
        const currentStock = stockMap.get(itemId) || 0;
        stockMap.set(itemId, currentStock + stock.quantity);
      });
    }
    return stockMap;
  }, [stockSummary, inputStock]);

  const { data: inputDistributions, refetch: refetchDistributions } = useQuery({
    queryKey: ["input-distributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("input_distributions")
        .select(`
          *,
          input_items(name, unit, category),
          farmer_groups!input_distributions_farmer_group_id_fkey(name),
          farmers!input_distributions_farmer_id_fkey(full_name),
          seasons(name)
        `)
        .order("distribution_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: cashPayments, refetch: refetchCashPayments } = useQuery({
    queryKey: ["cash-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_payments")
        .select(`
          *,
          farmer_groups!cash_payments_farmer_group_id_fkey(name),
          farmers!cash_payments_farmer_id_fkey(full_name),
          seasons(name)
        `)
        .order("payment_date", { ascending: false });
      
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

  const handleEditItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const itemData = {
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        unit: formData.get("unit") as string,
        sku: formData.get("sku") as string || null,
        active: formData.get("active") === "true"
      };

      const { error } = await supabase
        .from("input_items")
        .update(itemData)
        .eq("id", editingItem.id);

      if (error) throw error;

      toast.success("Item updated successfully!");
      setShowEditItemDialog(false);
      setEditingItem(null);
      refetchItems();
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Failed to update item");
    }
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setShowEditItemDialog(true);
  };

  // Filter farmers based on selected club
  const filteredFarmers = useMemo(() => {
    if (!selectedClubId || !farmers) return farmers;
    return farmers.filter(farmer => farmer.farmer_group_id === selectedClubId);
  }, [selectedClubId, farmers]);

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
      refetchStockSummary();
    } catch (error) {
      console.error("Error adding stock:", error);
      toast.error("Failed to add stock");
    }
  };

  const handleRecordDistribution = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const itemId = formData.get("item_id") as string;
    const quantity = parseFloat(formData.get("quantity") as string);
    
    // Check stock availability before proceeding (this will also be checked by the database trigger)
    const availableQuantity = availableStock.get(itemId) || 0;
    if (quantity > availableQuantity) {
      toast.error(`Insufficient stock. Available: ${availableQuantity.toFixed(1)} units`);
      return;
    }
    
    try {
      const distributionData = {
        item_id: itemId,
        farmer_group_id: formData.get("farmer_group_id") as string,
        farmer_id: formData.get("farmer_id") as string || null,
        quantity: quantity,
        season_id: formData.get("season_id") as string || null,
        distribution_date: formData.get("distribution_date") as string,
        notes: formData.get("notes") as string || null,
        distributed_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from("input_distributions")
        .insert([distributionData]);

      if (error) throw error;

      toast.success("Distribution recorded successfully! Stock deducted automatically.");
      setShowDistributionDialog(false);
      setSelectedClubId("");
      refetchDistributions();
      refetchStock();
      refetchStockSummary();
    } catch (error) {
      console.error("Error recording distribution:", error);
      toast.error("Failed to record distribution");
    }
  };

  const resetDistributionDialog = () => {
    setShowDistributionDialog(false);
    setSelectedClubId("");
  };

  const handleRecordCashPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const paymentData = {
        farmer_group_id: formData.get("farmer_group_id") as string,
        farmer_id: formData.get("farmer_id") as string || null,
        amount: parseFloat(formData.get("amount") as string),
        payment_type: formData.get("payment_type") as string,
        payment_method: formData.get("payment_method") as string,
        bank_details: formData.get("bank_details") as string || null,
        season_id: formData.get("season_id") as string || null,
        payment_date: formData.get("payment_date") as string,
        purpose: formData.get("purpose") as string,
        notes: formData.get("notes") as string || null,
        created_by: (await supabase.auth.getUser()).data.user?.id
      };

      const { error } = await supabase
        .from("cash_payments")
        .insert([paymentData]);

      if (error) throw error;

      const successMessage = paymentData.payment_type === 'loan' 
        ? "Cash payment recorded successfully! Loan created automatically."
        : "Cash payment recorded successfully!";
      
      toast.success(successMessage);
      setShowCashPaymentDialog(false);
      refetchCashPayments();
    } catch (error) {
      console.error("Error recording cash payment:", error);
      toast.error("Failed to record cash payment");
    }
  };

  const totalStock = inputStock?.reduce((sum, s) => sum + s.quantity, 0) || 0;
  const totalValue = inputStock?.reduce((sum, s) => sum + (s.quantity * (s.unit_cost || 0)), 0) || 0;
  const totalDistributed = inputDistributions?.reduce((sum, d) => sum + d.quantity, 0) || 0;
  const totalCashPayments = cashPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;

  // Filter data based on search filters
  const filteredInputItems = useMemo(() => {
    if (!inputItems) return [];
    
    return inputItems.filter(item => {
      const matchesSearch = !searchFilters.searchTerm || 
        item.name.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()));
      
      const matchesCategory = searchFilters.category === 'all' || item.category === searchFilters.category;
      
      return matchesSearch && matchesCategory;
    });
  }, [inputItems, searchFilters]);

  const filteredInputStock = useMemo(() => {
    if (!inputStock) return [];
    
    return inputStock.filter(stock => {
      const matchesSearch = !searchFilters.searchTerm || 
        stock.input_items?.name.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
        stock.input_items?.category.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
        (stock.source && stock.source.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()));
      
      const matchesCategory = searchFilters.category === 'all' || stock.input_items?.category === searchFilters.category;
      const matchesSeason = searchFilters.season === 'all' || stock.season_id === searchFilters.season;
      
      return matchesSearch && matchesCategory && matchesSeason;
    });
  }, [inputStock, searchFilters]);

  const filteredInputDistributions = useMemo(() => {
    if (!inputDistributions) return [];
    
    return inputDistributions.filter(distribution => {
      const matchesSearch = !searchFilters.searchTerm || 
        distribution.input_items?.name.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
        distribution.farmer_groups?.name.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
        (distribution.farmers?.full_name && distribution.farmers.full_name.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()));
      
      const matchesCategory = searchFilters.category === 'all' || distribution.input_items?.category === searchFilters.category;
      const matchesSeason = searchFilters.season === 'all' || distribution.season_id === searchFilters.season;
      const matchesFarmerGroup = searchFilters.farmerGroup === 'all' || distribution.farmer_group_id === searchFilters.farmerGroup;
      
      return matchesSearch && matchesCategory && matchesSeason && matchesFarmerGroup;
    });
  }, [inputDistributions, searchFilters]);

  const filteredCashPayments = useMemo(() => {
    if (!cashPayments) return [];
    
    return cashPayments.filter(payment => {
      const matchesSearch = !searchFilters.searchTerm || 
        payment.farmer_groups?.name.toLowerCase().includes(searchFilters.searchTerm.toLowerCase()) ||
        (payment.farmers?.full_name && payment.farmers.full_name.toLowerCase().includes(searchFilters.searchTerm.toLowerCase())) ||
        payment.purpose.toLowerCase().includes(searchFilters.searchTerm.toLowerCase());
      
      const matchesSeason = searchFilters.season === 'all' || payment.season_id === searchFilters.season;
      const matchesFarmerGroup = searchFilters.farmerGroup === 'all' || payment.farmer_group_id === searchFilters.farmerGroup;
      
      return matchesSearch && matchesSeason && matchesFarmerGroup;
    });
  }, [cashPayments, searchFilters]);

  // Get unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>();
    inputItems?.forEach(item => categories.add(item.category));
    return Array.from(categories).sort();
  }, [inputItems]);

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
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
            <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Input Item</DialogTitle>
                  <DialogDescription>
                    Update the input item details
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleEditItem} className="space-y-4">
                  <div>
                    <Label htmlFor="edit_name">Item Name</Label>
                    <Input 
                      name="name" 
                      required 
                      placeholder="e.g., NPK Fertilizer"
                      defaultValue={editingItem?.name || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_category">Category</Label>
                    <Select name="category" required defaultValue={editingItem?.category || ""}>
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
                    <Label htmlFor="edit_unit">Unit</Label>
                    <Select name="unit" required defaultValue={editingItem?.unit || ""}>
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
                    <Label htmlFor="edit_sku">SKU (Optional)</Label>
                    <Input 
                      name="sku" 
                      placeholder="Product code"
                      defaultValue={editingItem?.sku || ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit_active">Status</Label>
                    <Select name="active" required defaultValue={editingItem?.active?.toString() || "true"}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowEditItemDialog(false);
                        setEditingItem(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Update Item</Button>
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
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Stock</DialogTitle>
                  <DialogDescription>
                    Record new stock received
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddStock} className="space-y-3">
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input name="quantity" type="number" step="0.1" required placeholder="Enter quantity" />
                    </div>
                    <div>
                      <Label htmlFor="unit_cost">Unit Cost (MWK)</Label>
                      <Input name="unit_cost" type="number" step="0.01" placeholder="Cost per unit" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="source">Source</Label>
                      <Input name="source" placeholder="Supplier name" />
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Items in Catalog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold break-words">{inputItems?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Stock Units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold break-words">{totalStock.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Stock Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">MWK {totalValue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Distributed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold break-words">{totalDistributed.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">MWK {totalCashPayments.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search & Filters</CardTitle>
            <CardDescription>
              Search and filter inputs, stock, distributions, and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InputsSearch
              onSearchChange={setSearchFilters}
              categories={uniqueCategories}
              seasons={seasons || []}
              farmerGroups={farmerGroups || []}
            />
          </CardContent>
        </Card>

        <Tabs defaultValue="stock" className="w-full">
          <TabsList>
            <TabsTrigger value="stock">Stock Levels</TabsTrigger>
            <TabsTrigger value="stock-summary">Stock Summary</TabsTrigger>
            <TabsTrigger value="distributions">Distributions</TabsTrigger>
            <TabsTrigger value="cash-payments">Cash Payments</TabsTrigger>
            <TabsTrigger value="items">Item Catalog</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stock">
            <Card>
              <CardHeader>
                <CardTitle>Current Stock</CardTitle>
                <CardDescription>Available input stock and inventory levels</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredInputStock?.length ? (
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
                      {filteredInputStock.map((stock) => (
                        <TableRow key={stock.id}>
                          <TableCell className="font-medium">{stock.input_items?.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{stock.input_items?.category}</Badge>
                          </TableCell>
                          <TableCell>{stock.quantity} {stock.input_items?.unit}</TableCell>
                          <TableCell>MWK {stock.unit_cost?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>MWK {((stock.quantity || 0) * (stock.unit_cost || 0)).toFixed(2)}</TableCell>
                          <TableCell>{format(new Date(stock.received_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{stock.source || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4" />
                    <p>{inputStock?.length ? 'No stock matches your search criteria' : 'No stock recorded yet'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock-summary">
            <Card>
              <CardHeader>
                <CardTitle>Consolidated Stock Summary</CardTitle>
                <CardDescription>Overview of all input items with consolidated quantities and values</CardDescription>
              </CardHeader>
              <CardContent>
                {stockSummary?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Available Quantity</TableHead>
                        <TableHead>Total Value</TableHead>
                        <TableHead>Stock Records</TableHead>
                        <TableHead>First Received</TableHead>
                        <TableHead>Last Received</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockSummary.map((item) => (
                        <TableRow key={item.item_id}>
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${item.total_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {item.total_quantity.toFixed(1)} {item.unit}
                            </span>
                          </TableCell>
                          <TableCell>MWK {item.total_value.toFixed(2)}</TableCell>
                          <TableCell>{item.stock_records_count}</TableCell>
                          <TableCell>
                            {item.first_received_date ? format(new Date(item.first_received_date), "MMM dd, yyyy") : '-'}
                          </TableCell>
                          <TableCell>
                            {item.last_received_date ? format(new Date(item.last_received_date), "MMM dd, yyyy") : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4" />
                    <p>{stockSummary ? 'No stock summary available' : 'Loading stock summary...'}</p>
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
                    <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Record Distribution</DialogTitle>
                        <DialogDescription>
                          Track input distribution to clubs/farmers
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleRecordDistribution} className="space-y-3">
                        <div>
                          <Label htmlFor="item_id">Input Item</Label>
                          <Select name="item_id" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select item" />
                            </SelectTrigger>
                            <SelectContent>
                              {inputItems?.map((item) => {
                                const availableQuantity = availableStock.get(item.id) || 0;
                                return (
                                  <SelectItem key={item.id} value={item.id}>
                                    {item.name} ({item.unit}) - Stock: {availableQuantity.toFixed(1)}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="farmer_group_id">Club</Label>
                            <Select 
                              name="farmer_group_id" 
                              required
                              value={selectedClubId}
                              onValueChange={(value) => setSelectedClubId(value)}
                            >
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
                                <SelectValue placeholder={selectedClubId ? "Select farmer from club" : "Select club first"} />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredFarmers?.map((farmer) => (
                                  <SelectItem key={farmer.id} value={farmer.id}>
                                    {farmer.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input name="quantity" type="number" step="0.1" required placeholder="Enter quantity" />
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
                          <Label htmlFor="notes">Notes (Optional)</Label>
                          <Textarea name="notes" placeholder="Distribution notes..." rows={2} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Available stock will be checked before distribution
                        </p>
                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={resetDistributionDialog}>
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
                {filteredInputDistributions?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Farmer</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Loan Created</TableHead>
                        <TableHead>Acknowledged</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInputDistributions.map((distribution) => (
                        <TableRow key={distribution.id}>
                          <TableCell>{format(new Date(distribution.distribution_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="font-medium">{distribution.input_items?.name}</TableCell>
                          <TableCell>{distribution.farmer_groups?.name}</TableCell>
                          <TableCell>{distribution.farmers?.full_name || '-'}</TableCell>
                          <TableCell>{distribution.quantity} {distribution.input_items?.unit}</TableCell>
                          <TableCell>
                            <Badge variant="default">Yes</Badge>
                          </TableCell>
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
                    <p>{inputDistributions?.length ? 'No distributions match your search criteria' : 'No distributions recorded yet'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cash-payments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Cash Payments</CardTitle>
                    <CardDescription>Record cash payments to clubs and farmers</CardDescription>
                  </div>
                  <Dialog open={showCashPaymentDialog} onOpenChange={setShowCashPaymentDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <DollarSign className="h-4 w-4 mr-2" />
                        Record Cash Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Record Cash Payment</DialogTitle>
                        <DialogDescription>
                          Record cash payment to clubs/farmers
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleRecordCashPayment} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="amount">Amount (MWK)</Label>
                            <Input name="amount" type="number" step="0.01" required placeholder="Enter amount" />
                          </div>
                          <div>
                            <Label htmlFor="payment_type">Payment Type</Label>
                            <Select name="payment_type" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="loan">Loan</SelectItem>
                                <SelectItem value="grant">Grant</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="payment_method">Payment Method</Label>
                            <Select name="payment_method" required>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="bank">Bank</SelectItem>
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
                        </div>
                        <div>
                          <Label htmlFor="bank_details">Bank Details (Required if Bank)</Label>
                          <Textarea name="bank_details" placeholder="Bank name, account number, etc." rows={2} />
                        </div>
                        <div>
                          <Label htmlFor="purpose">Purpose</Label>
                          <Input name="purpose" required placeholder="e.g., Farm inputs, Emergency support" />
                        </div>
                        <div>
                          <Label htmlFor="payment_date">Payment Date</Label>
                          <Input 
                            name="payment_date" 
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
                          <Button type="button" variant="outline" onClick={() => setShowCashPaymentDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit">Record Payment</Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {filteredCashPayments?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Farmer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Purpose</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCashPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(new Date(payment.payment_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell>{payment.farmer_groups?.name}</TableCell>
                          <TableCell>{payment.farmers?.full_name || '-'}</TableCell>
                          <TableCell className="font-medium">MWK {payment.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={payment.payment_type === 'loan' ? 'default' : 'secondary'}>
                              {payment.payment_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.payment_method}</Badge>
                          </TableCell>
                          <TableCell>{payment.purpose}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4" />
                    <p>{cashPayments?.length ? 'No cash payments match your search criteria' : 'No cash payments recorded yet'}</p>
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
                {filteredInputItems?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInputItems.map((item) => (
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
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditDialog(item)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                    <p>{inputItems?.length ? 'No items match your search criteria' : 'No input items in catalog yet'}</p>
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
