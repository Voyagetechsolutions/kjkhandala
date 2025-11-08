import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MapPin, Clock, Bus, User, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function TripDetails() {
  const navigate = useNavigate();
  const [checklist, setChecklist] = useState({
    license: false,
    walkAround: false,
    lights: false,
    brakes: false,
    fuel: false,
    tyres: false,
    mirrors: false,
    emergencyKit: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['driver-trip'],
    queryFn: async () => {
      const response = await api.get('/driver/my-trip');
      return response.data;
    },
  });

  const submitChecklistMutation = useMutation({
    mutationFn: async (checklistData: any) => {
      const response = await api.post(`/driver/checklist/${data.trip.id}`, {
        checklist: checklistData,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Pre-departure checklist submitted!');
      navigate('/driver/start-trip');
    },
    onError: () => {
      toast.error('Failed to submit checklist');
    },
  });

  const handleChecklistChange = (key: string, value: boolean) => {
    setChecklist(prev => ({ ...prev, [key]: value }));
  };

  const allChecked = Object.values(checklist).every(val => val === true);

  const handleSubmitChecklist = () => {
    if (!allChecked) {
      toast.error('Please complete all checklist items');
      return;
    }
    submitChecklistMutation.mutate(checklist);
  };

  if (isLoading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-2xl font-bold">Loading trip details...</div>
        </div>
      </DriverLayout>
    );
  }

  if (!data?.hasTrip) {
    return (
      <DriverLayout>
        <div className="text-center py-16">
          <p className="text-2xl font-bold">No trip assigned</p>
        </div>
      </DriverLayout>
    );
  }

  const trip = data.trip;

  return (
    <DriverLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">Trip Details</h1>

        {/* Trip Information */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Trip Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Trip ID</p>
                  <p className="text-xl font-bold font-mono">{trip.id.substring(0, 8).toUpperCase()}</p>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="text-2xl font-bold">{trip.route}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Departure Terminal</p>
                  <p className="text-xl font-bold">{trip.origin}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Arrival Terminal</p>
                  <p className="text-xl font-bold">{trip.destination}</p>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Departure Time</p>
                    <p className="text-xl font-bold">
                      {new Date(trip.departureTime).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                    <p className="text-xl font-bold">
                      {new Date(trip.arrivalTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="text-2xl font-bold">{trip.distance} km</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Estimated Duration</p>
                  <p className="text-2xl font-bold">{trip.estimatedDuration} hours</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Average Expected Speed</p>
                  <p className="text-2xl font-bold">{Math.round(trip.distance / trip.estimatedDuration)} km/h</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Total Passengers</p>
                  <p className="text-2xl font-bold">{trip.totalPassengers}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="text-lg px-4 py-1">{trip.status}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crew Information */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <User className="h-6 w-6" />
              Crew Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Driver</p>
                <p className="text-xl font-bold">You (Primary Driver)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assistant Driver</p>
                <p className="text-xl font-medium text-muted-foreground">Not Assigned</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conductor</p>
                <p className="text-xl font-medium text-muted-foreground">Not Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bus Details */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Bus className="h-6 w-6" />
              Bus Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Registration</p>
                <p className="text-xl font-bold">{trip.busNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="text-xl font-bold">{trip.busModel}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Passengers</p>
                <p className="text-xl font-bold">{trip.totalPassengers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pre-Departure Checklist */}
        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              Pre-Departure Checklist
            </CardTitle>
            <p className="text-muted-foreground text-lg">All items must be checked before departure</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { key: 'license', label: 'Driver License Present' },
                { key: 'walkAround', label: 'Bus Walk-Around Check Completed' },
                { key: 'lights', label: 'All Lights Working' },
                { key: 'brakes', label: 'Brakes OK' },
                { key: 'fuel', label: 'Fuel Level OK' },
                { key: 'tyres', label: 'Tyres OK' },
                { key: 'mirrors', label: 'Mirrors OK' },
                { key: 'emergencyKit', label: 'Emergency Kit Present' },
              ].map(item => (
                <div key={item.key} className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                  <Checkbox
                    id={item.key}
                    checked={checklist[item.key as keyof typeof checklist]}
                    onCheckedChange={(checked) => 
                      handleChecklistChange(item.key, checked as boolean)
                    }
                    className="h-6 w-6"
                  />
                  <label
                    htmlFor={item.key}
                    className="text-xl font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {item.label}
                  </label>
                  {checklist[item.key as keyof typeof checklist] && (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  )}
                </div>
              ))}
            </div>

            <Button
              onClick={handleSubmitChecklist}
              disabled={!allChecked || submitChecklistMutation.isPending}
              className="w-full mt-6 h-16 text-xl font-bold"
              size="lg"
            >
              {allChecked ? (
                <>
                  <CheckCircle2 className="h-6 w-6 mr-2" />
                  Submit Checklist & Continue
                </>
              ) : (
                'Complete All Items'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
