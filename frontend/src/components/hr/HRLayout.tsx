import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Bus, 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Clock, 
  DollarSign, 
  Award,
  FileCheck,
  Calendar,
  BarChart3,
  Settings,
  LogOut 
} from "lucide-react";

interface HRLayoutProps {
  children: ReactNode;
}

export default function HRLayout({ children }: HRLayoutProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const navItems = [
    { path: "/hr", icon: LayoutDashboard, label: "HR Home" },
    { path: "/hr/employees", icon: Users, label: "Employee Management" },
    { path: "/hr/recruitment", icon: UserPlus, label: "Recruitment & Onboarding" },
    { path: "/hr/attendance", icon: Clock, label: "Attendance" },
    { path: "/hr/payroll", icon: DollarSign, label: "Payroll Management" },
    { path: "/hr/performance", icon: Award, label: "Performance Evaluation" },
    { path: "/hr/compliance", icon: FileCheck, label: "Compliance & Certifications" },
    { path: "/hr/leave", icon: Calendar, label: "Leave & Time-Off" },
    { path: "/hr/reports", icon: BarChart3, label: "Reports & Analytics" },
    { path: "/hr/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 border-b">
          <Link to="/hr" className="flex items-center gap-2">
            <Bus className="h-6 w-6 text-primary" />
            <div>
              <span className="font-bold text-lg block">KJ Khandala</span>
              <span className="text-xs text-muted-foreground">Human Resources</span>
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
