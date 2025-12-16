import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  UserCheck, 
  Users, 
  Clock, 
  Bus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Star,
  Phone,
  Mail,
  Award,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  RefreshCw,
  UserPlus,
  Edit,
  Eye
} from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  employeeId: string;
  license: string;
  phone: string;
  email: string;
  status: 'available' | 'on-duty' | 'off-duty' | 'on-leave';
  currentTrip?: {
    id: string;
    route: string;
    departureTime: string;
    busNumber: string;
  };
  performance: {
    rating: number;
    onTimePercentage: number;
    tripsThisMonth: number;
    totalTrips: number;
    accidents: number;
    violations: number;
  };
  availability: {
    hoursToday: number;
    hoursThisWeek: number;
    maxHoursPerDay: number;
    maxHoursPerWeek: number;
  };
  assignedVehicle?: string;
}

const DriverAssignment = () => {
  const [drivers, setDrivers] = useState<Driver[]>([
    {
      id: '1',
      name: 'John Smith',
      employeeId: 'DRV001',
      license: 'Class A - Professional',
      phone: '+267 71234567',
      email: 'john.smith@kjkhandala.com',
      status: 'available',
      performance: {
        rating: 4.8,
        onTimePercentage: 95,
        tripsThisMonth: 45,
        totalTrips: 1250,
        accidents: 0,
        violations: 1
      },
      availability: {
        hoursToday: 4,
        hoursThisWeek: 32,
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40
      }
    },
    {
      id: '2',
      name: 'Sarah Jones',
      employeeId: 'DRV002',
      license: 'Class A - Professional',
      phone: '+267 72345678',
      email: 'sarah.jones@kjkhandala.com',
      status: 'on-duty',
      currentTrip: {
        id: '2',
        route: 'Francistown - Maun',
        departureTime: '08:30',
        busNumber: 'BUS-003'
      },
      assignedVehicle: 'BUS-003',
      performance: {
        rating: 4.9,
        onTimePercentage: 98,
        tripsThisMonth: 52,
        totalTrips: 980,
        accidents: 0,
        violations: 0
      },
      availability: {
        hoursToday: 6,
        hoursThisWeek: 38,
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40
      }
    },
    {
      id: '3',
      name: 'Mike Brown',
      employeeId: 'DRV003',
      license: 'Class A - Professional',
      phone: '+267 73456789',
      email: 'mike.brown@kjkhandala.com',
      status: 'on-duty',
      currentTrip: {
        id: '3',
        route: 'Gaborone - Francistown',
        departureTime: '09:00',
        busNumber: 'BUS-002'
      },
      assignedVehicle: 'BUS-002',
      performance: {
        rating: 4.5,
        onTimePercentage: 88,
        tripsThisMonth: 38,
        totalTrips: 890,
        accidents: 1,
        violations: 2
      },
      availability: {
        hoursToday: 5,
        hoursThisWeek: 35,
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40
      }
    },
    {
      id: '4',
      name: 'Emma Davis',
      employeeId: 'DRV004',
      license: 'Class B - Standard',
      phone: '+267 74567890',
      email: 'emma.davis@kjkhandala.com',
      status: 'off-duty',
      performance: {
        rating: 4.7,
        onTimePercentage: 92,
        tripsThisMonth: 41,
        totalTrips: 650,
        accidents: 0,
        violations: 1
      },
      availability: {
        hoursToday: 8,
        hoursThisWeek: 40,
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40
      }
    },
    {
      id: '5',
      name: 'James Wilson',
      employeeId: 'DRV005',
      license: 'Class A - Professional',
      phone: '+267 75678901',
      email: 'james.wilson@kjkhandala.com',
      status: 'on-leave',
      performance: {
        rating: 4.6,
        onTimePercentage: 90,
        tripsThisMonth: 0,
        totalTrips: 720,
        accidents: 0,
        violations: 0
      },
      availability: {
        hoursToday: 0,
        hoursThisWeek: 0,
        maxHoursPerDay: 8,
        maxHoursPerWeek: 40
      }
    }
  ]);

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [assignment, setAssignment] = useState({
    driverId: '',
    tripId: '',
    busId: '',
    notes: ''
  });

  // Mock data
  const availableTrips = [
    { id: '1', route: 'Gaborone - Francistown', departureTime: '14:00', busNumber: 'BUS-001' },
    { id: '4', route: 'Maun - Gaborone', departureTime: '15:30', busNumber: 'BUS-005' },
    { id: '5', route: 'Francistown - Gaborone', departureTime: '16:00', busNumber: 'BUS-004' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'on-duty': return 'bg-blue-500';
      case 'off-duty': return 'bg-yellow-500';
      case 'on-leave': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />;
      case 'on-duty': return <UserCheck className="h-4 w-4" />;
      case 'off-duty': return <Clock className="h-4 w-4" />;
      case 'on-leave': return <Calendar className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }
    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-yellow-200 text-yellow-400" />);
    }
    for (let i = stars.length; i < 5; i++) {
      stars.push(<Star key={i} className="h-4 w-4 text-gray-300" />);
    }
    return stars;
  };

  const handleAssignDriver = () => {
    // In a real app, this would update the database
    const driver = drivers.find(d => d.id === assignment.driverId);
    const trip = availableTrips.find(t => t.id === assignment.tripId);
    
    if (driver && trip) {
      setDrivers(drivers.map(d => 
        d.id === assignment.driverId 
          ? {
              ...d,
              status: 'on-duty' as const,
              currentTrip: {
                id: trip.id,
                route: trip.route,
                departureTime: trip.departureTime,
                busNumber: trip.busNumber
              },
              assignedVehicle: trip.busNumber
            }
          : d
      ));
      setIsAssignDialogOpen(false);
      setAssignment({ driverId: '', tripId: '', busId: '', notes: '' });
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || driver.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getAvailableDrivers = () => drivers.filter(d => d.status === 'available');
  const getDriversOnDuty = () => drivers.filter(d => d.status === 'on-duty');
  const getDriversOffDuty = () => drivers.filter(d => d.status === 'off-duty');
  const getDriversOnLeave = () => drivers.filter(d => d.status === 'on-leave');

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{getAvailableDrivers().length}</div>
            <p className="text-xs text-muted-foreground">Ready for assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Duty</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{getDriversOnDuty().length}</div>
            <p className="text-xs text-muted-foreground">Currently driving</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Off Duty</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getDriversOffDuty().length}</div>
            <p className="text-xs text-muted-foreground">Shift completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{getDriversOnLeave().length}</div>
            <p className="text-xs text-muted-foreground">Not available</p>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Driver & Crew Assignment</h2>
          <p className="text-gray-600">Assign and manage human resources for trips</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Driver
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Driver to Trip</DialogTitle>
                <DialogDescription>Select a driver and trip for assignment</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="driver">Select Driver</Label>
                  <Select value={assignment.driverId} onValueChange={(value) => setAssignment({ ...assignment, driverId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose available driver" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDrivers().map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.name} ({driver.employeeId}) - {driver.license}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="trip">Select Trip</Label>
                  <Select value={assignment.tripId} onValueChange={(value) => setAssignment({ ...assignment, tripId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose trip" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTrips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.route} - {trip.departureTime} ({trip.busNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={assignment.notes}
                    onChange={(e) => setAssignment({ ...assignment, notes: e.target.value })}
                    placeholder="Any special instructions..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAssignDriver}>
                  Assign Driver
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Current Assignments</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Drivers</CardTitle>
                  <CardDescription>Manage driver assignments and availability</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search drivers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="on-duty">On Duty</SelectItem>
                      <SelectItem value="off-duty">Off Duty</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Assignment</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{driver.name}</p>
                            <p className="text-sm text-gray-500">{driver.employeeId}</p>
                            <p className="text-xs text-gray-400">{driver.license}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-500" />
                            {driver.phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-500" />
                            <span className="truncate max-w-32">{driver.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`${getStatusColor(driver.status)} text-white`}>
                          {getStatusIcon(driver.status)}
                          <span className="ml-1">{driver.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {driver.currentTrip ? (
                          <div className="text-sm">
                            <p className="font-medium">{driver.currentTrip.route}</p>
                            <p className="text-gray-500">{driver.currentTrip.departureTime} • {driver.currentTrip.busNumber}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500">No assignment</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            {getRatingStars(driver.performance.rating)}
                            <span className="text-sm ml-1">{driver.performance.rating}</span>
                          </div>
                          <p className="text-xs text-gray-500">
                            {driver.performance.onTimePercentage}% on-time
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{driver.availability.hoursToday}/{driver.availability.maxHoursPerDay} today</p>
                          <p className="text-gray-500">{driver.availability.hoursThisWeek}/{driver.availability.maxHoursPerWeek} week</p>
                          <Progress 
                            value={(driver.availability.hoursToday / driver.availability.maxHoursPerDay) * 100} 
                            className="w-16 h-1 mt-1" 
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-3 w-3" />
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

        {/* Current Assignments Tab */}
        <TabsContent value="assignments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {getDriversOnDuty().map((driver) => (
              <Card key={driver.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bus className="h-5 w-5" />
                      {driver.name}
                    </div>
                    <Badge variant="outline" className="bg-blue-500 text-white">
                      On Duty
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Currently assigned to {driver.assignedVehicle}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Trip:</span>
                      <span className="text-sm font-medium">{driver.currentTrip?.route}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Departure:</span>
                      <span className="text-sm font-medium">{driver.currentTrip?.departureTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Vehicle:</span>
                      <span className="text-sm font-medium">{driver.assignedVehicle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Performance:</span>
                      <div className="flex items-center gap-1">
                        {getRatingStars(driver.performance.rating)}
                        <span className="text-sm">{driver.performance.rating}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Phone className="h-3 w-3 mr-1" />
                        Contact
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Reassign
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {getDriversOnDuty().length === 0 && (
              <Card className="lg:col-span-2">
                <CardContent className="text-center py-12">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Drivers on Duty</h3>
                  <p className="text-gray-500 mb-4">All drivers are currently available or off-duty</p>
                  <Button onClick={() => setIsAssignDialogOpen(true)}>
                    Assign First Driver
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {drivers.map((driver) => (
              <Card key={driver.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{driver.name}</span>
                    <div className="flex items-center gap-1">
                      {getRatingStars(driver.performance.rating)}
                      <span className="text-sm">{driver.performance.rating}</span>
                    </div>
                  </CardTitle>
                  <CardDescription>{driver.employeeId}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">On-Time Rate:</span>
                        <span className={`text-sm font-medium ${
                          driver.performance.onTimePercentage >= 95 ? 'text-green-600' :
                          driver.performance.onTimePercentage >= 85 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {driver.performance.onTimePercentage}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Trips This Month:</span>
                        <span className="text-sm font-medium">{driver.performance.tripsThisMonth}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Trips:</span>
                        <span className="text-sm font-medium">{driver.performance.totalTrips}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Accidents:</span>
                        <span className={`text-sm font-medium ${
                          driver.performance.accidents === 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {driver.performance.accidents}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Violations:</span>
                        <span className={`text-sm font-medium ${
                          driver.performance.violations === 0 ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          {driver.performance.violations}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Trend:</span>
                        {driver.performance.rating >= 4.5 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Performance Score</span>
                      <Badge variant={driver.performance.rating >= 4.5 ? 'default' : 'secondary'}>
                        {driver.performance.rating >= 4.5 ? 'Excellent' : 
                         driver.performance.rating >= 4.0 ? 'Good' : 'Needs Improvement'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hours Availability</CardTitle>
                <CardDescription>Current hours worked vs limits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {drivers.map((driver) => (
                    <div key={driver.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{driver.name}</span>
                        <span className="text-sm text-gray-500">
                          {driver.availability.hoursToday}/{driver.availability.maxHoursPerDay} hrs today
                        </span>
                      </div>
                      <Progress 
                        value={(driver.availability.hoursToday / driver.availability.maxHoursPerDay) * 100}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{driver.availability.hoursThisWeek}/{driver.availability.maxHoursPerWeek} hrs this week</span>
                        <span>{Math.round((driver.availability.hoursToday / driver.availability.maxHoursPerDay) * 100)}% used</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability Alerts</CardTitle>
                <CardDescription>Drivers approaching limits or conflicts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {drivers.filter(d => d.availability.hoursToday >= d.availability.maxHoursPerDay * 0.9).map((driver) => (
                    <Alert key={driver.id} className="border-yellow-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="text-sm">Near Daily Limit</AlertTitle>
                      <AlertDescription className="text-xs">
                        {driver.name} has worked {driver.availability.hoursToday}/{driver.availability.maxHoursPerDay} hours today
                      </AlertDescription>
                    </Alert>
                  ))}
                  {drivers.filter(d => d.availability.hoursThisWeek >= d.availability.maxHoursPerWeek * 0.9).map((driver) => (
                    <Alert key={driver.id} className="border-orange-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="text-sm">Near Weekly Limit</AlertTitle>
                      <AlertDescription className="text-xs">
                        {driver.name} has worked {driver.availability.hoursThisWeek}/{driver.availability.maxHoursPerWeek} hours this week
                      </AlertDescription>
                    </Alert>
                  ))}
                  {drivers.filter(d => d.availability.hoursToday >= d.availability.maxHoursPerDay * 0.9).length === 0 && 
                   drivers.filter(d => d.availability.hoursThisWeek >= d.availability.maxHoursPerWeek * 0.9).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No availability alerts</p>
                      <p className="text-sm">All drivers are within safe working hours</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DriverAssignment;
