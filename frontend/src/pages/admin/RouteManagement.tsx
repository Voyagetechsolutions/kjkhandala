import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, MapPin, TrendingUp, Clock, DollarSign, Edit, Trash2, Map } from 'lucide-react';
import { toast } from 'sonner';
import RouteForm from '@/components/routes/RouteForm';
import RouteMapView from '@/components/routes/RouteMapView';

export default function RouteManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch routes with analytics
  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          schedules(count),
          bookings:schedules(bookings(count, total_amount))
        `)
        .order('origin');
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch route analytics
  const { data: analytics } = useQuery({
    queryKey: ['route-analytics'],
    queryFn: async () => {
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .select(`
          total_amount,
          schedules(route_id, routes(origin, destination))
        `)
        .eq('status', 'confirmed');

      if (error) throw error;

      // Aggregate by route
      const routeStats: any = {};
      bookingData?.forEach((booking: any) => {
        const routeId = booking.schedules?.route_id;
        if (routeId) {
          if (!routeStats[routeId]) {
            routeStats[routeId] = {
              routeId,
              origin: booking.schedules?.routes?.origin,
              destination: booking.schedules?.routes?.destination,
              revenue: 0,
              bookings: 0,
            };
          }
          routeStats[routeId].revenue += parseFloat(booking.total_amount);
          routeStats[routeId].bookings += 1;
        }
      });

      return Object.values(routeStats).sort((a: any, b: any) => b.revenue - a.revenue);
    },
  });

  // Delete route mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('routes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Route deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['routes-management'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete route');
    },
  });

  const handleEdit = (route: any) => {
    setEditingRoute(route);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredRoutes = routes?.filter((route: any) =>
    route.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate summary stats
  const totalRoutes = routes?.length || 0;
  const activeRoutes = routes?.filter((r: any) => r.active).length || 0;
  const totalRevenue = analytics?.reduce((sum: number, r: any) => sum + r.revenue, 0) || 0;
  const avgDistance = routes?.reduce((sum: number, r: any) => sum + (r.distance_km || 0), 0) / (routes?.length || 1) || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Route Management</h1>
            <p className="text-muted-foreground">Manage all company routes and analyze performance</p>
          </div>
          <Button onClick={() => { setEditingRoute(null); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Route
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Total Routes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalRoutes}</p>
              <p className="text-xs text-muted-foreground">{activeRoutes} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">P{totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">All routes combined</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg Distance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{avgDistance.toFixed(0)} km</p>
              <p className="text-xs text-muted-foreground">Per route</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Avg Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {(routes?.reduce((sum: number, r: any) => sum + r.duration_hours, 0) / (routes?.length || 1) || 0).toFixed(1)}h
              </p>
              <p className="text-xs text-muted-foreground">Per route</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="list" className="space-y-4">
          <TabsList>
            <TabsTrigger value="list">Route List</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>

          {/* Route List Tab */}
          <TabsContent value="list" className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search routes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Fare</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Active Trips</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading routes...
                        </TableCell>
                      </TableRow>
                    ) : filteredRoutes?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No routes found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRoutes?.map((route: any) => (
                        <TableRow key={route.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{route.origin} → {route.destination}</p>
                                <p className="text-xs text-muted-foreground">{route.description || 'No description'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{route.distance_km ? `${route.distance_km} km` : 'N/A'}</TableCell>
                          <TableCell>{route.duration_hours}h</TableCell>
                          <TableCell>P{parseFloat(route.price).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={route.route_type === 'cross_border' ? 'default' : 'secondary'}>
                              {route.route_type === 'cross_border' ? 'Cross-Border' : 'Local'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={route.active ? 'bg-green-500' : 'bg-gray-500'}>
                              {route.active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>{route.schedules?.[0]?.count || 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(route)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDelete(route.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Routes</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Total Bookings</TableHead>
                      <TableHead>Total Revenue</TableHead>
                      <TableHead>Avg per Booking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytics?.slice(0, 10).map((stat: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-muted-foreground">#{index + 1}</span>
                            <span>{stat.origin} → {stat.destination}</span>
                          </div>
                        </TableCell>
                        <TableCell>{stat.bookings}</TableCell>
                        <TableCell className="font-bold text-green-600">P{stat.revenue.toFixed(2)}</TableCell>
                        <TableCell>P{(stat.revenue / stat.bookings).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Map View Tab */}
          <TabsContent value="map">
            <RouteMapView routes={routes || []} />
          </TabsContent>
        </Tabs>

        {/* Route Form Dialog */}
        {showForm && (
          <RouteForm
            route={editingRoute}
            onClose={() => { setShowForm(false); setEditingRoute(null); }}
            onSuccess={() => {
              setShowForm(false);
              setEditingRoute(null);
              queryClient.invalidateQueries({ queryKey: ['routes-management'] });
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
}
