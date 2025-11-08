import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bus, Edit, Fuel, Calendar, Gauge, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface BusCardProps {
  bus: any;
  onEdit: (bus: any) => void;
  onAddFuel: (bus: any) => void;
}

export default function BusCard({ bus, onEdit, onAddFuel }: BusCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'maintenance':
        return 'bg-orange-500';
      case 'out_of_service':
        return 'bg-red-500';
      case 'retired':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    if (!status) return 'Unknown';
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const isServiceDue = bus.next_service_date && 
    new Date(bus.next_service_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bus className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{bus.name}</CardTitle>
              <p className="text-sm text-muted-foreground font-mono">{bus.number_plate}</p>
            </div>
          </div>
          <Badge className={getStatusColor(bus.status)}>
            {getStatusLabel(bus.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bus Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground">Model</p>
            <p className="font-medium">{bus.model || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Year</p>
            <p className="font-medium">{bus.year || 'N/A'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Capacity</p>
            <p className="font-medium">{bus.seating_capacity} seats</p>
          </div>
          <div>
            <p className="text-muted-foreground">Mileage</p>
            <p className="font-medium flex items-center gap-1">
              <Gauge className="h-3 w-3" />
              {parseFloat(bus.total_mileage || 0).toLocaleString()} km
            </p>
          </div>
        </div>

        {/* Service Information */}
        {bus.next_service_date && (
          <div className={`p-3 rounded-lg ${isServiceDue ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className={`h-4 w-4 ${isServiceDue ? 'text-orange-600' : 'text-muted-foreground'}`} />
              <div className="flex-1">
                <p className={`font-medium ${isServiceDue ? 'text-orange-900' : ''}`}>
                  Next Service
                </p>
                <p className={isServiceDue ? 'text-orange-700' : 'text-muted-foreground'}>
                  {format(new Date(bus.next_service_date), 'MMM dd, yyyy')}
                </p>
              </div>
              {isServiceDue && (
                <AlertCircle className="h-4 w-4 text-orange-600" />
              )}
            </div>
          </div>
        )}

        {/* GPS Device */}
        {bus.gps_device_id && (
          <div className="text-xs text-muted-foreground">
            GPS: {bus.gps_device_id}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit(bus)}
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onAddFuel(bus)}
          >
            <Fuel className="h-3 w-3 mr-1" />
            Add Fuel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
