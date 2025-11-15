import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Users, UserPlus, Shield, Key, Activity, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users-management'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles(role)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch roles
  const { data: roles } = useQuery({
    queryKey: ['user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*');
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const totalUsers = users?.length || 0;
  const adminUsers = users?.filter((u: any) => u.user_roles?.role === 'admin').length || 0;
  const activeUsers = users?.filter((u: any) => !u.is_suspended).length || 0;

  const filteredUsers = users?.filter((u: any) =>
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-blue-500';
      case 'staff': return 'bg-green-500';
      case 'driver': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User & Role Management</h1>
            <p className="text-muted-foreground">Manage system users, roles, and permissions</p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalUsers}</p>
              <p className="text-xs text-muted-foreground">{activeUsers} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Administrators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">{adminUsers}</p>
              <p className="text-xs text-muted-foreground">Full access</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Key className="h-4 w-4" />
                Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{roles?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Defined roles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{activeUsers}</p>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers?.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.full_name || 'N/A'}</p>
                              <p className="text-xs text-muted-foreground">ID: {user.id.slice(0, 8)}</p>
                            </div>
                          </TableCell>
                          <TableCell>{user.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.user_roles?.role || 'user')}>
                              {user.user_roles?.role || 'user'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.created_at ? format(new Date(user.created_at), 'MMM dd, yyyy') : 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge className={user.is_suspended ? 'bg-red-500' : 'bg-green-500'}>
                              {user.is_suspended ? 'Suspended' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm">Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Roles & Permissions</CardTitle>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Role
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Admin Role */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Shield className="h-4 w-4 text-red-500" />
                          Administrator
                        </h3>
                        <p className="text-sm text-muted-foreground">Full system access</p>
                      </div>
                      <Badge className="bg-red-500">{adminUsers} users</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">✓ Manage all modules</p>
                      <p className="text-muted-foreground">✓ User management</p>
                      <p className="text-muted-foreground">✓ System settings</p>
                      <p className="text-muted-foreground">✓ Financial reports</p>
                    </div>
                  </div>

                  {/* Manager Role */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          Manager
                        </h3>
                        <p className="text-sm text-muted-foreground">Department management</p>
                      </div>
                      <Badge className="bg-blue-500">
                        {users?.filter((u: any) => u.user_roles?.role === 'manager').length || 0} users
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">✓ View all data</p>
                      <p className="text-muted-foreground">✓ Manage operations</p>
                      <p className="text-muted-foreground">✓ Approve expenses</p>
                      <p className="text-muted-foreground">✗ System settings</p>
                    </div>
                  </div>

                  {/* Staff Role */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-500" />
                          Staff
                        </h3>
                        <p className="text-sm text-muted-foreground">Limited access</p>
                      </div>
                      <Badge className="bg-green-500">
                        {users?.filter((u: any) => u.user_roles?.role === 'staff').length || 0} users
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">✓ View assigned data</p>
                      <p className="text-muted-foreground">✓ Create bookings</p>
                      <p className="text-muted-foreground">✗ Financial reports</p>
                      <p className="text-muted-foreground">✗ User management</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Audit Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-medium text-sm">User Login</p>
                          <p className="text-xs text-muted-foreground">admin@kjkhandala.com</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">IP: 192.168.1.1</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="font-medium text-sm">Role Updated</p>
                          <p className="text-xs text-muted-foreground">User promoted to Manager</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(Date.now() - 3600000), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">By: admin@kjkhandala.com</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="font-medium text-sm">Permission Changed</p>
                          <p className="text-xs text-muted-foreground">Financial access granted</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(Date.now() - 7200000), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">By: admin@kjkhandala.com</p>
                  </div>

                  <div className="text-center py-4">
                    <Button variant="outline" size="sm">Load More</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
