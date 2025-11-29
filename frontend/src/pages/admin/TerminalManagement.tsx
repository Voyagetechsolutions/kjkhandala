import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Plus, Edit, Trash2, MapPin, Phone, Mail, Users, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Terminal {
  id: string;
  terminal_name: string;
  terminal_code: string;
  location: string;
  city: string;
  capacity: number;
  status: string;
  contact_phone: string;
  contact_email: string;
  operating_hours: string;
  facilities: string[];
  created_at: string;
}

interface Gate {
  id: string;
  terminal_id: string;
  gate_number: string;
  gate_name: string;
  status: string;
  current_trip_id: string | null;
}

export default function TerminalManagement() {
  const queryClient = useQueryClient();
  const [showTerminalDialog, setShowTerminalDialog] = useState(false);
  const [showGateDialog, setShowGateDialog] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState<Terminal | null>(null);
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    terminal_name: '',
    terminal_code: '',
    location: '',
    city: '',
    capacity: 10,
    contact_phone: '',
    contact_email: '',
    operating_hours: '06:00 - 22:00',
    facilities: [] as string[],
  });
  const [gateFormData, setGateFormData] = useState({
    gate_number: '',
    gate_name: '',
  });

  // Fetch terminals
  const { data: terminals = [], isLoading } = useQuery({
    queryKey: ['terminals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('terminals')
        .select('*')
        .order('terminal_name');
      if (error) throw error;
      return data as Terminal[];
    },
  });

  // Fetch gates for selected terminal
  const { data: gates = [] } = useQuery({
    queryKey: ['terminal-gates', selectedTerminalId],
    queryFn: async () => {
      if (!selectedTerminalId) return [];
      const { data, error } = await supabase
        .from('terminal_gates')
        .select('*')
        .eq('terminal_id', selectedTerminalId)
        .order('gate_number');
      if (error) throw error;
      return data as Gate[];
    },
    enabled: !!selectedTerminalId,
  });

  // Fetch ticketing offices
  const { data: offices = [] } = useQuery({
    queryKey: ['ticketing-offices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticketing_offices')
        .select('*, terminals(terminal_name)')
        .order('office_name');
      if (error) throw error;
      return data;
    },
  });

  // Create terminal mutation
  const createTerminal = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result, error } = await supabase
        .from('terminals')
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
      toast.success('Terminal created successfully');
      setShowTerminalDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create terminal');
    },
  });

  // Update terminal mutation
  const updateTerminal = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const { data: result, error } = await supabase
        .from('terminals')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
      toast.success('Terminal updated successfully');
      setShowTerminalDialog(false);
      setEditingTerminal(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update terminal');
    },
  });

  // Delete terminal mutation
  const deleteTerminal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('terminals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
      toast.success('Terminal deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete terminal');
    },
  });

  // Create gate mutation
  const createGate = useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase
        .from('terminal_gates')
        .insert([{ ...data, terminal_id: selectedTerminalId }])
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminal-gates'] });
      toast.success('Gate created successfully');
      setShowGateDialog(false);
      setGateFormData({ gate_number: '', gate_name: '' });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create gate');
    },
  });

  const handleEdit = (terminal: Terminal) => {
    setEditingTerminal(terminal);
    setFormData({
      terminal_name: terminal.terminal_name,
      terminal_code: terminal.terminal_code,
      location: terminal.location,
      city: terminal.city,
      capacity: terminal.capacity,
      contact_phone: terminal.contact_phone,
      contact_email: terminal.contact_email,
      operating_hours: terminal.operating_hours,
      facilities: terminal.facilities || [],
    });
    setShowTerminalDialog(true);
  };

  const handleSubmit = () => {
    if (!formData.terminal_name || !formData.terminal_code || !formData.location) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editingTerminal) {
      updateTerminal.mutate({ id: editingTerminal.id, ...formData });
    } else {
      createTerminal.mutate(formData);
    }
  };

  const handleGateSubmit = () => {
    if (!gateFormData.gate_number || !gateFormData.gate_name) {
      toast.error('Please fill all gate fields');
      return;
    }
    createGate.mutate(gateFormData);
  };

  const resetForm = () => {
    setFormData({
      terminal_name: '',
      terminal_code: '',
      location: '',
      city: '',
      capacity: 10,
      contact_phone: '',
      contact_email: '',
      operating_hours: '06:00 - 22:00',
      facilities: [],
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'maintenance': return 'bg-orange-500';
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-blue-500';
      case 'closed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const stats = {
    totalTerminals: terminals.length,
    activeTerminals: terminals.filter(t => t.status === 'active').length,
    totalGates: gates.length,
    availableGates: gates.filter(g => g.status === 'available').length,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Terminal Management</h1>
          <p className="text-muted-foreground">Manage bus terminals, gates, and ticketing offices</p>
        </div>
        <Button onClick={() => setShowTerminalDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Terminal
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Total Terminals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalTerminals}</p>
            <p className="text-xs text-muted-foreground">{stats.activeTerminals} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Gates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalGates}</p>
            <p className="text-xs text-muted-foreground">{stats.availableGates} available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ticketing Offices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{offices.length}</p>
            <p className="text-xs text-muted-foreground">Across all terminals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Cities Covered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {new Set(terminals.map(t => t.city).filter(Boolean)).size}
            </p>
            <p className="text-xs text-muted-foreground">Unique locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="terminals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="terminals">Terminals</TabsTrigger>
          <TabsTrigger value="gates">Gates</TabsTrigger>
          <TabsTrigger value="offices">Ticketing Offices</TabsTrigger>
        </TabsList>

        {/* Terminals Tab */}
        <TabsContent value="terminals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Terminals</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Terminal Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        Loading terminals...
                      </TableCell>
                    </TableRow>
                  ) : terminals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No terminals found. Click "Add Terminal" to create one.
                      </TableCell>
                    </TableRow>
                  ) : (
                    terminals.map((terminal) => (
                      <TableRow key={terminal.id}>
                        <TableCell className="font-medium">{terminal.terminal_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{terminal.terminal_code}</Badge>
                        </TableCell>
                        <TableCell>{terminal.location}</TableCell>
                        <TableCell>{terminal.city}</TableCell>
                        <TableCell>{terminal.capacity} buses</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {terminal.contact_phone}
                            </div>
                            {terminal.contact_email && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {terminal.contact_email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(terminal.status)} text-white`}>
                            {terminal.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTerminalId(terminal.id);
                              }}
                            >
                              View Gates
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleEdit(terminal)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this terminal?')) {
                                  deleteTerminal.mutate(terminal.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gates Tab */}
        <TabsContent value="gates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Terminal Gates</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedTerminalId
                    ? `Showing gates for ${terminals.find(t => t.id === selectedTerminalId)?.terminal_name}`
                    : 'Select a terminal to view gates'}
                </p>
              </div>
              {selectedTerminalId && (
                <Button onClick={() => setShowGateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gate
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!selectedTerminalId ? (
                <div className="text-center py-12">
                  <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Please select a terminal from the Terminals tab to view its gates
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gate Number</TableHead>
                      <TableHead>Gate Name</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Current Trip</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No gates found. Click "Add Gate" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      gates.map((gate) => (
                        <TableRow key={gate.id}>
                          <TableCell className="font-medium">{gate.gate_number}</TableCell>
                          <TableCell>{gate.gate_name}</TableCell>
                          <TableCell>
                            <Badge className={`${getStatusColor(gate.status)} text-white`}>
                              {gate.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {gate.current_trip_id ? (
                              <span className="text-sm">Trip assigned</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">No trip</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this gate?')) {
                                  supabase
                                    .from('terminal_gates')
                                    .delete()
                                    .eq('id', gate.id)
                                    .then(() => {
                                      queryClient.invalidateQueries({ queryKey: ['terminal-gates'] });
                                      toast.success('Gate deleted');
                                    });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ticketing Offices Tab */}
        <TabsContent value="offices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticketing Offices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Office Name</TableHead>
                    <TableHead>Office Code</TableHead>
                    <TableHead>Terminal</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No ticketing offices found
                      </TableCell>
                    </TableRow>
                  ) : (
                    offices.map((office: any) => (
                      <TableRow key={office.id}>
                        <TableCell className="font-medium">{office.office_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{office.office_code}</Badge>
                        </TableCell>
                        <TableCell>
                          {office.terminals?.terminal_name || 'Not assigned'}
                        </TableCell>
                        <TableCell>{office.location || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {office.contact_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {office.contact_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(office.status)} text-white`}>
                            {office.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Terminal Dialog */}
      <Dialog open={showTerminalDialog} onOpenChange={setShowTerminalDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTerminal ? 'Edit Terminal' : 'Add New Terminal'}</DialogTitle>
            <DialogDescription>
              {editingTerminal ? 'Update terminal information' : 'Create a new bus terminal'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Terminal Name *</Label>
                <Input
                  value={formData.terminal_name}
                  onChange={(e) => setFormData({ ...formData, terminal_name: e.target.value })}
                  placeholder="Main Terminal Gaborone"
                />
              </div>
              <div>
                <Label>Terminal Code *</Label>
                <Input
                  value={formData.terminal_code}
                  onChange={(e) => setFormData({ ...formData, terminal_code: e.target.value })}
                  placeholder="GAB-MAIN"
                />
              </div>
            </div>
            <div>
              <Label>Location *</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Plot 123, Main Mall"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Gaborone"
                />
              </div>
              <div>
                <Label>Capacity (buses)</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Contact Phone</Label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  placeholder="+267 1234567"
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="terminal@example.com"
                />
              </div>
            </div>
            <div>
              <Label>Operating Hours</Label>
              <Input
                value={formData.operating_hours}
                onChange={(e) => setFormData({ ...formData, operating_hours: e.target.value })}
                placeholder="06:00 - 22:00"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTerminalDialog(false);
                  setEditingTerminal(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={createTerminal.isPending || updateTerminal.isPending}>
                {createTerminal.isPending || updateTerminal.isPending
                  ? 'Saving...'
                  : editingTerminal
                  ? 'Update Terminal'
                  : 'Create Terminal'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Gate Dialog */}
      <Dialog open={showGateDialog} onOpenChange={setShowGateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Gate</DialogTitle>
            <DialogDescription>Create a new boarding gate for this terminal</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Gate Number *</Label>
              <Input
                value={gateFormData.gate_number}
                onChange={(e) => setGateFormData({ ...gateFormData, gate_number: e.target.value })}
                placeholder="GATE-1"
              />
            </div>
            <div>
              <Label>Gate Name *</Label>
              <Input
                value={gateFormData.gate_name}
                onChange={(e) => setGateFormData({ ...gateFormData, gate_name: e.target.value })}
                placeholder="Gate 1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGateDialog(false);
                  setGateFormData({ gate_number: '', gate_name: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleGateSubmit} disabled={createGate.isPending}>
                {createGate.isPending ? 'Creating...' : 'Create Gate'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
