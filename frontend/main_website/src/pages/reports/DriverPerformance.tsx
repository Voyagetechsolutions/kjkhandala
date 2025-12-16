import { useState, useEffect } from 'react';
import { User, TrendingUp, AlertTriangle, Star, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
}

interface DriverPerformanceData {
  driverId: string;
  driverName: string;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalHours: number;
  totalRevenue: number;
  averageRating: number;
  safetyScore: number;
  incidents: number;
  onTimePercentage: number;
  totalPassengers: number;
  averageOccupancy: number;
  fuelEfficiency: number;
}

const DriverPerformance = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [performanceData, setPerformanceData] = useState<DriverPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (selectedDriver) {
      fetchDriverPerformance();
    }
  }, [selectedDriver, startDate, endDate]);

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('last_name');

      if (error) throw error;
      setDrivers(data || []);
      if (data?.length > 0) {
        setSelectedDriver(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverPerformance = async () => {
    if (!selectedDriver) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/reports/driver-performance/${selectedDriver}?startDate=${startDate}&endDate=${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch driver performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading && drivers.length === 0) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Performance Report</h1>
          <p className="text-gray-600">Analyze individual driver metrics and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Driver</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.firstName} {driver.lastName}
              </option>
            ))}
          </select>
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

      {performanceData ? (
        <>
          {/* Driver Info Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{performanceData.driverName}</h2>
                <p className="text-blue-100">Performance Report: {startDate} to {endDate}</p>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Safety Score</p>
                  <p className={`text-3xl font-bold ${getScoreColor(performanceData.safetyScore)}`}>
                    {performanceData.safetyScore}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor(performanceData.safetyScore)}`}>
                  <AlertTriangle className={`w-6 h-6 ${getScoreColor(performanceData.safetyScore)}`} />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">{performanceData.incidents} incidents</div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {performanceData.averageRating.toFixed(1)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= performanceData.averageRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">On-Time Rate</p>
                  <p className={`text-3xl font-bold ${getScoreColor(performanceData.onTimePercentage)}`}>
                    {performanceData.onTimePercentage.toFixed(0)}%
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getScoreBgColor(performanceData.onTimePercentage)}`}>
                  <Clock className={`w-6 h-6 ${getScoreColor(performanceData.onTimePercentage)}`} />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">Punctuality score</div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600">
                    {(performanceData.totalRevenue / 1000).toFixed(1)}K
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">BWP {performanceData.totalRevenue.toLocaleString()}</div>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Trip Statistics */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-bold mb-4">Trip Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Trips</span>
                  <span className="text-2xl font-bold">{performanceData.totalTrips}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="text-xl font-bold text-green-600">{performanceData.completedTrips}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cancelled</span>
                  <span className="text-xl font-bold text-red-600">{performanceData.cancelledTrips}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Hours</span>
                  <span className="text-xl font-bold text-blue-600">{performanceData.totalHours.toFixed(1)}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Passengers</span>
                  <span className="text-xl font-bold text-purple-600">{performanceData.totalPassengers}</span>
                </div>
              </div>
            </div>

            {/* Efficiency Metrics */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-bold mb-4">Efficiency Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Average Occupancy</span>
                    <span className="text-xl font-bold">{performanceData.averageOccupancy.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`rounded-full h-3 ${
                        performanceData.averageOccupancy >= 80 ? 'bg-green-600' :
                        performanceData.averageOccupancy >= 60 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${performanceData.averageOccupancy}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Fuel Efficiency</span>
                    <span className="text-xl font-bold">{performanceData.fuelEfficiency.toFixed(1)} km/L</span>
                  </div>
                  <div className="text-sm text-gray-500">Average fuel consumption</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Revenue per Trip</span>
                    <span className="text-xl font-bold text-green-600">
                      BWP {(performanceData.totalRevenue / (performanceData.totalTrips || 1)).toFixed(0)}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600">Revenue per Hour</span>
                    <span className="text-xl font-bold text-green-600">
                      BWP {(performanceData.totalRevenue / (performanceData.totalHours || 1)).toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-bold mb-4">Performance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${getScoreBgColor(performanceData.safetyScore)}`}>
                <p className="text-sm font-medium text-gray-700 mb-1">Safety Performance</p>
                <p className={`text-2xl font-bold ${getScoreColor(performanceData.safetyScore)}`}>
                  {performanceData.safetyScore >= 90 ? 'Excellent' :
                   performanceData.safetyScore >= 70 ? 'Good' : 'Needs Improvement'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {performanceData.incidents === 0 ? 'No incidents reported' : `${performanceData.incidents} incident(s)`}
                </p>
              </div>

              <div className={`p-4 rounded-lg ${getScoreBgColor(performanceData.onTimePercentage)}`}>
                <p className="text-sm font-medium text-gray-700 mb-1">Punctuality</p>
                <p className={`text-2xl font-bold ${getScoreColor(performanceData.onTimePercentage)}`}>
                  {performanceData.onTimePercentage >= 90 ? 'Excellent' :
                   performanceData.onTimePercentage >= 70 ? 'Good' : 'Needs Improvement'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {performanceData.onTimePercentage.toFixed(0)}% on-time arrivals
                </p>
              </div>

              <div className={`p-4 rounded-lg ${getScoreBgColor(performanceData.averageOccupancy)}`}>
                <p className="text-sm font-medium text-gray-700 mb-1">Occupancy Rate</p>
                <p className={`text-2xl font-bold ${getScoreColor(performanceData.averageOccupancy)}`}>
                  {performanceData.averageOccupancy >= 80 ? 'Excellent' :
                   performanceData.averageOccupancy >= 60 ? 'Good' : 'Needs Improvement'}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {performanceData.averageOccupancy.toFixed(1)}% average occupancy
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          {selectedDriver ? 'Loading driver performance data...' : 'Please select a driver'}
        </div>
      )}
    </div>
  );
};

export default DriverPerformance;
