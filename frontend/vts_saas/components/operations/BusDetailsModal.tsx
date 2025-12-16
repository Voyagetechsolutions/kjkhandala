import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Bus, MapPin, Wrench, Activity, DollarSign, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface BusDetailsModalProps {
  bus: any;
  isOpen: boolean;
  onClose: () => void;
  gpsData?: any;
  maintenanceData: any[];
}

export default function BusDetailsModal({
  bus,
  isOpen,
  onClose,
  gpsData,
  maintenanceData,
}: BusDetailsModalProps) {
  const currentTrip = Array.isArray(bus.current_trip) ? bus.current_trip[0] : bus.current_trip;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus className="h-5 w-5" />
            Bus Details: {bus.bus_number}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tracking">Live Tracking</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
            <TabsTrigger value="trips">Trip History</TabsTrigger>
            <TabsTrigger value="costs">Costs</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bus Information</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Bus Number</p>
                  <p className="font-semibold">{bus.bus_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Registration Number</p>
                  <p className="font-semibold">{bus.registration_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Model</p>
                  <p className="font-semibold">{bus.model || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seating Capacity</p>
                  <p className="font-semibold">{bus.seating_capacity || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Odometer</p>
                  <p className="font-semibold">{bus.odometer ? `${bus.odometer.toLocaleString()} km` : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={bus.status === 'active' ? 'default' : 'secondary'}>
                    {bus.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Year of Manufacture</p>
                  <p className="font-semibold">{bus.year_of_manufacture || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">GPS Device ID</p>
                  <p className="font-semibold">{bus.gps_device_id || 'Not installed'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Current Assignment */}
            {currentTrip && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Current Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="font-semibold">
                      {currentTrip.route?.origin} → {currentTrip.route?.destination}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Driver</p>
                    <p className="font-semibold">{currentTrip.driver?.full_name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Departure Time</p>
                    <p className="font-semibold">
                      {format(new Date(currentTrip.scheduled_departure), 'PPp')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{currentTrip.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Live Tracking Tab */}
          <TabsContent value="tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  GPS Tracking Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                {gpsData ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Latitude</p>
                        <p className="font-semibold">{gpsData.latitude?.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Longitude</p>
                        <p className="font-semibold">{gpsData.longitude?.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Speed</p>
                        <p className="font-semibold">{gpsData.speed || 0} km/h</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Update</p>
                        <p className="font-semibold">
                          {format(new Date(gpsData.timestamp), 'PPp')}
                        </p>
                      </div>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-4 text-center">
                      <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Map view would display here with Google Maps integration
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No GPS data available for this bus</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Maintenance Tab */}
          <TabsContent value="maintenance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Maintenance History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {maintenanceData.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Cost (BWP)</TableHead>
                        <TableHead>Next Service</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceData.map((record: any) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {format(new Date(record.service_date), 'PP')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{record.service_type}</Badge>
                          </TableCell>
                          <TableCell>{record.description || 'N/A'}</TableCell>
                          <TableCell>P {record.cost?.toLocaleString() || '0'}</TableCell>
                          <TableCell>
                            {record.next_service_date
                              ? format(new Date(record.next_service_date), 'PP')
                              : '–'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No maintenance records found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trip History Tab */}
          <TabsContent value="trips" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Trips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Trip history will be displayed here</p>
                  <p className="text-sm mt-2">Showing recent trips with dates and revenue</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Costs Tab */}
          <TabsContent value="costs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Fuel & Cost Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Total Maintenance Cost</p>
                    <p className="text-2xl font-bold">
                      P {maintenanceData.reduce((sum, m) => sum + (m.cost || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Fuel Consumption</p>
                    <p className="text-2xl font-bold">N/A</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Operating Cost</p>
                    <p className="text-2xl font-bold">N/A</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button>
            Edit Bus Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
