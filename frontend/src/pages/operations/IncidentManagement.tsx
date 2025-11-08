import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function IncidentManagement() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [newIncident, setNewIncident] = useState({
    tripId: '',
    type: 'breakdown',
    severity: 'MEDIUM',
    description: '',
    location: '',
  });

  const [resolution, setResolution] = useState('');

  const queryClient = useQueryClient();

  // Fetch incidents
  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ['operations-incidents', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await api.get(`/operations/incidents?${params}`);
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Fetch trips for incident creation
  const { data: tripsData } = useQuery({
    queryKey: ['operations-trips'],
    queryFn: async () => {
      const response = await api.get('/operations/trips');
      return response.data;
    },
  });

  // Create incident mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/operations/incidents', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-incidents'] });
      toast.success('Incident created successfully');
      setShowCreateDialog(false);
      setNewIncident({
        tripId: '',
        type: 'breakdown',
        severity: 'MEDIUM',
        description: '',
        location: '',
      });
    },
    onError: () => {
      toast.error('Failed to create incident');
    },
  });

  // Resolve incident mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ id, resolution }: any) => {
      await api.put(`/operations/incidents/${id}`, {
        status: 'RESOLVED',
        resolution,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-incidents'] });
      toast.success('Incident resolved successfully');
      setShowResolveDialog(false);
      setResolution('');
    },
    onError: () => {
      toast.error('Failed to resolve incident');
    },
  });

  const incidents = incidentsData?.incidents || [];
  const trips = tripsData?.trips || [];

  const stats = {
    total: incidents.length,
    open: incidents.filter((i: any) => i.status === 'OPEN').length,
    investigating: incidents.filter((i: any) => i.status === 'INVESTIGATING').length,
    resolved: incidents.filter((i: any) => i.status === 'RESOLVED').length,
    critical: incidents.filter((i: any) => i.severity === 'CRITICAL').length,
  };

  const getSeverityBadge = (severity: string) => {
    const config: any = {
      LOW: { variant: 'outline', label: 'Low', color: 'text-gray-600' },
      MEDIUM: { variant: 'secondary', label: 'Medium', color: 'text-yellow-600' },
      HIGH: { variant: 'default', label: 'High', color: 'text-orange-600' },
      CRITICAL: { variant: 'destructive', label: 'Critical', color: 'text-red-600' },
    };
    const c = config[severity] || config.MEDIUM;
    return <Badge variant={c.variant as any}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: any = {
      OPEN: { variant: 'destructive', label: 'Open', icon: AlertCircle },
      INVESTIGATING: { variant: 'secondary', label: 'Investigating', icon: Clock },
      RESOLVED: { variant: 'outline', label: 'Resolved', icon: CheckCircle },
      CLOSED: { variant: 'outline', label: 'Closed', icon: XCircle },
    };
    const c = config[status] || config.OPEN;
    const Icon = c.icon;
    return (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <Badge variant={c.variant as any}>{c.label}</Badge>
      </div>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: any = {
      breakdown: 'Bus Breakdown',
      accident: 'Accident',
      driver_emergency: 'Driver Emergency',
      passenger_emergency: 'Passenger Emergency',
      route_blockage: 'Route Blockage',
      overspeed: 'Over-speeding',
      unauthorized_stop: 'Unauthorized Stop',
      delay: 'Delay',
    };
    return labels[type] || type;
  };

  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Incident Management</h1>
            <p className="text-muted-foreground">Track and resolve operational incidents</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Log Incident
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.open}</div>
              <p className="text-xs text-muted-foreground">Needs attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Investigating</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.investigating}</div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.critical}</div>
              <p className="text-xs text-muted-foreground">High priority</p>
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
                All Incidents
              </Button>
              <Button
                variant={statusFilter === 'OPEN' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('OPEN')}
              >
                Open
              </Button>
              <Button
                variant={statusFilter === 'INVESTIGATING' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('INVESTIGATING')}
              >
                Investigating
              </Button>
              <Button
                variant={statusFilter === 'RESOLVED' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('RESOLVED')}
              >
                Resolved
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Incidents List */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Log</CardTitle>
            <CardDescription>{incidents.length} incident(s) found</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading incidents...</div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No incidents found for selected filter
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Trip/Bus</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reported</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map((incident: any) => (
                    <TableRow key={incident.id}>
                      <TableCell>
                        <div className="font-medium">{getTypeLabel(incident.type)}</div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{incident.description}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {incident.trip ? (
                            <>
                              <div className="font-medium">{incident.trip.route?.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {incident.trip.bus?.registrationNumber}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{incident.location || 'N/A'}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(incident.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(incident.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {incident.status !== 'RESOLVED' && incident.status !== 'CLOSED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedIncident(incident);
                              setShowResolveDialog(true);
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Incident Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Log New Incident</DialogTitle>
              <DialogDescription>Report an operational incident</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Incident Type</Label>
                  <Select value={newIncident.type} onValueChange={(value) => setNewIncident({ ...newIncident, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakdown">Bus Breakdown</SelectItem>
                      <SelectItem value="accident">Accident</SelectItem>
                      <SelectItem value="driver_emergency">Driver Emergency</SelectItem>
                      <SelectItem value="passenger_emergency">Passenger Emergency</SelectItem>
                      <SelectItem value="route_blockage">Route Blockage</SelectItem>
                      <SelectItem value="overspeed">Over-speeding</SelectItem>
                      <SelectItem value="unauthorized_stop">Unauthorized Stop</SelectItem>
                      <SelectItem value="delay">Delay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Severity</Label>
                  <Select value={newIncident.severity} onValueChange={(value) => setNewIncident({ ...newIncident, severity: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Trip (Optional)</Label>
                <Select value={newIncident.tripId} onValueChange={(value) => setNewIncident({ ...newIncident, tripId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select trip if applicable" />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map((trip: any) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.route?.name} - {trip.bus?.registrationNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  placeholder="Enter incident location"
                  value={newIncident.location}
                  onChange={(e) => setNewIncident({ ...newIncident, location: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the incident..."
                  rows={4}
                  value={newIncident.description}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createMutation.mutate(newIncident)} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Creating...' : 'Log Incident'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Resolve Incident Dialog */}
        <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve Incident</DialogTitle>
              <DialogDescription>Provide resolution details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Resolution Notes</Label>
                <Textarea
                  placeholder="Describe how the incident was resolved..."
                  rows={4}
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedIncident) {
                      resolveMutation.mutate({
                        id: selectedIncident.id,
                        resolution,
                      });
                    }
                  }}
                  disabled={resolveMutation.isPending}
                >
                  {resolveMutation.isPending ? 'Resolving...' : 'Mark as Resolved'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </OperationsLayout>
  );
}
