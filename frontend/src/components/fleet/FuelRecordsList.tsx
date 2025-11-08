import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Fuel } from 'lucide-react';
import { format } from 'date-fns';

interface FuelRecordsListProps {
  records: any[];
}

export default function FuelRecordsList({ records }: FuelRecordsListProps) {
  if (!records || records.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Fuel className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No fuel records yet</p>
        </CardContent>
      </Card>
    );
  }

  const totalFuelCost = records.reduce((sum, record) => sum + parseFloat(record.total_cost || 0), 0);
  const totalLiters = records.reduce((sum, record) => sum + parseFloat(record.quantity_liters || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Fuel Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">P {totalFuelCost.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Liters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalLiters.toFixed(2)} L</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Cost/Liter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              P {(totalFuelCost / totalLiters).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Station</TableHead>
                  <TableHead className="text-right">Liters</TableHead>
                  <TableHead className="text-right">Cost/L</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Odometer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{record.buses?.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {record.buses?.number_plate}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{record.station_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      {parseFloat(record.quantity_liters).toFixed(2)} L
                    </TableCell>
                    <TableCell className="text-right">
                      P {parseFloat(record.cost_per_liter).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      P {parseFloat(record.total_cost).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {record.odometer_reading 
                        ? `${parseFloat(record.odometer_reading).toLocaleString()} km`
                        : '-'
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
