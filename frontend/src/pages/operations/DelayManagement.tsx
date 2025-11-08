import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Clock, AlertCircle, Users, TrendingUp, Activity } from 'lucide-react';

export default function DelayManagement() {
  // Fetch delayed trips
  const { data: delaysData, isLoading } = useQuery({
    queryKey: ['operations-delays'],
    queryFn: async () => {
      const response = await api.get('/operations/delays');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const delays = delaysData?.delays || [];

  const stats = {
    total: delays.length,
    critical: delays.filter((d: any) => d.delayMinutes > 60).length,
    moderate: delays.filter((d: any) => d.delayMinutes > 30 && d.delayMinutes <= 60).length,
    minor: delays.filter((d: any) => d.delayMinutes <= 30).length,
    totalPassengers: delays.reduce((sum: number, d: any) => sum + (d.affectedPassengers || 0), 0),
  };

  const getDelayBadge = (delayMinutes: number) => {
    if (delayMinutes > 60) {
      return <Badge variant="destructive">Critical ({delayMinutes}min)</Badge>;
    } else if (delayMinutes > 30) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        Moderate ({delayMinutes}min)
      </Badge>;
    } else {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        Minor ({delayMinutes}min)
      </Badge>;
    }
  };

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Delay Management</h1>
          <p className="text-muted-foreground">Monitor and resolve trip delays</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Delays</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Currently delayed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.critical}</div>
              <p className="text-xs text-muted-foreground">&gt;60 minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moderate</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.moderate}</div>
              <p className="text-xs text-muted-foreground">30-60 minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minor</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.minor}</div>
              <p className="text-xs text-muted-foreground">&lt;30 minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affected Passengers</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPassengers}</div>
              <p className="text-xs text-muted-foreground">Total impacted</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Summary */}
        {delays.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Immediate Action Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">{stats.critical}</div>
                <p className="text-sm text-red-700 mt-1">
                  Critical delays over 60 minutes requiring immediate intervention
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-900 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Monitor Closely
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">{stats.moderate}</div>
                <p className="text-sm text-orange-700 mt-1">
                  Moderate delays that may escalate if not addressed
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delayed Trips Table */}
        <Card>
          <CardHeader>
            <CardTitle>Delayed Trips</CardTitle>
            <CardDescription>
              {delays.length} trip(s) currently delayed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading delay data...</p>
              </div>
            ) : delays.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No Delays!</p>
                <p className="text-sm mt-2">All trips are running on schedule</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route</TableHead>
                    <TableHead>Bus</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Scheduled Departure</TableHead>
                    <TableHead>Delay</TableHead>
                    <TableHead>Affected Passengers</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {delays.map((trip: any) => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{trip.route?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {trip.route?.origin} → {trip.route?.destination}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{trip.bus?.registrationNumber}</code>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {trip.driver ? `${trip.driver.firstName} ${trip.driver.lastName}` : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {new Date(trip.departureTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getDelayBadge(trip.delayMinutes)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <Badge variant="outline">{trip.affectedPassengers || 0}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {trip.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Notify
                          </Button>
                          <Button size="sm" variant="outline">
                            Update
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Delay Trends */}
        {delays.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Delay Analytics
              </CardTitle>
              <CardDescription>Performance insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Average Delay</div>
                  <div className="text-2xl font-bold">
                    {delays.length > 0
                      ? Math.round(
                          delays.reduce((sum: number, d: any) => sum + d.delayMinutes, 0) / delays.length
                        )
                      : 0}{' '}
                    min
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Longest Delay</div>
                  <div className="text-2xl font-bold">
                    {Math.max(...delays.map((d: any) => d.delayMinutes), 0)} min
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Total Affected</div>
                  <div className="text-2xl font-bold">{stats.totalPassengers} passengers</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </OperationsLayout>
  );
}
