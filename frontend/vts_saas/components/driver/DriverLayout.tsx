import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Bus, 
  Home, 
  ClipboardList, 
  Users, 
  Play, 
  Navigation, 
  Coffee,
  AlertTriangle,
  StopCircle,
  UserCircle,
  MapPin,
  LogOut 
} from "lucide-react";

interface DriverLayoutProps {
  children: ReactNode;
}

export default function DriverLayout({ children }: DriverLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: "/driver", icon: Home, label: "Home" },
    { path: "/driver/trip-details", icon: ClipboardList, label: "Trip Details" },
    { path: "/driver/manifest", icon: Users, label: "Manifest" },
    { path: "/driver/start-trip", icon: Play, label: "Start Trip" },
    { path: "/driver/live", icon: Navigation, label: "Live Trip" },
    { path: "/driver/stops", icon: Coffee, label: "Log Stop" },
    { path: "/driver/border-control", icon: MapPin, label: "Border Control" },
    { path: "/driver/report", icon: AlertTriangle, label: "Report Issue" },
    { path: "/driver/end-trip", icon: StopCircle, label: "End Trip" },
    { path: "/driver/profile", icon: UserCircle, label: "Profile" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <Link to="/driver" className="flex items-center gap-2">
            <Bus className="h-6 w-6 text-primary" />
            <div>
              <span className="font-bold text-lg block">KJ Khandala</span>
              <span className="text-xs text-muted-foreground">Driver Portal</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-4 rounded-lg transition-colors text-base font-semibold
                      ${isActive
                        ? "bg-primary text-white shadow-md"
                        : "hover:bg-muted hover:shadow"
                      }
                    `}
                  >
                    <Icon className="h-6 w-6" />
                    <span>{item.label}</span>
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
