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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Fuel as FuelIcon, Plus, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function Fuel() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  const queryClient = useQueryClient();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    driver_id: '',
    bus_id: '',
    route_id: '',
    fuel_station: '',
    quantity_liters: '',
    price_per_liter: '',
    odometer_reading: '',
    previous_odometer: '',
    receipt_number: '',
    notes: '',
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, license_number')
        .eq('status', 'ACTIVE')
        .order('full_name');
      if (error) {
        console.error('Error fetching drivers:', error);
        throw error;
      }
      return data || [];
    },
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('buses')
        .select('id, name, number_plate, registration_number, model')
        .eq('status', 'ACTIVE')
        .order('name');
      if (error) {
        console.error('Error fetching buses:', error);
        throw error;
      }
      return data || [];
    },
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, origin, destination')
        .order('origin');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: fuelLogs = [], isLoading } = useQuery({
    queryKey: ['fuel-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select(`
          *,
          driver:profiles!driver_id(full_name, employee_id),
          bus:buses(registration_number, model),
          route:routes(origin, destination)
        `)
        .order('date', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
  });

  const createFuelLog = useMutation({
    mutationFn: async (fuelData: any) => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .insert([{
          ...fuelData,
          quantity_liters: parseFloat(fuelData.quantity_liters),
          price_per_liter: parseFloat(fuelData.price_per_liter),
          odometer_reading: parseInt(fuelData.odometer_reading),
          previous_odometer: parseInt(fuelData.previous_odometer),
          status: 'pending'
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      toast.success('Fuel log submitted successfully');
      setShowAddDialog(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        driver_id: '',
        bus_id: '',
        route_id: '',
        fuel_station: '',
        quantity_liters: '',
        price_per_liter: '',
        odometer_reading: '',
        previous_odometer: '',
        receipt_number: '',
        notes: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit fuel log');
    }
  });

  const approveFuelLog = useMutation({
    mutationFn: async (logId: string) => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', logId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      toast.success('Fuel log approved');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve fuel log');
    }
  });

  const rejectFuelLog = useMutation({
    mutationFn: async (logId: string) => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', logId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      toast.success('Fuel log rejected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject fuel log');
    }
  });

  const handleSubmit = () => {
    if (!formData.date || !formData.driver_id || !formData.bus_id || !formData.fuel_station || !formData.quantity_liters || !formData.price_per_liter) {
      toast.error('Please fill all required fields');
      return;
    }
    createFuelLog.mutate(formData);
  };

  const totalFuelCost = fuelLogs.filter((l: any) => l.status === 'approved').reduce((sum, log: any) => sum + parseFloat(log.total_cost || 0), 0);
  const totalQuantity = fuelLogs.filter((l: any) => l.status === 'approved').reduce((sum, log: any) => sum + parseFloat(log.quantity_liters || 0), 0);
  const pendingApprovals = fuelLogs.filter((l: any) => l.status === 'pending').length;
  const fuelVariance = fuelLogs.filter((l: any) => l.status === 'approved' && parseFloat(l.variance || 0) !== 0).reduce((sum, log: any) => sum + parseFloat(log.variance || 0), 0);

  // Top fuel stations
  const stationStats = fuelLogs.filter((l: any) => l.status === 'approved').reduce((acc: any[], log: any) => {
    const existing = acc.find(s => s.station === log.fuel_station);
    if (existing) {
      existing.count += 1;
      existing.totalCost += parseFloat(log.total_cost || 0);
    } else {
      acc.push({ station: log.fuel_station, count: 1, totalCost: parseFloat(log.total_cost || 0) });
    }
    return acc;
  }, []);
  const topStations = stationStats.sort((a, b) => b.count - a.count).slice(0, 3);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Fuel & Allowance</h1>
            <p className="text-muted-foreground">Track fuel consumption and efficiency</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Fuel Log
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fuel Cost</CardTitle>
              <FuelIcon className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">P {totalFuelCost.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantity.toFixed(0)} L</div>
              <p className="text-xs text-muted-foreground">Liters consumed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fuel Variance</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">P {Math.abs(fuelVariance).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Discrepancies</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Fuel Stations */}
        <Card>
          <CardHeader>
            <CardTitle>Top Fuel Stations</CardTitle>
            <CardDescription>Most frequently used stations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topStations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
              ) : (
                topStations.map((station, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{station.station}</div>
                      <div className="text-sm text-muted-foreground">{station.count} refills</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">P {station.totalCost.toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Total spent</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fuel Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Logs</CardTitle>
            <CardDescription>All fuel submissions and approvals</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead>Quantity (L)</TableHead>
                  <TableHead>Price/L</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : fuelLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      No fuel logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  fuelLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.date}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.driver?.full_name || '-'}</div>
                          <div className="text-xs text-muted-foreground">{log.driver?.employee_id || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.bus?.registration_number || '-'}</div>
                          <div className="text-xs text-muted-foreground">{log.bus?.model || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.route ? `${log.route.origin} - ${log.route.destination}` : '-'}
                      </TableCell>
                      <TableCell>{log.fuel_station}</TableCell>
                      <TableCell>{parseFloat(log.quantity_liters).toFixed(1)}</TableCell>
                      <TableCell>P {parseFloat(log.price_per_liter).toFixed(2)}</TableCell>
                      <TableCell className="font-bold">P {parseFloat(log.total_cost).toLocaleString()}</TableCell>
                      <TableCell>
                        {log.fuel_efficiency ? `${parseFloat(log.fuel_efficiency).toFixed(2)} km/L` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          log.status === 'approved' ? 'bg-green-500' :
                          log.status === 'rejected' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => approveFuelLog.mutate(log.id)}>
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => rejectFuelLog.mutate(log.id)}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Fuel Log Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Fuel Log</DialogTitle>
              <DialogDescription>Submit a new fuel refill record</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <Label>Driver *</Label>
                  <Select value={formData.driver_id} onValueChange={(value) => setFormData({...formData, driver_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No active drivers found</div>
                      ) : (
                        drivers.map((driver: any) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.full_name} {driver.license_number ? `(${driver.license_number})` : ''}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Bus *</Label>
                  <Select value={formData.bus_id} onValueChange={(value) => setFormData({...formData, bus_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bus" />
                    </SelectTrigger>
                    <SelectContent>
                      {buses.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No active buses found</div>
                      ) : (
                        buses.map((bus: any) => (
                          <SelectItem key={bus.id} value={bus.id}>
                            {bus.name || bus.number_plate || bus.registration_number} - {bus.model}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Route (Optional)</Label>
                  <Select value={formData.route_id} onValueChange={(value) => setFormData({...formData, route_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select route (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {routes.map((route: any) => (
                        <SelectItem key={route.id} value={route.id}>
                          {route.origin} - {route.destination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Fuel Station *</Label>
                <Input value={formData.fuel_station} onChange={(e) => setFormData({...formData, fuel_station: e.target.value})} placeholder="e.g., Shell Gaborone" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Quantity (Liters) *</Label>
                  <Input type="number" step="0.01" value={formData.quantity_liters} onChange={(e) => setFormData({...formData, quantity_liters: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <Label>Price per Liter *</Label>
                  <Input type="number" step="0.01" value={formData.price_per_liter} onChange={(e) => setFormData({...formData, price_per_liter: e.target.value})} placeholder="0.00" />
                </div>
                <div>
                  <Label>Total Cost</Label>
                  <Input type="number" value={(parseFloat(formData.quantity_liters || '0') * parseFloat(formData.price_per_liter || '0')).toFixed(2)} disabled />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Previous Odometer</Label>
                  <Input type="number" value={formData.previous_odometer} onChange={(e) => setFormData({...formData, previous_odometer: e.target.value})} placeholder="0" />
                </div>
                <div>
                  <Label>Current Odometer</Label>
                  <Input type="number" value={formData.odometer_reading} onChange={(e) => setFormData({...formData, odometer_reading: e.target.value})} placeholder="0" />
                </div>
              </div>
              <div>
                <Label>Receipt Number</Label>
                <Input value={formData.receipt_number} onChange={(e) => setFormData({...formData, receipt_number: e.target.value})} placeholder="e.g., REC-001" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Additional notes..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleSubmit} disabled={createFuelLog.isPending}>
                  {createFuelLog.isPending ? 'Submitting...' : 'Submit Fuel Log'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
