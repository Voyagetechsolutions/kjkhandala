import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Bus, 
  LayoutDashboard, 
  Search, 
  Ticket, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  Users, 
  FileText, 
  Settings,
  LogOut 
} from "lucide-react";

interface TicketingLayoutProps {
  children: ReactNode;
}

export default function TicketingLayout({ children }: TicketingLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: "/ticketing", icon: LayoutDashboard, label: "Control Panel" },
    { path: "/ticketing/sell", icon: Ticket, label: "Sell Ticket" },
    { path: "/ticketing/find", icon: Search, label: "Find/Modify Ticket" },
    { path: "/ticketing/check-in", icon: CheckCircle2, label: "Check-In" },
    { path: "/ticketing/payments", icon: CreditCard, label: "Payments & Cash Register" },
    { path: "/ticketing/manifest", icon: Users, label: "Passenger Manifest" },
    { path: "/ticketing/reports", icon: FileText, label: "Reports & Audit" },
    { path: "/ticketing/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <Link to="/ticketing" className="flex items-center gap-2">
            <Bus className="h-6 w-6 text-primary" />
            <div>
              <span className="font-bold text-lg block">KJ Khandala</span>
              <span className="text-xs text-muted-foreground">Ticketing</span>
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
