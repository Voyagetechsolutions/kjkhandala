import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Star, Download, TrendingUp } from 'lucide-react';

export default function TripHistory() {
  const trips = [
    {
      id: 1,
      route: 'Gaborone - Kasane',
      date: '2024-11-05',
      duration: '10h 00m',
      distance: '850 km',
      passengers: 42,
      rating: 4.8,
      onTime: true,
      revenue: 'P 21,000',
    },
    {
      id: 2,
      route: 'Maun - Gaborone',
      date: '2024-11-04',
      duration: '4h 30m',
      distance: '520 km',
      passengers: 38,
      rating: 4.9,
      onTime: true,
      revenue: 'P 19,000',
    },
  ];

  const stats = {
    totalTrips: 156,
    totalDistance: '12,450 km',
    averageRating: 4.8,
    onTimeRate: 96,
  };

  return (
    <DriverLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Trip History</h1>
          <p className="text-muted-foreground">Your completed trips and performance</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrips}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDistance}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}/5.0</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Time Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onTimeRate}%</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {trips.map((trip) => (
            <Card key={trip.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{trip.route}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {trip.date}
                    </CardDescription>
                  </div>
                  <Badge className={trip.onTime ? 'bg-green-500' : 'bg-yellow-500'}>
                    {trip.onTime ? 'On Time' : 'Delayed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="font-medium">{trip.duration}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Distance</div>
                    <div className="font-medium">{trip.distance}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Passengers</div>
                    <div className="font-medium">{trip.passengers}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Rating</div>
                    <div className="font-medium flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      {trip.rating}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Revenue</div>
                    <div className="font-medium">{trip.revenue}</div>
                  </div>
                </div>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download Report
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DriverLayout>
  );
}
