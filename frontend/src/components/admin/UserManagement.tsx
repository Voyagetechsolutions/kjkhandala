import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Mail, 
  Phone, 
  Building,
  UserCheck,
  UserX,
  Key,
  Eye,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Crown,
  Settings,
  Bus,
  Wrench,
  CreditCard,
  Ticket,
  SteeringWheel
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/integrations/supabase/client';

interface User {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  role_description: string;
  department: string;
  is_active: boolean;
  role_assigned_at: string;
  employee_id?: string;
  position?: string;
  employment_status?: string;
  hire_date?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [activeTab, setActiveTab] = useState('users');
  
  const supabase = createClient();

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: '',
    department: '',
    position: '',
    salary: '',
    employee_id: '',
    send_welcome_email: true
  });

  // Role definitions with icons and descriptions
  const roles = [
    {
      value: 'super_admin',
      label: 'Company Admin (CEO / General Manager)',
      description: 'Has full oversight of all company operations',
      icon: Crown,
      level: 5,
      color: 'bg-purple-500'
    },
    {
      value: 'admin',
      label: 'System Administrator',
      description: 'Manages system configuration and users',
      icon: Settings,
      level: 4,
      color: 'bg-blue-500'
    },
    {
      value: 'operations_manager',
      label: 'Operations Manager',
      description: 'Handles routes, scheduling, dispatch, and tracking',
      icon: Bus,
      level: 3,
      color: 'bg-green-500'
    },
    {
      value: 'maintenance_manager',
      label: 'Maintenance Manager / Workshop Supervisor',
      description: 'Oversees repairs, inspections, and service scheduling',
      icon: Wrench,
      level: 3,
      color: 'bg-orange-500'
    },
    {
      value: 'hr_manager',
      label: 'HR Manager',
      description: 'Manages staff records, recruitment, and payroll',
      icon: Users,
      level: 3,
      color: 'bg-pink-500'
    },
    {
      value: 'finance_manager',
      label: 'Finance / Accounting Officer',
      description: 'Manages payments, expenses, and financial reports',
      icon: CreditCard,
      level: 3,
      color: 'bg-yellow-500'
    },
    {
      value: 'ticketing_officer',
      label: 'Ticketing / Booking Officer',
      description: 'Handles walk-in and manual bookings at terminal',
      icon: Ticket,
      level: 2,
      color: 'bg-cyan-500'
    },
    {
      value: 'driver',
      label: 'Driver',
      description: 'Sees assigned trips, passengers, and route details',
      icon: SteeringWheel,
      level: 1,
      color: 'bg-gray-500'
    }
  ];

  const departments = [
    'Management',
    'Operations',
    'Maintenance',
    'Human Resources',
    'Finance',
    'Ticketing',
    'Driving'
  ];

  const getRoleIcon = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig ? roleConfig.icon : Users;
  };

  const getRoleColor = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig ? roleConfig.color : 'bg-gray-500';
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_management_view')
        .select('*')
        .order('role_level', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      // Validate required fields
      if (!newUser.email || !newUser.password || !newUser.full_name || !newUser.role) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Create user using the procedure
      const { error } = await supabase.rpc('create_user_with_role', {
        p_email: newUser.email,
        p_password: newUser.password,
        p_full_name: newUser.full_name,
        p_phone: newUser.phone || null,
        p_role: newUser.role,
        p_department: newUser.department || null,
        p_position: newUser.position || null,
        p_salary: newUser.salary ? parseFloat(newUser.salary) : null,
        p_employee_id: newUser.employee_id || null
      });

      if (error) throw error;

      toast.success(`User ${newUser.full_name} created successfully`);
      setIsCreateUserOpen(false);
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        role: '',
        department: '',
        position: '',
        salary: '',
        employee_id: '',
        send_welcome_email: true
      });
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user: ' + error.message);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.rpc('update_user_role', {
        p_user_id: userId,
        p_new_role: newRole
      });

      if (error) throw error;
      
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Failed to deactivate user');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.role_description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Create and manage system users and their roles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Users
          </Button>
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new user to the system with appropriate role and permissions</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="john.smith@kjkhandala.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Temporary Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="Enter temporary password"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder="+267 1234567"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          <div className="flex items-center gap-2">
                            <role.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{role.label}</div>
                              <div className="text-xs text-gray-500">{role.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Select value={newUser.department} onValueChange={(value) => setNewUser({ ...newUser, department: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="employee_id">Employee ID</Label>
                  <Input
                    id="employee_id"
                    value={newUser.employee_id}
                    onChange={(e) => setNewUser({ ...newUser, employee_id: e.target.value })}
                    placeholder="EMP001"
                  />
                </div>
                <div>
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={newUser.position}
                    onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                    placeholder="Senior Driver"
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Salary (BWP)</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={newUser.salary}
                    onChange={(e) => setNewUser({ ...newUser, salary: e.target.value })}
                    placeholder="12000"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send_welcome_email"
                    checked={newUser.send_welcome_email}
                    onCheckedChange={(checked) => setNewUser({ ...newUser, send_welcome_email: checked as boolean })}
                  />
                  <Label htmlFor="send_welcome_email">Send welcome email</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateUser}>
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>Manage system users and their access levels</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading users...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => {
                      const RoleIcon = getRoleIcon(user.role);
                      return (
                        <TableRow key={user.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium">{user.full_name}</p>
                                <p className="text-sm text-gray-500">{user.email}</p>
                                {user.employee_id && (
                                  <p className="text-xs text-gray-400">ID: {user.employee_id}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-gray-500" />
                                  {user.phone}
                                </div>
                              )}
                              {user.position && (
                                <p className="text-gray-500">{user.position}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getRoleColor(user.role)}`} />
                              <div>
                                <div className="flex items-center gap-1">
                                  <RoleIcon className="h-4 w-4 text-gray-500" />
                                  <span className="font-medium">{user.role_description}</span>
                                </div>
                                <p className="text-xs text-gray-500">Level {roles.find(r => r.value === user.role)?.level}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3 text-gray-500" />
                              {user.department || 'Not assigned'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? (
                                <div className="flex items-center gap-1">
                                  <UserCheck className="h-3 w-3" />
                                  Active
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <UserX className="h-3 w-3" />
                                  Inactive
                                </div>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleDeactivateUser(user.user_id)}
                                disabled={!user.is_active}
                              >
                                <UserX className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles & Permissions Tab */}
        <TabsContent value="roles">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roles.map((role) => {
              const RoleIcon = role.icon;
              const usersInRole = users.filter(u => u.role === role.value);
              
              return (
                <Card key={role.value}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`w-8 h-8 ${role.color} rounded-lg flex items-center justify-center`}>
                        <RoleIcon className="h-4 w-4 text-white" />
                      </div>
                      {role.label}
                    </CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Access Level</span>
                        <Badge variant="outline">Level {role.level}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Active Users</span>
                        <span className="text-sm">{usersInRole.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Status</span>
                        <Badge variant={usersInRole.length > 0 ? 'default' : 'secondary'}>
                          {usersInRole.length > 0 ? 'Active' : 'No Users'}
                        </Badge>
                      </div>
                      {usersInRole.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium mb-2">Users in this role:</p>
                          <div className="space-y-1">
                            {usersInRole.slice(0, 3).map((user) => (
                              <div key={user.user_id} className="text-xs text-gray-600">
                                • {user.full_name}
                              </div>
                            ))}
                            {usersInRole.length > 3 && (
                              <div className="text-xs text-gray-500">
                                ... and {usersInRole.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Log</CardTitle>
              <CardDescription>Track all user management actions and changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Activity Tracking</h3>
                <p className="text-gray-500 mb-4">Monitor user creation, role changes, and access modifications</p>
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Full Audit Log
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManagement;
