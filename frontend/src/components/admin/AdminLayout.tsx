import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Bus, LayoutDashboard, LogOut, Building2, Truck, Users, MapPin, DollarSign, 
  Briefcase, Wrench, Navigation, FileText, Shield, Settings, MapPinned, 
  ChevronDown, ChevronRight, Ticket, CreditCard, UserCheck, Receipt, 
  AlertTriangle, Clock, BarChart3, Warehouse, CalendarClock, ClipboardCheck,
  Package, Coins, UserPlus, Calendar, Award, FileCheck, Wallet, TrendingUp,
  Calculator, Fuel, FileSpreadsheet, RefreshCw, Search, Plus, UserCog, Activity,
  Menu, X, ClipboardList, Headphones, PieChart
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  // State for collapsible sections and mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openSections, setOpenSections] = useState({
    operations: false,
    finance: false,
    ticketing: false,
    hr: false,
    maintenance: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => {
      const isCurrentlyOpen = prev[section];
      
      if (isCurrentlyOpen) {
        // If clicking on an open section, just close it
        return { ...prev, [section]: false };
      } else {
        // If opening a new section, close all others and open this one
        const allClosed = {
          operations: false,
          finance: false,
          ticketing: false,
          hr: false,
          maintenance: false,
        };
        return { ...allClosed, [section]: true };
      }
    });
  };

  // Menu structure with categories and sub-items
  const menuStructure = {
    operations: {
      label: "Operations",
      icon: Navigation,
      items: [
        { path: "/admin", icon: LayoutDashboard, label: "Command Center" },
        { path: "/admin/trips", icon: Activity, label: "Trip Scheduling" },
        { path: "/admin/trip-management", icon: Calendar, label: "Trip Management" },
        { path: "/admin/assign-bus", icon: Bus, label: "Assign Bus" },
        { path: "/admin/driver-shifts", icon: UserCog, label: "Driver Shifts" },
        { path: "/admin/fleet", icon: Truck, label: "Fleet Management" },
        { path: "/admin/drivers", icon: Users, label: "Driver Management" },
        { path: "/admin/tracking", icon: Navigation, label: "Live Tracking" },
        { path: "/admin/cities", icon: MapPinned, label: "City Management" },
        { path: "/admin/route-management", icon: MapPin, label: "Route Management" },
        { path: "/admin/incidents", icon: AlertTriangle, label: "Incident Management" },
        { path: "/admin/delays", icon: Clock, label: "Delay Management" },
        { path: "/admin/passenger-manifest", icon: ClipboardList, label: "Passenger Manifest" },
        { path: "/admin/reports", icon: BarChart3, label: "Reports and Analytics" },
        { path: "/admin/terminal", icon: Building2, label: "Terminal Operations" },
        { path: "/admin/terminal-management", icon: Building2, label: "Terminal Management" },
      ]
    },
    finance: {
      label: "Finance and Accounting",
      icon: DollarSign,
      items: [
        { path: "/admin/finance", icon: LayoutDashboard, label: "Finance Home" },
        { path: "/admin/finance/income", icon: TrendingUp, label: "Income Management" },
        { path: "/admin/finance/expenses", icon: Receipt, label: "Expense Management" },
        { path: "/admin/finance/revenue-analysis", icon: PieChart, label: "Revenue Analysis" },
        { path: "/admin/finance/payroll", icon: Wallet, label: "Payroll Management" },
        { path: "/admin/finance/fuel-allowance", icon: Fuel, label: "Fuel and Allowance" },
        { path: "/admin/finance/invoices", icon: FileText, label: "Invoice and Billing" },
        { path: "/admin/finance/refunds", icon: RefreshCw, label: "Refund and Adjustments" },
        { path: "/admin/finance/reports", icon: BarChart3, label: "Reports and Analytics" },
        { path: "/admin/finance/accounts", icon: Calculator, label: "Accounts and Reconciliation" },
      ]
    },
    ticketing: {
      label: "Ticketing",
      icon: Ticket,
      items: [
        { path: "/admin/ticketing", icon: LayoutDashboard, label: "Control Panel" },
        { path: "/admin/ticketing/search-trips", icon: Search, label: "Search Trips" },
        { path: "/admin/ticketing/reserved", icon: Clock, label: "Reserved Seats" },
        { path: "/admin/ticketing/modify-booking", icon: RefreshCw, label: "Modify Booking" },
        { path: "/admin/ticketing/cancel-refund", icon: AlertTriangle, label: "Cancel & Refund" },
        { path: "/admin/ticketing/customer-lookup", icon: Users, label: "Customer Lookup" },
        { path: "/admin/ticketing/reports", icon: BarChart3, label: "Reports" },
      ]
    },
    hr: {
      label: "HR Management",
      icon: Briefcase,
      items: [
        { path: "/admin/hr", icon: LayoutDashboard, label: "HR Home" },
        { path: "/admin/hr/employees", icon: Users, label: "Employees" },
        { path: "/admin/hr/recruitment", icon: UserPlus, label: "Recruitment" },
        { path: "/admin/hr/attendance", icon: CalendarClock, label: "Attendance" },
        { path: "/admin/hr/payroll", icon: Wallet, label: "Payroll" },
        { path: "/admin/hr/performance", icon: Award, label: "Performance" },
        { path: "/admin/hr/compliance", icon: FileCheck, label: "Compliance" },
        { path: "/admin/hr/leave", icon: Calendar, label: "Leave" },
        { path: "/admin/hr/support", icon: Headphones, label: "Customer Support" },
        { path: "/admin/hr/reports", icon: BarChart3, label: "Reports" },
        { path: "/admin/hr/settings", icon: Settings, label: "Settings" },
        { path: "/admin/hr/documents", icon: FileText, label: "Documents" },
        { path: "/admin/users", icon: Shield, label: "User Management" },
      ]
    },
    maintenance: {
      label: "Maintenance",
      icon: Wrench,
      items: [
        { path: "/admin/maintenance", icon: LayoutDashboard, label: "Maintenance Home" },
        { path: "/admin/maintenance/work-orders", icon: ClipboardCheck, label: "Work Orders" },
        { path: "/admin/maintenance/schedule", icon: Calendar, label: "Schedule" },
        { path: "/admin/maintenance/inspections", icon: FileCheck, label: "Inspections" },
        { path: "/admin/maintenance/repairs", icon: Wrench, label: "Repairs" },
        { path: "/admin/maintenance/inventory", icon: Package, label: "Inventory" },
        { path: "/admin/maintenance/costs", icon: Coins, label: "Costs" },
        { path: "/admin/maintenance/reports", icon: BarChart3, label: "Reports" },
        { path: "/admin/maintenance/settings", icon: Settings, label: "Settings" },
        { path: "/admin/maintenance/breakdowns", icon: AlertTriangle, label: "Breakdowns" },
        { path: "/admin/maintenance/parts", icon: Package, label: "Parts" },
        { path: "/admin/maintenance/preventive", icon: Calendar, label: "Preventive" },
      ]
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between">
        <Link to="/admin" className="flex items-center gap-2">
          <Bus className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">KJ Khandala</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-card border-r flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b hidden lg:block">
          <Link to="/admin" className="flex items-center gap-2">
            <Bus className="h-6 w-6 text-primary" />
            <div>
              <span className="font-bold text-lg block">KJ Khandala</span>
              <span className="text-xs text-muted-foreground">Admin Control</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {/* Operations Section */}
            <Collapsible open={openSections.operations} onOpenChange={() => toggleSection('operations')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <menuStructure.operations.icon className="h-5 w-5" />
                  <span className="font-semibold">{menuStructure.operations.label}</span>
                </div>
                {openSections.operations ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1">
                {menuStructure.operations.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-2 ml-4 rounded-lg transition-colors text-sm
                      ${location.pathname === item.path
                        ? "bg-primary text-white"
                        : "hover:bg-muted"
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Finance Section */}
            <Collapsible open={openSections.finance} onOpenChange={() => toggleSection('finance')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <menuStructure.finance.icon className="h-5 w-5" />
                  <span className="font-semibold">{menuStructure.finance.label}</span>
                </div>
                {openSections.finance ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1">
                {menuStructure.finance.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-2 ml-4 rounded-lg transition-colors text-sm
                      ${location.pathname === item.path
                        ? "bg-primary text-white"
                        : "hover:bg-muted"
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Ticketing Section */}
            <Collapsible open={openSections.ticketing} onOpenChange={() => toggleSection('ticketing')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <menuStructure.ticketing.icon className="h-5 w-5" />
                  <span className="font-semibold">{menuStructure.ticketing.label}</span>
                </div>
                {openSections.ticketing ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1">
                {menuStructure.ticketing.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-2 ml-4 rounded-lg transition-colors text-sm
                      ${location.pathname === item.path
                        ? "bg-primary text-white"
                        : "hover:bg-muted"
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* HR Management Section */}
            <Collapsible open={openSections.hr} onOpenChange={() => toggleSection('hr')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <menuStructure.hr.icon className="h-5 w-5" />
                  <span className="font-semibold">{menuStructure.hr.label}</span>
                </div>
                {openSections.hr ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1">
                {menuStructure.hr.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-2 ml-4 rounded-lg transition-colors text-sm
                      ${location.pathname === item.path
                        ? "bg-primary text-white"
                        : "hover:bg-muted"
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

            {/* Maintenance Section */}
            <Collapsible open={openSections.maintenance} onOpenChange={() => toggleSection('maintenance')}>
              <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <menuStructure.maintenance.icon className="h-5 w-5" />
                  <span className="font-semibold">{menuStructure.maintenance.label}</span>
                </div>
                {openSections.maintenance ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1 space-y-1">
                {menuStructure.maintenance.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-2 ml-4 rounded-lg transition-colors text-sm
                      ${location.pathname === item.path
                        ? "bg-primary text-white"
                        : "hover:bg-muted"
                      }
                    `}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>

            <div className="h-2" />

            {/* System Settings */}
            <Link
              to="/admin/settings"
              className={`
                flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm
                ${location.pathname === "/admin/settings"
                  ? "bg-primary text-white"
                  : "hover:bg-muted"
                }
              `}
            >
              <Settings className="h-4 w-4" />
              <span>System Settings</span>
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => signOut()}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 sm:px-6 py-8 mt-16 lg:mt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
