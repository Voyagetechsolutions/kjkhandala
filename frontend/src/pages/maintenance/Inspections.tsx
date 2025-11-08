import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import MaintenanceLayout from '@/components/maintenance/MaintenanceLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, ClipboardCheck, Camera, FileText, CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Inspections() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    busId: '',
    date: new Date().toISOString().split('T')[0],
    inspectorId: '',
    status: 'PASSED',
    checklist: {},
    issues: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  const { data: inspections = [] } = useQuery({
    queryKey: ['inspections'],
    queryFn: async () => {
      const response = await api.get('/maintenance/inspections');
      return Array.isArray(response.data) ? response.data : (response.data?.inspections || []);
    },
  });

  const { data: buses = [] } = useQuery({
    queryKey: ['buses'],
    queryFn: async () => {
      const response = await api.get('/buses');
      return Array.isArray(response.data) ? response.data : (response.data?.buses || []);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/maintenance/inspections', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspections'] });
      toast.success('Inspection recorded successfully');
      setShowCreateDialog(false);
      setFormData({
        busId: '',
        date: new Date().toISOString().split('T')[0],
        inspectorId: '',
        status: 'PASSED',
        checklist: {},
        issues: '',
        notes: '',
      });
    },
    onError: () => {
      toast.error('Failed to record inspection');
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const todayInspections = inspections.filter((i: any) => i.date?.startsWith(today));
  
  const summary = {
    todayInspections: todayInspections.length,
    passed: todayInspections.filter((i: any) => i.status === 'PASSED').length,
    failed: todayInspections.filter((i: any) => i.status === 'FAILED').length,
    issuesFound: todayInspections.filter((i: any) => i.issues).length,
  };

  const handleCreateInspection = () => {
    createMutation.mutate(formData);
  };

  return (
    <MaintenanceLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Vehicle Inspections</h1>
            <p className="text-muted-foreground">Track vehicle inspections and safety checks</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Inspection
          </Button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Inspections</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.todayInspections}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{summary.issuesFound}</div>
            </CardContent>
          </Card>
        </div>

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
                  <TableHead>Inspection Type</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Photos</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No inspections found
                    </TableCell>
                  </TableRow>
                ) : (
                  inspections.map((inspection: any) => {
                    const bus = buses.find((b: any) => b.id === inspection.busId);
                    const photos = inspection.photos ? (Array.isArray(inspection.photos) ? inspection.photos.length : 0) : 0;
                    
                    return (
                      <TableRow key={inspection.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{bus?.registrationNumber || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{bus?.model || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell>Safety Inspection</TableCell>
                        <TableCell>{inspection.inspectorId || 'N/A'}</TableCell>
                        <TableCell>
                          <div>
                            <div>{new Date(inspection.date).toLocaleDateString()}</div>
                            <div className="text-sm text-muted-foreground">{new Date(inspection.date).toLocaleTimeString()}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={inspection.status === 'PASSED' ? 'bg-green-500' : inspection.status === 'FAILED' ? 'bg-red-500' : 'bg-yellow-500'}>
                            {inspection.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={inspection.issues ? 'text-red-600 font-medium' : ''}>
                            {inspection.issues ? 'Yes' : 'No'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Camera className="h-4 w-4" />
                            <span>{photos}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{inspection.notes || 'N/A'}</TableCell>
                        <TableCell>
                          <Button size="sm">View</Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

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
                  value={formData.busId}
                  onChange={(e) => setFormData({...formData, busId: e.target.value})}
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
                <Label>Inspector ID</Label>
                <Input 
                  placeholder="Enter inspector ID" 
                  value={formData.inspectorId}
                  onChange={(e) => setFormData({...formData, inspectorId: e.target.value})}
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <Label>Result</Label>
                <select 
                  className="w-full p-2 border rounded"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, issues: e.target.value})}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Input 
                  placeholder="Additional notes" 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
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
    </MaintenanceLayout>
  );
}
