import { useState } from 'react';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ClipboardCheck, Camera, Upload, CheckCircle } from 'lucide-react';

export default function VehicleInspection() {
  const [inspectionType, setInspectionType] = useState<'pre' | 'post'>('pre');
  const [checklist, setChecklist] = useState({
    tyres: false,
    brakes: false,
    lights: false,
    wipers: false,
    engine: false,
    mirrors: false,
    firstAid: false,
    fireExtinguisher: false,
  });

  const handleSubmit = () => {
    console.log('Submit inspection:', inspectionType, checklist);
  };

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Vehicle Inspection</h1>
          <p className="text-muted-foreground">Complete pre-trip and post-trip inspections</p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => setInspectionType('pre')}
            className={inspectionType === 'pre' ? '' : 'bg-muted'}
          >
            Pre-Trip Inspection
          </Button>
          <Button 
            onClick={() => setInspectionType('post')}
            className={inspectionType === 'post' ? '' : 'bg-muted'}
          >
            Post-Trip Inspection
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{inspectionType === 'pre' ? 'Pre-Trip' : 'Post-Trip'} Checklist</CardTitle>
            <CardDescription>Mark all items as checked before proceeding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(checklist).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) => 
                    setChecklist({...checklist, [key]: checked as boolean})
                  }
                />
                <Label htmlFor={key} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
              </div>
            ))}
          </CardContent>
        </Card>

        {inspectionType === 'post' && (
          <Card>
            <CardHeader>
              <CardTitle>Post-Trip Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mileage</Label>
                <Input type="number" placeholder="Enter ending mileage" />
              </div>
              <div>
                <Label>Fuel Level</Label>
                <Input type="number" placeholder="Fuel percentage" />
              </div>
              <div>
                <Label>Cleanliness Status</Label>
                <Textarea placeholder="Note any cleaning required" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Damage or Issues</CardTitle>
            <CardDescription>Report any problems found</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea placeholder="Describe any damage or issues..." rows={4} />
            <div>
              <Label>Attach Photos</Label>
              <div className="mt-2 flex gap-2">
                <Button>
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSubmit} className="w-full">
          <CheckCircle className="mr-2 h-4 w-4" />
          Submit Inspection Report
        </Button>
      </div>
    </DriverLayout>
  );
}
