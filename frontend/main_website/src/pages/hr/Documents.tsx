import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import HRLayout from '@/components/hr/HRLayout';
import { FileText, Upload, CheckCircle, AlertTriangle, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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

export default function Documents() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : HRLayout;
  const queryClient = useQueryClient();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    driverId: '',
    documentType: '',
    documentNumber: '',
    issueDate: '',
    expiryDate: '',
    file: null as File | null
  });

  // Fetch drivers
  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, license_number')
        .eq('status', 'ACTIVE')
        .order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_documents')
        .select('*, drivers(*)')
        .order('expiry_date');

      if (error) throw error;
      setDocuments(data || []);
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
    <Layout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Documents</h1>
            <p className="text-gray-600">Manage driver licenses and certifications</p>
          </div>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="w-5 h-5 mr-2" />
            Upload Document
          </Button>
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

        {/* Upload Document Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload driver license or certification document
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Driver</Label>
                <Select value={formData.driverId} onValueChange={(value) => setFormData({...formData, driverId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No active drivers found</div>
                    ) : (
                      drivers.map((driver: any) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.full_name} ({driver.license_number})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Document Type</Label>
                <Select value={formData.documentType} onValueChange={(value) => setFormData({...formData, documentType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                    <SelectItem value="PDP">Professional Driving Permit (PDP)</SelectItem>
                    <SelectItem value="PASSPORT">Passport</SelectItem>
                    <SelectItem value="ID_CARD">ID Card</SelectItem>
                    <SelectItem value="MEDICAL_CERTIFICATE">Medical Certificate</SelectItem>
                    <SelectItem value="POLICE_CLEARANCE">Police Clearance</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Document Number</Label>
                <Input 
                  value={formData.documentNumber} 
                  onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
                  placeholder="e.g., DL123456"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Issue Date</Label>
                  <Input 
                    type="date" 
                    value={formData.issueDate} 
                    onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Input 
                    type="date" 
                    value={formData.expiryDate} 
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label>Upload File</Label>
                <Input 
                  type="file" 
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFormData({...formData, file: e.target.files?.[0] || null})}
                />
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, or PNG (Max 5MB)</p>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setShowUploadDialog(false);
                  setFormData({ driverId: '', documentType: '', documentNumber: '', issueDate: '', expiryDate: '', file: null });
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload}
                  disabled={uploading || !formData.driverId || !formData.documentType || !formData.file}
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );

  async function handleUpload() {
    if (!formData.file || !formData.driverId) {
      toast.error('Please fill all required fields');
      return;
    }

    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${formData.driverId}_${formData.documentType}_${Date.now()}.${fileExt}`;
      const filePath = `driver-documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Insert document record
      const { error: insertError } = await supabase
        .from('driver_documents')
        .insert([{
          driver_id: formData.driverId,
          document_type: formData.documentType,
          document_number: formData.documentNumber,
          issue_date: formData.issueDate,
          expiry_date: formData.expiryDate,
          file_url: publicUrl,
          status: 'PENDING',
          uploaded_by: user?.id,
          uploaded_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      toast.success('Document uploaded successfully');
      setShowUploadDialog(false);
      setFormData({ driverId: '', documentType: '', documentNumber: '', issueDate: '', expiryDate: '', file: null });
      fetchDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  }
}
