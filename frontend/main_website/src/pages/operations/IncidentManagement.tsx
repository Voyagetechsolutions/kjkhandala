import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
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
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : OperationsLayout;

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [newIncident, setNewIncident] = useState({
    tripId: '',
    incidentType: 'BREAKDOWN',
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
      let query = supabase
        .from('incidents')
        .select(`
          *,
          trip:trips(
            *,
            route:routes(*),
            bus:buses(*),
            driver:drivers(*)
          )
        `)
        .order('created_at', { ascending: false });
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return { incidents: data || [] };
    },
    refetchInterval: 30000,
  });

  // Fetch trips for incident creation
  const { data: tripsData } = useQuery({
    queryKey: ['operations-trips'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .eq('status', 'in_progress')
        .order('scheduled_departure', { ascending: false });
      if (error) throw error;
      return { trips: data || [] };
    },
  });

  // Create incident mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      const typeLabelMap: Record<string, string> = {
        BREAKDOWN: 'Bus Breakdown',
        ACCIDENT: 'Accident',
        DELAY: 'Delay',
        PASSENGER_COMPLAINT: 'Passenger Complaint',
        TRAFFIC: 'Traffic',
        WEATHER: 'Weather',
        MECHANICAL: 'Mechanical Issue',
        MEDICAL_EMERGENCY: 'Medical Emergency',
        SECURITY: 'Security Incident',
        OTHER: 'Other Incident',
      };

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        trip_id: newIncident.tripId || null,
        incident_type: newIncident.incidentType,
        severity: newIncident.severity,
        description: newIncident.description,
        location: newIncident.location || null,
        reported_by: user?.id || null,
      };

      const { error } = await supabase
        .from('incidents')
        .insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-incidents'] });
      toast.success('Incident created successfully');
      setShowCreateDialog(false);
      setNewIncident({
        tripId: '',
        incidentType: 'BREAKDOWN',
        severity: 'MEDIUM',
        description: '',
        location: '',
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create incident');
    },
  });

  // Resolve incident mutation
  const resolveMutation = useMutation({
    mutationFn: async ({ id, resolution }: any) => {
      const { error } = await supabase
        .from('incidents')
        .update({
          status: 'RESOLVED',
          resolution,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
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

  const normalizeStatus = (status: string) => (status || '').toUpperCase();
  const normalizeSeverity = (severity: string) => (severity || '').toUpperCase();

  const stats = {
    total: incidents.length,
    reported: incidents.filter((i: any) => normalizeStatus(i.status) === 'REPORTED').length,
    investigating: incidents.filter((i: any) => normalizeStatus(i.status) === 'INVESTIGATING').length,
    resolved: incidents.filter((i: any) => normalizeStatus(i.status) === 'RESOLVED').length,
    closed: incidents.filter((i: any) => normalizeStatus(i.status) === 'CLOSED').length,
    critical: incidents.filter((i: any) => normalizeSeverity(i.severity) === 'CRITICAL').length,
  };

  const getSeverityBadge = (severity: string) => {
    const value = normalizeSeverity(severity);
    const config: any = {
      LOW: { variant: 'outline', label: 'Low', color: 'text-gray-600' },
      MEDIUM: { variant: 'secondary', label: 'Medium', color: 'text-yellow-600' },
      HIGH: { variant: 'default', label: 'High', color: 'text-orange-600' },
      CRITICAL: { variant: 'destructive', label: 'Critical', color: 'text-red-600' },
    };
    const c = config[value] || config.MEDIUM;
    return <Badge variant={c.variant as any}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const value = normalizeStatus(status);
    const config: any = {
      REPORTED: { variant: 'destructive', label: 'Reported', icon: AlertCircle },
      INVESTIGATING: { variant: 'secondary', label: 'Investigating', icon: Clock },
      RESOLVED: { variant: 'outline', label: 'Resolved', icon: CheckCircle },
      CLOSED: { variant: 'outline', label: 'Closed', icon: XCircle },
    };
    const c = config[value] || config.REPORTED;
    const Icon = c.icon;
    return (
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <Badge variant={c.variant as any}>{c.label}</Badge>
      </div>
    );
  };

  const getTypeLabel = (type: string) => {
    const key = (type || '').toUpperCase();
    const labels: any = {
      BREAKDOWN: 'Bus Breakdown',
      ACCIDENT: 'Accident',
      DELAY: 'Delay',
      PASSENGER_COMPLAINT: 'Passenger Complaint',
      TRAFFIC: 'Traffic',
      WEATHER: 'Weather',
      MECHANICAL: 'Mechanical Issue',
      MEDICAL_EMERGENCY: 'Medical Emergency',
      SECURITY: 'Security Incident',
      OTHER: 'Other',
    };
    return labels[key] || key || 'Incident';
  };

  return (
    <Layout>
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
              <CardTitle className="text-sm font-medium">Reported</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reported}</div>
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
                variant={statusFilter === 'REPORTED' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('REPORTED')}
              >
                Reported
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
              <Button
                variant={statusFilter === 'CLOSED' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('CLOSED')}
              >
                Closed
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
                        <div className="font-medium">{getTypeLabel(incident.incident_type)}</div>
                      </TableCell>
                      <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">{incident.description}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {incident.trip ? (
                            <>
                              <div className="font-medium">
                                {incident.trip.route?.name || incident.trip.trip_number || 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {incident.trip.bus?.number_plate || incident.trip.bus?.registration_number || 'N/A'}
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
                          {new Date(incident.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {normalizeStatus(incident.status) !== 'RESOLVED' &&
                          normalizeStatus(incident.status) !== 'CLOSED' && (
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
                  <Select
                    value={newIncident.incidentType}
                    onValueChange={(value) => setNewIncident({ ...newIncident, incidentType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BREAKDOWN">Bus Breakdown</SelectItem>
                      <SelectItem value="ACCIDENT">Accident</SelectItem>
                      <SelectItem value="DELAY">Delay</SelectItem>
                      <SelectItem value="PASSENGER_COMPLAINT">Passenger Complaint</SelectItem>
                      <SelectItem value="TRAFFIC">Traffic</SelectItem>
                      <SelectItem value="WEATHER">Weather</SelectItem>
                      <SelectItem value="MECHANICAL">Mechanical Issue</SelectItem>
                      <SelectItem value="MEDICAL_EMERGENCY">Medical Emergency</SelectItem>
                      <SelectItem value="SECURITY">Security Incident</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
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
                        {trip.route?.name || trip.trip_number || 'Trip'} - {trip.bus?.number_plate || trip.bus?.registration_number || 'N/A'}
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
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
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
    </Layout>
  );
}
