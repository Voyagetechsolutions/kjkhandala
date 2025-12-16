import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus, Printer, FileText, Percent, Lock, DollarSign, 
  Settings, Clock, CheckCircle2, AlertCircle, ArrowLeft 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OfficeAdmin() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;

  const [currentShift, setCurrentShift] = useState<any>(null);
  const [cashUpData, setCashUpData] = useState({
    opening_cash: 0,
    closing_cash: 0,
    expected_cash: 0,
    variance: 0,
    notes: '',
  });

  useEffect(() => {
    if (user) {
      fetchCurrentShift();
    }
  }, [user]);

  const fetchCurrentShift = async () => {
    try {
      // Get agent
      const { data: agentData } = await supabase
        .from('ticketing_agents')
        .select('id')
        .eq('profile_id', user?.id)
        .single();

      if (!agentData) return;

      // Get current open shift
      const { data: shiftData } = await supabase
        .from('agent_shifts')
        .select('*')
        .eq('agent_id', agentData.id)
        .eq('status', 'open')
        .single();

      if (shiftData) {
        setCurrentShift(shiftData);
        setCashUpData({
          ...cashUpData,
          opening_cash: shiftData.opening_cash || 0,
        });

        // Calculate expected cash from today's payments
        const { data: payments } = await supabase
          .from('booking_payments')
          .select('amount')
          .eq('processed_by', agentData.id)
          .eq('payment_method', 'cash')
          .gte('payment_date', shiftData.start_time);

        const totalCash = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
        const expected = shiftData.opening_cash + totalCash;

        setCashUpData(prev => ({ ...prev, expected_cash: expected }));
      }

    } catch (error: any) {
      console.error('Error fetching shift:', error);
    }
  };

  const openShift = async () => {
    try {
      const { data: agentData } = await supabase
        .from('ticketing_agents')
        .select('id, terminal_id')
        .eq('profile_id', user?.id)
        .single();

      if (!agentData) {
        toast({
          variant: 'destructive',
          title: 'Agent not found',
          description: 'You must be registered as a ticketing agent',
        });
        return;
      }

      const { data, error } = await supabase
        .from('agent_shifts')
        .insert({
          agent_id: agentData.id,
          terminal_id: agentData.terminal_id,
          shift_date: new Date().toISOString().split('T')[0],
          start_time: new Date().toISOString(),
          opening_cash: cashUpData.opening_cash,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentShift(data);
      toast({
        title: 'Shift opened',
        description: 'Your shift has been started',
      });

    } catch (error: any) {
      console.error('Error opening shift:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to open shift',
        description: error.message,
      });
    }
  };

  const closeShift = async () => {
    if (!currentShift) return;

    try {
      const variance = cashUpData.closing_cash - cashUpData.expected_cash;

      const { error } = await supabase
        .from('agent_shifts')
        .update({
          end_time: new Date().toISOString(),
          closing_cash: cashUpData.closing_cash,
          expected_cash: cashUpData.expected_cash,
          variance,
          status: 'closed',
          notes: cashUpData.notes,
        })
        .eq('id', currentShift.id);

      if (error) throw error;

      toast({
        title: 'Shift closed',
        description: `Variance: P ${variance.toFixed(2)}`,
      });

      setCurrentShift(null);
      setCashUpData({
        opening_cash: 0,
        closing_cash: 0,
        expected_cash: 0,
        variance: 0,
        notes: '',
      });

    } catch (error: any) {
      console.error('Error closing shift:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to close shift',
        description: error.message,
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">⚙️ Office Admin</h1>
            <p className="text-muted-foreground">Administrative tools and settings</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate(isAdminRoute ? '/admin/ticketing' : '/ticketing')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Shift Status */}
        <Card className={currentShift ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className={`h-5 w-5 ${currentShift ? 'text-green-600' : 'text-orange-600'}`} />
                <div>
                  <p className="font-semibold">
                    {currentShift ? 'Shift Active' : 'No Active Shift'}
                  </p>
                  {currentShift && (
                    <p className="text-sm text-muted-foreground">
                      Started: {new Date(currentShift.start_time).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={currentShift ? 'default' : 'secondary'}>
                {currentShift ? 'OPEN' : 'CLOSED'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="cash-up" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="cash-up">Cash-Up</TabsTrigger>
            <TabsTrigger value="walk-in">Walk-In</TabsTrigger>
            <TabsTrigger value="reprint">Reprint</TabsTrigger>
            <TabsTrigger value="discounts">Discounts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Cash-Up Tab */}
          <TabsContent value="cash-up" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cash-Up Report</CardTitle>
                <CardDescription>End-of-day cash reconciliation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!currentShift ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="opening_cash">Opening Cash Amount</Label>
                      <Input
                        id="opening_cash"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={cashUpData.opening_cash || ''}
                        onChange={(e) => setCashUpData({ ...cashUpData, opening_cash: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <Button onClick={openShift} className="w-full">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Open Shift
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Opening Cash:</span>
                        <span className="font-medium">P {cashUpData.opening_cash.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Expected Cash:</span>
                        <span className="font-medium">P {cashUpData.expected_cash.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="closing_cash">Actual Closing Cash</Label>
                        <Input
                          id="closing_cash"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={cashUpData.closing_cash || ''}
                          onChange={(e) => {
                            const closing = parseFloat(e.target.value) || 0;
                            const variance = closing - cashUpData.expected_cash;
                            setCashUpData({ ...cashUpData, closing_cash: closing, variance });
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Variance:</span>
                        <span className={cashUpData.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          P {cashUpData.variance.toFixed(2)}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any notes about discrepancies..."
                          value={cashUpData.notes}
                          onChange={(e) => setCashUpData({ ...cashUpData, notes: e.target.value })}
                          rows={3}
                        />
                      </div>
                    </div>
                    <Button onClick={closeShift} className="w-full" variant="destructive">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Close Shift
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Walk-In Registration Tab */}
          <TabsContent value="walk-in" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Walk-In Passenger Registration</CardTitle>
                <CardDescription>Quick registration for walk-in customers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    Use the main booking flow to register walk-in passengers
                  </p>
                  <Button onClick={() => navigate('/ticketing/search-trips')}>
                    Start New Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reprint Tab */}
          <TabsContent value="reprint" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reprint Lost Ticket</CardTitle>
                <CardDescription>Search and reprint tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Printer className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    Use Modify Booking to search and reprint tickets
                  </p>
                  <Button onClick={() => navigate('/ticketing/modify-booking')}>
                    Go to Modify Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Discounts Tab */}
          <TabsContent value="discounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Discount Rules</CardTitle>
                <CardDescription>Manage discount codes and rules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Percent className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    Discount management coming soon
                  </p>
                  <Button disabled>
                    <Percent className="h-4 w-4 mr-2" />
                    Manage Discounts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Terminal Settings</CardTitle>
                <CardDescription>Configure terminal and printer settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Terminal ID</Label>
                  <Input value="TERM-001" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Printer</Label>
                  <Input value="Default Printer" disabled />
                </div>
                <div className="space-y-2">
                  <Label>Receipt Template</Label>
                  <select className="w-full p-2 border rounded" disabled>
                    <option>Standard Template</option>
                  </select>
                </div>
                <Button disabled className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seat Override</CardTitle>
                <CardDescription>Admin override for blocked seats (requires supervisor)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    Supervisor approval required
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
