import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Clock, Users, MapPin } from 'lucide-react';

interface TripPerformanceData {
  tripId: string;
  routeName: string;
  busNumber: string;
  driverName: string;
  departureTime: string;
  arrivalTime: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  totalSeats: number;
  bookedSeats: number;
  occupancyRate: number;
  revenue: number;
  status: string;
  onTimeStatus: string;
  delayMinutes?: number;
}

const TripPerformance = () => {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [trips, setTrips] = useState<TripPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTripPerformance();
  }, [startDate, endDate]);

  const fetchTripPerformance = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/reports/trip-performance?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setTrips(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch trip performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const totalTrips = trips.length;
  const completedTrips = trips.filter(t => t.status === 'COMPLETED').length;
  const avgOccupancy = trips.reduce((sum, t) => sum + t.occupancyRate, 0) / (totalTrips || 1);
  const totalRevenue = trips.reduce((sum, t) => sum + t.revenue, 0);
  const onTimeTrips = trips.filter(t => t.onTimeStatus === 'ON_TIME').length;
  const onTimePercentage = (onTimeTrips / (totalTrips || 1)) * 100;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Performance Report</h1>
          <p className="text-gray-600">Analyze trip efficiency and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Trips</p>
              <p className="text-2xl font-bold">{totalTrips}</p>
            </div>
            <MapPin className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedTrips}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Occupancy</p>
              <p className="text-2xl font-bold text-purple-600">{avgOccupancy.toFixed(1)}%</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">BWP {totalRevenue.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On-Time Rate</p>
              <p className="text-2xl font-bold text-blue-600">{onTimePercentage.toFixed(1)}%</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="text-lg font-bold mb-4">Occupancy Rate Distribution</h3>
        <div className="space-y-3">
          {[
            { range: '90-100%', count: trips.filter(t => t.occupancyRate >= 90).length, color: 'bg-green-600' },
            { range: '70-89%', count: trips.filter(t => t.occupancyRate >= 70 && t.occupancyRate < 90).length, color: 'bg-blue-600' },
            { range: '50-69%', count: trips.filter(t => t.occupancyRate >= 50 && t.occupancyRate < 70).length, color: 'bg-yellow-600' },
            { range: '30-49%', count: trips.filter(t => t.occupancyRate >= 30 && t.occupancyRate < 50).length, color: 'bg-orange-600' },
            { range: '0-29%', count: trips.filter(t => t.occupancyRate < 30).length, color: 'bg-red-600' }
          ].map((item) => (
            <div key={item.range} className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 w-20">{item.range}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                <div
                  className={`${item.color} rounded-full h-8 flex items-center justify-end pr-3`}
                  style={{ width: `${(item.count / (totalTrips || 1)) * 100}%` }}
                >
                  <span className="text-sm text-white font-medium">{item.count} trips</span>
                </div>
              </div>
              <span className="text-sm text-gray-600 w-16">
                {((item.count / (totalTrips || 1)) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-bold">Trip Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departure</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Occupancy</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">On-Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trips.map((trip) => (
                <tr key={trip.tripId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{trip.routeName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{trip.busNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{trip.driverName}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div>{new Date(trip.departureTime).toLocaleString()}</div>
                      {trip.delayMinutes && trip.delayMinutes > 0 && (
                        <div className="text-xs text-red-600">+{trip.delayMinutes} min late</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`rounded-full h-2 ${
                            trip.occupancyRate >= 80 ? 'bg-green-600' :
                            trip.occupancyRate >= 50 ? 'bg-yellow-600' :
                            'bg-red-600'
                          }`}
                          style={{ width: `${trip.occupancyRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{trip.occupancyRate.toFixed(0)}%</span>
                    </div>
                    <div className="text-xs text-gray-500">{trip.bookedSeats}/{trip.totalSeats} seats</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-green-600">BWP {trip.revenue.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      trip.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      trip.status === 'DEPARTED' ? 'bg-blue-100 text-blue-800' :
                      trip.status === 'BOARDING' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      trip.onTimeStatus === 'ON_TIME' ? 'bg-green-100 text-green-800' :
                      trip.onTimeStatus === 'DELAYED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trip.onTimeStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {trips.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No trip data available for the selected date range
        </div>
      )}
    </div>
  );
};

export default TripPerformance;
