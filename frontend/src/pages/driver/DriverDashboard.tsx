import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  Navigation,
  Calendar,
  Award
} from 'lucide-react';

export default function DriverDashboard() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !userRoles?.includes('DRIVER'))) {
      navigate('/');
      return;
    }
  }, [user, userRoles, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!userRoles?.includes('DRIVER')) return null;

  // Mock data - replace with API calls
  const driverInfo = {
    name: user?.fullName || 'Driver Name',
    busNumber: 'BUS-001',
    shiftStatus: 'on-duty',
    profilePicture: null,
  };

  const currentTrip = {
    route: 'Gaborone - Francistown',
    departure: '08:00',
    arrival: '12:00',
    passengers: 35,
    status: 'in-progress',
  };

  const nextTrip = {
    route: 'Francistown - Maun',
    departure: '14:00',
    arrival: '18:30',
  };

  const stats = {
    tripsCompleted: 156,
    distanceDriven: '12,450 km',
    averageRating: 4.8,
    punctualityRate: 96,
  };

  const notifications = [
    { id: 1, type: 'maintenance', message: 'Vehicle inspection due in 2 days', priority: 'medium' },
    { id: 2, type: 'hr', message: 'License renewal reminder - 30 days remaining', priority: 'low' },
    { id: 3, type: 'operations', message: 'Route change for tomorrow\'s trip', priority: 'high' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <DriverLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bus className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Welcome back, {driverInfo.name}!</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <Badge className="bg-primary">
                      <Bus className="h-3 w-3 mr-1" />
                      {driverInfo.busNumber}
                    </Badge>
                    <Badge className={driverInfo.shiftStatus === 'on-duty' ? 'bg-green-500' : 'bg-gray-500'}>
                      {driverInfo.shiftStatus === 'on-duty' ? '● On Duty' : '○ Off Duty'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Current Time</div>
                <div className="text-2xl font-bold">{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Trip Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Current Trip
            </CardTitle>
            <CardDescription>Active journey in progress</CardDescription>
          </CardHeader>
          <CardContent>
            {currentTrip.status === 'in-progress' ? (
              <div className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Route</div>
                    <div className="font-bold text-lg">{currentTrip.route}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Departure</div>
                    <div className="font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {currentTrip.departure}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Expected Arrival</div>
                    <div className="font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {currentTrip.arrival}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Passengers</div>
                    <div className="font-medium flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {currentTrip.passengers}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => navigate('/driver/live-trip')}>
                    <Navigation className="mr-2 h-4 w-4" />
                    View Live Trip
                  </Button>
                  <Button onClick={() => navigate('/driver/manifest')}>
                    <Users className="mr-2 h-4 w-4" />
                    View Manifest
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active trip</p>
                <p className="text-sm">Your next trip is scheduled below</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Trip */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Trip
            </CardTitle>
            <CardDescription>Upcoming scheduled journey</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Route</div>
                <div className="font-bold">{nextTrip.route}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Departure</div>
                <div className="font-medium">{nextTrip.departure}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expected Arrival</div>
                <div className="font-medium">{nextTrip.arrival}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trips Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tripsCompleted}</div>
              <p className="text-xs text-muted-foreground">Total journeys</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distance Driven</CardTitle>
              <Navigation className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.distanceDriven}</div>
              <p className="text-xs text-muted-foreground">Total kilometers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}/5.0</div>
              <p className="text-xs text-muted-foreground">Passenger feedback</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Punctuality</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.punctualityRate}%</div>
              <p className="text-xs text-muted-foreground">On-time arrivals</p>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Notifications & Alerts
            </CardTitle>
            <CardDescription>Important messages and reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <Badge className={getPriorityColor(notification.priority)}>
                    {notification.priority}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.type.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common driver operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <Button 
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate('/driver/inspection')}
              >
                <CheckCircle className="h-6 w-6" />
                <span>Vehicle Inspection</span>
              </Button>
              <Button 
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate('/driver/fuel-log')}
              >
                <Award className="h-6 w-6" />
                <span>Log Fuel</span>
              </Button>
              <Button 
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate('/driver/communication')}
              >
                <AlertCircle className="h-6 w-6" />
                <span>Report Issue</span>
              </Button>
              <Button 
                className="h-20 flex flex-col gap-2"
                onClick={() => navigate('/driver/history')}
              >
                <Calendar className="h-6 w-6" />
                <span>View History</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
