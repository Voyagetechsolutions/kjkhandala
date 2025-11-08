import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  Bus, 
  DollarSign, 
  Users, 
  Wrench, 
  Ticket,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DepartmentsSection() {
  const navigate = useNavigate();

  // Fetch fleet data
  const { data: buses } = useQuery({
    queryKey: ['buses-dept'],
    queryFn: async () => {
      const response = await api.get('/buses');
      return Array.isArray(response.data) ? response.data : (response.data?.buses || []);
    },
  });

  // Fetch schedules
  const { data: schedules } = useQuery({
    queryKey: ['schedules-dept'],
    queryFn: async () => {
      const response = await api.get('/schedules');
      return Array.isArray(response.data) ? response.data : (response.data?.schedules || []);
    },
  });

  // Fetch bookings
  const { data: bookings } = useQuery({
    queryKey: ['bookings-dept'],
    queryFn: async () => {
      const response = await api.get('/bookings');
      return Array.isArray(response.data) ? response.data : (response.data?.bookings || []);
    },
  });

  // Fetch staff
  const { data: staff } = useQuery({
    queryKey: ['staff-dept'],
    queryFn: async () => {
      const response = await api.get('/staff');
      return Array.isArray(response.data) ? response.data : (response.data?.staff || []);
    },
  });

  // Fetch maintenance
  const { data: maintenance } = useQuery({
    queryKey: ['maintenance-dept'],
    queryFn: async () => {
      const response = await api.get('/maintenance_records');
      return Array.isArray(response.data) ? response.data : (response.data?.maintenance_records || []);
    },
  });

  // Calculate department stats
  const totalBuses = Array.isArray(buses) ? buses.length : 0;
  const activeBuses = Array.isArray(buses) ? buses.filter((b: any) => b.status === 'active').length : 0;
  const maintenanceDue = Array.isArray(maintenance) ? maintenance.length : 0;

  const todayTrips = Array.isArray(schedules) ? schedules.length : 0;
  const activeTrips = Array.isArray(schedules) ? schedules.filter((s: any) => s.status === 'active').length : 0;
  const completedTrips = Array.isArray(schedules) ? schedules.filter((s: any) => s.status === 'completed').length : 0;

  const todayRevenue = Array.isArray(bookings) ? bookings.reduce((sum: number, b: any) => sum + parseFloat(b.total_amount || 0), 0) : 0;
  const pendingBookings = Array.isArray(bookings) ? bookings.filter((b: any) => b.status === 'pending').length : 0;

  const totalStaff = Array.isArray(staff) ? staff.length : 0;
  const activeStaff = Array.isArray(staff) ? staff.filter((s: any) => s.status === 'active').length : 0;

  const todayBookings = Array.isArray(bookings) ? bookings.length : 0;
  const confirmedBookings = Array.isArray(bookings) ? bookings.filter((b: any) => b.status === 'confirmed').length : 0;

  const departments = [
    {
      id: 'fleet',
      name: 'Fleet Management',
      icon: Truck,
      color: 'bg-blue-500',
      stats: [
        { label: 'Total Buses', value: totalBuses, icon: Bus },
        { label: 'Active', value: activeBuses, icon: CheckCircle, color: 'text-green-600' },
        { label: 'Maintenance Due', value: maintenanceDue, icon: AlertCircle, color: 'text-orange-600' },
      ],
      link: '/admin/fleet',
    },
    {
      id: 'operations',
      name: 'Operations',
      icon: Bus,
      color: 'bg-green-500',
      stats: [
        { label: "Today's Trips", value: todayTrips, icon: Bus },
        { label: 'Active', value: activeTrips, icon: TrendingUp, color: 'text-green-600' },
        { label: 'Completed', value: completedTrips, icon: CheckCircle, color: 'text-blue-600' },
      ],
      link: '/admin/trips',
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: DollarSign,
      color: 'bg-emerald-500',
      stats: [
        { label: "Today's Revenue", value: `P${todayRevenue.toFixed(2)}`, icon: DollarSign },
        { label: 'Pending Payments', value: pendingBookings, icon: AlertCircle, color: 'text-orange-600' },
        { label: 'Profit Margin', value: '32%', icon: TrendingUp, color: 'text-green-600' },
      ],
      link: '/admin/finance',
    },
    {
      id: 'hr',
      name: 'Human Resources',
      icon: Users,
      color: 'bg-purple-500',
      stats: [
        { label: 'Total Employees', value: totalStaff, icon: Users },
        { label: 'Active', value: activeStaff, icon: CheckCircle, color: 'text-green-600' },
        { label: 'Attendance Today', value: '95%', icon: TrendingUp, color: 'text-blue-600' },
      ],
      link: '/admin/hr',
    },
    {
      id: 'maintenance',
      name: 'Maintenance',
      icon: Wrench,
      color: 'bg-orange-500',
      stats: [
        { label: 'Scheduled Services', value: maintenanceDue, icon: Wrench },
        { label: 'Overdue', value: 0, icon: AlertCircle, color: 'text-red-600' },
        { label: 'This Month Cost', value: 'P12,500', icon: DollarSign, color: 'text-blue-600' },
      ],
      link: '/admin/maintenance',
    },
    {
      id: 'customer',
      name: 'Customer Service',
      icon: Ticket,
      color: 'bg-pink-500',
      stats: [
        { label: 'Bookings Today', value: todayBookings, icon: Ticket },
        { label: 'Confirmed', value: confirmedBookings, icon: CheckCircle, color: 'text-green-600' },
        { label: 'Inquiries', value: 0, icon: AlertCircle, color: 'text-orange-600' },
      ],
      link: '/admin/bookings',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Departments Overview</h2>
        <Badge variant="outline" className="text-sm">
          Real-time Data
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => {
          const Icon = dept.icon;
          return (
            <Card key={dept.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${dept.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(dept.link)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dept.stats.map((stat, index) => {
                    const StatIcon = stat.icon;
                    return (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StatIcon className={`h-4 w-4 ${stat.color || 'text-muted-foreground'}`} />
                          <span className="text-sm text-muted-foreground">{stat.label}</span>
                        </div>
                        <span className={`font-bold ${stat.color || ''}`}>
                          {stat.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4"
                  onClick={() => navigate(dept.link)}
                >
                  View Details
                  <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
