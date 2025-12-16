import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface DriverAssignmentsProps {
  assignments: any[];
  drivers: any[];
}

export default function DriverAssignments({ assignments, drivers }: DriverAssignmentsProps) {
  if (!assignments || assignments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No driver assignments yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Driver Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{assignment.drivers?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{assignment.drivers?.phone}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {assignment.schedules?.routes?.origin} → {assignment.schedules?.routes?.destination}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {assignment.schedules?.departure_date 
                      ? format(new Date(assignment.schedules.departure_date), 'MMM dd, yyyy')
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>
                    {assignment.schedules?.departure_time || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {format(new Date(assignment.assigned_at), 'MMM dd, HH:mm')}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
