import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Bus, Calendar, ArrowRight } from "lucide-react";

interface TripSummaryProps {
  schedule: {
    departure_date: string;
    departure_time: string;
    routes: {
      origin: string;
      destination: string;
      price: number;
      duration_hours: number;
      route_type: string;
    };
    buses: {
      name: string;
      number_plate: string;
    };
  };
  passengers?: number;
  totalPrice?: number;
}

export default function TripSummary({ schedule, passengers = 1, totalPrice }: TripSummaryProps) {
  const calculatedTotal = totalPrice || (schedule.routes.price * passengers);

  return (
    <Card className="p-6 bg-muted/30">
      <h3 className="text-xl font-bold mb-4">Trip Summary</h3>
      
      <div className="space-y-4">
        {/* Route */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">Route</div>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">{schedule.routes.origin}</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-semibold text-lg">{schedule.routes.destination}</span>
          </div>
          <Badge variant={schedule.routes.route_type === 'local' ? 'secondary' : 'default'} className="mt-2">
            {schedule.routes.route_type === 'local' ? 'STANDARD' : 'PREMIUM'}
          </Badge>
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Date</div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium">
                {new Date(schedule.departure_date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Departure Time</div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium">{schedule.departure_time}</span>
            </div>
          </div>
        </div>

        {/* Bus & Duration */}
        <div>
          <div className="text-sm text-muted-foreground mb-1">Coach</div>
          <div className="flex items-center gap-2">
            <Bus className="h-4 w-4 text-primary" />
            <span className="font-medium">{schedule.buses.name}</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {schedule.buses.number_plate} • {schedule.routes.duration_hours}h duration
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="border-t pt-4">
          <div className="text-sm text-muted-foreground mb-2">Fare Breakdown</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Base Fare ({passengers} passenger{passengers > 1 ? 's' : ''})</span>
              <span className="font-medium">P{schedule.routes.price * passengers}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Booking Fee</span>
              <span>P0</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total</span>
              <span className="text-primary">P{calculatedTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
