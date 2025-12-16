import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Loader2, AlertCircle, CheckCircle2, Bus, User, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ShiftPreview {
  availableDrivers: number;
  availableBuses: number;
  plannedSchedules: number;
  potentialShifts: number;
  warnings: string[];
}

export default function GenerateShiftsDialog() {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [selectAllRoutes, setSelectAllRoutes] = useState(true);
  const [preview, setPreview] = useState<ShiftPreview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const queryClient = useQueryClient();

  // Fetch routes
  const { data: routes = [], isLoading: routesLoading, error: routesError } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('id, origin, destination')
        .eq('is_active', true)
        .order('origin');
      
      if (error) {
        console.error('Error fetching routes:', error);
        throw error;
      }
      
      console.log('Routes fetched:', data);
      return data || [];
    },
    enabled: open, // Only fetch when dialog is open
  });

  // Generate preview
  const generatePreview = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Get available drivers
      const { data: drivers } = await supabase
        .from('drivers')
        .select('id')
        .eq('status', 'active');

      // Get available buses (no fuel_level in schema)
      const { data: buses } = await supabase
        .from('buses')
        .select('id')
        .eq('status', 'active');

      // Get schedules for selected routes (schedules don't have departure_date)
      const { data: schedules } = await supabase
        .from('schedules')
        .select('id, route_id')
        .eq('is_active', true)
        .in('route_id', selectAllRoutes ? routes.map(r => r.id) : selectedRoutes);

      const warnings: string[] = [];
      
      if ((drivers?.length || 0) < (schedules?.length || 0)) {
        warnings.push(`Not enough drivers available (${drivers?.length} drivers for ${schedules?.length} schedules)`);
      }
      
      if ((buses?.length || 0) < (schedules?.length || 0)) {
        warnings.push(`Not enough buses available (${buses?.length} buses for ${schedules?.length} schedules)`);
      }

      if ((schedules?.length || 0) === 0) {
        warnings.push('No active schedules found for selected routes');
      }

      setPreview({
        availableDrivers: drivers?.length || 0,
        availableBuses: buses?.length || 0,
        plannedSchedules: schedules?.length || 0,
        potentialShifts: Math.min(drivers?.length || 0, buses?.length || 0, schedules?.length || 0),
        warnings,
      });
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview');
    }
  };

  // Auto-generate shifts
  const generateShiftsMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Call the Supabase function to auto-generate shifts
      const { data, error } = await supabase.rpc('auto_generate_shifts', {
        p_date: dateStr,
        p_route_ids: selectAllRoutes ? routes.map(r => r.id) : selectedRoutes,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      toast.success(`Successfully generated ${data?.shifts_created || 0} shifts!`);
      queryClient.invalidateQueries({ queryKey: ['driver-shifts'] });
      setOpen(false);
      setPreview(null);
    },
    onError: (error: any) => {
      setIsGenerating(false);
      console.error('Error generating shifts:', error);
      toast.error(error.message || 'Failed to generate shifts');
    },
  });

  const handleGenerateShifts = () => {
    if (!preview) {
      generatePreview();
    } else {
      generateShiftsMutation.mutate();
    }
  };

  const handleRouteToggle = (routeId: string) => {
    setSelectedRoutes(prev =>
      prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
    );
    setSelectAllRoutes(false);
    setPreview(null);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAllRoutes(checked);
    if (checked) {
      setSelectedRoutes([]);
    }
    setPreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Generate Shifts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Auto-Generate Driver Shifts</DialogTitle>
          <DialogDescription>
            Automatically assign drivers, buses, and conductors to scheduled trips
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setPreview(null);
                }
              }}
              className="rounded-md border"
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </div>

          {/* Route Selection */}
          <div className="space-y-3">
            <Label>Select Routes {routes.length > 0 && `(${routes.length} available)`}</Label>
            
            {routesLoading ? (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Loading routes...
              </div>
            ) : routesError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load routes: {routesError.message}
                </AlertDescription>
              </Alert>
            ) : routes.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No routes found. Please create routes first.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex items-center space-x-2 mb-2">
                  <Checkbox
                    id="select-all"
                    checked={selectAllRoutes}
                    onCheckedChange={handleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All Routes
                  </label>
                </div>
                
                {!selectAllRoutes && (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                    {routes.map((route: any) => (
                      <div key={route.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={route.id}
                          checked={selectedRoutes.includes(route.id)}
                          onCheckedChange={() => handleRouteToggle(route.id)}
                        />
                        <label
                          htmlFor={route.id}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {route.origin} → {route.destination}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <Label>Generation Preview</Label>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    <span>Available Drivers</span>
                  </div>
                  <p className="text-2xl font-bold">{preview.availableDrivers}</p>
                </div>
                
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Bus className="h-4 w-4" />
                    <span>Available Buses</span>
                  </div>
                  <p className="text-2xl font-bold">{preview.availableBuses}</p>
                </div>
                
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span>Planned Trips</span>
                  </div>
                  <p className="text-2xl font-bold">{preview.plannedSchedules}</p>
                </div>
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>{preview.potentialShifts} shifts</strong> will be automatically generated
                </AlertDescription>
              </Alert>

              {preview.warnings.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1">
                      {preview.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateShifts} 
            disabled={isGenerating || routes.length === 0 || routesLoading}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : preview ? (
              'Generate Shifts'
            ) : (
              'Preview'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
