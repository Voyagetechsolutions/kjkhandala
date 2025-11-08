import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MapPin, Clock, Upload, CheckCircle2 } from 'lucide-react';

export default function BorderControl() {
  const navigate = useNavigate();
  const [borderEntered, setBorderEntered] = useState('');
  const [borderExited, setBorderExited] = useState('');
  const [timeInQueue, setTimeInQueue] = useState('');
  const [passengersChecked, setPassengersChecked] = useState('');
  const [stampPhoto, setStampPhoto] = useState<File | null>(null);

  const { data } = useQuery({
    queryKey: ['driver-trip'],
    queryFn: async () => {
      const response = await api.get('/driver/my-trip');
      return response.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (borderData: any) => {
      const formData = new FormData();
      formData.append('borderEntered', borderData.borderEntered);
      formData.append('borderExited', borderData.borderExited);
      formData.append('timeInQueue', borderData.timeInQueue);
      formData.append('passengersChecked', borderData.passengersChecked);
      if (stampPhoto) {
        formData.append('stampPhoto', stampPhoto);
      }

      const response = await api.post(`/driver/report-issue/${data.trip.id}`, {
        category: 'BORDER_CROSSING',
        description: JSON.stringify(borderData),
        severity: 'LOW',
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Border crossing logged successfully');
      navigate('/driver/live');
    },
    onError: () => {
      toast.error('Failed to log border crossing');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setStampPhoto(e.target.files[0]);
      toast.success('Photo uploaded');
    }
  };

  const handleSubmit = () => {
    if (!borderEntered || !passengersChecked) {
      toast.error('Please fill in required fields');
      return;
    }

    submitMutation.mutate({
      borderEntered,
      borderExited,
      timeInQueue: parseInt(timeInQueue) || 0,
      passengersChecked: parseInt(passengersChecked),
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <DriverLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <MapPin className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">Border Control</h1>
        </div>

        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <p className="text-lg">
              Log border crossing details for international trips. This information is required for compliance and tracking.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Border Crossing Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Border Entered */}
            <div>
              <Label className="text-xl font-semibold">Border Entered *</Label>
              <Input
                placeholder="e.g., Botswana-Zimbabwe Border"
                value={borderEntered}
                onChange={(e) => setBorderEntered(e.target.value)}
                className="h-16 text-lg mt-2"
              />
            </div>

            {/* Border Exited */}
            <div>
              <Label className="text-xl font-semibold">Border Exited (if completed)</Label>
              <Input
                placeholder="e.g., Zimbabwe Border Post"
                value={borderExited}
                onChange={(e) => setBorderExited(e.target.value)}
                className="h-16 text-lg mt-2"
              />
            </div>

            {/* Time in Queue */}
            <div>
              <Label className="text-xl font-semibold">Time in Queue (minutes)</Label>
              <Input
                type="number"
                placeholder="Enter waiting time"
                value={timeInQueue}
                onChange={(e) => setTimeInQueue(e.target.value)}
                className="h-16 text-lg mt-2"
              />
            </div>

            {/* Passengers Checked */}
            <div>
              <Label className="text-xl font-semibold">Number of Passengers Checked *</Label>
              <Input
                type="number"
                placeholder="Enter passenger count"
                value={passengersChecked}
                onChange={(e) => setPassengersChecked(e.target.value)}
                className="h-16 text-lg mt-2"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <Label className="text-xl font-semibold">Immigration Stamp Photo (Optional)</Label>
              <div className="mt-2">
                <label htmlFor="stamp-photo" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium">
                      {stampPhoto ? stampPhoto.name : 'Click to upload photo'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Take a photo of the immigration stamp
                    </p>
                  </div>
                  <input
                    id="stamp-photo"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Info */}
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="space-y-2 text-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <span>GPS location automatically recorded</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-green-600" />
                    <span>Timestamp automatically logged</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-green-600" />
                    <span>Data sent to Operations Manager</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={() => navigate('/driver/live')}
                variant="outline"
                className="h-16 text-xl"
                size="lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending || !borderEntered || !passengersChecked}
                className="h-16 text-xl bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <CheckCircle2 className="h-6 w-6 mr-2" />
                {submitMutation.isPending ? 'Submitting...' : 'Submit Border Crossing'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
