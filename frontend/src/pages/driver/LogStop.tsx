import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Coffee, Play, StopCircle } from 'lucide-react';

export default function LogStop() {
  const navigate = useNavigate();
  const [stopType, setStopType] = useState('');
  const [activeStop, setActiveStop] = useState<any>(null);

  const { data } = useQuery({
    queryKey: ['driver-trip'],
    queryFn: async () => {
      const response = await api.get('/driver/my-trip');
      return response.data;
    },
  });

  const logStopMutation = useMutation({
    mutationFn: async (stopData: any) => {
      const response = await api.post(`/driver/log-stop/${data.trip.id}`, stopData);
      return response.data;
    },
    onSuccess: (data) => {
      setActiveStop(data);
      toast.success('Stop logged successfully');
    },
    onError: () => {
      toast.error('Failed to log stop');
    },
  });

  const endStopMutation = useMutation({
    mutationFn: async (stopId: string) => {
      const response = await api.post(`/driver/end-stop/${stopId}`);
      return response.data;
    },
    onSuccess: () => {
      setActiveStop(null);
      setStopType('');
      toast.success('Stop ended');
      navigate('/driver/live');
    },
    onError: () => {
      toast.error('Failed to end stop');
    },
  });

  const handleStartStop = () => {
    if (!stopType) {
      toast.error('Please select stop type');
      return;
    }

    logStopMutation.mutate({
      stopType,
      reason: stopType,
      location: 'Current GPS location',
    });
  };

  const handleEndStop = () => {
    if (activeStop) {
      endStopMutation.mutate(activeStop.stopId);
    }
  };

  return (
    <DriverLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Coffee className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">Log Stop</h1>
        </div>

        {!activeStop ? (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Start New Stop</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-xl font-semibold">Stop Reason</Label>
                <Select value={stopType} onValueChange={setStopType}>
                  <SelectTrigger className="h-16 text-lg mt-2">
                    <SelectValue placeholder="Select stop reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SCHEDULED_STOP" className="text-lg">Scheduled Stop</SelectItem>
                    <SelectItem value="BATHROOM_BREAK" className="text-lg">Bathroom Break</SelectItem>
                    <SelectItem value="FUEL_STOP" className="text-lg">Fuel Stop</SelectItem>
                    <SelectItem value="POLICE_CHECKPOINT" className="text-lg">Police Checkpoint</SelectItem>
                    <SelectItem value="BORDER_POST" className="text-lg">Border Post</SelectItem>
                    <SelectItem value="EMERGENCY_STOP" className="text-lg">Emergency Stop</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleStartStop}
                disabled={logStopMutation.isPending || !stopType}
                className="w-full h-20 text-2xl font-bold"
                size="lg"
              >
                <Play className="h-8 w-8 mr-3" />
                Start Stop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-2xl">Stop in Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-lg text-muted-foreground mb-2">Stop Type</p>
                <p className="text-3xl font-bold">{stopType.replace(/_/g, ' ')}</p>
              </div>

              <div className="bg-white p-6 rounded-lg text-center">
                <p className="text-lg text-muted-foreground mb-2">Timer will track duration automatically</p>
                <p className="text-4xl font-bold text-orange-600">⏱️ In Progress</p>
              </div>

              <Button
                onClick={handleEndStop}
                disabled={endStopMutation.isPending}
                className="w-full h-20 text-2xl font-bold bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <StopCircle className="h-8 w-8 mr-3" />
                End Stop
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DriverLayout>
  );
}
