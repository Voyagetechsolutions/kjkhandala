import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle2,
  Shield,
  Mail,
  RefreshCw,
  Download,
  UserCheck,
  UserX,
  Building2,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface User {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  company_id: string | null;
  company_name?: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  source: "profiles" | "drivers" | "employees" | "staff" | "passengers" | "saved_passengers";
}

interface UserStats {
  total: number;
  active: number;
  admins: number;
  profiles: number;
  drivers: number;
  employees: number;
  staff: number;
  passengers: number;
  saved_passengers: number;
}

export default function UsersManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const token = localStorage.getItem("platform_admin_token");
    if (!token) {
      navigate("/platform/login");
      return;
    }
    fetchUsers();
  }, [navigate]);

  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    admins: 0,
    profiles: 0,
    drivers: 0,
    employees: 0,
    staff: 0,
    passengers: 0,
    saved_passengers: 0,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch from all user tables in parallel
      const [profilesRes, driversRes, employeesRes, staffRes, passengersRes, savedPassengersRes] = await Promise.all([
        supabase
          .from("profiles")
          .select(`id, email, full_name, phone, avatar_url, is_active, created_at, company_id, companies(name)`)
          .order("created_at", { ascending: false }),
        supabase
          .from("drivers")
          .select(`id, full_name, phone, status, created_at, user_id`)
          .order("created_at", { ascending: false }),
        supabase
          .from("employees")
          .select(`id, full_name, email, phone, position, department, status, created_at, company_id, companies(name)`)
          .order("created_at", { ascending: false }),
        supabase
          .from("staff")
          .select(`id, full_name, email, phone, position, department, status, created_at`)
          .order("created_at", { ascending: false }),
        supabase
          .from("passengers")
          .select(`id, full_name, phone, email, id_number, gender, nationality, created_at`)
          .order("created_at", { ascending: false }),
        supabase
          .from("saved_passengers")
          .select(`id, full_name, phone, email, id_number, relationship, created_at, user_id`)
          .order("created_at", { ascending: false }),
      ]);

      const allUsers: User[] = [];

      // Process profiles
      profilesRes.data?.forEach(user => {
        allUsers.push({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role: "user",
          company_id: user.company_id,
          company_name: (user.companies as any)?.name || null,
          is_active: user.is_active ?? true,
          created_at: user.created_at,
          last_sign_in_at: null,
          source: "profiles",
        });
      });

      // Process drivers
      driversRes.data?.forEach(driver => {
        allUsers.push({
          id: driver.id,
          email: null,
          full_name: driver.full_name,
          phone: driver.phone,
          avatar_url: null,
          role: "driver",
          company_id: null,
          company_name: null,
          is_active: driver.status === "active" || driver.status === "ACTIVE",
          created_at: driver.created_at,
          last_sign_in_at: null,
          source: "drivers",
        });
      });

      // Process employees
      employeesRes.data?.forEach(emp => {
        allUsers.push({
          id: emp.id,
          email: emp.email,
          full_name: emp.full_name,
          phone: emp.phone,
          avatar_url: null,
          role: emp.position || "employee",
          company_id: emp.company_id,
          company_name: (emp.companies as any)?.name || null,
          is_active: emp.status === "ACTIVE" || emp.status === "active",
          created_at: emp.created_at,
          last_sign_in_at: null,
          source: "employees",
        });
      });

      // Process staff
      staffRes.data?.forEach(s => {
        allUsers.push({
          id: s.id,
          email: s.email,
          full_name: s.full_name,
          phone: s.phone,
          avatar_url: null,
          role: s.position || "staff",
          company_id: null,
          company_name: null,
          is_active: s.status === "active",
          created_at: s.created_at,
          last_sign_in_at: null,
          source: "staff",
        });
      });

      // Process passengers
      passengersRes.data?.forEach(p => {
        allUsers.push({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          phone: p.phone,
          avatar_url: null,
          role: "passenger",
          company_id: null,
          company_name: null,
          is_active: true,
          created_at: p.created_at,
          last_sign_in_at: null,
          source: "passengers",
        });
      });

      // Process saved passengers
      savedPassengersRes.data?.forEach(sp => {
        allUsers.push({
          id: sp.id,
          email: sp.email,
          full_name: sp.full_name,
          phone: sp.phone,
          avatar_url: null,
          role: sp.relationship || "saved_passenger",
          company_id: null,
          company_name: null,
          is_active: true,
          created_at: sp.created_at,
          last_sign_in_at: null,
          source: "saved_passengers",
        });
      });

      // Sort by created_at descending
      allUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Calculate stats
      setStats({
        total: allUsers.length,
        active: allUsers.filter(u => u.is_active).length,
        admins: allUsers.filter(u => u.role === "admin" || u.role === "super_admin").length,
        profiles: profilesRes.data?.length || 0,
        drivers: driversRes.data?.length || 0,
        employees: employeesRes.data?.length || 0,
        staff: staffRes.data?.length || 0,
        passengers: passengersRes.data?.length || 0,
        saved_passengers: savedPassengersRes.data?.length || 0,
      });

      setUsers(allUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !user.is_active })
        .eq("id", user.id);

      if (error) throw error;
      toast.success(`User ${user.is_active ? "suspended" : "activated"}`);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSource = roleFilter === "all" || user.source === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active) ||
      (statusFilter === "inactive" && !user.is_active);
    return matchesSearch && matchesSource && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-purple-500">Super Admin</Badge>;
      case "admin":
        return <Badge className="bg-blue-500">Admin</Badge>;
      case "manager":
        return <Badge className="bg-green-500">Manager</Badge>;
      case "driver":
        return <Badge className="bg-orange-500">Driver</Badge>;
      case "employee":
        return <Badge className="bg-purple-400">Employee</Badge>;
      case "staff":
        return <Badge className="bg-pink-500">Staff</Badge>;
      case "user":
        return <Badge variant="secondary">User</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "profiles":
        return <Badge variant="outline" className="text-blue-600 border-blue-300">profiles</Badge>;
      case "drivers":
        return <Badge variant="outline" className="text-orange-600 border-orange-300">drivers</Badge>;
      case "employees":
        return <Badge variant="outline" className="text-purple-600 border-purple-300">employees</Badge>;
      case "staff":
        return <Badge variant="outline" className="text-pink-600 border-pink-300">staff</Badge>;
      case "passengers":
        return <Badge variant="outline" className="text-green-600 border-green-300">passengers</Badge>;
      case "saved_passengers":
        return <Badge variant="outline" className="text-teal-600 border-teal-300">saved_passengers</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
            <p className="text-muted-foreground">
              Manage all users across the platform
            </p>
          </div>
          <Button variant="outline" onClick={fetchUsers}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.admins}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profiles</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.profiles}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drivers</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.drivers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employees</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.employees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Staff</CardTitle>
              <Users className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.staff}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Passengers</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.passengers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saved</CardTitle>
              <Users className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.saved_passengers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="profiles">Profiles</SelectItem>
                  <SelectItem value="drivers">Drivers</SelectItem>
                  <SelectItem value="employees">Employees</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="passengers">Passengers</SelectItem>
                  <SelectItem value="saved_passengers">Saved Passengers</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={`${user.source}-${user.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {user.full_name?.substring(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.full_name || "Unknown"}</p>
                            <p className="text-sm text-muted-foreground">{user.email || "-"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getSourceBadge(user.source)}</TableCell>
                      <TableCell>
                        {user.company_name ? (
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span>{user.company_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.is_active !== false ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Suspended</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="h-4 w-4 mr-2" />
                              Impersonate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => toggleUserStatus(user)}
                              className={user.is_active !== false ? "text-red-600" : "text-green-600"}
                            >
                              {user.is_active !== false ? (
                                <>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend User
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Activate User
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}
