
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, TrendingUp, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function Payments() {
  const { data: payouts, isLoading: payoutsLoading } = useQuery({
    queryKey: ["payouts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select(`
          *,
          deliveries(
            *,
            farmers(full_name),
            farmer_groups(name)
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: loanLedgers, isLoading: ledgersLoading } = useQuery({
    queryKey: ["loan-ledgers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loan_ledgers")
        .select(`
          *,
          farmers(full_name),
          loans(amount, loan_type),
          seasons(name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: loans } = useQuery({
    queryKey: ["loans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("loans")
        .select(`
          *,
          farmer_groups(name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (payoutsLoading || ledgersLoading) {
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

  const totalPayouts = payouts?.reduce((sum, p) => sum + p.net_paid, 0) || 0;
  const totalDeductions = payouts?.reduce((sum, p) => sum + p.loan_deduction, 0) || 0;
  const outstandingLoans = loans?.reduce((sum, l) => sum + l.outstanding_balance, 0) || 0;

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
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalPayouts.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Loan Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalDeductions.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Outstanding Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${outstandingLoans.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Recovery Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalDeductions && outstandingLoans ? 
                  ((totalDeductions / (totalDeductions + outstandingLoans)) * 100).toFixed(1) + '%' 
                  : '0%'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payouts" className="w-full">
          <TabsList>
            <TabsTrigger value="payouts">Payment History</TabsTrigger>
            <TabsTrigger value="ledgers">Farmer Ledgers</TabsTrigger>
            <TabsTrigger value="loans">Outstanding Loans</TabsTrigger>
          </TabsList>

          <TabsContent value="payouts">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>Processed payments and deductions</CardDescription>
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
                          <TableCell className="font-medium">{payout.deliveries?.farmers?.full_name}</TableCell>
                          <TableCell>{payout.deliveries?.farmer_groups?.name}</TableCell>
                          <TableCell>${payout.gross_amount.toFixed(2)}</TableCell>
                          <TableCell className="text-red-600">-${payout.loan_deduction.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">${payout.net_paid.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payout.method}</Badge>
                          </TableCell>
                          <TableCell>{payout.reference_number || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4" />
                    <p>No payments processed yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ledgers">
            <Card>
              <CardHeader>
                <CardTitle>Farmer Ledgers</CardTitle>
                <CardDescription>Individual farmer account movements</CardDescription>
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loanLedgers.map((ledger) => (
                        <TableRow key={ledger.id}>
                          <TableCell>{format(new Date(ledger.created_at), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="font-medium">{ledger.farmers?.full_name}</TableCell>
                          <TableCell>
                            <Badge variant={ledger.entry_type === 'loan' ? 'destructive' : 'default'}>
                              {ledger.entry_type}
                            </Badge>
                          </TableCell>
                          <TableCell className={ledger.entry_type === 'loan' ? 'text-red-600' : 'text-green-600'}>
                            {ledger.entry_type === 'loan' ? '+' : '-'}${Math.abs(ledger.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>${ledger.balance_after?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>{ledger.seasons?.name || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CreditCard className="h-12 w-12 mx-auto mb-4" />
                    <p>No ledger entries yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="loans">
            <Card>
              <CardHeader>
                <CardTitle>Outstanding Loans</CardTitle>
                <CardDescription>Current loan balances by club</CardDescription>
              </CardHeader>
              <CardContent>
                {loans?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Club</TableHead>
                        <TableHead>Loan Type</TableHead>
                        <TableHead>Original Amount</TableHead>
                        <TableHead>Outstanding Balance</TableHead>
                        <TableHead>Interest Rate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-medium">{loan.farmer_groups?.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{loan.loan_type}</Badge>
                          </TableCell>
                          <TableCell>${loan.amount.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">${loan.outstanding_balance.toFixed(2)}</TableCell>
                          <TableCell>{loan.interest_rate}%</TableCell>
                          <TableCell>
                            <Badge variant={
                              loan.status === 'active' ? 'default' : 
                              loan.status === 'paid' ? 'secondary' : 'destructive'
                            }>
                              {loan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {loan.due_date ? format(new Date(loan.due_date), "MMM dd, yyyy") : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>No outstanding loans</p>
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
