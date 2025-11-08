import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import HRLayout from '@/components/hr/HRLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  DollarSign, 
  TrendingUp,
  AlertCircle,
  Calendar,
  Award
} from 'lucide-react';

export default function HRDashboard() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && (!user || !userRoles?.includes('HR_MANAGER'))) {
      navigate('/');
      return;
    }
  }, [user, userRoles, loading, navigate]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!userRoles?.includes('HR_MANAGER')) return null;

  const { data: employees = [] } = useQuery({
    queryKey: ['hr-employees'],
    queryFn: async () => {
      const response = await api.get('/hr/employees');
      return Array.isArray(response.data) ? response.data : (response.data?.employees || []);
    },
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ['hr-attendance-today'],
    queryFn: async () => {
      const response = await api.get('/hr/attendance/today');
      return Array.isArray(response.data) ? response.data : (response.data?.attendance || []);
    },
  });

  const { data: payroll = [] } = useQuery({
    queryKey: ['hr-payroll'],
    queryFn: async () => {
      const response = await api.get('/hr/payroll');
      return Array.isArray(response.data) ? response.data : (response.data?.payroll || []);
    },
  });

  const { data: certifications = [] } = useQuery({
    queryKey: ['hr-certifications'],
    queryFn: async () => {
      const response = await api.get('/hr/certifications');
      return Array.isArray(response.data) ? response.data : (response.data?.certifications || []);
    },
  });

  const employeeStats = {
    total: employees.length,
    active: employees.filter((e: any) => e.status === 'active').length,
    onLeave: employees.filter((e: any) => e.status === 'on_leave').length,
    terminated: employees.filter((e: any) => e.status === 'terminated').length,
  };

  const departmentBreakdown = employees.reduce((acc: any[], emp: any) => {
    const existing = acc.find(d => d.dept === emp.department);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ dept: emp.department || 'Others', count: 1 });
    }
    return acc;
  }, []).map((d: any) => ({
    ...d,
    percentage: Math.round((d.count / employees.length) * 100)
  }));

  const attendanceToday = {
    onDuty: attendance.filter((a: any) => a.status === 'present').length,
    absent: attendance.filter((a: any) => a.status === 'absent').length,
    late: attendance.filter((a: any) => a.isLate).length,
  };

  const payrollSummary = {
    totalCost: payroll.reduce((sum: number, p: any) => sum + parseFloat(p.totalAmount || 0), 0),
    processed: payroll.filter((p: any) => p.status === 'processed').length,
    pending: payroll.filter((p: any) => p.status === 'pending').length,
  };

  const today = new Date();
  const oneMonthLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const expiringCerts = certifications.filter((c: any) => {
    const expiry = new Date(c.expiryDate);
    return expiry > today && expiry <= oneMonthLater;
  });

  const alerts = [
    expiringCerts.filter((c: any) => c.type === 'license').length > 0 && 
      { id: 1, type: 'license', message: `${expiringCerts.filter((c: any) => c.type === 'license').length} driver licenses expiring this month`, priority: 'high' },
    expiringCerts.filter((c: any) => c.type === 'medical').length > 0 && 
      { id: 2, type: 'medical', message: `${expiringCerts.filter((c: any) => c.type === 'medical').length} medical exams due`, priority: 'high' },
    expiringCerts.filter((c: any) => c.type === 'contract').length > 0 && 
      { id: 3, type: 'contract', message: `${expiringCerts.filter((c: any) => c.type === 'contract').length} contracts up for renewal`, priority: 'medium' },
  ].filter(Boolean);

  const upcomingRenewals = expiringCerts.slice(0, 5).map((cert: any) => {
    const expiry = new Date(cert.expiryDate);
    const days = Math.floor((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
    return {
      name: cert.employeeName || 'Unknown',
      type: cert.type,
      date: cert.expiryDate,
      days
    };
  });

  return (
    <HRLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">HR Dashboard</h1>
          <p className="text-muted-foreground">Human Resources management and employee lifecycle</p>
        </div>

        {/* Employee Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeStats.total}</div>
              <p className="text-xs text-muted-foreground">Company workforce</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeStats.active}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Leave</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeStats.onLeave}</div>
              <p className="text-xs text-muted-foreground">Temporary absence</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Terminated</CardTitle>
              <UserX className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employeeStats.terminated}</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Department Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Staff by Department</CardTitle>
            <CardDescription>Employee distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {departmentBreakdown.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{dept.dept}</span>
                      <span className="text-sm text-muted-foreground">{dept.count} ({dept.percentage}%)</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${dept.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attendance & Payroll */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Attendance Overview (Today)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">On Duty</span>
                  <Badge className="bg-green-500">{attendanceToday.onDuty}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Absent</span>
                  <Badge className="bg-red-500">{attendanceToday.absent}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Late</span>
                  <Badge className="bg-yellow-500">{attendanceToday.late}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payroll Summary (This Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Payroll Cost</span>
                  <span className="font-bold">P {payrollSummary.totalCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Processed</span>
                  <Badge className="bg-green-500">{payrollSummary.processed}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pending</span>
                  <Badge className="bg-yellow-500">{payrollSummary.pending}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* HR Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              HR Alerts
            </CardTitle>
            <CardDescription>Important notifications requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <AlertCircle className={`h-5 w-5 ${
                    alert.priority === 'high' ? 'text-red-500' : 
                    alert.priority === 'medium' ? 'text-yellow-500' : 
                    'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground capitalize">{alert.type}</p>
                  </div>
                  <Badge className={
                    alert.priority === 'high' ? 'bg-red-500' : 
                    alert.priority === 'medium' ? 'bg-yellow-500' : 
                    'bg-blue-500'
                  }>
                    {alert.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Renewals */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Contract Renewals & Expirations</CardTitle>
            <CardDescription>Items requiring renewal soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingRenewals.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.type} Renewal</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{item.date}</div>
                    <div className="text-xs text-muted-foreground">{item.days} days</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Turnover & Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Turnover & Retention Rate
            </CardTitle>
            <CardDescription>Employee retention metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-green-600">94.2%</div>
                <div className="text-sm text-muted-foreground">Retention Rate</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-red-600">5.8%</div>
                <div className="text-sm text-muted-foreground">Turnover Rate</div>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-3xl font-bold text-blue-600">2.3 yrs</div>
                <div className="text-sm text-muted-foreground">Avg Tenure</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </HRLayout>
  );
}
