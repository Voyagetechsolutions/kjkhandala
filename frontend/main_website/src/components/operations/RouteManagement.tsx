import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Users,
  Fuel,
  Activity,
  BarChart3,
  Download,
  Archive,
  Eye
} from 'lucide-react';

interface Route {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: number;
  estimatedDuration: number;
  price: number;
  status: 'active' | 'inactive' | 'suspended';
  stops: string[];
  performance: {
    avgTripTime: number;
    delayFrequency: number;
    passengerLoad: number;
    fuelUsage: number;
    profitability: number;
  };
}

const RouteManagement = () => {
  const [routes, setRoutes] = useState<Route[]>([
    {
      id: '1',
      name: 'Gaborone - Francistown Express',
      origin: 'Gaborone',
      destination: 'Francistown',
      distance: 437,
      estimatedDuration: 360,
      price: 150,
      status: 'active',
      stops: ['Palapye', 'Serowe'],
      performance: {
        avgTripTime: 345,
        delayFrequency: 12,
        passengerLoad: 85,
        fuelUsage: 45,
        profitability: 78
      }
    },
    {
      id: '2',
      name: 'Francistown - Maun Route',
      origin: 'Francistown',
      destination: 'Maun',
      distance: 580,
      estimatedDuration: 480,
      price: 200,
      status: 'active',
      stops: ['Nata', 'Gweta'],
      performance: {
        avgTripTime: 465,
        delayFrequency: 8,
        passengerLoad: 72,
        fuelUsage: 62,
        profitability: 82
      }
    },
    {
      id: '3',
      name: 'Gaborone - Kasane Direct',
      origin: 'Gaborone',
      destination: 'Kasane',
      distance: 940,
      estimatedDuration: 720,
      price: 350,
      status: 'active',
      stops: [],
      performance: {
        avgTripTime: 695,
        delayFrequency: 5,
        passengerLoad: 90,
        fuelUsage: 95,
        profitability: 88
      }
    }
  ]);

  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [activeTab, setActiveTab] = useState('routes');

  const [newRoute, setNewRoute] = useState({
    name: '',
    origin: '',
    destination: '',
    distance: '',
    estimatedDuration: '',
    price: '',
    stops: '',
    status: 'active' as 'active' | 'inactive' | 'suspended'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'suspended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPerformanceColor = (value: number, type: string) => {
    if (type === 'delayFrequency') {
      return value < 10 ? 'text-green-600' : value < 20 ? 'text-yellow-600' : 'text-red-600';
    }
    return value > 80 ? 'text-green-600' : value > 60 ? 'text-yellow-600' : 'text-red-600';
  };

  const handleAddRoute = () => {
    const route: Route = {
      id: Date.now().toString(),
      name: newRoute.name,
      origin: newRoute.origin,
      destination: newRoute.destination,
      distance: parseFloat(newRoute.distance),
      estimatedDuration: parseInt(newRoute.estimatedDuration),
      price: parseFloat(newRoute.price),
      status: newRoute.status,
      stops: newRoute.stops.split(',').map(s => s.trim()).filter(s => s),
      performance: {
        avgTripTime: parseInt(newRoute.estimatedDuration),
        delayFrequency: 0,
        passengerLoad: 0,
        fuelUsage: 0,
        profitability: 0
      }
    };
    setRoutes([...routes, route]);
    setIsAddRouteOpen(false);
    setNewRoute({
      name: '',
      origin: '',
      destination: '',
      distance: '',
      estimatedDuration: '',
      price: '',
      stops: '',
      status: 'active'
    });
  };

  const handleEditRoute = (route: Route) => {
    setEditingRoute(route);
  };

  const handleDeleteRoute = (id: string) => {
    setRoutes(routes.filter(r => r.id !== id));
  };

  const handleArchiveRoute = (id: string) => {
    setRoutes(routes.map(r => 
      r.id === id ? { ...r, status: 'inactive' } : r
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Route Management</h2>
          <p className="text-gray-600">Define, manage, and optimize all bus routes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isAddRouteOpen} onOpenChange={setIsAddRouteOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Route
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Route</DialogTitle>
                <DialogDescription>Create a new bus route with performance tracking</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Route Name</Label>
                  <Input
                    id="name"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                    placeholder="e.g., Gaborone - Francistown Express"
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={newRoute.status} onValueChange={(value: 'active' | 'inactive' | 'suspended') => setNewRoute({ ...newRoute, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="origin">Origin</Label>
                  <Input
                    id="origin"
                    value={newRoute.origin}
                    onChange={(e) => setNewRoute({ ...newRoute, origin: e.target.value })}
                    placeholder="e.g., Gaborone"
                  />
                </div>
                <div>
                  <Label htmlFor="destination">Destination</Label>
                  <Input
                    id="destination"
                    value={newRoute.destination}
                    onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })}
                    placeholder="e.g., Francistown"
                  />
                </div>
                <div>
                  <Label htmlFor="distance">Distance (km)</Label>
                  <Input
                    id="distance"
                    type="number"
                    value={newRoute.distance}
                    onChange={(e) => setNewRoute({ ...newRoute, distance: e.target.value })}
                    placeholder="437"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newRoute.estimatedDuration}
                    onChange={(e) => setNewRoute({ ...newRoute, estimatedDuration: e.target.value })}
                    placeholder="360"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price (BWP)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={newRoute.price}
                    onChange={(e) => setNewRoute({ ...newRoute, price: e.target.value })}
                    placeholder="150"
                  />
                </div>
                <div>
                  <Label htmlFor="stops">Stops (comma-separated)</Label>
                  <Input
                    id="stops"
                    value={newRoute.stops}
                    onChange={(e) => setNewRoute({ ...newRoute, stops: e.target.value })}
                    placeholder="Palapye, Serowe"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAddRouteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRoute}>
                  Add Route
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="routes">Routes</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="heatmap">Route Heatmap</TabsTrigger>
        </TabsList>

        {/* Routes List */}
        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle>All Routes</CardTitle>
              <CardDescription>Manage your bus route network</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Route Name</TableHead>
                    <TableHead>Origin → Destination</TableHead>
                    <TableHead>Distance</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          {route.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{route.origin}</span>
                          <span className="text-gray-400">→</span>
                          <span>{route.destination}</span>
                        </div>
                        {route.stops.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Stops: {route.stops.join(', ')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{route.distance} km</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          {route.estimatedDuration} min
                        </div>
                      </TableCell>
                      <TableCell>BWP {route.price}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusColor(route.status)} text-white`}>
                          {route.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => handleEditRoute(route)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleArchiveRoute(route.id)}>
                            <Archive className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteRoute(route.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {routes.map((route) => (
              <Card key={route.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{route.name}</span>
                    <Badge variant="outline" className={`${getStatusColor(route.status)} text-white`}>
                      {route.status}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {route.origin} → {route.destination} • {route.distance} km
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Avg Trip Time</span>
                      </div>
                      <span className="font-medium">{route.performance.avgTripTime} min</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Delay Freq</span>
                      </div>
                      <span className={`font-medium ${getPerformanceColor(route.performance.delayFrequency, 'delayFrequency')}`}>
                        {route.performance.delayFrequency}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Load Factor</span>
                      </div>
                      <span className={`font-medium ${getPerformanceColor(route.performance.passengerLoad, 'default')}`}>
                        {route.performance.passengerLoad}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fuel className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Fuel Usage</span>
                      </div>
                      <span className="font-medium">{route.performance.fuelUsage} L</span>
                    </div>
                    <div className="flex items-center justify-between col-span-2">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Profitability</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getPerformanceColor(route.performance.profitability, 'default')}`}>
                          {route.performance.profitability}%
                        </span>
                        {route.performance.profitability > 80 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Route Heatmap */}
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Route Efficiency Heatmap</CardTitle>
              <CardDescription>Visual representation of route performance and efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Interactive Route Map</h3>
                <p className="text-gray-500 mb-4">Heatmap showing route efficiency and passenger density</p>
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-500 rounded mx-auto mb-2"></div>
                    <p className="text-sm">High Efficiency</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-yellow-500 rounded mx-auto mb-2"></div>
                    <p className="text-sm">Medium Efficiency</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-red-500 rounded mx-auto mb-2"></div>
                    <p className="text-sm">Low Efficiency</p>
                  </div>
                </div>
                <Button className="mt-6">
                  <Eye className="h-4 w-4 mr-2" />
                  View Interactive Map
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RouteManagement;
