import { useState, useEffect } from 'react';
import { Calendar, DollarSign, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';

interface ReconciliationData {
  date: string;
  totalRevenue: number;
  totalRefunds: number;
  totalExpenses: number;
  netRevenue: number;
  status: string;
  paymentMethods: {
    method: string;
    amount: number;
    count: number;
  }[];
  reconciledBy?: string;
  reconciledAt?: string;
}

const Reconciliation = () => {
  const [reconciliations, setReconciliations] = useState<ReconciliationData[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentData, setCurrentData] = useState<ReconciliationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReconciliations();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDailyData(selectedDate);
    }
  }, [selectedDate]);

  const fetchReconciliations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/finance/reconciliation', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setReconciliations(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch reconciliations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyData = async (date: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/finance/reconciliation/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch daily data:', error);
    }
  };

  const reconcileDay = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/finance/reconcile/${selectedDate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchReconciliations();
        await fetchDailyData(selectedDate);
        alert('Day reconciled successfully!');
      }
    } catch (error) {
      console.error('Failed to reconcile:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Reconciliation</h1>
          <p className="text-gray-600">Review and reconcile daily finances</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {currentData && currentData.status !== 'RECONCILED' && (
            <button
              onClick={reconcileDay}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <CheckCircle className="w-5 h-5" />
              Reconcile Day
            </button>
          )}
        </div>
      </div>

      {/* Current Day Summary */}
      {currentData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    BWP {currentData.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Refunds</p>
                  <p className="text-2xl font-bold text-red-600">
                    BWP {currentData.totalRefunds.toLocaleString()}
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expenses</p>
                  <p className="text-2xl font-bold text-orange-600">
                    BWP {currentData.totalExpenses.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Net Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">
                    BWP {currentData.netRevenue.toLocaleString()}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white rounded-lg border p-6 mb-6">
            <h3 className="text-lg font-bold mb-4">Payment Methods Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {currentData.paymentMethods.map((method) => (
                <div key={method.method} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">{method.method}</p>
                  <p className="text-xl font-bold">BWP {method.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{method.count} transactions</p>
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          {currentData.status === 'RECONCILED' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Day Reconciled</p>
                  <p className="text-sm text-green-700">
                    Reconciled by {currentData.reconciledBy} on {new Date(currentData.reconciledAt!).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Reconciliation History */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-bold">Reconciliation History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refunds</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {reconciliations.map((rec) => (
                <tr key={rec.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{new Date(rec.date).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-green-600 font-medium">BWP {rec.totalRevenue.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-red-600 font-medium">BWP {rec.totalRefunds.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-orange-600 font-medium">BWP {rec.totalExpenses.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-blue-600 font-bold text-lg">BWP {rec.netRevenue.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      rec.status === 'RECONCILED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rec.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reconciliation;
