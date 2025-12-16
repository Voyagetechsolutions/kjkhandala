import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Plus, ClipboardCheck, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Inspections() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : MaintenanceLayout;

  const today = new Date().toISOString().split('T')[0];

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    bus_id: '',
    inspection_date: today,
    inspector_id: '',
    status: 'PASSED',
    issues: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  // -------------------------
  // FETCH INSPECTIONS
  // -------------------------
  const { data: inspections = [], refetch: refetchInspections } = useQuery({
    queryKey: ['inspections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inspections')
        .select('*')
        .order('inspection_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // FETCH BUSES
  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('buses').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // FETCH INSPECTORS
  const { data: inspectors = [] } = useQuery({
    queryKey: ['inspectors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // -------------------------
  // CREATE INSPECTION MUTATION
  // -------------------------
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from('inspections').insert([{
        bus_id: payload.bus_id,
        inspection_date: payload.inspection_date,
        inspector_id: payload.inspector_id,
        status: payload.status,
        issues: payload.issues || null,
        notes: payload.notes || null,
      }]);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success('Inspection recorded successfully');
      setShowCreateDialog(false);
      setFormData({
        bus_id: '',
        inspection_date: today,
        inspector_id: '',
        status: 'PASSED',
        issues: '',
        notes: '',
      });
      // REFRESH INSPECTIONS AFTER SAVE
      await refetchInspections();
    },
    onError: (err: any) => {
      console.error('Supabase insert error:', err);
      toast.error('Failed to record inspection. Check console for details.');
    },
  });

  const todayInspections = inspections.filter((i: any) => {
    const date = new Date(i.inspection_date).toISOString().split('T')[0];
    return date === today;
  });

  const summary = {
    todayInspections: todayInspections.length,
    passed: todayInspections.filter((i: any) => i.status === 'PASSED').length,
    failed: todayInspections.filter((i: any) => i.status === 'FAILED').length,
    issuesFound: todayInspections.filter((i: any) => i.issues).length,
  };

  const handleCreateInspection = () => {
    if (!formData.bus_id || !formData.inspector_id) {
      toast.error('Bus and Inspector are required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Vehicle Inspections</h1>
            <p className="text-muted-foreground">Track vehicle inspections and safety checks</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Inspection
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex justify-between items-center pb-2">
              <CardTitle className="text-sm font-medium">Today's Inspections</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.todayInspections}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between items-center pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between items-center pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between items-center pb-2">
              <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.issuesFound}</div>
            </CardContent>
          </Card>
        </div>

        {/* Inspection Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inspection Records</CardTitle>
            <CardDescription>All vehicle inspection records</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No inspections found
                    </TableCell>
                  </TableRow>
                ) : (
                  inspections.map((inspection: any) => {
                    const bus = buses.find((b: any) => b.id === inspection.bus_id);
                    const inspector = inspectors.find((p: any) => p.id === inspection.inspector_id);
                    return (
                      <TableRow key={inspection.id}>
                        <TableCell>
                          <div className="font-medium">{bus?.registrationNumber || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{bus?.model || ''}</div>
                        </TableCell>
                        <TableCell>{inspector?.full_name || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(inspection.inspection_date).toLocaleDateString()} {' '}
                          <span className="text-sm text-muted-foreground">{new Date(inspection.inspection_date).toLocaleTimeString()}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={inspection.status === 'PASSED' ? 'bg-green-500' : inspection.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'}>
                            {inspection.status}
                          </Badge>
                        </TableCell>
                        <TableCell className={inspection.issues ? 'text-red-600 font-medium' : ''}>
                          {inspection.issues ? 'Yes' : 'No'}
                        </TableCell>
                        <TableCell>{inspection.notes || 'N/A'}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create Inspection Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>New Inspection</DialogTitle>
              <DialogDescription>Record a vehicle inspection</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Bus</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.bus_id}
                  onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
                >
                  <option value="">Select bus</option>
                  {buses.map((bus: any) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.registrationNumber} ({bus.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Inspector</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.inspector_id}
                  onChange={(e) => setFormData({ ...formData, inspector_id: e.target.value })}
                >
                  <option value="">Select inspector</option>
                  {inspectors.map((inspector: any) => (
                    <option key={inspector.id} value={inspector.id}>
                      {inspector.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.inspection_date}
                  onChange={(e) => setFormData({ ...formData, inspection_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Result</Label>
                <select
                  className="w-full p-2 border rounded"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="PASSED">Pass</option>
                  <option value="FAILED">Fail</option>
                  <option value="NEEDS_ATTENTION">Needs Attention</option>
                </select>
              </div>

              <div>
                <Label>Issues Found</Label>
                <Input
                  placeholder="Describe any issues found"
                  value={formData.issues}
                  onChange={(e) => setFormData({ ...formData, issues: e.target.value })}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Input
                  placeholder="Additional notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateInspection} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saving...' : 'Save Inspection'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
