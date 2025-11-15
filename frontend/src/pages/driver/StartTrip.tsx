import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Play, AlertTriangle, CheckCircle2, Upload, Camera } from 'lucide-react';

export default function StartTrip() {
  const navigate = useNavigate();
  const [odometerReading, setOdometerReading] = useState('');
  const [fuelLevel, setFuelLevel] = useState('');
  const [dashboardPhoto, setDashboardPhoto] = useState<File | null>(null);

  const { data } = useQuery({
    queryKey: ['driver-trip'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('id, route, departure_time, total_passengers, checked_in_passengers')
        .eq('driver_id', supabase.auth.user().id)
        .eq('status', 'pending');
      if (error) throw error;
      return { trip: data[0], hasTrip: true };
    },
  });

  const startTripMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('trips')
        .update({ status: 'in_progress', actual_departure: new Date().toISOString() })
        .eq('id', data.tripId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Trip started successfully!');
      navigate('/driver/live');
    },
    onError: () => {
      toast.error('Failed to start trip');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDashboardPhoto(e.target.files[0]);
      toast.success('Photo uploaded');
    }
  };

  const handleStartTrip = () => {
    if (!odometerReading || !fuelLevel) {
      toast.error('Please enter odometer reading and fuel level');
      return;
    }

    if (!dashboardPhoto) {
      toast.error('Please take a photo of the dashboard');
      return;
    }

    startTripMutation.mutate({
      odometerReading: parseInt(odometerReading),
      fuelLevel: parseFloat(fuelLevel),
      dashboardPhoto: dashboardPhoto.name, // In production, upload to server
    });
  };

  if (!data?.hasTrip) {
    return (
      <DriverLayout>
        <div className="text-center py-16">
          <p className="text-3xl font-bold">No trip assigned</p>
        </div>
      </DriverLayout>
    );
  }

  const trip = data.trip;

  return (
    <DriverLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">Start Trip</h1>

        {/* Warning */}
        <Card className="border-2 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="h-8 w-8 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold mb-2">Important</p>
                <p className="text-lg">
                  Once you start the trip, all data will be time-stamped and locked. 
                  Make sure all passengers are checked in and ready to depart.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Summary */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Trip Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Route</p>
                <p className="text-2xl font-bold">{trip.route}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Departure Time</p>
                <p className="text-2xl font-bold">
                  {new Date(trip.departureTime).toLocaleTimeString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Passengers</p>
                <p className="text-2xl font-bold">{trip.totalPassengers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Checked In</p>
                <p className="text-2xl font-bold">{trip.checkedInPassengers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pre-Start Checklist */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Pre-Start Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-xl font-semibold">Odometer Reading (km)</Label>
              <Input
                type="number"
                placeholder="Enter odometer reading"
                value={odometerReading}
                onChange={(e) => setOdometerReading(e.target.value)}
                className="h-16 text-2xl mt-2"
              />
            </div>

            <div>
              <Label className="text-xl font-semibold">Fuel Level (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Enter fuel level"
                value={fuelLevel}
                onChange={(e) => setFuelLevel(e.target.value)}
                className="h-16 text-2xl mt-2"
              />
            </div>

            {/* Dashboard Photo */}
            <div>
              <Label className="text-xl font-semibold">Dashboard Photo (Proof) *</Label>
              <div className="mt-2">
                <label htmlFor="dashboard-photo" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                    {dashboardPhoto ? (
                      <>
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                        <p className="text-lg font-medium text-green-600">Photo Captured</p>
                        <p className="text-sm text-muted-foreground mt-2">{dashboardPhoto.name}</p>
                      </>
                    ) : (
                      <>
                        <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-lg font-medium">Take Dashboard Photo</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Photo of odometer and fuel gauge required
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    id="dashboard-photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Checklist */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Final Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span>All checked-in passengers on board</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span>No-shows marked</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span>Pre-departure checklist completed</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span>Bus is ready to depart</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Button */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={() => navigate('/driver')}
            variant="outline"
            className="h-20 text-xl"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStartTrip}
            disabled={startTripMutation.isPending || !odometerReading || !fuelLevel}
            className="h-20 text-2xl font-bold bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <Play className="h-8 w-8 mr-3" />
            START TRIP
          </Button>
        </div>
      </div>
    </DriverLayout>
  );
}
