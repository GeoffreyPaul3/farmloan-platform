
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, TrendingUp, DollarSign, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function Payments() {
  const { data: payouts, isLoading } = useQuery({
    queryKey: ["payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select(`
          *,
          deliveries(
            farmers(full_name),
            farmer_groups(name)
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: loanLedgers } = useQuery({
    queryKey: ["loan-ledgers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_ledgers")
        .select(`
          *,
          farmers(full_name),
          seasons(name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);
      
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

  const totalPaid = payouts?.reduce((sum, p) => sum + (p.net_paid || 0), 0) || 0;
  const totalDeductions = payouts?.reduce((sum, p) => sum + (p.loan_deduction || 0), 0) || 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payments & Loan Recovery</h1>
            <p className="text-muted-foreground">Track payments, loan deductions, and farmer ledgers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payouts?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Net Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Loan Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">${totalDeductions.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalPaid ? ((totalDeductions / (totalPaid + totalDeductions)) * 100).toFixed(1) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payouts">
          <TabsList>
            <TabsTrigger value="payouts">Recent Payouts</TabsTrigger>
            <TabsTrigger value="ledgers">Loan Ledgers</TabsTrigger>
          </TabsList>

          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Recent farmer payments with loan deductions</CardDescription>
              </CardHeader>
              <CardContent>
                {payouts?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Farmer</TableHead>
                        <TableHead>Club</TableHead>
                        <TableHead>Gross Amount</TableHead>
                        <TableHead>Loan Deduction</TableHead>
                        <TableHead>Net Paid</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>{format(new Date(payout.created_at), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="font-medium">
                            {payout.deliveries?.farmers?.full_name}
                          </TableCell>
                          <TableCell>{payout.deliveries?.farmer_groups?.name}</TableCell>
                          <TableCell>${payout.gross_amount.toFixed(2)}</TableCell>
                          <TableCell className="text-orange-600">
                            -${payout.loan_deduction.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            ${payout.net_paid.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{payout.method}</Badge>
                          </TableCell>
                          <TableCell>{payout.reference_number || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4" />
                    <p>No payments processed yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledgers">
            <Card>
              <CardHeader>
                <CardTitle>Loan Ledger Entries</CardTitle>
                <CardDescription>Detailed loan transaction history per farmer</CardDescription>
              </CardHeader>
              <CardContent>
                {loanLedgers?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Farmer</TableHead>
                        <TableHead>Entry Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Balance After</TableHead>
                        <TableHead>Season</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loanLedgers.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>{format(new Date(entry.created_at), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="font-medium">{entry.farmers?.full_name}</TableCell>
                          <TableCell>
                            <Badge variant={entry.entry_type === 'sale_deduction' ? 'default' : 'secondary'}>
                              {entry.entry_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className={entry.amount < 0 ? 'text-orange-600' : 'text-blue-600'}>
                            ${Math.abs(entry.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>${entry.balance_after?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>{entry.seasons?.name || 'N/A'}</TableCell>
                          <TableCell>{entry.reference_table || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>No ledger entries yet</p>
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
