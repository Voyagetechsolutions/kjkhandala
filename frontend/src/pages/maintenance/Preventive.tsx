import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Plus, X, CheckCircle, Clock } from 'lucide-react';

const maintenanceSchema = z.object({
  busId: z.string().min(1, 'Bus is required'),
  maintenanceType: z.enum(['OIL_CHANGE', 'TIRE_ROTATION', 'BRAKE_INSPECTION', 'ENGINE_SERVICE', 'ANNUAL_INSPECTION', 'SAFETY_CHECK']),
  scheduledDate: z.string().min(1, 'Date is required'),
  estimatedDuration: z.number().min(1, 'Duration must be at least 1 hour'),
  description: z.string().optional()
});

type MaintenanceFormData = z.infer<typeof maintenanceSchema>;

interface Maintenance {
  id: string;
  busNumber: string;
  maintenanceType: string;
  scheduledDate: string;
  completedDate?: string;
  status: string;
  cost?: number;
  nextDueDate?: string;
}

const Preventive = () => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceSchema)
  });

  useEffect(() => {
    fetchMaintenances();
  }, []);

  const fetchMaintenances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/maintenance/preventive', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMaintenances(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch maintenances:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: MaintenanceFormData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/maintenance/preventive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        await fetchMaintenances();
        setShowModal(false);
        reset();
      }
    } catch (error) {
      console.error('Failed to schedule maintenance:', error);
    }
  };

  const completeMaintenance = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/maintenance/preventive/${id}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          completedBy: 'current-user-id',
          actualDuration: 2,
          cost: 0,
          notes: 'Completed'
        })
      });

      if (response.ok) {
        await fetchMaintenances();
      }
    } catch (error) {
      console.error('Failed to complete maintenance:', error);
    }
  };

  const filteredMaintenances = maintenances.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'scheduled') return m.status === 'SCHEDULED';
    if (filter === 'completed') return m.status === 'COMPLETED';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMaintenanceIcon = (type: string) => {
    switch (type) {
      case 'OIL_CHANGE': return '🛢️';
      case 'TIRE_ROTATION': return '🔄';
      case 'BRAKE_INSPECTION': return '🛑';
      case 'ENGINE_SERVICE': return '⚙️';
      case 'ANNUAL_INSPECTION': return '📋';
      case 'SAFETY_CHECK': return '✅';
      default: return '🔧';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preventive Maintenance</h1>
          <p className="text-gray-600">Schedule and track maintenance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Schedule Maintenance
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Scheduled</p>
          <p className="text-2xl font-bold">{maintenances.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Upcoming</p>
          <p className="text-2xl font-bold text-blue-600">
            {maintenances.filter(m => m.status === 'SCHEDULED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-2xl font-bold text-green-600">
            {maintenances.filter(m => m.status === 'COMPLETED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Cost</p>
          <p className="text-2xl font-bold">
            BWP {maintenances.reduce((sum, m) => sum + (m.cost || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('scheduled')}
          className={`px-4 py-2 rounded-lg ${filter === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Scheduled
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg ${filter === 'completed' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Completed
        </button>
      </div>

      {/* Maintenance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaintenances.map((maintenance) => (
          <div key={maintenance.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getMaintenanceIcon(maintenance.maintenanceType)}</span>
                <div>
                  <h3 className="font-bold">{maintenance.busNumber}</h3>
                  <p className="text-sm text-gray-600">{maintenance.maintenanceType.replace('_', ' ')}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(maintenance.status)}`}>
                {maintenance.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="text-sm">
                  Scheduled: {new Date(maintenance.scheduledDate).toLocaleDateString()}
                </p>
              </div>

              {maintenance.completedDate && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <p className="text-sm">
                    Completed: {new Date(maintenance.completedDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {maintenance.nextDueDate && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <p className="text-sm">
                    Next Due: {new Date(maintenance.nextDueDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {maintenance.cost && (
                <p className="text-sm font-medium text-gray-900">
                  Cost: BWP {maintenance.cost.toLocaleString()}
                </p>
              )}
            </div>

            {maintenance.status === 'SCHEDULED' && (
              <button
                onClick={() => completeMaintenance(maintenance.id)}
                className="w-full px-3 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
              >
                Mark Complete
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Schedule Maintenance</h2>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Type</label>
                <select
                  {...register('maintenanceType')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="OIL_CHANGE">Oil Change</option>
                  <option value="TIRE_ROTATION">Tire Rotation</option>
                  <option value="BRAKE_INSPECTION">Brake Inspection</option>
                  <option value="ENGINE_SERVICE">Engine Service</option>
                  <option value="ANNUAL_INSPECTION">Annual Inspection</option>
                  <option value="SAFETY_CHECK">Safety Check</option>
                </select>
                {errors.maintenanceType && <p className="text-red-500 text-sm mt-1">{errors.maintenanceType.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                <input
                  type="date"
                  {...register('scheduledDate')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.scheduledDate && <p className="text-red-500 text-sm mt-1">{errors.scheduledDate.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (hours)</label>
                <input
                  type="number"
                  {...register('estimatedDuration', { valueAsNumber: true })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2"
                />
                {errors.estimatedDuration && <p className="text-red-500 text-sm mt-1">{errors.estimatedDuration.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes..."
                />
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Preventive;
