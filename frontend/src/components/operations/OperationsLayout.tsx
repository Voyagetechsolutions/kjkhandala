import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Bus, 
  LayoutDashboard, 
  Activity, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Clock,
  Building2,
  Settings,
  LogOut,
  MapPinned,
  MapPin,
  Calendar,
  UserCog,
  Menu,
  X,
  ClipboardList
} from "lucide-react";

interface OperationsLayoutProps {
  children: ReactNode;
}

export default function OperationsLayout({ children }: OperationsLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/operations", icon: LayoutDashboard, label: "Command Center" },
    { path: "/operations/trips", icon: Activity, label: "Trip Scheduling" },
    { path: "/operations/trip-management", icon: Calendar, label: "Trip Management" },
    { path: "/operations/assign-bus", icon: Bus, label: "Assign Bus" },
    { path: "/operations/driver-shifts", icon: UserCog, label: "Driver Shifts" },
    { path: "/operations/fleet", icon: Bus, label: "Fleet Management" },
    { path: "/operations/drivers", icon: Users, label: "Driver Management" },
    { path: "/operations/tracking", icon: MapPin, label: "Live Tracking" },
    { path: "/operations/cities", icon: MapPinned, label: "City Management" },
    { path: "/operations/routes", icon: MapPin, label: "Route Management" },
    { path: "/operations/incidents", icon: AlertTriangle, label: "Incident Management" },
    { path: "/operations/delays", icon: Clock, label: "Delay Management" },
    { path: "/operations/passenger-manifest", icon: ClipboardList, label: "Passenger Manifest" },
    { path: "/operations/reports", icon: BarChart3, label: "Reports and Analytics" },
    { path: "/operations/terminal", icon: Building2, label: "Terminal Operations" },
    { path: "/operations/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b px-4 py-3 flex items-center justify-between">
        <Link to="/operations" className="flex items-center gap-2">
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
          <Link to="/operations" className="flex items-center gap-2">
            <Bus className="h-6 w-6 text-primary" />
            <div>
              <span className="font-bold text-lg block">KJ Khandala</span>
              <span className="text-xs text-muted-foreground">Operations</span>
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
