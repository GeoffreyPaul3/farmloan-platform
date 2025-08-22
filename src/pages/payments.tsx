
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, TrendingUp, Users, Package } from "lucide-react";
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
            farmers!deliveries_farmer_id_fkey(full_name),
            farmer_groups!deliveries_farmer_group_id_fkey(name)
          )
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: cashPayments, isLoading: cashPaymentsLoading } = useQuery({
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
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: inputDistributions, isLoading: distributionsLoading } = useQuery({
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
          farmers!loan_ledgers_farmer_id_fkey(full_name),
          loans!loan_ledgers_loan_id_fkey(amount, loan_type),
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

  if (payoutsLoading || cashPaymentsLoading || distributionsLoading || ledgersLoading) {
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
  const totalCashPayments = cashPayments?.reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalDistributions = inputDistributions?.reduce((sum, d) => sum + d.quantity, 0) || 0;
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MWK {totalPayouts.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MWK {totalCashPayments.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Input Distributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDistributions.toFixed(1)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Outstanding Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">MWK {outstandingLoans.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Ledger Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loanLedgers?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payouts" className="w-full">
          <TabsList>
            <TabsTrigger value="payouts">Payment History</TabsTrigger>
            <TabsTrigger value="cash-payments">Cash Payments</TabsTrigger>
            <TabsTrigger value="distributions">Input Distributions</TabsTrigger>
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
                          <TableCell>MWK {payout.gross_amount.toFixed(2)}</TableCell>
                          <TableCell className="text-red-600">-MWK {payout.loan_deduction.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">MWK {payout.net_paid.toFixed(2)}</TableCell>
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

          <TabsContent value="cash-payments">
            <Card>
              <CardHeader>
                <CardTitle>Cash Payments</CardTitle>
                <CardDescription>Cash payments made to clubs and farmers</CardDescription>
              </CardHeader>
              <CardContent>
                {cashPayments?.length ? (
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
                      {cashPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(new Date(payment.payment_date), "MMM dd, yyyy")}</TableCell>
                          <TableCell className="font-medium">{payment.farmer_groups?.name}</TableCell>
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
                    <p>No cash payments recorded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distributions">
            <Card>
              <CardHeader>
                <CardTitle>Input Distributions</CardTitle>
                <CardDescription>Input distributions that created loans</CardDescription>
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
                        <TableHead>Loan Created</TableHead>
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
                            <Badge variant="default">Yes</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-4" />
                    <p>No input distributions recorded yet</p>
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
                            {ledger.entry_type === 'loan' ? '+' : '-'}MWK {Math.abs(ledger.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>MWK {ledger.balance_after?.toFixed(2) || '0.00'}</TableCell>
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
                          <TableCell>MWK {loan.amount.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">MWK {loan.outstanding_balance.toFixed(2)}</TableCell>
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
