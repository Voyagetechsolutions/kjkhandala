import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Key,
  Ban,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  DollarSign,
  Activity,
  Filter,
  Download,
  RefreshCw,
  Shield,
  Mail,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  SUBSCRIPTION_PACKAGES,
  SubscriptionTier,
  formatPrice,
  getTierBadgeClass,
} from "@/lib/subscription-tiers";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  logo_url: string | null;
  is_active: boolean;
  subscription_tier: SubscriptionTier;
  subscription_status: "active" | "trial" | "expired" | "cancelled";
  subscription_expires_at: string | null;
  created_at: string;
  api_calls_this_month: number;
  api_rate_limit: number;
  user_count?: number;
  booking_count?: number;
  bus_count?: number;
  employee_count?: number;
  terminal_count?: number;
}

export default function TenantManagement() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const [newTenant, setNewTenant] = useState({
    name: "",
    email: "",
    phone: "",
    subscription_tier: "starter",
  });

  useEffect(() => {
    // Check if platform admin is logged in
    const token = localStorage.getItem("platform_admin_token");
    if (!token) {
      navigate("/platform/login");
      return;
    }
    
    // Verify Supabase session exists
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Clear local storage and redirect to login
        localStorage.removeItem("platform_admin_token");
        localStorage.removeItem("platform_admin_email");
        toast.error("Session expired. Please log in again.");
        navigate("/platform/login");
        return;
      }
      fetchTenants();
    };
    
    checkSession();
  }, [navigate]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      // Fetch companies
      const { data: companies, error } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!companies || companies.length === 0) {
        setTenants([]);
        return;
      }

      // Fetch user counts per company from profiles
      const { data: profileCounts } = await supabase
        .from("profiles")
        .select("company_id");

      // Fetch booking counts per company
      const { data: bookingCounts } = await supabase
        .from("bookings")
        .select("company_id");

      // Fetch employee counts per company
      const { data: employeeCounts } = await supabase
        .from("employees")
        .select("company_id");

      // Aggregate counts
      const userCountMap: Record<string, number> = {};
      const bookingCountMap: Record<string, number> = {};
      const employeeCountMap: Record<string, number> = {};

      profileCounts?.forEach(p => {
        if (p.company_id) {
          userCountMap[p.company_id] = (userCountMap[p.company_id] || 0) + 1;
        }
      });

      bookingCounts?.forEach(b => {
        if (b.company_id) {
          bookingCountMap[b.company_id] = (bookingCountMap[b.company_id] || 0) + 1;
        }
      });

      employeeCounts?.forEach(e => {
        if (e.company_id) {
          employeeCountMap[e.company_id] = (employeeCountMap[e.company_id] || 0) + 1;
        }
      });

      // Merge counts into tenants
      const tenantsWithCounts = companies.map(company => ({
        ...company,
        user_count: userCountMap[company.id] || 0,
        booking_count: bookingCountMap[company.id] || 0,
        employee_count: employeeCountMap[company.id] || 0,
      }));

      setTenants(tenantsWithCounts);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
      toast.error("Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  const createTenant = async () => {
    try {
      const slug = newTenant.name.toLowerCase().replace(/\s+/g, "-");
      const apiKey = `vts_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

      const { data, error } = await supabase.from("companies").insert({
        name: newTenant.name,
        slug,
        email: newTenant.email,
        phone: newTenant.phone,
        subscription_tier: newTenant.subscription_tier,
        subscription_status: "trial",
        api_key: apiKey,
        is_active: true,
      }).select().single();

      if (error) throw error;

      toast.success("Tenant created successfully");
      setIsCreateDialogOpen(false);
      setNewTenant({ name: "", email: "", phone: "", subscription_tier: "starter" });
      fetchTenants();
    } catch (error: any) {
      toast.error(error.message || "Failed to create tenant");
    }
  };

  const toggleTenantStatus = async (tenant: Tenant) => {
    try {
      const { error } = await supabase
        .from("companies")
        .update({ is_active: !tenant.is_active })
        .eq("id", tenant.id);

      if (error) throw error;

      toast.success(`Tenant ${tenant.is_active ? "suspended" : "activated"}`);
      fetchTenants();
    } catch (error: any) {
      toast.error(error.message || "Failed to update tenant");
    }
  };

  const regenerateApiKey = async (tenant: Tenant) => {
    try {
      const newApiKey = `vts_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

      const { error } = await supabase
        .from("companies")
        .update({ api_key: newApiKey, api_key_created_at: new Date().toISOString() })
        .eq("id", tenant.id);

      if (error) throw error;

      toast.success("API key regenerated");
      fetchTenants();
    } catch (error: any) {
      toast.error(error.message || "Failed to regenerate API key");
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && tenant.is_active) ||
      (statusFilter === "inactive" && !tenant.is_active);

    const matchesPlan =
      planFilter === "all" || tenant.subscription_tier === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusBadge = (tenant: Tenant) => {
    if (!tenant.is_active) {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    switch (tenant.subscription_status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "trial":
        return <Badge variant="secondary">Trial</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getPlanBadge = (tier: string) => {
    const pkg = SUBSCRIPTION_PACKAGES[tier as SubscriptionTier];
    if (pkg) {
      return <Badge className={getTierBadgeClass(tier as SubscriptionTier)}>{pkg.name}</Badge>;
    }
    return <Badge variant="outline">{tier}</Badge>;
  };

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tenant Management</h1>
            <p className="text-muted-foreground">
              Manage all bus companies on your platform
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tenant</DialogTitle>
                <DialogDescription>
                  Add a new bus company to your platform
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    placeholder="ABC Bus Lines"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@abcbus.com"
                    value={newTenant.email}
                    onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+263 77 123 4567"
                    value={newTenant.phone}
                    onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan">Subscription Plan</Label>
                  <Select
                    value={newTenant.subscription_tier}
                    onValueChange={(value) => setNewTenant({ ...newTenant, subscription_tier: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(SUBSCRIPTION_PACKAGES).map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} - {formatPrice(pkg.pricing.monthlyFee)}/mo
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createTenant} className="bg-blue-600 hover:bg-blue-700">
                  Create Tenant
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter((t) => t.is_active && t.subscription_status === "active").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Trial</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter((t) => t.subscription_status === "trial").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter((t) => !t.is_active).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {Object.values(SUBSCRIPTION_PACKAGES).map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchTenants}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tenants Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>API Usage</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredTenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No tenants found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {tenant.logo_url ? (
                              <AvatarImage src={tenant.logo_url} />
                            ) : null}
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {tenant.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">{tenant.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(tenant.subscription_tier)}</TableCell>
                      <TableCell>{getStatusBadge(tenant)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{tenant.user_count || 0}</span>
                          <span className="text-muted-foreground text-xs ml-1">users</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{tenant.booking_count || 0}</span>
                          <span className="text-muted-foreground text-xs ml-1">bookings</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">
                            {(tenant.api_calls_this_month || 0).toLocaleString()}
                          </span>
                          <span className="text-muted-foreground">
                            {" "}/ {(tenant.api_rate_limit || 1000).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(tenant.created_at).toLocaleDateString()}
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
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Tenant
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Shield className="h-4 w-4 mr-2" />
                              Impersonate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => regenerateApiKey(tenant)}>
                              <Key className="h-4 w-4 mr-2" />
                              Regenerate API Key
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Mail className="h-4 w-4 mr-2" />
                              Send Email
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => toggleTenantStatus(tenant)}
                              className={tenant.is_active ? "text-red-600" : "text-green-600"}
                            >
                              {tenant.is_active ? (
                                <>
                                  <Ban className="h-4 w-4 mr-2" />
                                  Suspend Tenant
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Activate Tenant
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
