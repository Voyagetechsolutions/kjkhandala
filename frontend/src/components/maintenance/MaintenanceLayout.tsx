import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Bus, 
  LayoutDashboard, 
  ClipboardList, 
  Calendar, 
  ClipboardCheck, 
  Wrench, 
  Package, 
  AlertTriangle,
  Box,
  Shield,
  DollarSign,
  BarChart3,
  Settings,
  LogOut 
} from "lucide-react";

interface MaintenanceLayoutProps {
  children: ReactNode;
}

export default function MaintenanceLayout({ children }: MaintenanceLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: "/maintenance", icon: LayoutDashboard, label: "Maintenance Home" },
    { path: "/maintenance/work-orders", icon: ClipboardList, label: "Work Orders" },
    { path: "/maintenance/schedule", icon: Calendar, label: "Maintenance Schedule" },
    { path: "/maintenance/inspections", icon: ClipboardCheck, label: "Vehicle Inspections" },
    { path: "/maintenance/repairs", icon: Wrench, label: "Repairs & Parts" },
    { path: "/maintenance/inventory", icon: Package, label: "Inventory & Spare Parts" },
    { path: "/maintenance/breakdowns", icon: AlertTriangle, label: "Breakdowns" },
    { path: "/maintenance/parts", icon: Box, label: "Parts" },
    { path: "/maintenance/preventive", icon: Shield, label: "Preventive" },
    { path: "/maintenance/costs", icon: DollarSign, label: "Cost Management" },
    { path: "/maintenance/reports", icon: BarChart3, label: "Reports & Analytics" },
    { path: "/maintenance/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <Link to="/maintenance" className="flex items-center gap-2">
            <Bus className="h-6 w-6 text-primary" />
            <div>
              <span className="font-bold text-lg block">KJ Khandala</span>
              <span className="text-xs text-muted-foreground">Maintenance</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                      ${isActive
                        ? "bg-primary text-white"
                        : "hover:bg-muted"
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <Button
            className="w-full justify-start"
            onClick={() => signOut()}
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
