import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Plus, X, AlertTriangle, TrendingDown, ShoppingCart } from 'lucide-react';

const partSchema = z.object({
  partNumber: z.string().min(1, 'Part number is required'),
  partName: z.string().min(1, 'Part name is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().min(0, 'Quantity must be 0 or more'),
  unitPrice: z.number().min(0, 'Price must be 0 or more'),
  supplier: z.string().optional(),
  minStockLevel: z.number().min(1, 'Minimum stock level is required')
});

type PartFormData = z.infer<typeof partSchema>;

interface Part {
  id: string;
  partNumber: string;
  partName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  supplier?: string;
  minStockLevel: number;
  status: string;
}

const Parts = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUseModal, setShowUseModal] = useState(false);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [useQuantity, setUseQuantity] = useState(1);
  const [usedFor, setUsedFor] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<PartFormData>({
    resolver: zodResolver(partSchema)
  });

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/maintenance/parts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setParts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PartFormData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/maintenance/parts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        await fetchParts();
        setShowModal(false);
        reset();
      }
    } catch (error) {
      console.error('Failed to add part:', error);
    }
  };

  const usePart = async () => {
    if (!selectedPart || !usedFor) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/maintenance/parts/${selectedPart.id}/use`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: useQuantity,
          usedFor
        })
      });

      if (response.ok) {
        await fetchParts();
        setShowUseModal(false);
        setSelectedPart(null);
        setUseQuantity(1);
        setUsedFor('');
      }
    } catch (error) {
      console.error('Failed to use part:', error);
    }
  };

  const reorderPart = async (partId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/maintenance/parts/${partId}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: 10 })
      });

      if (response.ok) {
        alert('Reorder request submitted');
      }
    } catch (error) {
      console.error('Failed to reorder part:', error);
    }
  };

  const getStockStatus = (part: Part) => {
    if (part.quantity === 0) return { color: 'bg-red-100 text-red-800', label: 'Out of Stock', icon: AlertTriangle };
    if (part.quantity <= part.minStockLevel) return { color: 'bg-orange-100 text-orange-800', label: 'Low Stock', icon: TrendingDown };
    return { color: 'bg-green-100 text-green-800', label: 'In Stock', icon: Package };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const totalValue = parts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const lowStock = parts.filter(p => p.quantity <= p.minStockLevel && p.quantity > 0).length;
  const outOfStock = parts.filter(p => p.quantity === 0).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parts Inventory</h1>
          <p className="text-gray-600">Manage spare parts and stock levels</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Part
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Parts</p>
          <p className="text-2xl font-bold">{parts.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Low Stock</p>
          <p className="text-2xl font-bold text-orange-600">{lowStock}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Value</p>
          <p className="text-2xl font-bold">BWP {totalValue.toLocaleString()}</p>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {parts.map((part) => {
                const status = getStockStatus(part);
                const StatusIcon = status.icon;

                return (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{part.partName}</div>
                        <div className="text-sm text-gray-500">{part.partNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">{part.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">{part.quantity}</div>
                        <div className="text-xs text-gray-500">Min: {part.minStockLevel}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">BWP {part.unitPrice.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium">BWP {(part.quantity * part.unitPrice).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedPart(part);
                            setShowUseModal(true);
                          }}
                          disabled={part.quantity === 0}
                          className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                        >
                          Use
                        </button>
                        {part.quantity <= part.minStockLevel && (
                          <button
                            onClick={() => reorderPart(part.id)}
                            className="text-sm text-green-600 hover:text-green-700"
                          >
                            Reorder
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Part Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Add New Part</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                  <input
                    {...register('partNumber')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., BRK-001"
                  />
                  {errors.partNumber && <p className="text-red-500 text-sm mt-1">{errors.partNumber.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                  <input
                    {...register('partName')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Brake Pads"
                  />
                  {errors.partName && <p className="text-red-500 text-sm mt-1">{errors.partName.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    {...register('category')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Brakes"
                  />
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    {...register('supplier')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    {...register('quantity', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (BWP)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('unitPrice', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.unitPrice && <p className="text-red-500 text-sm mt-1">{errors.unitPrice.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
                  <input
                    type="number"
                    {...register('minStockLevel', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  {errors.minStockLevel && <p className="text-red-500 text-sm mt-1">{errors.minStockLevel.message}</p>}
                </div>
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
                  Add Part
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Use Part Modal */}
      {showUseModal && selectedPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Use Part</h2>
              <button onClick={() => setShowUseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Part</p>
                <p className="font-medium">{selectedPart.partName}</p>
                <p className="text-sm text-gray-500">Available: {selectedPart.quantity}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Use</label>
                <input
                  type="number"
                  min="1"
                  max={selectedPart.quantity}
                  value={useQuantity}
                  onChange={(e) => setUseQuantity(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Used For</label>
                <input
                  type="text"
                  value={usedFor}
                  onChange={(e) => setUsedFor(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Bus ABC-123 brake repair"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowUseModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={usePart}
                  disabled={!usedFor || useQuantity < 1}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Use Part
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parts;
