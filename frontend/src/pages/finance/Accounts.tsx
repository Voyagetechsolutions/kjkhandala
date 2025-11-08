import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import FinanceLayout from '@/components/finance/FinanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Upload, CheckCircle, AlertCircle, Landmark } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function Accounts() {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const queryClient = useQueryClient();

  const { data: accounts = [] } = useQuery({
    queryKey: ['finance-accounts'],
    queryFn: async () => {
      const response = await api.get('/finance/accounts');
      return Array.isArray(response.data) ? response.data : (response.data?.accounts || []);
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['finance-transactions'],
    queryFn: async () => {
      const response = await api.get('/finance/transactions');
      return Array.isArray(response.data) ? response.data : (response.data?.transactions || []);
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async (accountId: string) => {
      await api.post(`/finance/accounts/${accountId}/reconcile`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-accounts'] });
      toast.success('Account reconciled successfully');
    },
    onError: () => {
      toast.error('Failed to reconcile account');
    },
  });

  const discrepancies = transactions.filter((t: any) => !t.matched);

  const handleUploadStatement = () => {
    console.log('Uploading statement:', uploadFile, selectedAccount);
    setShowUploadDialog(false);
  };

  const handleMatchTransactions = () => {
    console.log('Matching transactions');
  };

  const handleResolveDiscrepancy = (id: number) => {
    console.log('Resolving discrepancy:', id);
  };

  return (
    <FinanceLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Accounts & Reconciliation</h1>
            <p className="text-muted-foreground">Bank reconciliation and account management</p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload Statement
          </Button>
        </div>

        {/* Accounts List */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts & Cash</CardTitle>
            <CardDescription>All company accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Last Reconciled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{account.bank}</TableCell>
                    <TableCell className="font-mono">{account.accountNumber}</TableCell>
                    <TableCell>{account.type}</TableCell>
                    <TableCell className="text-right font-bold">P {account.balance.toLocaleString()}</TableCell>
                    <TableCell>{account.lastReconciled}</TableCell>
                    <TableCell>
                      <Badge className={account.status === 'reconciled' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {account.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button onClick={() => { setSelectedAccount(account); setShowUploadDialog(true); }}>
                        Reconcile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest bank transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.date}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>
                      <Badge className={transaction.type === 'credit' ? 'bg-green-500' : 'bg-red-500'}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}P {transaction.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {transaction.matched ? (
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Matched
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unmatched
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Discrepancies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Discrepancies
            </CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            {discrepancies.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discrepancies.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Badge className="bg-red-500">{item.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">P {item.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleResolveDiscrepancy(item.id)}>
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No discrepancies found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Statement Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Bank Statement</DialogTitle>
              <DialogDescription>
                {selectedAccount ? `${selectedAccount.name} - ${selectedAccount.bank}` : 'Select account and upload statement'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Select Account</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedAccount?.id || ''}
                  onChange={(e) => {
                    const account = accounts.find(a => a.id === parseInt(e.target.value));
                    setSelectedAccount(account);
                  }}
                >
                  <option value="">Choose account...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.bank}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Upload Statement (CSV or PDF)</Label>
                <Input
                  type="file"
                  accept=".csv,.pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button onClick={() => setShowUploadDialog(false)}>Cancel</Button>
                <Button onClick={handleUploadStatement} disabled={!selectedAccount || !uploadFile}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Match
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FinanceLayout>
  );
}
