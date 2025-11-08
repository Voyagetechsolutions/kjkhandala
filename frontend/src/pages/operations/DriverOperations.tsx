import { useState } from 'react';
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
import { Users, CheckCircle, AlertCircle, Clock, Activity, Calendar } from 'lucide-react';

export default function DriverOperations() {
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch drivers
  const { data: driversData, isLoading } = useQuery({
    queryKey: ['operations-drivers'],
    queryFn: async () => {
      const response = await api.get('/operations/drivers');
      return response.data;
    },
    refetchInterval: 30000,
  });

  const drivers = driversData?.drivers || [];

  const filteredDrivers = drivers.filter((driver: any) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'on-duty') return driver.isOnDuty;
    if (statusFilter === 'off-duty') return !driver.isOnDuty;
    if (statusFilter === 'expiring') return driver.licenseExpiringSoon;
    return true;
  });

  const stats = {
    total: drivers.length,
    onDuty: drivers.filter((d: any) => d.isOnDuty).length,
    offDuty: drivers.filter((d: any) => !d.isOnDuty).length,
    expiringSoon: drivers.filter((d: any) => d.licenseExpiringSoon).length,
  };

  const getStatusBadge = (driver: any) => {
    if (driver.isOnDuty) {
      return <Badge variant="default" className="bg-green-600">On Duty</Badge>;
    }
    return <Badge variant="outline">Off Duty</Badge>;
  };

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Driver Operations</h1>
          <p className="text-muted-foreground">Monitor and manage driver assignments</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All drivers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Duty</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onDuty}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Off Duty</CardTitle>
              <Clock className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.offDuty}</div>
              <p className="text-xs text-muted-foreground">Available</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">License Expiring</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground">Within 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
              >
                All Drivers
              </Button>
              <Button
                variant={statusFilter === 'on-duty' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('on-duty')}
              >
                On Duty
              </Button>
              <Button
                variant={statusFilter === 'off-duty' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('off-duty')}
              >
                Off Duty
              </Button>
              <Button
                variant={statusFilter === 'expiring' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('expiring')}
              >
                License Expiring
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Drivers List */}
        <Card>
          <CardHeader>
            <CardTitle>Driver Roster</CardTitle>
            <CardDescription>{filteredDrivers.length} driver(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading drivers...</div>
            ) : filteredDrivers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No drivers found for selected filter
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Assignment</TableHead>
                    <TableHead>License Expiry</TableHead>
                    <TableHead>Days Until Expiry</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver: any) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <div>
                            <div className="font-medium">
                              {driver.firstName} {driver.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ID: {driver.id.slice(0, 8)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm">{driver.licenseNumber}</code>
                      </TableCell>
                      <TableCell>{getStatusBadge(driver)}</TableCell>
                      <TableCell>
                        {driver.currentTrip ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Activity className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium">
                                {driver.currentTrip.route?.name}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Bus: {driver.currentTrip.bus?.registrationNumber}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline">Available</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {driver.licenseExpiry ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {new Date(driver.licenseExpiry).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {driver.licenseExpiringSoon ? (
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {driver.daysUntilLicenseExpiry} days
                          </Badge>
                        ) : driver.daysUntilLicenseExpiry ? (
                          <span className="text-sm text-muted-foreground">
                            {driver.daysUntilLicenseExpiry} days
                          </span>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{driver.phone}</div>
                          {driver.email && (
                            <div className="text-xs text-muted-foreground">{driver.email}</div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </OperationsLayout>
  );
}
