import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Receipt, Plus, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const expenseSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  category: z.enum(['FUEL', 'MAINTENANCE', 'SALARIES', 'UTILITIES', 'INSURANCE', 'OTHER']),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  receiptUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional()
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  status: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  receiptUrl?: string;
}

const Expenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'FUEL'
    }
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('expenses')
        .insert([{
          ...data,
          submitted_by_id: user.id,
          status: 'PENDING',
          date: new Date().toISOString().split('T')[0]
        }]);

      if (error) throw error;
      await fetchExpenses();
      setShowModal(false);
      reset();
    } catch (error) {
      console.error('Failed to submit expense:', error);
    }
  };

  const approveExpense = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('expenses')
        .update({ 
          status: 'APPROVED',
          approved_by_id: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      await fetchExpenses();
    } catch (error) {
      console.error('Failed to approve expense:', error);
    }
  };

  const rejectExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ 
          status: 'REJECTED',
          notes: 'Not approved'
        })
        .eq('id', id);

      if (error) throw error;
      await fetchExpenses();
    } catch (error) {
      console.error('Failed to reject expense:', error);
    }
  };

  const filteredExpenses = expenses.filter(e => {
    if (filter === 'all') return true;
    if (filter === 'pending') return e.status === 'PENDING';
    if (filter === 'approved') return e.status === 'APPROVED';
    if (filter === 'rejected') return e.status === 'REJECTED';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FUEL': return '⛽';
      case 'MAINTENANCE': return '🔧';
      case 'SALARIES': return '💰';
      case 'UTILITIES': return '💡';
      case 'INSURANCE': return '🛡️';
      default: return '📄';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedExpenses = expenses.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'PENDING').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">Submit and manage expense claims</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Submit Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Expenses</p>
          <p className="text-2xl font-bold">BWP {totalExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-2xl font-bold text-green-600">BWP {approvedExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">BWP {pendingExpenses.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Count</p>
          <p className="text-2xl font-bold">{expenses.length}</p>
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
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Pending
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg ${filter === 'approved' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Approved
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg ${filter === 'rejected' ? 'bg-blue-600 text-white' : 'bg-white border'}`}
        >
          Rejected
        </button>
      </div>

      {/* Expenses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExpenses.map((expense) => (
          <div key={expense.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCategoryIcon(expense.category)}</span>
                <div>
                  <h3 className="font-bold">{expense.category}</h3>
                  <p className="text-sm text-gray-600">{expense.submittedByName}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expense.status)}`}>
                {expense.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount</span>
                <span className="text-lg font-bold">BWP {expense.amount.toLocaleString()}</span>
              </div>

              <p className="text-sm text-gray-600 line-clamp-2">{expense.description}</p>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {new Date(expense.submittedAt).toLocaleDateString()}
              </div>

              {expense.receiptUrl && (
                <a
                  href={expense.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                >
                  <Receipt className="w-4 h-4" />
                  View Receipt
                </a>
              )}
            </div>

            {expense.status === 'PENDING' && (
              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => approveExpense(expense.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => rejectExpense(expense.id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-white bg-red-600 rounded hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Submit Expense</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (BWP)</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    {...register('category')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FUEL">Fuel</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="SALARIES">Salaries</option>
                    <option value="UTILITIES">Utilities</option>
                    <option value="INSURANCE">Insurance</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the expense..."
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt URL (Optional)</label>
                <input
                  {...register('receiptUrl')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
                {errors.receiptUrl && <p className="text-red-500 text-sm mt-1">{errors.receiptUrl.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  {...register('notes')}
                  rows={2}
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
                  Submit Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
