import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Bus, 
  LayoutDashboard, 
  DollarSign, 
  TrendingDown, 
  Users, 
  Fuel, 
  FileText, 
  RefreshCw,
  BarChart3,
  Landmark,
  Settings,
  LogOut 
} from "lucide-react";

interface FinanceLayoutProps {
  children: ReactNode;
}

export default function FinanceLayout({ children }: FinanceLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: "/finance", icon: LayoutDashboard, label: "Finance Home" },
    { path: "/finance/income", icon: DollarSign, label: "Income Management" },
    { path: "/finance/expenses", icon: TrendingDown, label: "Expense Management" },
    { path: "/finance/payroll", icon: Users, label: "Payroll Management" },
    { path: "/finance/fuel-allowance", icon: Fuel, label: "Fuel & Allowances" },
    { path: "/finance/invoices", icon: FileText, label: "Invoices & Billing" },
    { path: "/finance/refunds", icon: RefreshCw, label: "Refunds & Adjustments" },
    { path: "/finance/reports", icon: BarChart3, label: "Reports & Analytics" },
    { path: "/finance/accounts", icon: Landmark, label: "Accounts & Reconciliation" },
    { path: "/finance/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <Link to="/finance" className="flex items-center gap-2">
            <Bus className="h-6 w-6 text-primary" />
            <div>
              <span className="font-bold text-lg block">KJ Khandala</span>
              <span className="text-xs text-muted-foreground">Finance</span>
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
