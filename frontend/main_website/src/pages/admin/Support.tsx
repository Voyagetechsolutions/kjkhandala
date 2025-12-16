import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Headphones, MessageSquare, Phone, Mail, Calendar, Clock, User, 
  CheckCircle, XCircle, AlertCircle, Reply, Eye, Filter, Search,
  Send, Archive, Trash2, ExternalLink, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ContactQuery {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'archived';
  created_at: string;
  updated_at: string;
  response?: string;
  assigned_to?: string;
  priority: 'low' | 'medium' | 'high';
  type: 'contact' | 'charter';
}

interface CharterQuery extends ContactQuery {
  organization?: string;
  charter_type?: string;
  passengers?: string;
  date?: string;
  destination?: string;
}

export default function Support() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<ContactQuery | CharterQuery | null>(null);
  const [responseText, setResponseText] = useState('');
  const [newStatus, setNewStatus] = useState<'pending' | 'in_progress' | 'resolved' | 'archived'>('pending');
  const queryClient = useQueryClient();

  // Fetch all queries (contact + charter)
  const { data: queriesData, isLoading, error } = useQuery({
    queryKey: ['admin-support-queries'],
    queryFn: async () => {
      // Fetch contact queries
      const { data: contactData, error: contactError } = await supabase
        .from('contact_queries')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch charter queries
      const { data: charterData, error: charterError } = await supabase
        .from('charter_queries')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactError) throw contactError;
      if (charterError) throw charterError;

      // Combine and format data
      const combinedQueries = [
        ...(contactData || []).map(q => ({ ...q, type: 'contact' as const })),
        ...(charterData || []).map(q => ({ ...q, type: 'charter' as const }))
      ];

      return { queries: combinedQueries };
    },
  });

  // Update query status and response
  const updateQueryMutation = useMutation({
    mutationFn: async ({ id, type, updates }: { id: string; type: 'contact' | 'charter'; updates: any }) => {
      const table = type === 'contact' ? 'contact_queries' : 'charter_queries';
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Query updated successfully');
      setResponseDialogOpen(false);
      setSelectedQuery(null);
      setResponseText('');
      queryClient.invalidateQueries({ queryKey: ['admin-support-queries'] });
    },
    onError: (error) => {
      toast.error('Failed to update query: ' + error.message);
    },
  });

  // Send email response (mock implementation)
  const sendEmailMutation = useMutation({
    mutationFn: async ({ email, subject, message }: { email: string; subject: string; message: string }) => {
      // This would integrate with your email service
      console.log('Sending email to:', email, 'Subject:', subject, 'Message:', message);
      // Mock email sending
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Response email sent successfully');
    },
    onError: (error) => {
      toast.error('Failed to send email: ' + error.message);
    },
  });

  const handleResponse = (query: ContactQuery | CharterQuery) => {
    setSelectedQuery(query);
    setResponseText(query.response || '');
    setNewStatus(query.status);
    setResponseDialogOpen(true);
  };

  const submitResponse = () => {
    if (!selectedQuery) return;

    const updates = {
      response: responseText,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    updateQueryMutation.mutate({
      id: selectedQuery.id,
      type: selectedQuery.type,
      updates,
    });

    // Send email if response is provided
    if (responseText) {
      sendEmailMutation.mutate({
        email: selectedQuery.email,
        subject: `Response to your ${selectedQuery.type === 'charter' ? 'charter' : 'contact'} inquiry`,
        message: responseText,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; icon: React.ReactNode }> = {
      pending: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      in_progress: { variant: 'default', icon: <AlertCircle className="h-3 w-3" /> },
      resolved: { variant: 'outline', icon: <CheckCircle className="h-3 w-3" /> },
      archived: { variant: 'destructive', icon: <Archive className="h-3 w-3" /> },
    };
    
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        {config.icon}
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
    };
    
    return (
      <Badge variant={variants[priority] as any}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const filteredQueries = queriesData?.queries?.filter(query => {
    const matchesSearch = !searchQuery || 
      query.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      query.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      query.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || query.status === selectedStatus;
    const matchesType = selectedType === 'all' || query.type === selectedType;
    const matchesPriority = selectedPriority === 'all' || query.priority === selectedPriority;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  }) || [];

  const stats = {
    total: queriesData?.queries?.length || 0,
    pending: queriesData?.queries?.filter(q => q.status === 'pending').length || 0,
    inProgress: queriesData?.queries?.filter(q => q.status === 'in_progress').length || 0,
    resolved: queriesData?.queries?.filter(q => q.status === 'resolved').length || 0,
    contact: queriesData?.queries?.filter(q => q.type === 'contact').length || 0,
    charter: queriesData?.queries?.filter(q => q.type === 'charter').length || 0,
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-medium">Error loading support queries</h3>
            <p className="text-red-600 text-sm mt-1">{error.message}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Headphones className="h-6 w-6" />
              Customer Support
            </h1>
            <p className="text-muted-foreground">Manage customer inquiries and charter requests</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Queries</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">Resolved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.contact}</div>
              <p className="text-xs text-muted-foreground">Contact</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-indigo-600">{stats.charter}</div>
              <p className="text-xs text-muted-foreground">Charters</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search queries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                  <SelectItem value="charter">Charter</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Queries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Queries</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading queries...</div>
            ) : filteredQueries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No queries found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQueries.map((query) => (
                    <TableRow key={query.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{query.name}</div>
                          <div className="text-sm text-muted-foreground">{query.email}</div>
                          <div className="text-sm text-muted-foreground">{query.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={query.type === 'charter' ? 'default' : 'secondary'}>
                          {query.type === 'charter' ? 'Charter' : 'Contact'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getPriorityBadge(query.priority)}</TableCell>
                      <TableCell>{getStatusBadge(query.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(query.created_at), 'MMM dd, yyyy')}
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(query.created_at), 'HH:mm')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResponse(query)}
                          >
                            <Reply className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedQuery(query);
                              // View details logic here
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Response Dialog */}
        <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Respond to Query</DialogTitle>
              <DialogDescription>
                {selectedQuery && (
                  <span>
                    Response for {selectedQuery.name} ({selectedQuery.email})
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {selectedQuery && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Original Query:</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedQuery.message}</p>
                  {selectedQuery.type === 'charter' && (
                    <div className="mt-2 space-y-1">
                      {selectedQuery.organization && (
                        <p className="text-sm"><strong>Organization:</strong> {selectedQuery.organization}</p>
                      )}
                      {selectedQuery.charter_type && (
                        <p className="text-sm"><strong>Charter Type:</strong> {selectedQuery.charter_type}</p>
                      )}
                      {selectedQuery.passengers && (
                        <p className="text-sm"><strong>Passengers:</strong> {selectedQuery.passengers}</p>
                      )}
                      {selectedQuery.date && (
                        <p className="text-sm"><strong>Date:</strong> {selectedQuery.date}</p>
                      )}
                      {selectedQuery.destination && (
                        <p className="text-sm"><strong>Destination:</strong> {selectedQuery.destination}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Update Status</Label>
                  <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="response">Response</Label>
                  <Textarea
                    id="response"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Type your response here..."
                    rows={6}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={submitResponse}
                    disabled={updateQueryMutation.isPending || sendEmailMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {updateQueryMutation.isPending || sendEmailMutation.isPending ? 'Sending...' : 'Send Response'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
