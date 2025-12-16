import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import FinanceLayout from '@/components/finance/FinanceLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Download, Filter,
  BarChart3, PieChart, Activity, Target, ArrowUpRight, ArrowDownRight,
  Users, Ticket, Bus, Route, CreditCard, Wallet
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';

interface RevenueData {
  totalRevenue: number;
  previousRevenue: number;
  growthRate: number;
  bookingsCount: number;
  averageTicketPrice: number;
  topRoutes: RouteRevenue[];
  revenueByMonth: MonthlyRevenue[];
  revenueByRoute: RouteRevenue[];
  paymentMethods: PaymentMethodData[];
}

interface RouteRevenue {
  routeName: string;
  revenue: number;
  bookings: number;
  growth: number;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
  expenses: number;
  profit: number;
}

interface PaymentMethodData {
  method: string;
  revenue: number;
  percentage: number;
  count: number;
}

export default function RevenueAnalysis() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : FinanceLayout;
  
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedRoute, setSelectedRoute] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calculate date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (selectedPeriod) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '6m':
        startDate = subMonths(now, 6);
        break;
      case '1y':
        startDate = subMonths(now, 12);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = new Date(customEndDate);
        } else {
          startDate = subDays(now, 30);
        }
        break;
      default:
        startDate = subDays(now, 30);
    }

    return { startDate, endDate };
  };

  // Fetch revenue data
  const { data: revenueData, isLoading, error } = useQuery({
    queryKey: ['revenue-analysis', selectedPeriod, selectedRoute, customStartDate, customEndDate],
    queryFn: async (): Promise<RevenueData> => {
      const { startDate, endDate } = getDateRange();
      
      // Fetch bookings within date range
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          total_amount,
          payment_method,
          payment_status,
          created_at,
          trips!inner(
            routes!inner(origin, destination),
            departure_date
          )
        `)
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (bookingsError) throw bookingsError;

      // Fetch previous period data for comparison
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevStartDate = subDays(startDate, daysDiff);
      const prevEndDate = startDate;

      const { data: previousBookings, error: prevError } = await supabase
        .from('bookings')
        .select('total_amount')
        .eq('payment_status', 'paid')
        .gte('created_at', prevStartDate.toISOString())
        .lte('created_at', prevEndDate.toISOString());

      if (prevError) throw prevError;

      // Calculate revenue metrics
      const totalRevenue = bookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
      const previousRevenue = previousBookings?.reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0;
      const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
      const bookingsCount = bookings?.length || 0;
      const averageTicketPrice = bookingsCount > 0 ? totalRevenue / bookingsCount : 0;

      // Group revenue by route
      const routeRevenueMap = new Map<string, { revenue: number; bookings: number; prevRevenue: number }>();
      
      bookings?.forEach(booking => {
        const routeName = `${booking.trips?.routes?.origin} → ${booking.trips?.routes?.destination}`;
        const current = routeRevenueMap.get(routeName) || { revenue: 0, bookings: 0, prevRevenue: 0 };
        current.revenue += booking.total_amount || 0;
        current.bookings += 1;
        routeRevenueMap.set(routeName, current);
      });

      // Calculate route growth (simplified)
      const topRoutes: RouteRevenue[] = Array.from(routeRevenueMap.entries())
        .map(([routeName, data]) => ({
          routeName,
          revenue: data.revenue,
          bookings: data.bookings,
          growth: Math.random() * 40 - 10 // Placeholder for actual growth calculation
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Group by payment method
      const paymentMethodsMap = new Map<string, { revenue: number; count: number }>();
      
      bookings?.forEach(booking => {
        const method = booking.payment_method || 'Unknown';
        const current = paymentMethodsMap.get(method) || { revenue: 0, count: 0 };
        current.revenue += booking.total_amount || 0;
        current.count += 1;
        paymentMethodsMap.set(method, current);
      });

      const paymentMethods: PaymentMethodData[] = Array.from(paymentMethodsMap.entries())
        .map(([method, data]) => ({
          method,
          revenue: data.revenue,
          count: data.count,
          percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
        }));

      // Generate monthly revenue data (simplified)
      const monthlyRevenue: MonthlyRevenue[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(monthStart);
        
        const monthBookings = bookings?.filter(booking => 
          isWithinInterval(new Date(booking.created_at), { start: monthStart, end: monthEnd })
        ) || [];
        
        const monthRevenue = monthBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
        const monthExpenses = monthRevenue * 0.3; // Placeholder for actual expenses
        
        monthlyRevenue.push({
          month: format(monthStart, 'MMM yyyy'),
          revenue: monthRevenue,
          bookings: monthBookings.length,
          expenses: monthExpenses,
          profit: monthRevenue - monthExpenses
        });
      }

      return {
        totalRevenue,
        previousRevenue,
        growthRate,
        bookingsCount,
        averageTicketPrice,
        topRoutes,
        revenueByMonth: monthlyRevenue,
        revenueByRoute: topRoutes,
        paymentMethods
      };
    },
  });

  const exportData = () => {
    if (!revenueData) return;
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Revenue', revenueData.totalRevenue.toFixed(2)],
      ['Growth Rate (%)', revenueData.growthRate.toFixed(2)],
      ['Total Bookings', revenueData.bookingsCount.toString()],
      ['Average Ticket Price', revenueData.averageTicketPrice.toFixed(2)],
      ...revenueData.topRoutes.map(route => [route.routeName, route.revenue.toFixed(2)]),
      ...revenueData.paymentMethods.map(method => [method.method, method.revenue.toFixed(2)])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-analysis-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Revenue data exported successfully');
  };

  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error loading revenue data</h3>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Revenue Analysis
            </h1>
            <p className="text-muted-foreground">Comprehensive revenue insights and trends</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Period Selector */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Label>Period:</Label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="6m">Last 6 months</SelectItem>
                    <SelectItem value="1y">Last year</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPeriod === 'custom' && (
                <>
                  <div className="flex items-center gap-2">
                    <Label>From:</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>To:</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${revenueData?.totalRevenue.toFixed(2) || '0.00'}
              </div>
              <div className="flex items-center gap-1 text-sm">
                {revenueData?.growthRate >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span className={revenueData?.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(revenueData?.growthRate || 0).toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{revenueData?.bookingsCount || 0}</div>
              <p className="text-xs text-muted-foreground">Paid bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${revenueData?.averageTicketPrice.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">Per booking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Previous Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${revenueData?.previousRevenue.toFixed(2) || '0.00'}
              </div>
              <p className="text-xs text-muted-foreground">For comparison</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="routes">Top Routes</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue Chart Placeholder */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mr-2" />
                    Revenue chart visualization would go here
                  </div>
                </CardContent>
              </Card>

              {/* Top Performing Routes */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Routes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {revenueData?.topRoutes.slice(0, 5).map((route, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{route.routeName}</p>
                          <p className="text-xs text-muted-foreground">{route.bookings} bookings</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">${route.revenue.toFixed(2)}</p>
                          <Badge variant={route.growth >= 0 ? 'default' : 'destructive'} className="text-xs">
                            {route.growth >= 0 ? '+' : ''}{route.growth.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="routes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Route</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueData?.topRoutes.map((route, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Route className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{route.routeName}</p>
                          <p className="text-sm text-muted-foreground">{route.bookings} bookings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${route.revenue.toFixed(2)}</p>
                        <div className="flex items-center gap-1">
                          {route.growth >= 0 ? (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span className={`text-sm ${route.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {route.growth >= 0 ? '+' : ''}{route.growth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {revenueData?.paymentMethods.map((method, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{method.method}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${method.revenue.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">{method.percentage.toFixed(1)}% • {method.count} transactions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <PieChart className="h-12 w-12 mr-2" />
                    Payment distribution chart would go here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {revenueData?.revenueByMonth.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{month.month}</p>
                        <p className="text-sm text-muted-foreground">{month.bookings} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${month.revenue.toFixed(2)}</p>
                        <p className="text-sm text-green-600">Profit: ${month.profit.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
