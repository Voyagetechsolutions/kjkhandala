import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bus, Wrench, CheckCircle, AlertCircle, Calendar, Activity } from 'lucide-react';
import { toast } from 'sonner';

export default function FleetOperations() {
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();

  // Fetch fleet data
  const { data: fleetData, isLoading } = useQuery({
    queryKey: ['operations-fleet'],
    queryFn: async () => {
      const response = await api.get('/operations/fleet');
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Update bus status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: any) => {
      await api.put(`/operations/fleet/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-fleet'] });
      toast.success('Bus status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update bus status');
    },
  });

  const fleet = fleetData?.fleet || [];

  const filteredFleet = fleet.filter((bus: any) => {
    if (statusFilter === 'all') return true;
    return bus.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      ACTIVE: { variant: 'default', label: 'Active', icon: CheckCircle, color: 'text-green-600' },
      MAINTENANCE: { variant: 'secondary', label: 'Maintenance', icon: Wrench, color: 'text-orange-600' },
      INACTIVE: { variant: 'outline', label: 'Inactive', icon: AlertCircle, color: 'text-gray-600' },
    };
    
    const config = statusConfig[status] || { variant: 'outline', label: status, icon: Bus, color: 'text-gray-600' };
    const Icon = config.icon;
    
    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <Badge variant={config.variant as any}>{config.label}</Badge>
      </div>
    );
  };

  const stats = {
    total: fleet.length,
    active: fleet.filter((b: any) => b.status === 'ACTIVE').length,
    maintenance: fleet.filter((b: any) => b.status === 'MAINTENANCE').length,
    inactive: fleet.filter((b: any) => b.status === 'INACTIVE').length,
    inUse: fleet.filter((b: any) => b.isInUse).length,
  };

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Fleet Operations</h1>
          <p className="text-muted-foreground">Monitor and manage your bus fleet</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
              <Bus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All buses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Ready to operate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Use</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inUse}</div>
              <p className="text-xs text-muted-foreground">On trips now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.maintenance}</div>
              <p className="text-xs text-muted-foreground">Under service</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <AlertCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">Not in service</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-64">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fleet Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12">Loading fleet data...</div>
          ) : filteredFleet.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No buses found for selected filter
            </div>
          ) : (
            filteredFleet.map((bus: any) => (
              <Card key={bus.id} className={bus.needsMaintenance ? 'border-orange-300' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Bus className="h-5 w-5" />
                        {bus.registrationNumber}
                      </CardTitle>
                      <CardDescription>
                        {bus.model} • Capacity: {bus.capacity}
                      </CardDescription>
                    </div>
                    {getStatusBadge(bus.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current Assignment */}
                  {bus.currentTrip ? (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Currently On Trip</span>
                      </div>
                      <div className="text-sm text-blue-700">
                        <div>{bus.currentTrip.route?.name}</div>
                        <div className="text-xs">
                          Driver: {bus.currentTrip.driver?.firstName} {bus.currentTrip.driver?.lastName}
                        </div>
                        <div className="text-xs">
                          Departs: {new Date(bus.currentTrip.departureTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Available for assignment</span>
                      </div>
                    </div>
                  )}

                  {/* Maintenance Info */}
                  {bus.lastMaintenanceDate && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Last Maintenance:</span>
                        <span className="font-medium">
                          {new Date(bus.lastMaintenanceDate).toLocaleDateString()}
                        </span>
                      </div>
                      {bus.lastMaintenanceType && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium capitalize">{bus.lastMaintenanceType}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bus Details */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Mileage:</span>
                      <span className="font-medium">{bus.mileage?.toLocaleString() || 0} km</span>
                    </div>
                    {bus.yearOfManufacture && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Year:</span>
                        <span className="font-medium">{bus.yearOfManufacture}</span>
                      </div>
                    )}
                  </div>

                  {/* Maintenance Alert */}
                  {bus.needsMaintenance && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-900">
                          Maintenance Required
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2">
                    <Select
                      onValueChange={(action) => {
                        updateStatusMutation.mutate({ id: bus.id, status: action });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Change Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Set Active</SelectItem>
                        <SelectItem value="MAINTENANCE">Send to Maintenance</SelectItem>
                        <SelectItem value="INACTIVE">Set Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </OperationsLayout>
  );
}
