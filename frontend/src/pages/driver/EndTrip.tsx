import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { StopCircle, CheckCircle2, PenTool, Trash2 } from 'lucide-react';

export default function EndTrip() {
  const navigate = useNavigate();
  const [finalOdometer, setFinalOdometer] = useState('');
  const [finalFuel, setFinalFuel] = useState('');
  const [incidents, setIncidents] = useState('');
  const [condition, setCondition] = useState('');
  const [signature, setSignature] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data } = useQuery({
    queryKey: ['driver-trip'],
    queryFn: async () => {
      const response = await api.get('/driver/my-trip');
      return response.data;
    },
  });

  const endTripMutation = useMutation({
    mutationFn: async (tripData: any) => {
      const response = await api.post(`/driver/end-trip/${data.trip.id}`, tripData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Trip completed successfully!');
      navigate('/driver');
    },
    onError: () => {
      toast.error('Failed to end trip');
    },
  });

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature('');
  };

  const handleEndTrip = () => {
    if (!finalOdometer || !finalFuel) {
      toast.error('Please enter final odometer and fuel level');
      return;
    }

    if (!signature) {
      toast.error('Please provide your digital signature');
      return;
    }

    endTripMutation.mutate({
      finalOdometer: parseInt(finalOdometer),
      finalFuel: parseFloat(finalFuel),
      incidents,
      condition,
      signature,
    });
  };

  if (!data?.hasTrip) {
    return (
      <DriverLayout>
        <div className="text-center py-16">
          <p className="text-3xl font-bold">No active trip</p>
        </div>
      </DriverLayout>
    );
  }

  return (
    <DriverLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <StopCircle className="h-12 w-12 text-red-600" />
          <h1 className="text-4xl font-bold">End Trip</h1>
        </div>

        {/* Trip Summary */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Trip Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Route</p>
                <p className="text-2xl font-bold">{data.trip.route}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Passengers</p>
                <p className="text-2xl font-bold">{data.trip.totalPassengers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Readings */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Final Readings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-xl font-semibold">Final Odometer (km)</Label>
              <Input
                type="number"
                placeholder="Enter final odometer reading"
                value={finalOdometer}
                onChange={(e) => setFinalOdometer(e.target.value)}
                className="h-16 text-2xl mt-2"
              />
            </div>

            <div>
              <Label className="text-xl font-semibold">Final Fuel Level (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="Enter final fuel level"
                value={finalFuel}
                onChange={(e) => setFinalFuel(e.target.value)}
                className="h-16 text-2xl mt-2"
              />
            </div>

            <div>
              <Label className="text-xl font-semibold">Incidents Summary (if any)</Label>
              <Textarea
                placeholder="List any incidents during the trip..."
                value={incidents}
                onChange={(e) => setIncidents(e.target.value)}
                className="min-h-32 text-lg mt-2"
              />
            </div>

            <div>
              <Label className="text-xl font-semibold">Bus Condition</Label>
              <Textarea
                placeholder="Report bus condition after trip..."
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="min-h-32 text-lg mt-2"
              />
            </div>
          </CardContent>
        </Card>

        {/* Digital Signature */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <PenTool className="h-6 w-6" />
              Digital Signature
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground">
              Sign below to confirm all information is accurate and complete
            </p>
            
            <div className="border-2 border-dashed rounded-lg p-4 bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full touch-none cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={clearSignature}
                variant="outline"
                size="lg"
                className="flex-1"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Clear Signature
              </Button>
              {signature && (
                <div className="flex items-center gap-2 text-green-600 flex-1 justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Signature Captured</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Confirmation */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="space-y-4 text-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span>All passengers have alighted</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span>All incidents have been reported</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span>Bus has been inspected</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <span>Digital signature provided</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={() => navigate('/driver/live')}
            variant="outline"
            className="h-20 text-xl"
            size="lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleEndTrip}
            disabled={endTripMutation.isPending || !finalOdometer || !finalFuel}
            className="h-20 text-2xl font-bold bg-red-600 hover:bg-red-700"
            size="lg"
          >
            <StopCircle className="h-8 w-8 mr-3" />
            {endTripMutation.isPending ? 'Completing...' : 'Complete Trip'}
          </Button>
        </div>
      </div>
    </DriverLayout>
  );
}
