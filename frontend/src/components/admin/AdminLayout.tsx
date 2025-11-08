import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Bus, LayoutDashboard, Route, Calendar, Ticket, LogOut, Building2, Truck, Users, MapPin, DollarSign, Briefcase, Wrench, Navigation, FileText, Shield, Settings } from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Command Center" },
    { path: "/admin/fleet", icon: Truck, label: "Fleet Management" },
    { path: "/admin/drivers", icon: Users, label: "Driver Management" },
    { path: "/admin/route-management", icon: MapPin, label: "Route Management" },
    { path: "/admin/trips", icon: Bus, label: "Trip Scheduling" },
    { path: "/admin/manifest", icon: Ticket, label: "Passenger Manifest" },
    { path: "/admin/finance", icon: DollarSign, label: "Finance & Accounting" },
    { path: "/admin/hr", icon: Briefcase, label: "HR Management" },
    { path: "/admin/maintenance", icon: Wrench, label: "Maintenance" },
    { path: "/admin/tracking", icon: Navigation, label: "Live Tracking" },
    { path: "/admin/reports", icon: FileText, label: "Reports & Analytics" },
    { path: "/admin/users", icon: Shield, label: "User Management" },
    { path: "/admin/settings", icon: Settings, label: "System Settings" },
    { path: "/admin/offices", icon: Building2, label: "Booking Offices" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <Link to="/admin" className="flex items-center gap-2">
            <Bus className="h-6 w-6 text-primary" />
            <div>
              <span className="font-bold text-lg block">KJ Khandala</span>
              <span className="text-xs text-muted-foreground">Admin Control</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4">
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
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
