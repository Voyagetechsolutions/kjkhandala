import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Calendar,
  Filter,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import { supabase } from "@/lib/supabase";
import {
  SUBSCRIPTION_PACKAGES,
  SubscriptionTier,
  formatPrice,
  getTierBadgeClass,
} from "@/lib/subscription-tiers";

interface Tenant {
  id: string;
  name: string;
  subscription_tier: SubscriptionTier;
  subscription_status: string;
  created_at: string;
}

interface BillingStats {
  totalRevenue: number;
  tenantCount: number;
  avgRevPerTenant: number;
  starterCount: number;
  smallCount: number;
  mediumCount: number;
  largeCount: number;
}

export default function BillingManagement() {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<BillingStats>({
    totalRevenue: 0,
    tenantCount: 0,
    avgRevPerTenant: 0,
    starterCount: 0,
    smallCount: 0,
    mediumCount: 0,
    largeCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Get pricing from subscription packages
  const starterPrice = SUBSCRIPTION_PACKAGES.starter.pricing.monthlyFee;
  const smallPrice = SUBSCRIPTION_PACKAGES.small.pricing.monthlyFee;
  const mediumPrice = SUBSCRIPTION_PACKAGES.medium.pricing.monthlyFee;
  const largePrice = SUBSCRIPTION_PACKAGES.large.pricing.monthlyFee;

  useEffect(() => {
    // Check if platform admin is logged in
    const token = localStorage.getItem("platform_admin_token");
    if (!token) {
      navigate("/platform/login");
      return;
    }
    fetchBillingData();
  }, [navigate]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      // Fetch all tenants
      const { data: companies, error } = await supabase
        .from("companies")
        .select("id, name, subscription_tier, subscription_status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTenants(companies || []);

      // Calculate stats based on new 4-tier system
      const starterCount = companies?.filter(c => c.subscription_tier === "starter").length || 0;
      const smallCount = companies?.filter(c => c.subscription_tier === "small").length || 0;
      const mediumCount = companies?.filter(c => c.subscription_tier === "medium").length || 0;
      const largeCount = companies?.filter(c => c.subscription_tier === "large").length || 0;

      // Calculate MRR based on new subscription tiers (ZAR)
      const mrr = (starterCount * starterPrice) + (smallCount * smallPrice) + (mediumCount * mediumPrice) + (largeCount * largePrice);
      const tenantCount = companies?.length || 0;

      setStats({
        totalRevenue: mrr,
        tenantCount,
        avgRevPerTenant: tenantCount > 0 ? Math.round(mrr / tenantCount) : 0,
        starterCount,
        smallCount,
        mediumCount,
        largeCount,
      });

    } catch (error) {
      console.error("Failed to fetch billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "trial":
        return <Badge variant="secondary">Trial</Badge>;
      case "expired":
        return <Badge variant="destructive">Expired</Badge>;
      case "cancelled":
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status || "Free"}</Badge>;
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || tenant.subscription_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <PlatformLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
            <p className="text-muted-foreground">
              Manage platform revenue and tenant subscriptions
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <DollarSign className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Revenue Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue (MRR)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                From {stats.tenantCount} active tenants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Revenue (ARR)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.totalRevenue * 12)}</div>
              <p className="text-xs text-muted-foreground">
                Projected annual revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue/Tenant</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.avgRevPerTenant)}</div>
              <p className="text-xs text-muted-foreground">
                Per month per tenant
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tenantCount}</div>
              <p className="text-xs text-muted-foreground">
                Active subscriptions
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
            <TabsTrigger value="payments">Payment Methods</TabsTrigger>
          </TabsList>

          {/* Tenants Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Tenant Subscriptions</CardTitle>
                    <CardDescription>Manage tenant subscription status</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search tenants..."
                        className="pl-10 w-[200px]"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Monthly Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filteredTenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No tenants found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTenants.map((tenant) => {
                        const tier = tenant.subscription_tier || "starter";
                        const pkg = SUBSCRIPTION_PACKAGES[tier as SubscriptionTier];
                        const planPrice = pkg?.pricing.monthlyFee || 0;
                        return (
                          <TableRow key={tenant.id}>
                            <TableCell className="font-medium">{tenant.name}</TableCell>
                            <TableCell>
                              <Badge className={`${getTierBadgeClass(tier as SubscriptionTier)} capitalize`}>
                                {pkg?.name || tier}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatPrice(planPrice)}</TableCell>
                            <TableCell>{getStatusBadge(tenant.subscription_status)}</TableCell>
                            <TableCell>{new Date(tenant.created_at).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.values(SUBSCRIPTION_PACKAGES).map((pkg) => {
                const tenantCount = pkg.id === "starter" ? stats.starterCount 
                  : pkg.id === "small" ? stats.smallCount 
                  : pkg.id === "medium" ? stats.mediumCount 
                  : stats.largeCount;
                return (
                  <Card key={pkg.id} className={pkg.popular ? "border-orange-500 border-2" : ""}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        {pkg.popular && (
                          <Badge className="bg-orange-500">Popular</Badge>
                        )}
                      </div>
                      <CardDescription>
                        <span className="text-2xl font-bold text-foreground">{formatPrice(pkg.pricing.monthlyFee)}</span>
                        <span className="text-muted-foreground">/month</span>
                      </CardDescription>
                      <p className="text-xs text-muted-foreground">
                        Setup: {formatPrice(pkg.pricing.setupFee)}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                          <span className="text-sm">Active Tenants</span>
                          <Badge variant="secondary">{tenantCount}</Badge>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><strong>Buses:</strong> {pkg.limits.maxBuses === Infinity ? "Unlimited" : `Up to ${pkg.limits.maxBuses}`}</p>
                          <p><strong>Employees:</strong> {pkg.limits.maxEmployees === Infinity ? "Unlimited" : `Up to ${pkg.limits.maxEmployees}`}</p>
                          <p><strong>Terminals:</strong> {pkg.limits.maxTerminals === Infinity ? "Unlimited" : `Up to ${pkg.limits.maxTerminals}`}</p>
                        </div>
                        <Button variant="outline" className="w-full">
                          Edit Plan
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway Configuration</CardTitle>
                <CardDescription>Configure payment providers for subscription billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Stripe", status: "active", icon: "💳" },
                    { name: "PayPal", status: "active", icon: "🅿️" },
                    { name: "Flutterwave", status: "configured", icon: "🌊" },
                    { name: "Paystack", status: "inactive", icon: "💰" },
                  ].map((gateway) => (
                    <div key={gateway.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{gateway.icon}</span>
                        <div>
                          <p className="font-medium">{gateway.name}</p>
                          <p className="text-sm text-muted-foreground">Payment Gateway</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={gateway.status === "active" ? "default" : "outline"}
                          className={gateway.status === "active" ? "bg-green-500" : ""}
                        >
                          {gateway.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Configure
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PlatformLayout>
  );
}
