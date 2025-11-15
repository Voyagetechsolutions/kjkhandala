import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceLayout from '@/components/finance/FinanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BankAccounts() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [formData, setFormData] = useState({
    bank_name: '',
    account_number: '',
    account_type: 'checking',
    currency: 'BWP',
    balance: '0',
    notes: '',
  });

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['bank-transactions', selectedAccount?.id],
    queryFn: async () => {
      if (!selectedAccount?.id) return [];
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('account_id', selectedAccount.id)
        .order('date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedAccount?.id,
  });

  const createAccount = useMutation({
    mutationFn: async (accountData: any) => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert([{
          ...accountData,
          balance: parseFloat(accountData.balance),
          status: 'active'
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Bank account added successfully');
      setShowAddDialog(false);
      setFormData({
        bank_name: '',
        account_number: '',
        account_type: 'checking',
        currency: 'BWP',
        balance: '0',
        notes: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add bank account');
    }
  });

  const reconcileTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .update({
          reconciled: true,
          reconciled_date: new Date().toISOString().split('T')[0],
          reconciled_by: user?.id
        })
        .eq('id', transactionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast.success('Transaction reconciled');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reconcile transaction');
    }
  });

  const handleSubmit = () => {
    if (!formData.bank_name || !formData.account_number) {
      toast.error('Please fill all required fields');
      return;
    }
    createAccount.mutate(formData);
  };

  const totalBalance = accounts.filter((a: any) => a.status === 'active').reduce((sum, acc: any) => sum + parseFloat(acc.balance || 0), 0);
  const activeAccounts = accounts.filter((a: any) => a.status === 'active').length;
  const reconciledCount = transactions.filter((t: any) => t.reconciled).length;
  const unreconciledCount = transactions.filter((t: any) => !t.reconciled).length;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bank Accounts & Reconciliation</h1>
            <p className="text-muted-foreground">Manage bank accounts and reconcile transactions</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {totalBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all accounts</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAccounts}</div>
              <p className="text-xs text-muted-foreground">{accounts.length} total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reconciled</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{reconciledCount}</div>
              <p className="text-xs text-muted-foreground">Transactions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unreconciled</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{unreconciledCount}</div>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
            <CardDescription>All registered bank accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bank Name</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Last Reconciled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No bank accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account: any) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.bank_name}</TableCell>
                      <TableCell>{account.account_number}</TableCell>
                      <TableCell className="capitalize">{account.account_type}</TableCell>
                      <TableCell>{account.currency}</TableCell>
                      <TableCell className="font-bold">P {parseFloat(account.balance || 0).toLocaleString()}</TableCell>
                      <TableCell>{account.last_reconciled_date || 'Never'}</TableCell>
                      <TableCell>
                        <Badge className={account.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" onClick={() => {
                          setSelectedAccount(account);
                          setShowTransactionsDialog(true);
                        }}>
                          View Transactions
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Bank Account</DialogTitle>
              <DialogDescription>Register a new bank account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Bank Name *</Label>
                <Input value={formData.bank_name} onChange={(e) => setFormData({...formData, bank_name: e.target.value})} placeholder="e.g., First National Bank" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Account Number *</Label>
                  <Input value={formData.account_number} onChange={(e) => setFormData({...formData, account_number: e.target.value})} placeholder="1234567890" />
                </div>
                <div>
                  <Label>Account Type *</Label>
                  <Select value={formData.account_type} onValueChange={(value) => setFormData({...formData, account_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="petty_cash">Petty Cash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Currency</Label>
                  <Input value={formData.currency} onChange={(e) => setFormData({...formData, currency: e.target.value})} placeholder="BWP" />
                </div>
                <div>
                  <Label>Initial Balance</Label>
                  <Input type="number" step="0.01" value={formData.balance} onChange={(e) => setFormData({...formData, balance: e.target.value})} placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Input value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createAccount.isPending}>
                  {createAccount.isPending ? 'Adding...' : 'Add Account'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showTransactionsDialog} onOpenChange={setShowTransactionsDialog}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Transactions - {selectedAccount?.bank_name}</DialogTitle>
              <DialogDescription>
                Account: {selectedAccount?.account_number} | Balance: P {parseFloat(selectedAccount?.balance || 0).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Balance After</TableHead>
                  <TableHead>Reconciled</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.date}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.reference_number || '-'}</TableCell>
                      <TableCell className="capitalize">{transaction.transaction_type}</TableCell>
                      <TableCell className={
                        transaction.transaction_type === 'deposit' || transaction.transaction_type === 'interest' 
                          ? 'text-green-600 font-bold' 
                          : 'text-red-600 font-bold'
                      }>
                        {transaction.transaction_type === 'deposit' || transaction.transaction_type === 'interest' ? '+' : '-'}
                        P {parseFloat(transaction.amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>P {parseFloat(transaction.balance_after || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        {transaction.reconciled ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Reconciled
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!transaction.reconciled && (
                          <Button size="sm" onClick={() => reconcileTransaction.mutate(transaction.id)}>
                            Reconcile
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
