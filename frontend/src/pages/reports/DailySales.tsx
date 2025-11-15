import { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, CreditCard, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DailySalesData {
  date: string;
  totalRevenue: number;
  totalBookings: number;
  totalPassengers: number;
  averageTicketPrice: number;
  paymentMethods: {
    method: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  routeBreakdown: {
    routeName: string;
    revenue: number;
    bookings: number;
    occupancyRate: number;
  }[];
  hourlyBreakdown: {
    hour: number;
    revenue: number;
    bookings: number;
  }[];
}

const DailySales = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesData, setSalesData] = useState<DailySalesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedDate) {
      fetchDailySales(selectedDate);
    }
  }, [selectedDate]);

  const fetchDailySales = async (date: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('total_amount, payment_status, created_at')
        .gte('booking_date', `${date}T00:00:00Z`)
        .lt('booking_date', `${date}T23:59:59Z`);

      if (error) throw error;
      
      const totalRevenue = data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
      const totalBookings = data?.length || 0;
      
      setSalesData({
        date,
        totalRevenue,
        totalBookings,
        totalPassengers: totalBookings,
        averageTicketPrice: totalBookings > 0 ? totalRevenue / totalBookings : 0,
        paymentMethods: []
      });
    } catch (error) {
      console.error('Failed to fetch sales data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!salesData) return;

    const csvContent = [
      ['Daily Sales Report', selectedDate],
      [],
      ['Metric', 'Value'],
      ['Total Revenue', `BWP ${salesData.totalRevenue.toLocaleString()}`],
      ['Total Bookings', salesData.totalBookings],
      ['Total Passengers', salesData.totalPassengers],
      ['Average Ticket Price', `BWP ${salesData.averageTicketPrice.toFixed(2)}`],
      [],
      ['Payment Methods'],
      ['Method', 'Amount', 'Count', 'Percentage'],
      ...salesData.paymentMethods.map(pm => [pm.method, pm.amount, pm.count, `${pm.percentage}%`]),
      [],
      ['Route Breakdown'],
      ['Route', 'Revenue', 'Bookings', 'Occupancy'],
      ...salesData.routeBreakdown.map(r => [r.routeName, r.revenue, r.bookings, `${r.occupancyRate}%`])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-sales-${selectedDate}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Sales Report</h1>
          <p className="text-gray-600">View detailed sales analytics by date</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {salesData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    BWP {salesData.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-2xl font-bold">{salesData.totalBookings}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Passengers</p>
                  <p className="text-2xl font-bold">{salesData.totalPassengers}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Ticket Price</p>
                  <p className="text-2xl font-bold">
                    BWP {salesData.averageTicketPrice.toFixed(2)}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Payment Methods Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {salesData.paymentMethods.map((method) => (
                <div key={method.method} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{method.method}</span>
                    <span className="text-xs text-gray-500">{method.percentage.toFixed(1)}%</span>
                  </div>
                  <p className="text-xl font-bold">BWP {method.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{method.count} transactions</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 rounded-full h-2"
                      style={{ width: `${method.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Route Breakdown */}
          <div className="bg-white rounded-lg border overflow-hidden mb-6">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-bold">Revenue by Route</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bookings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {salesData.routeBreakdown.map((route, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{route.routeName}</td>
                      <td className="px-6 py-4">
                        <span className="text-green-600 font-bold">
                          BWP {route.revenue.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">{route.bookings}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`rounded-full h-2 ${
                                route.occupancyRate >= 80 ? 'bg-green-600' :
                                route.occupancyRate >= 50 ? 'bg-yellow-600' :
                                'bg-red-600'
                              }`}
                              style={{ width: `${route.occupancyRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{route.occupancyRate.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Hourly Breakdown */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-bold mb-4">Hourly Sales Distribution</h3>
            <div className="space-y-2">
              {salesData.hourlyBreakdown.map((hour) => (
                <div key={hour.hour} className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-600 w-16">
                    {hour.hour.toString().padStart(2, '0')}:00
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div
                      className="bg-blue-600 rounded-full h-6 flex items-center justify-end pr-2"
                      style={{
                        width: `${(hour.revenue / Math.max(...salesData.hourlyBreakdown.map(h => h.revenue))) * 100}%`
                      }}
                    >
                      <span className="text-xs text-white font-medium">
                        BWP {hour.revenue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 w-20">{hour.bookings} bookings</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          No sales data available for {selectedDate}
        </div>
      )}
    </div>
  );
};

export default DailySales;
