/**
 * VTS SaaS Subscription Tiers Configuration
 * 4 packages optimized for bus companies of different sizes
 */

export type SubscriptionTier = "starter" | "small" | "medium" | "large";

export interface TierLimits {
  maxBuses: number;
  maxEmployees: number;
  maxTerminals: number;
  maxTripsPerMonth: number | "unlimited";
}

export interface TierPricing {
  setupFee: number;
  monthlyFee: number;
  currency: string;
}

export interface TierFeatures {
  // Admin Dashboard
  adminDashboard: "limited" | "full";
  companyRolesPermissions: boolean;
  multiTerminalSupport: boolean;
  
  // Operations
  operationsDashboard: boolean;
  driverPerformanceAnalytics: boolean;
  issueComplaintManagement: boolean;
  intelligentScheduling: boolean;
  
  // Finance
  financeDashboard: "basic" | "standard" | "advanced" | "full";
  payments: boolean;
  ticketSalesSummary: boolean;
  endOfDayReconciliation: boolean;
  transactionHistoryExport: boolean;
  paymentBreakdowns: boolean;
  revenueForecasting: boolean;
  
  // Ticketing
  ticketing: "basic" | "standard" | "advanced" | "full";
  sellTickets: boolean;
  manualCheckIn: boolean;
  qrCheckIn: boolean;
  refunds: boolean;
  passengerSearch: boolean;
  dateChanges: boolean;
  multiPickupLocations: boolean;
  lateCheckInSupport: boolean;
  
  // Passenger Manifest
  passengerManifest: "none" | "basic" | "advanced" | "full";
  manifestDownload: boolean;
  
  // Maintenance
  maintenance: "basic" | "standard" | "advanced" | "full";
  preventiveMaintenance: boolean;
  workOrders: boolean;
  repairsParts: boolean;
  inventory: boolean;
  costManagement: boolean;
  mechanicProductivity: boolean;
  frequentIssuesAnalytics: boolean;
  complianceReports: boolean;
  maintenanceHomeAnalytics: boolean;
  
  // GPS & Tracking
  gpsTracking: "none" | "basic" | "advanced" | "full";
  telematicsIntegration: boolean;
  
  // HR
  hr: "basic" | "standard" | "advanced" | "full";
  addEmployees: boolean;
  payrollSync: boolean;
  leaveManagement: boolean;
  
  // Reports
  reports: "none" | "basic" | "advanced" | "full";
  dailySalesSummary: boolean;
  routePerformance: boolean;
  agentPerformance: boolean;
  noShowReport: boolean;
  auditLogs: boolean;
  revenueAnalyticsExport: boolean;
  
  // API & Integrations
  apiAccess: boolean;
  developerDashboard: boolean;
  customModules: boolean;
  
  // Support
  supportLevel: "basic" | "standard" | "priority" | "premium";
  whatsappSupport: boolean;
  phoneSupport: boolean;
  
  // Real-time Features
  realTimeDashboards: boolean;
  multiCompanyManagement: boolean;
}

export interface SubscriptionPackage {
  id: SubscriptionTier;
  name: string;
  tagline: string;
  description: string;
  targetAudience: string;
  busRange: string;
  pricing: TierPricing;
  limits: TierLimits;
  features: TierFeatures;
  color: string;
  popular?: boolean;
}

// ============================================
// 🟩 STARTER OPERATOR PACKAGE
// ============================================
const starterPackage: SubscriptionPackage = {
  id: "starter",
  name: "Starter Operator",
  tagline: "Get started with the basics",
  description: "Perfect for new operators with 1-3 buses. Entry-level package to get you running.",
  targetAudience: "New Operators",
  busRange: "1-3 buses",
  pricing: {
    setupFee: 3500,
    monthlyFee: 2500,
    currency: "ZAR",
  },
  limits: {
    maxBuses: 3,
    maxEmployees: 5,
    maxTerminals: 2,
    maxTripsPerMonth: 20,
  },
  color: "green",
  features: {
    // Admin Dashboard
    adminDashboard: "limited",
    companyRolesPermissions: false,
    multiTerminalSupport: false,
    
    // Operations
    operationsDashboard: true,
    driverPerformanceAnalytics: false,
    issueComplaintManagement: false,
    intelligentScheduling: false,
    
    // Finance
    financeDashboard: "basic",
    payments: true,
    ticketSalesSummary: true,
    endOfDayReconciliation: false,
    transactionHistoryExport: false,
    paymentBreakdowns: false,
    revenueForecasting: false,
    
    // Ticketing
    ticketing: "basic",
    sellTickets: true,
    manualCheckIn: true,
    qrCheckIn: false,
    refunds: false,
    passengerSearch: false,
    dateChanges: false,
    multiPickupLocations: false,
    lateCheckInSupport: false,
    
    // Passenger Manifest
    passengerManifest: "none",
    manifestDownload: false,
    
    // Maintenance
    maintenance: "basic",
    preventiveMaintenance: true,
    workOrders: false,
    repairsParts: false,
    inventory: false,
    costManagement: false,
    mechanicProductivity: false,
    frequentIssuesAnalytics: false,
    complianceReports: false,
    maintenanceHomeAnalytics: false,
    
    // GPS & Tracking
    gpsTracking: "none",
    telematicsIntegration: false,
    
    // HR
    hr: "basic",
    addEmployees: true,
    payrollSync: false,
    leaveManagement: false,
    
    // Reports
    reports: "none",
    dailySalesSummary: false,
    routePerformance: false,
    agentPerformance: false,
    noShowReport: false,
    auditLogs: false,
    revenueAnalyticsExport: false,
    
    // API & Integrations
    apiAccess: false,
    developerDashboard: false,
    customModules: false,
    
    // Support
    supportLevel: "basic",
    whatsappSupport: false,
    phoneSupport: false,
    
    // Real-time Features
    realTimeDashboards: false,
    multiCompanyManagement: false,
  },
};

// ============================================
// 🟨 SMALL FLEET PACKAGE
// ============================================
const smallPackage: SubscriptionPackage = {
  id: "small",
  name: "Small Fleet",
  tagline: "Full system for growing fleets",
  description: "Complete fleet management for small operators. Full functionality without enterprise analytics.",
  targetAudience: "Small Fleet Operators",
  busRange: "3-10 buses",
  pricing: {
    setupFee: 8500,
    monthlyFee: 7500,
    currency: "ZAR",
  },
  limits: {
    maxBuses: 10,
    maxEmployees: 20,
    maxTerminals: 5,
    maxTripsPerMonth: "unlimited",
  },
  color: "yellow",
  features: {
    // Admin Dashboard
    adminDashboard: "full",
    companyRolesPermissions: false,
    multiTerminalSupport: false,
    
    // Operations
    operationsDashboard: true,
    driverPerformanceAnalytics: false,
    issueComplaintManagement: false,
    intelligentScheduling: false,
    
    // Finance
    financeDashboard: "standard",
    payments: true,
    ticketSalesSummary: true,
    endOfDayReconciliation: false,
    transactionHistoryExport: false,
    paymentBreakdowns: false,
    revenueForecasting: false,
    
    // Ticketing
    ticketing: "standard",
    sellTickets: true,
    manualCheckIn: true,
    qrCheckIn: true,
    refunds: true,
    passengerSearch: true,
    dateChanges: true,
    multiPickupLocations: false,
    lateCheckInSupport: false,
    
    // Passenger Manifest
    passengerManifest: "basic",
    manifestDownload: false,
    
    // Maintenance
    maintenance: "standard",
    preventiveMaintenance: true,
    workOrders: true,
    repairsParts: true,
    inventory: true,
    costManagement: true,
    mechanicProductivity: false,
    frequentIssuesAnalytics: false,
    complianceReports: false,
    maintenanceHomeAnalytics: false,
    
    // GPS & Tracking
    gpsTracking: "basic",
    telematicsIntegration: false,
    
    // HR
    hr: "standard",
    addEmployees: true,
    payrollSync: false,
    leaveManagement: false,
    
    // Reports
    reports: "basic",
    dailySalesSummary: false,
    routePerformance: false,
    agentPerformance: false,
    noShowReport: false,
    auditLogs: false,
    revenueAnalyticsExport: false,
    
    // API & Integrations
    apiAccess: false,
    developerDashboard: false,
    customModules: false,
    
    // Support
    supportLevel: "standard",
    whatsappSupport: false,
    phoneSupport: false,
    
    // Real-time Features
    realTimeDashboards: false,
    multiCompanyManagement: false,
  },
};

// ============================================
// 🟧 MEDIUM FLEET PACKAGE
// ============================================
const mediumPackage: SubscriptionPackage = {
  id: "medium",
  name: "Medium Fleet",
  tagline: "Advanced features for growing companies",
  description: "Ideal for growing companies. Includes advanced ticketing, finance, reporting, and maintenance features.",
  targetAudience: "Growing Fleet Operators",
  busRange: "10-25 buses",
  pricing: {
    setupFee: 11000,
    monthlyFee: 8000,
    currency: "ZAR",
  },
  limits: {
    maxBuses: 25,
    maxEmployees: 50,
    maxTerminals: 10,
    maxTripsPerMonth: "unlimited",
  },
  color: "orange",
  popular: true,
  features: {
    // Admin Dashboard
    adminDashboard: "full",
    companyRolesPermissions: true,
    multiTerminalSupport: true,
    
    // Operations
    operationsDashboard: true,
    driverPerformanceAnalytics: true,
    issueComplaintManagement: true,
    intelligentScheduling: false,
    
    // Finance
    financeDashboard: "advanced",
    payments: true,
    ticketSalesSummary: true,
    endOfDayReconciliation: true,
    transactionHistoryExport: true,
    paymentBreakdowns: true,
    revenueForecasting: false,
    
    // Ticketing
    ticketing: "advanced",
    sellTickets: true,
    manualCheckIn: true,
    qrCheckIn: true,
    refunds: true,
    passengerSearch: true,
    dateChanges: true,
    multiPickupLocations: true,
    lateCheckInSupport: true,
    
    // Passenger Manifest
    passengerManifest: "advanced",
    manifestDownload: true,
    
    // Maintenance
    maintenance: "advanced",
    preventiveMaintenance: true,
    workOrders: true,
    repairsParts: true,
    inventory: true,
    costManagement: true,
    mechanicProductivity: true,
    frequentIssuesAnalytics: true,
    complianceReports: true,
    maintenanceHomeAnalytics: true,
    
    // GPS & Tracking
    gpsTracking: "advanced",
    telematicsIntegration: false,
    
    // HR
    hr: "advanced",
    addEmployees: true,
    payrollSync: true,
    leaveManagement: true,
    
    // Reports
    reports: "advanced",
    dailySalesSummary: true,
    routePerformance: true,
    agentPerformance: true,
    noShowReport: true,
    auditLogs: true,
    revenueAnalyticsExport: false,
    
    // API & Integrations
    apiAccess: false,
    developerDashboard: false,
    customModules: false,
    
    // Support
    supportLevel: "priority",
    whatsappSupport: true,
    phoneSupport: false,
    
    // Real-time Features
    realTimeDashboards: false,
    multiCompanyManagement: false,
  },
};

// ============================================
// 🟥 LARGE FLEET / ENTERPRISE PACKAGE
// ============================================
const largePackage: SubscriptionPackage = {
  id: "large",
  name: "Large Fleet / Enterprise",
  tagline: "Unlimited power for large operators",
  description: "Full access for large operators. Unlimited everything with API access, real-time dashboards, and premium support.",
  targetAudience: "Large Fleet Operators",
  busRange: "25+ buses",
  pricing: {
    setupFee: 13000,
    monthlyFee: 10500,
    currency: "ZAR",
  },
  limits: {
    maxBuses: Infinity,
    maxEmployees: Infinity,
    maxTerminals: Infinity,
    maxTripsPerMonth: "unlimited",
  },
  color: "red",
  features: {
    // Admin Dashboard
    adminDashboard: "full",
    companyRolesPermissions: true,
    multiTerminalSupport: true,
    
    // Operations
    operationsDashboard: true,
    driverPerformanceAnalytics: true,
    issueComplaintManagement: true,
    intelligentScheduling: true,
    
    // Finance
    financeDashboard: "full",
    payments: true,
    ticketSalesSummary: true,
    endOfDayReconciliation: true,
    transactionHistoryExport: true,
    paymentBreakdowns: true,
    revenueForecasting: true,
    
    // Ticketing
    ticketing: "full",
    sellTickets: true,
    manualCheckIn: true,
    qrCheckIn: true,
    refunds: true,
    passengerSearch: true,
    dateChanges: true,
    multiPickupLocations: true,
    lateCheckInSupport: true,
    
    // Passenger Manifest
    passengerManifest: "full",
    manifestDownload: true,
    
    // Maintenance
    maintenance: "full",
    preventiveMaintenance: true,
    workOrders: true,
    repairsParts: true,
    inventory: true,
    costManagement: true,
    mechanicProductivity: true,
    frequentIssuesAnalytics: true,
    complianceReports: true,
    maintenanceHomeAnalytics: true,
    
    // GPS & Tracking
    gpsTracking: "full",
    telematicsIntegration: true,
    
    // HR
    hr: "full",
    addEmployees: true,
    payrollSync: true,
    leaveManagement: true,
    
    // Reports
    reports: "full",
    dailySalesSummary: true,
    routePerformance: true,
    agentPerformance: true,
    noShowReport: true,
    auditLogs: true,
    revenueAnalyticsExport: true,
    
    // API & Integrations
    apiAccess: true,
    developerDashboard: true,
    customModules: true,
    
    // Support
    supportLevel: "premium",
    whatsappSupport: true,
    phoneSupport: true,
    
    // Real-time Features
    realTimeDashboards: true,
    multiCompanyManagement: true,
  },
};

// ============================================
// EXPORTS
// ============================================

export const SUBSCRIPTION_PACKAGES: Record<SubscriptionTier, SubscriptionPackage> = {
  starter: starterPackage,
  small: smallPackage,
  medium: mediumPackage,
  large: largePackage,
};

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = ["starter", "small", "medium", "large"];

export const getPackage = (tier: SubscriptionTier): SubscriptionPackage => {
  return SUBSCRIPTION_PACKAGES[tier];
};

export const getPackageLimits = (tier: SubscriptionTier): TierLimits => {
  return SUBSCRIPTION_PACKAGES[tier].limits;
};

export const getPackageFeatures = (tier: SubscriptionTier): TierFeatures => {
  return SUBSCRIPTION_PACKAGES[tier].features;
};

export const getPackagePricing = (tier: SubscriptionTier): TierPricing => {
  return SUBSCRIPTION_PACKAGES[tier].pricing;
};

/**
 * Check if a specific feature is available for a tier
 */
export const hasFeature = (tier: SubscriptionTier, feature: keyof TierFeatures): boolean => {
  const features = getPackageFeatures(tier);
  const value = features[feature];
  
  if (typeof value === "boolean") {
    return value;
  }
  
  // For level-based features, check if not "none" or "basic" (for limited access)
  return value !== "none";
};

/**
 * Check if tenant is within their limits
 */
export const isWithinLimits = (
  tier: SubscriptionTier,
  current: { buses?: number; employees?: number; terminals?: number; tripsThisMonth?: number }
): { withinLimits: boolean; exceeded: string[] } => {
  const limits = getPackageLimits(tier);
  const exceeded: string[] = [];
  
  if (current.buses !== undefined && current.buses >= limits.maxBuses) {
    exceeded.push("buses");
  }
  if (current.employees !== undefined && current.employees >= limits.maxEmployees) {
    exceeded.push("employees");
  }
  if (current.terminals !== undefined && current.terminals >= limits.maxTerminals) {
    exceeded.push("terminals");
  }
  if (
    current.tripsThisMonth !== undefined &&
    limits.maxTripsPerMonth !== "unlimited" &&
    current.tripsThisMonth >= limits.maxTripsPerMonth
  ) {
    exceeded.push("trips");
  }
  
  return {
    withinLimits: exceeded.length === 0,
    exceeded,
  };
};

/**
 * Get upgrade recommendation based on current usage
 */
export const getUpgradeRecommendation = (
  currentTier: SubscriptionTier,
  usage: { buses: number; employees: number; terminals: number }
): SubscriptionTier | null => {
  const tierIndex = SUBSCRIPTION_TIERS.indexOf(currentTier);
  
  if (tierIndex >= SUBSCRIPTION_TIERS.length - 1) {
    return null; // Already on highest tier
  }
  
  const limits = getPackageLimits(currentTier);
  const usagePercent = {
    buses: (usage.buses / limits.maxBuses) * 100,
    employees: (usage.employees / limits.maxEmployees) * 100,
    terminals: (usage.terminals / limits.maxTerminals) * 100,
  };
  
  // Recommend upgrade if any usage is above 80%
  if (usagePercent.buses > 80 || usagePercent.employees > 80 || usagePercent.terminals > 80) {
    return SUBSCRIPTION_TIERS[tierIndex + 1];
  }
  
  return null;
};

/**
 * Format price for display
 */
export const formatPrice = (amount: number, currency: string = "ZAR"): string => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get tier display color
 */
export const getTierColor = (tier: SubscriptionTier): string => {
  const colors: Record<SubscriptionTier, string> = {
    starter: "green",
    small: "yellow",
    medium: "orange",
    large: "red",
  };
  return colors[tier];
};

/**
 * Get tier badge class
 */
export const getTierBadgeClass = (tier: SubscriptionTier): string => {
  const classes: Record<SubscriptionTier, string> = {
    starter: "bg-green-500",
    small: "bg-yellow-500",
    medium: "bg-orange-500",
    large: "bg-red-500",
  };
  return classes[tier];
};
