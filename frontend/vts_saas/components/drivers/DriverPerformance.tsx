import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface DriverPerformanceProps {
  performance: any[];
}

export default function DriverPerformance({ performance }: DriverPerformanceProps) {
  if (!performance || performance.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No performance data yet</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate summary statistics
  const totalTrips = performance.length;
  const onTimeTrips = performance.filter(p => p.on_time).length;
  const onTimePercentage = totalTrips > 0 ? ((onTimeTrips / totalTrips) * 100).toFixed(1) : '0';
  const avgRating = performance.length > 0
    ? (performance.reduce((sum, p) => sum + (parseFloat(p.passenger_rating) || 0), 0) / performance.length).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalTrips}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              On-Time Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{onTimePercentage}%</p>
            <p className="text-xs text-muted-foreground">{onTimeTrips} of {totalTrips} trips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">⭐ {avgRating}</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Performance History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>On Time</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Fuel Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {performance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <p className="font-medium">{record.drivers?.full_name}</p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {record.schedules?.routes?.origin} → {record.schedules?.routes?.destination}
                      </span>
                    </TableCell>
                    <TableCell>
                      {record.created_at 
                        ? format(new Date(record.created_at), 'MMM dd, yyyy')
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {record.on_time ? (
                        <Badge className="bg-green-500 gap-1">
                          <CheckCircle className="h-3 w-3" />
                          On Time
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500 gap-1">
                          <XCircle className="h-3 w-3" />
                          Delayed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.passenger_rating 
                        ? `⭐ ${parseFloat(record.passenger_rating).toFixed(1)}`
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      {record.fuel_efficiency 
                        ? `${parseFloat(record.fuel_efficiency).toFixed(2)} L/km`
                        : 'N/A'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
