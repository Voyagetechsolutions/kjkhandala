import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Bus, LayoutDashboard, LogOut, Ticket, CreditCard, Users, FileText,
  RefreshCw, AlertTriangle, BarChart3, Search, Clock
} from "lucide-react";

interface TicketingLayoutProps {
  children: ReactNode;
}

export default function TicketingLayout({ children }: TicketingLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const menuItems = [
    { path: "/ticketing", icon: LayoutDashboard, label: "Control Panel" },
    { path: "/ticketing/search-trips", icon: Search, label: "Search Trips" },
    { path: "/ticketing/reserved", icon: Clock, label: "Reserved Tickets" },
    { path: "/ticketing/seat-selection", icon: LayoutDashboard, label: "Seat Selection" },
    { path: "/ticketing/passenger-details", icon: Users, label: "Passenger Details" },
    { path: "/ticketing/payment", icon: CreditCard, label: "Payment" },
    { path: "/ticketing/booking-summary", icon: FileText, label: "Booking Summary" },
    { path: "/ticketing/issue-ticket", icon: Ticket, label: "Issue Ticket" },
    { path: "/ticketing/modify-booking", icon: RefreshCw, label: "Modify Booking" },
    { path: "/ticketing/cancel-refund", icon: AlertTriangle, label: "Cancel & Refund" },
    { path: "/ticketing/customer-lookup", icon: Users, label: "Customer Lookup" },
    { path: "/ticketing/reports", icon: BarChart3, label: "Reports" },
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

        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
