import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertTriangle, Send } from 'lucide-react';

export default function ReportIssue() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');

  const { data } = useQuery({
    queryKey: ['driver-trip'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('id')
        .eq('driver_id', supabase.auth.user().id);
      if (error) throw error;
      return data[0];
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('incidents')
        .insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Issue reported successfully');
      navigate('/driver');
    },
    onError: () => {
      toast.error('Failed to report issue');
    },
  });

  const handleSubmit = () => {
    if (!category || !description) {
      toast.error('Please select category and enter description');
      return;
    }

    reportMutation.mutate({
      category,
      description,
      severity,
      location: 'GPS coordinates here', // In real app, get from navigator.geolocation
    });
  };

  return (
    <DriverLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <AlertTriangle className="h-12 w-12 text-orange-600" />
          <h1 className="text-4xl font-bold">Report Issue</h1>
        </div>

        <Card className="border-2 border-orange-200">
          <CardHeader>
            <CardTitle className="text-2xl">Issue Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category */}
            <div>
              <Label className="text-xl font-semibold">Issue Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-16 text-lg mt-2">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MECHANICAL" className="text-lg">Mechanical Issue</SelectItem>
                  <SelectItem value="PASSENGER" className="text-lg">Passenger Problem</SelectItem>
                  <SelectItem value="WEATHER" className="text-lg">Weather</SelectItem>
                  <SelectItem value="POLICE" className="text-lg">Police/Checkpoint</SelectItem>
                  <SelectItem value="ACCIDENT_MINOR" className="text-lg">Accident (Minor)</SelectItem>
                  <SelectItem value="ACCIDENT_MAJOR" className="text-lg">Accident (Major)</SelectItem>
                  <SelectItem value="ROAD_CONDITION" className="text-lg">Road Condition</SelectItem>
                  <SelectItem value="FUEL" className="text-lg">Fuel Shortage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div>
              <Label className="text-xl font-semibold">Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="h-16 text-lg mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW" className="text-lg">Low - Informational</SelectItem>
                  <SelectItem value="MEDIUM" className="text-lg">Medium - Requires Attention</SelectItem>
                  <SelectItem value="HIGH" className="text-lg">High - Urgent</SelectItem>
                  <SelectItem value="CRITICAL" className="text-lg">Critical - Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label className="text-xl font-semibold">Description</Label>
              <Textarea
                placeholder="Describe the issue in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-40 text-lg mt-2"
              />
            </div>

            {/* Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-lg">
                  <strong>GPS Location:</strong> Will be automatically attached<br />
                  <strong>Time:</strong> Will be automatically recorded<br />
                  <strong>Trip ID:</strong> Will be linked to this trip
                </p>
              </CardContent>
            </Card>

            {/* Buttons */}
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={() => navigate('/driver')}
                variant="outline"
                className="h-16 text-xl"
                size="lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={reportMutation.isPending || !category || !description}
                className="h-16 text-xl bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                <Send className="h-6 w-6 mr-2" />
                {reportMutation.isPending ? 'Sending...' : 'Submit Report'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
