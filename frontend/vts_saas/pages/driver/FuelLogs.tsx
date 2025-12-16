import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Fuel, Plus, Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function FuelLogs() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Fetch driver ID
  const { data: driverData } = useQuery({
    queryKey: ['driver-profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch fuel stations
  const { data: fuelStations = [] } = useQuery({
    queryKey: ['fuel-stations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_stations')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch driver's fuel logs
  const { data: fuelLogs = [], isLoading } = useQuery({
    queryKey: ['driver-fuel-logs', driverData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('driver_fuel_logs')
        .select('*')
        .eq('driver_id', driverData?.id)
        .order('filled_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!driverData?.id,
  });

  // Fetch driver's current bus
  const { data: currentBus } = useQuery({
    queryKey: ['driver-current-bus', driverData?.id],
    queryFn: async () => {
      // Get the most recent active trip for this driver
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('bus_id, buses!inner(id, bus_number, number_plate)')
        .eq('driver_id', driverData?.id)
        .in('status', ['scheduled', 'active', 'boarding', 'departed'])
        .order('departure_time', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (tripError || !trip) return null;
      // buses is returned as an object when using !inner
      return trip.buses as any;
    },
    enabled: !!driverData?.id,
  });

  // Upload receipt to storage
  const uploadReceipt = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('fuel-receipts')
      .upload(fileName, file);

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('fuel-receipts')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Add fuel log mutation
  const addFuelLogMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setUploading(true);
      
      let receiptUrl = '';
      if (receiptFile) {
        receiptUrl = await uploadReceipt(receiptFile);
      }

      const fuelLog = {
        driver_id: driverData?.id,
        bus_id: formData.get('bus_id') || currentBus?.id,
        fuel_station_id: formData.get('fuel_station_id'),
        liters: parseFloat(formData.get('liters') as string),
        cost_per_liter: parseFloat(formData.get('cost_per_liter') as string),
        total_cost: parseFloat(formData.get('total_cost') as string),
        odometer_reading: parseInt(formData.get('odometer_reading') as string),
        receipt_number: formData.get('receipt_number'),
        receipt_image_url: receiptUrl,
        filled_at: new Date(formData.get('filled_at') as string).toISOString(),
        status: 'pending',
      };

      const { data, error } = await supabase
        .from('fuel_logs')
        .insert([fuelLog])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-fuel-logs'] });
      toast.success('Fuel log submitted successfully!');
      setShowAddDialog(false);
      setReceiptFile(null);
      setUploading(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit fuel log');
      setUploading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addFuelLogMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  return (
    <DriverLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Fuel className="h-8 w-8" />
              Fuel Logs
            </h1>
            <p className="text-muted-foreground">Record your fuel purchases and upload receipts</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Fuel Log
          </Button>
        </div>

        {/* Current Bus Info */}
        {currentBus && (
          <Card>
            <CardHeader>
              <CardTitle>Current Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bus Number</p>
                  <p className="text-xl font-bold">{currentBus.bus_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Number Plate</p>
                  <p className="text-xl font-bold">{currentBus.number_plate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fuel Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Fuel Logs</CardTitle>
            <CardDescription>View and track your fuel purchase history</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading...</div>
            ) : fuelLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Fuel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No fuel logs yet. Add your first fuel purchase!</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Station</TableHead>
                    <TableHead>Liters</TableHead>
                    <TableHead>Cost/L</TableHead>
                    <TableHead>Total Cost</TableHead>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>{format(new Date(log.filled_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.bus_number}</div>
                          <div className="text-xs text-muted-foreground">{log.number_plate}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.fuel_station_name}</div>
                          <div className="text-xs text-muted-foreground">{log.station_location}</div>
                        </div>
                      </TableCell>
                      <TableCell>{log.liters} L</TableCell>
                      <TableCell>P {log.cost_per_liter.toFixed(2)}</TableCell>
                      <TableCell className="font-bold">P {log.total_cost.toFixed(2)}</TableCell>
                      <TableCell>
                        {log.receipt_image_url ? (
                          <a href={log.receipt_image_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-sm">No receipt</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Fuel Log Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Fuel Log</DialogTitle>
            <DialogDescription>Record your fuel purchase details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fuel_station_id">Fuel Station *</Label>
                <Select name="fuel_station_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select station" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelStations.map((station: any) => (
                      <SelectItem key={station.id} value={station.id}>
                        {station.name} - {station.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="filled_at">Date & Time *</Label>
                <Input
                  id="filled_at"
                  name="filled_at"
                  type="datetime-local"
                  defaultValue={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="liters">Liters *</Label>
                <Input
                  id="liters"
                  name="liters"
                  type="number"
                  step="0.01"
                  placeholder="50.00"
                  required
                  onChange={(e) => {
                    const liters = parseFloat(e.target.value) || 0;
                    const costPerLiter = parseFloat((document.getElementById('cost_per_liter') as HTMLInputElement)?.value) || 0;
                    const totalCost = liters * costPerLiter;
                    (document.getElementById('total_cost') as HTMLInputElement).value = totalCost.toFixed(2);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost_per_liter">Cost per Liter (P) *</Label>
                <Input
                  id="cost_per_liter"
                  name="cost_per_liter"
                  type="number"
                  step="0.01"
                  placeholder="15.50"
                  required
                  onChange={(e) => {
                    const costPerLiter = parseFloat(e.target.value) || 0;
                    const liters = parseFloat((document.getElementById('liters') as HTMLInputElement)?.value) || 0;
                    const totalCost = liters * costPerLiter;
                    (document.getElementById('total_cost') as HTMLInputElement).value = totalCost.toFixed(2);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_cost">Total Cost (P) *</Label>
                <Input
                  id="total_cost"
                  name="total_cost"
                  type="number"
                  step="0.01"
                  placeholder="775.00"
                  required
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="odometer_reading">Odometer Reading (km) *</Label>
                <Input
                  id="odometer_reading"
                  name="odometer_reading"
                  type="number"
                  placeholder="125000"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt_number">Receipt Number</Label>
                <Input
                  id="receipt_number"
                  name="receipt_number"
                  placeholder="RCP-12345"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="receipt">Receipt Image/PDF</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="receipt"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                />
                {receiptFile && (
                  <Badge variant="secondary">
                    <FileText className="h-3 w-3 mr-1" />
                    {receiptFile.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a photo or PDF of your fuel receipt (Max 5MB)
              </p>
            </div>

            {currentBus && (
              <input type="hidden" name="bus_id" value={currentBus.id} />
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading || addFuelLogMutation.isPending}>
                {uploading || addFuelLogMutation.isPending ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Fuel Log
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DriverLayout>
  );
}
