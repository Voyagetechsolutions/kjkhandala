import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  MoreVertical,
  Bus,
  Calendar,
  Edit,
  UserX,
  Clock,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import DriverProfileModal from '@/components/operations/DriverProfileModal';
import AssignBusModal from '@/components/operations/AssignBusModal';
import DriverForm from '@/components/drivers/DriverForm';

export default function DriverManagement() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: driversData, isLoading } = useQuery({
    queryKey: ['driver-management'],
    queryFn: async () => {
      // Fetch drivers - simple query that works
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select('*')
        .order('full_name');

      if (driversError) throw driversError;

      // Fetch active trips for these drivers
      const driverIds = drivers?.map(d => d.id) || [];
      const { data: activeTrips } = await supabase
        .from('trips')
        .select('id, driver_id, bus_id, route_id, status, scheduled_departure')
        .in('driver_id', driverIds)
        .in('status', ['SCHEDULED', 'BOARDING', 'DEPARTED', 'IN_PROGRESS']);

      // Fetch buses for active trips
      const busIds = activeTrips?.map(t => t.bus_id).filter(Boolean) || [];
      const { data: buses } = await supabase
        .from('buses')
        .select('id, bus_number')
        .in('id', busIds);

      // Fetch routes for active trips
      const routeIds = activeTrips?.map(t => t.route_id).filter(Boolean) || [];
      const { data: routes } = await supabase
        .from('routes')
        .select('id, origin, destination')
        .in('id', routeIds);

      // Combine data
      const driversWithAssignments = drivers?.map(driver => {
        const currentTrip = activeTrips?.find(t => t.driver_id === driver.id);
        if (currentTrip) {
          const bus = buses?.find(b => b.id === currentTrip.bus_id);
          const route = routes?.find(r => r.id === currentTrip.route_id);
          return {
            ...driver,
            current_assignment: {
              ...currentTrip,
              bus,
              route,
            },
          };
        }
        return driver;
      }) || [];

      return driversWithAssignments;
    },
    refetchInterval: 30000,
  });

  const updateDriverStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('drivers')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-management'] });
      toast.success('Driver status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update driver status');
    },
  });

  const drivers = driversData || [];

  const getDaysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return null;
    return differenceInDays(new Date(expiryDate), new Date());
  };

  const isLicenseExpiringSoon = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    return days !== null && days <= 30 && days >= 0;
  };

  const isLicenseExpired = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    return days !== null && days < 0;
  };

  const stats = {
    total: drivers.length,
    onDuty: drivers.filter((d: any) => d.status === 'active').length,
    offDuty: drivers.filter((d: any) => d.status === 'inactive').length,
    expiringSoon: drivers.filter((d: any) => 
      d.license_expiry_date && isLicenseExpiringSoon(d.license_expiry_date)
    ).length,
  };

  const filteredDrivers = drivers.filter((driver: any) => {
    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'on_duty' ? driver.status === 'active' :
      statusFilter === 'off_duty' ? driver.status === 'inactive' :
      statusFilter === 'expiring_soon' ? driver.license_expiry_date && isLicenseExpiringSoon(driver.license_expiry_date) :
      true;

    const matchesSearch = 
      driver.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.license_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.id?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">On Duty</Badge>;
      case 'inactive':
        return <Badge variant="outline">Off Duty</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLicenseExpiryBadge = (expiryDate: string) => {
    if (!expiryDate) return null;
    
    if (isLicenseExpired(expiryDate)) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (isLicenseExpiringSoon(expiryDate)) {
      return <Badge className="bg-orange-500">Expiring Soon</Badge>;
    }
    
    return null;
  };

  const handleAssignBus = (driver: any) => {
    setSelectedDriver(driver);
    setShowAssignModal(true);
  };

  const handleViewProfile = (driver: any) => {
    setSelectedDriver(driver);
    setShowProfileModal(true);
  };

  const handleSuspendDriver = async (driverId: string) => {
    if (confirm('Are you sure you want to suspend this driver?')) {
      await updateDriverStatus.mutateAsync({ id: driverId, status: 'suspended' });
    }
  };

  return (
    <OperationsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Driver Management</h1>
            <p className="text-muted-foreground">Monitor, assign, and manage all drivers</p>
          </div>
          <Button onClick={() => {
            setSelectedDriver(null);
            setShowDriverForm(true);
          }}>
            <Users className="h-4 w-4 mr-2" />
            Add New Driver
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total registered drivers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Duty</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.onDuty}</div>
              <p className="text-xs text-muted-foreground">Currently assigned to active buses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Off Duty</CardTitle>
              <XCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.offDuty}</div>
              <p className="text-xs text-muted-foreground">Available but not currently driving</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">License Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</div>
              <p className="text-xs text-muted-foreground">Expiring within 30 days</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, ID, or license number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  <SelectItem value="on_duty">On Duty</SelectItem>
                  <SelectItem value="off_duty">Off Duty</SelectItem>
                  <SelectItem value="expiring_soon">License Expiring Soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver Roster ({filteredDrivers.length} drivers)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver Name / ID</TableHead>
                    <TableHead>License Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Assignment</TableHead>
                    <TableHead>License Expiry</TableHead>
                    <TableHead>Days Until Expiry</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading drivers...
                      </TableCell>
                    </TableRow>
                  ) : filteredDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No drivers found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDrivers.map((driver: any) => {
                      const currentTrip = Array.isArray(driver.current_assignment) 
                        ? driver.current_assignment[0] 
                        : driver.current_assignment;
                      const daysUntilExpiry = getDaysUntilExpiry(driver.license_expiry_date);
                      const hasExpiryAlert = driver.license_expiry_date && 
                        (isLicenseExpiringSoon(driver.license_expiry_date) || isLicenseExpired(driver.license_expiry_date));

                      return (
                        <TableRow key={driver.id} className={hasExpiryAlert ? 'bg-orange-50' : ''}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewProfile(driver)}
                                className="font-medium hover:underline text-left"
                              >
                                {driver.full_name}
                              </button>
                              {hasExpiryAlert && (
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{driver.id}</div>
                          </TableCell>
                          <TableCell>{driver.license_number || 'N/A'}</TableCell>
                          <TableCell>{getStatusBadge(driver.status)}</TableCell>
                          <TableCell>
                            {currentTrip ? (
                              <div className="text-sm">
                                <div className="flex items-center gap-1 mb-1">
                                  <Bus className="h-3 w-3" />
                                  <span className="font-medium">{currentTrip.bus?.bus_number}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {currentTrip.route?.origin} → {currentTrip.route?.destination}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {driver.license_expiry_date ? (
                                <>
                                  <span className="text-sm">
                                    {format(new Date(driver.license_expiry_date), 'yyyy-MM-dd')}
                                  </span>
                                  {getLicenseExpiryBadge(driver.license_expiry_date)}
                                </>
                              ) : (
                                <span className="text-muted-foreground text-sm">N/A</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {daysUntilExpiry !== null ? (
                              <span className={`text-sm font-medium ${
                                daysUntilExpiry < 0 ? 'text-red-600' :
                                daysUntilExpiry <= 30 ? 'text-orange-600' :
                                'text-gray-600'
                              }`}>
                                {daysUntilExpiry < 0 
                                  ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                                  : `${daysUntilExpiry} days`
                                }
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm space-y-1">
                              {driver.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{driver.phone}</span>
                                </div>
                              )}
                              {driver.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="text-xs">{driver.email}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAssignBus(driver)}>
                                  <Bus className="h-4 w-4 mr-2" />
                                  Assign to Bus
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewProfile(driver)}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  View History
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewProfile(driver)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Info
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleSuspendDriver(driver.id)}
                                  className="text-red-600"
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspend Driver
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {stats.expiringSoon > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertTriangle className="h-5 w-5" />
                License Expiry Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {drivers
                  .filter((d: any) => d.license_expiry_date && isLicenseExpiringSoon(d.license_expiry_date))
                  .map((driver: any) => {
                    const days = getDaysUntilExpiry(driver.license_expiry_date);
                    return (
                      <div key={driver.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="font-medium text-orange-900">{driver.full_name}</p>
                            <p className="text-sm text-orange-700">
                              License expires in {days} days ({format(new Date(driver.license_expiry_date), 'MMM dd, yyyy')})
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewProfile(driver)}
                        >
                          View Details
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showProfileModal && selectedDriver && (
        <DriverProfileModal
          driver={selectedDriver}
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedDriver(null);
          }}
        />
      )}

      {showAssignModal && selectedDriver && (
        <AssignBusModal
          driver={selectedDriver}
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedDriver(null);
          }}
        />
      )}

      {/* Driver Form Modal */}
      {showDriverForm && (
        <DriverForm
          driver={selectedDriver}
          onClose={() => {
            setShowDriverForm(false);
            setSelectedDriver(null);
          }}
          onSuccess={() => {
            setShowDriverForm(false);
            setSelectedDriver(null);
            queryClient.invalidateQueries({ queryKey: ['driver-management'] });
          }}
        />
      )}
    </OperationsLayout>
  );
}
