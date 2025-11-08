import { ReactNode } from "react";
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
  LogOut 
} from "lucide-react";

interface OperationsLayoutProps {
  children: ReactNode;
}

export default function OperationsLayout({ children }: OperationsLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: "/operations", icon: LayoutDashboard, label: "Control Center" },
    { path: "/operations/trips", icon: Activity, label: "Trip Management" },
    { path: "/operations/fleet", icon: Bus, label: "Fleet Operations" },
    { path: "/operations/drivers", icon: Users, label: "Driver Operations" },
    { path: "/operations/incidents", icon: AlertTriangle, label: "Incident Management" },
    { path: "/operations/delays", icon: Clock, label: "Delay Management" },
    { path: "/operations/reports", icon: BarChart3, label: "Reports & Analytics" },
    { path: "/operations/terminal", icon: Building2, label: "Terminal Operations" },
    { path: "/operations/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <Link to="/operations" className="flex items-center gap-2">
            <Bus className="h-6 w-6 text-primary" />
            <div>
              <span className="font-bold text-lg block">KJ Khandala</span>
              <span className="text-xs text-muted-foreground">Operations</span>
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
