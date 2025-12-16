import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import DriverLayout from '@/components/driver/DriverLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserCircle, Award, TrendingUp, Calendar } from 'lucide-react';

export default function Profile() {
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .single();
      if (error) throw error;
      return { driver: data };
    },
  });

  if (isLoading) {
    return (
      <DriverLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-3xl font-bold">Loading profile...</div>
        </div>
      </DriverLayout>
    );
  }

  const profile = profileData?.driver || {};
  const stats = { totalTrips: 0, safetyScore: 100, incidents: 0 };
  const recentTrips: any[] = [];

  return (
    <DriverLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <UserCircle className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold">Driver Profile</h1>
        </div>

        {/* Driver Info */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-2xl font-bold">{profile.full_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-xl font-medium">{profile.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-xl font-medium">{profile.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <Badge className="text-lg px-4 py-1">{profile.status || 'DRIVER'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Total Trips</CardTitle>
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.totalTrips}</div>
              <p className="text-sm text-muted-foreground mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Safety Score</CardTitle>
              <Award className="h-6 w-6 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600">
                {stats.safetyScore}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Out of 100</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Incidents</CardTitle>
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{stats.incidents}</div>
              <p className="text-sm text-muted-foreground mt-1">Reported</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trips */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">Recent Trips</CardTitle>
          </CardHeader>
          <CardContent>
            {recentTrips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-xl">No recent trips</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTrips.map((trip: any) => (
                  <div key={trip.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-lg font-bold">{trip.route}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(trip.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge>{trip.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Safety Information */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Award className="h-6 w-6 text-green-600" />
              Safety Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-4">Your safety score is calculated based on:</p>
            <div className="space-y-2 text-lg">
              <div className="flex items-center gap-2">
                <span className="font-semibold">✓</span> Speed violations
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">✓</span> Harsh braking incidents
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">✓</span> Passenger complaints
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">✓</span> Accident history
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">✓</span> On-time performance
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DriverLayout>
  );
}
