import { useState, useEffect } from 'react';
import { FileText, Upload, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';

interface Document {
  id: string;
  driverName: string;
  documentType: string;
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  fileUrl: string;
}

const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/hr/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getExpiryStatus = (expiryDate: string) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return { color: 'text-red-600', label: 'Expired', icon: AlertTriangle };
    if (days <= 30) return { color: 'text-orange-600', label: `${days} days left`, icon: AlertTriangle };
    return { color: 'text-green-600', label: 'Valid', icon: CheckCircle };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Driver Documents</h1>
          <p className="text-gray-600">Manage driver licenses and certifications</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Upload className="w-5 h-5" />
          Upload Document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total Documents</p>
          <p className="text-2xl font-bold">{documents.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Expiring Soon</p>
          <p className="text-2xl font-bold text-orange-600">
            {documents.filter(d => getDaysUntilExpiry(d.expiryDate) <= 30 && getDaysUntilExpiry(d.expiryDate) > 0).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Expired</p>
          <p className="text-2xl font-bold text-red-600">
            {documents.filter(d => getDaysUntilExpiry(d.expiryDate) < 0).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Verified</p>
          <p className="text-2xl font-bold text-green-600">
            {documents.filter(d => d.status === 'VERIFIED').length}
          </p>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => {
          const expiryStatus = getExpiryStatus(doc.expiryDate);
          const Icon = expiryStatus.icon;
          
          return (
            <div key={doc.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-sm">{doc.documentType}</span>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  doc.status === 'VERIFIED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {doc.status}
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-600">Driver</p>
                  <p className="font-medium">{doc.driverName}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600">Document Number</p>
                  <p className="font-mono text-sm">{doc.documentNumber}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-600">Expires</p>
                    <p className="text-sm">{new Date(doc.expiryDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className={`flex items-center gap-2 ${expiryStatus.color}`}>
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{expiryStatus.label}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50">
                  View
                </button>
                {doc.status !== 'VERIFIED' && (
                  <button className="flex-1 px-3 py-2 text-sm text-white bg-green-600 rounded hover:bg-green-700">
                    Verify
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Documents;
