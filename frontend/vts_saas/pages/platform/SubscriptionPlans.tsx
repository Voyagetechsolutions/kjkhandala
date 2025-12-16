import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  X,
  Minus,
  Bus,
  Users,
  Building2,
  Route,
  Zap,
  Shield,
  Phone,
  MessageSquare,
  BarChart3,
  Settings,
  Key,
  MapPin,
  Wrench,
  DollarSign,
  Ticket,
  FileText,
  Clock,
  Star,
} from "lucide-react";
import PlatformLayout from "@/components/platform/PlatformLayout";
import {
  SUBSCRIPTION_PACKAGES,
  SUBSCRIPTION_TIERS,
  SubscriptionTier,
  formatPrice,
  getTierBadgeClass,
} from "@/lib/subscription-tiers";

export default function SubscriptionPlans() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("platform_admin_token");
    if (!token) {
      navigate("/platform/login");
      return;
    }
  }, [navigate]);

  const packages = SUBSCRIPTION_TIERS.map(tier => SUBSCRIPTION_PACKAGES[tier]);

  const featureCategories = [
    {
      name: "Admin Dashboard",
      icon: Settings,
      features: [
        { key: "adminDashboard", label: "Admin Dashboard" },
        { key: "companyRolesPermissions", label: "Roles & Permissions" },
        { key: "multiTerminalSupport", label: "Multi-Terminal Support" },
      ],
    },
    {
      name: "Operations",
      icon: Route,
      features: [
        { key: "operationsDashboard", label: "Operations Dashboard" },
        { key: "driverPerformanceAnalytics", label: "Driver Performance Analytics" },
        { key: "issueComplaintManagement", label: "Issue & Complaint Management" },
        { key: "intelligentScheduling", label: "Intelligent Scheduling" },
      ],
    },
    {
      name: "Finance",
      icon: DollarSign,
      features: [
        { key: "financeDashboard", label: "Finance Dashboard" },
        { key: "payments", label: "Payments" },
        { key: "ticketSalesSummary", label: "Ticket Sales Summary" },
        { key: "endOfDayReconciliation", label: "End of Day Reconciliation" },
        { key: "transactionHistoryExport", label: "Transaction History Export" },
        { key: "paymentBreakdowns", label: "Payment Breakdowns" },
        { key: "revenueForecasting", label: "Revenue Forecasting" },
      ],
    },
    {
      name: "Ticketing",
      icon: Ticket,
      features: [
        { key: "ticketing", label: "Ticketing System" },
        { key: "sellTickets", label: "Sell Tickets" },
        { key: "manualCheckIn", label: "Manual Check-in" },
        { key: "qrCheckIn", label: "QR Check-in" },
        { key: "refunds", label: "Refunds" },
        { key: "passengerSearch", label: "Passenger Search" },
        { key: "dateChanges", label: "Date Changes" },
        { key: "multiPickupLocations", label: "Multi-Pickup Locations" },
        { key: "lateCheckInSupport", label: "Late Check-in Support" },
      ],
    },
    {
      name: "Passenger Manifest",
      icon: FileText,
      features: [
        { key: "passengerManifest", label: "Passenger Manifest" },
        { key: "manifestDownload", label: "Manifest Download (PDF)" },
      ],
    },
    {
      name: "Maintenance",
      icon: Wrench,
      features: [
        { key: "maintenance", label: "Maintenance System" },
        { key: "preventiveMaintenance", label: "Preventive Maintenance" },
        { key: "workOrders", label: "Work Orders" },
        { key: "repairsParts", label: "Repairs & Parts" },
        { key: "inventory", label: "Inventory Management" },
        { key: "costManagement", label: "Cost Management" },
        { key: "mechanicProductivity", label: "Mechanic Productivity" },
        { key: "frequentIssuesAnalytics", label: "Frequent Issues Analytics" },
        { key: "complianceReports", label: "Compliance Reports" },
      ],
    },
    {
      name: "GPS & Tracking",
      icon: MapPin,
      features: [
        { key: "gpsTracking", label: "GPS Tracking" },
        { key: "telematicsIntegration", label: "Telematics Integration" },
      ],
    },
    {
      name: "HR",
      icon: Users,
      features: [
        { key: "hr", label: "HR System" },
        { key: "addEmployees", label: "Add Employees" },
        { key: "payrollSync", label: "Payroll Sync" },
        { key: "leaveManagement", label: "Leave Management" },
      ],
    },
    {
      name: "Reports",
      icon: BarChart3,
      features: [
        { key: "reports", label: "Reporting System" },
        { key: "dailySalesSummary", label: "Daily Sales Summary" },
        { key: "routePerformance", label: "Route Performance" },
        { key: "agentPerformance", label: "Agent Performance" },
        { key: "noShowReport", label: "No-Show Report" },
        { key: "auditLogs", label: "Audit Logs" },
        { key: "revenueAnalyticsExport", label: "Revenue Analytics Export" },
      ],
    },
    {
      name: "API & Integrations",
      icon: Key,
      features: [
        { key: "apiAccess", label: "API Access" },
        { key: "developerDashboard", label: "Developer Dashboard" },
        { key: "customModules", label: "Custom Modules" },
      ],
    },
    {
      name: "Support",
      icon: Phone,
      features: [
        { key: "supportLevel", label: "Support Level" },
        { key: "whatsappSupport", label: "WhatsApp Support" },
        { key: "phoneSupport", label: "Phone Support" },
      ],
    },
  ];

  const renderFeatureValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="h-5 w-5 text-green-500" />
      ) : (
        <X className="h-5 w-5 text-red-400" />
      );
    }
    if (value === "none") {
      return <X className="h-5 w-5 text-red-400" />;
    }
    if (value === "limited" || value === "basic") {
      return <Badge variant="outline" className="text-xs">{value}</Badge>;
    }
    if (value === "standard") {
      return <Badge className="bg-blue-500 text-xs">{value}</Badge>;
    }
    if (value === "advanced") {
      return <Badge className="bg-purple-500 text-xs">{value}</Badge>;
    }
    if (value === "full" || value === "premium" || value === "priority") {
      return <Badge className="bg-green-500 text-xs">{value}</Badge>;
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <PlatformLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
            <p className="text-muted-foreground">
              4 packages optimized for bus companies of different sizes
            </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => (
            <Card 
              key={pkg.id} 
              className={`relative ${pkg.popular ? "border-2 border-orange-500 shadow-lg" : ""}`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-orange-500">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${getTierBadgeClass(pkg.id)}`}>
                  <Bus className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <CardDescription>{pkg.tagline}</CardDescription>
                <p className="text-sm text-muted-foreground">{pkg.busRange}</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">Setup Fee</p>
                  <p className="text-2xl font-bold">{formatPrice(pkg.pricing.setupFee)}</p>
                </div>
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Monthly</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {formatPrice(pkg.pricing.monthlyFee)}
                  </p>
                </div>
                
                {/* Limits */}
                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Buses</span>
                    <span className="font-medium">
                      {pkg.limits.maxBuses === Infinity ? "Unlimited" : `Up to ${pkg.limits.maxBuses}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employees</span>
                    <span className="font-medium">
                      {pkg.limits.maxEmployees === Infinity ? "Unlimited" : `Up to ${pkg.limits.maxEmployees}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Terminals</span>
                    <span className="font-medium">
                      {pkg.limits.maxTerminals === Infinity ? "Unlimited" : `Up to ${pkg.limits.maxTerminals}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trips/Month</span>
                    <span className="font-medium">
                      {pkg.limits.maxTripsPerMonth === "unlimited" ? "Unlimited" : pkg.limits.maxTripsPerMonth}
                    </span>
                  </div>
                </div>

                {/* Key Features */}
                <div className="mt-4 pt-4 border-t space-y-2 text-left">
                  <p className="text-sm font-medium mb-2">Key Features:</p>
                  <div className="flex items-center gap-2 text-sm">
                    {pkg.features.qrCheckIn ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-400" />
                    )}
                    <span>QR Check-in</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {pkg.features.gpsTracking !== "none" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-400" />
                    )}
                    <span>GPS Tracking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {pkg.features.apiAccess ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-400" />
                    )}
                    <span>API Access</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {pkg.features.realTimeDashboards ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-400" />
                    )}
                    <span>Real-time Dashboards</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Comparison</CardTitle>
            <CardDescription>Detailed breakdown of features by plan</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="all">All Features</TabsTrigger>
                {featureCategories.map((cat) => (
                  <TabsTrigger key={cat.name} value={cat.name}>
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Feature</TableHead>
                        {packages.map((pkg) => (
                          <TableHead key={pkg.id} className="text-center">
                            <Badge className={getTierBadgeClass(pkg.id)}>{pkg.name}</Badge>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Limits Section */}
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={5} className="font-semibold">
                          <div className="flex items-center gap-2">
                            <Bus className="h-4 w-4" />
                            Limits
                          </div>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Max Buses</TableCell>
                        {packages.map((pkg) => (
                          <TableCell key={pkg.id} className="text-center font-medium">
                            {pkg.limits.maxBuses === Infinity ? "Unlimited" : pkg.limits.maxBuses}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell>Max Employees</TableCell>
                        {packages.map((pkg) => (
                          <TableCell key={pkg.id} className="text-center font-medium">
                            {pkg.limits.maxEmployees === Infinity ? "Unlimited" : pkg.limits.maxEmployees}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell>Max Terminals</TableCell>
                        {packages.map((pkg) => (
                          <TableCell key={pkg.id} className="text-center font-medium">
                            {pkg.limits.maxTerminals === Infinity ? "Unlimited" : pkg.limits.maxTerminals}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell>Trips per Month</TableCell>
                        {packages.map((pkg) => (
                          <TableCell key={pkg.id} className="text-center font-medium">
                            {pkg.limits.maxTripsPerMonth === "unlimited" ? "Unlimited" : pkg.limits.maxTripsPerMonth}
                          </TableCell>
                        ))}
                      </TableRow>

                      {/* Feature Categories */}
                      {featureCategories.map((category) => (
                        <>
                          <TableRow key={category.name} className="bg-muted/50">
                            <TableCell colSpan={5} className="font-semibold">
                              <div className="flex items-center gap-2">
                                <category.icon className="h-4 w-4" />
                                {category.name}
                              </div>
                            </TableCell>
                          </TableRow>
                          {category.features.map((feature) => (
                            <TableRow key={feature.key}>
                              <TableCell>{feature.label}</TableCell>
                              {packages.map((pkg) => (
                                <TableCell key={pkg.id} className="text-center">
                                  {renderFeatureValue((pkg.features as any)[feature.key])}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Individual Category Tabs */}
              {featureCategories.map((category) => (
                <TabsContent key={category.name} value={category.name} className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Feature</TableHead>
                        {packages.map((pkg) => (
                          <TableHead key={pkg.id} className="text-center">
                            <Badge className={getTierBadgeClass(pkg.id)}>{pkg.name}</Badge>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.features.map((feature) => (
                        <TableRow key={feature.key}>
                          <TableCell>{feature.label}</TableCell>
                          {packages.map((pkg) => (
                            <TableCell key={pkg.id} className="text-center">
                              {renderFeatureValue((pkg.features as any)[feature.key])}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Why This Structure */}
        <Card>
          <CardHeader>
            <CardTitle>Why This Structure Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Starter Package</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cheap but useful — perfect for new operators to get started quickly
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <Bus className="h-4 w-4 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold">Small Fleet</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Full system access but blocks enterprise analytics
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                  </div>
                  <h3 className="font-semibold">Medium Fleet</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Unlocks advanced business intelligence for growing companies
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <Key className="h-4 w-4 text-red-600" />
                  </div>
                  <h3 className="font-semibold">Large Fleet</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Unlocks API access + unlimited scaling for enterprise operators
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">High Value Tiers</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maintain high value at higher tiers with premium features
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Star className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Natural Upgrades</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Makes upgrades feel natural and necessary as companies grow
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PlatformLayout>
  );
}
