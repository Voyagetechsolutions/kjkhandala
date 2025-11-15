import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import FinanceLayout from '@/components/finance/FinanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    // Tax & VAT
    vatRate: '12',
    incomeTaxRate: '22',
    
    // Currency
    baseCurrency: 'BWP',
    exchangeRateUSD: '13.50',
    exchangeRateZAR: '0.72',
    
    // Payroll
    payrollCycle: 'monthly',
    payrollProcessingDay: '25',
    
    // Refund Policy
    refundMoreThan7Days: '100',
    refund3To7Days: '80',
    refund1To3Days: '50',
    refundLessThan24Hours: '0',
    
    // Payment Gateway
    gatewayProvider: 'flutterwave',
    gatewayPublicKey: '',
    gatewaySecretKey: '',
    
    // Bank Details
    bankName: 'First National Bank',
    bankAccountNumber: '',
    bankBranch: '',
    bankSwiftCode: '',
  });

  const [expenseCategories, setExpenseCategories] = useState([
    'Payroll',
    'Fuel & Lubricants',
    'Maintenance & Repairs',
    'Office/Terminal Rent',
    'Utilities & Communications',
    'Vehicle Insurance & Licensing',
    'Miscellaneous',
  ]);

  const queryClient = useQueryClient();

  const { data: savedSettings } = useQuery({
    queryKey: ['finance-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_settings')
        .select('*');
      if (error) throw error;
      return data[0] || {};
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('finance_settings')
        .upsert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-settings'] });
      toast.success('Settings saved successfully');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  const handleSave = () => {
    saveMutation.mutate({ ...settings, expenseCategories });
  };

  return (
    <FinanceLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Settings & Configuration</h1>
            <p className="text-muted-foreground">Configure financial parameters</p>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save All Settings
          </Button>
        </div>

        {/* Tax & VAT Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Tax & VAT Rates</CardTitle>
            <CardDescription>Configure tax rates for calculations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>VAT Rate (%)</Label>
                <Input
                  type="number"
                  value={settings.vatRate}
                  onChange={(e) => setSettings({...settings, vatRate: e.target.value})}
                />
              </div>
              <div>
                <Label>Income Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={settings.incomeTaxRate}
                  onChange={(e) => setSettings({...settings, incomeTaxRate: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Currency & Exchange Rates</CardTitle>
            <CardDescription>Base currency and exchange rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Base Currency</Label>
                <Select value={settings.baseCurrency} onValueChange={(v) => setSettings({...settings, baseCurrency: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BWP">BWP (Botswana Pula)</SelectItem>
                    <SelectItem value="USD">USD (US Dollar)</SelectItem>
                    <SelectItem value="ZAR">ZAR (South African Rand)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Exchange Rate (USD to BWP)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.exchangeRateUSD}
                  onChange={(e) => setSettings({...settings, exchangeRateUSD: e.target.value})}
                />
              </div>
              <div>
                <Label>Exchange Rate (ZAR to BWP)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={settings.exchangeRateZAR}
                  onChange={(e) => setSettings({...settings, exchangeRateZAR: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Cycle */}
        <Card>
          <CardHeader>
            <CardTitle>Payroll Configuration</CardTitle>
            <CardDescription>Payroll processing settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Payroll Cycle</Label>
                <Select value={settings.payrollCycle} onValueChange={(v) => setSettings({...settings, payrollCycle: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Processing Day of Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={settings.payrollProcessingDay}
                  onChange={(e) => setSettings({...settings, payrollProcessingDay: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refund Policies */}
        <Card>
          <CardHeader>
            <CardTitle>Refund Policies</CardTitle>
            <CardDescription>Automatic refund percentage based on cancellation timing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>More than 7 days before travel (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.refundMoreThan7Days}
                  onChange={(e) => setSettings({...settings, refundMoreThan7Days: e.target.value})}
                />
              </div>
              <div>
                <Label>3-7 days before travel (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.refund3To7Days}
                  onChange={(e) => setSettings({...settings, refund3To7Days: e.target.value})}
                />
              </div>
              <div>
                <Label>1-3 days before travel (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.refund1To3Days}
                  onChange={(e) => setSettings({...settings, refund1To3Days: e.target.value})}
                />
              </div>
              <div>
                <Label>Less than 24 hours (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.refundLessThan24Hours}
                  onChange={(e) => setSettings({...settings, refundLessThan24Hours: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Manage expense classification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expenseCategories.map((category, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input value={category} readOnly />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Gateway */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Gateway Configuration</CardTitle>
            <CardDescription>Configure payment processing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Payment Provider</Label>
                <Select value={settings.gatewayProvider} onValueChange={(v) => setSettings({...settings, gatewayProvider: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flutterwave">Flutterwave</SelectItem>
                    <SelectItem value="payfast">PayFast</SelectItem>
                    <SelectItem value="orange-money">Orange Money</SelectItem>
                    <SelectItem value="mascom-myzaka">Mascom MyZaka</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Public Key</Label>
                <Input
                  type="text"
                  placeholder="Enter public key"
                  value={settings.gatewayPublicKey}
                  onChange={(e) => setSettings({...settings, gatewayPublicKey: e.target.value})}
                />
              </div>
              <div>
                <Label>Secret Key</Label>
                <Input
                  type="password"
                  placeholder="Enter secret key"
                  value={settings.gatewaySecretKey}
                  onChange={(e) => setSettings({...settings, gatewaySecretKey: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Bank Account Details</CardTitle>
            <CardDescription>Company bank account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Bank Name</Label>
                <Input
                  value={settings.bankName}
                  onChange={(e) => setSettings({...settings, bankName: e.target.value})}
                />
              </div>
              <div>
                <Label>Account Number</Label>
                <Input
                  value={settings.bankAccountNumber}
                  onChange={(e) => setSettings({...settings, bankAccountNumber: e.target.value})}
                />
              </div>
              <div>
                <Label>Branch</Label>
                <Input
                  value={settings.bankBranch}
                  onChange={(e) => setSettings({...settings, bankBranch: e.target.value})}
                />
              </div>
              <div>
                <Label>SWIFT Code</Label>
                <Input
                  value={settings.bankSwiftCode}
                  onChange={(e) => setSettings({...settings, bankSwiftCode: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} className="h-12 px-6">
            <Save className="mr-2 h-5 w-5" />
            Save All Settings
          </Button>
        </div>
      </div>
    </FinanceLayout>
  );
}
