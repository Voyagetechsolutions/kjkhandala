import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Plus, X, Upload, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const breakdownSchema = z.object({
  busId: z.string().min(1, 'Bus is required'),
  driverId: z.string().min(1, 'Driver is required'),
  tripId: z.string().optional(),
  location: z.string().min(3, 'Location is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  photos: z.array(z.string()).optional()
});

type BreakdownFormData = z.infer<typeof breakdownSchema>;

interface Breakdown {
  id: string;
  busNumber: string;
  driverName: string;
  location: string;
  description: string;
  severity: string;
  status: string;
  reportedAt: string;
  photos?: string[];
}

export default function Breakdowns() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : MaintenanceLayout;
  
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<Breakdown | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BreakdownFormData>({
    resolver: zodResolver(breakdownSchema)
  });

  useEffect(() => {
    fetchBreakdowns();
  }, []);

  const fetchBreakdowns = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*, buses(*)')
        .eq('type', 'breakdown')
        .order('created_at', { ascending: false});

      if (error) throw error;
      setBreakdowns(data || []);
    } catch (error) {
      console.error('Failed to fetch breakdowns:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BreakdownFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('incidents')
        .insert([{
          bus_id: data.busId,
          driver_id: data.driverId,
          trip_id: data.tripId,
          type: 'breakdown',
          severity: data.severity,
          description: data.description,
          location: data.location,
          status: 'OPEN',
          reported_by_id: user.id
        }]);

      if (error) throw error;
      await fetchBreakdowns();
      setShowModal(false);
      reset();
    } catch (error) {
      console.error('Failed to report breakdown:', error);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('incidents')
        .update({ 
          status: status,
          resolved_at: status === 'RESOLVED' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;
      await fetchBreakdowns();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <Layout className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Breakdown Reports</h1>
          <p className="text-gray-600">Track and manage bus breakdowns</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <AlertTriangle className="w-5 h-5" />
          Report Breakdown
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Breakdowns</p>
          <p className="text-2xl font-bold">{breakdowns.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Critical</p>
          <p className="text-2xl font-bold text-red-600">
            {breakdowns.filter(b => b.severity === 'CRITICAL').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">
            {breakdowns.filter(b => b.status === 'IN_PROGRESS').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Resolved</p>
          <p className="text-2xl font-bold text-green-600">
            {breakdowns.filter(b => b.status === 'RESOLVED').length}
          </p>
        </div>
      </div>

      {/* Breakdowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {breakdowns.map((breakdown) => (
          <div key={breakdown.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-lg">{breakdown.busNumber}</h3>
                <p className="text-sm text-gray-600">{breakdown.driverName}</p>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(breakdown.severity)}`}>
                  {breakdown.severity}
                </span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(breakdown.status)}`}>
                  {breakdown.status}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <p className="text-sm">{breakdown.location}</p>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                <p className="text-sm">{new Date(breakdown.reportedAt).toLocaleString()}</p>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">{breakdown.description}</p>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={() => setSelectedBreakdown(breakdown)}
                className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
              >
                View Details
              </button>
              {breakdown.status !== 'RESOLVED' && (
                <button
                  onClick={() => updateStatus(breakdown.id, breakdown.status === 'REPORTED' ? 'IN_PROGRESS' : 'RESOLVED')}
                  className="flex-1 px-3 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                >
                  {breakdown.status === 'REPORTED' ? 'Start Work' : 'Resolve'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Report Breakdown</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bus ID</label>
                <input
                  {...register('busId')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter bus ID"
                />
                {errors.busId && <p className="text-red-500 text-sm mt-1">{errors.busId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Driver ID</label>
                <input
                  {...register('driverId')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter driver ID"
                />
                {errors.driverId && <p className="text-red-500 text-sm mt-1">{errors.driverId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  {...register('location')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Francistown Road, KM 45"
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                <select
                  {...register('severity')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                {errors.severity && <p className="text-red-500 text-sm mt-1">{errors.severity.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the breakdown in detail..."
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Report Breakdown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedBreakdown && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Breakdown Details</h2>
              <button onClick={() => setSelectedBreakdown(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Bus</p>
                  <p className="font-medium">{selectedBreakdown.busNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Driver</p>
                  <p className="font-medium">{selectedBreakdown.driverName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Severity</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(selectedBreakdown.severity)}`}>
                    {selectedBreakdown.severity}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedBreakdown.status)}`}>
                    {selectedBreakdown.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-medium">{selectedBreakdown.location}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Reported At</p>
                <p className="font-medium">{new Date(selectedBreakdown.reportedAt).toLocaleString()}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-900">{selectedBreakdown.description}</p>
              </div>

              {selectedBreakdown.photos && selectedBreakdown.photos.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Photos</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedBreakdown.photos.map((photo, index) => (
                      <img key={index} src={photo} alt={`Breakdown ${index + 1}`} className="w-full h-32 object-cover rounded" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
