import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Building2,
  Users,
  Activity,
  DollarSign,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Server,
  Database,
  Key,
  Globe,
  AlertTriangle,
  FileText,
  Send,
  Wrench,
  Shield,
  Menu,
  X,
  Rocket,
  HelpCircle,
  Code2,
  Plus,
} from "lucide-react";

interface PlatformLayoutProps {
  children: ReactNode;
}

const navigation = [
  {
    name: "Overview",
    href: "/platform",
    icon: LayoutDashboard,
  },
  {
    name: "Tenants",
    href: "/platform/tenants",
    icon: Building2,
  },
  {
    name: "Onboard Company",
    href: "/platform/onboarding",
    icon: Plus,
  },
  {
    name: "Users",
    href: "/platform/users",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/platform/analytics",
    icon: Activity,
  },
  {
    name: "Billing",
    items: [
      { name: "Overview", href: "/platform/billing", icon: DollarSign },
      { name: "Subscription Plans", href: "/platform/plans", icon: DollarSign },
    ],
  },
  {
    name: "System",
    items: [
      { name: "Monitoring", href: "/platform/monitoring", icon: Server },
      { name: "Error Logs", href: "/platform/logs", icon: AlertTriangle },
      { name: "Database", href: "/platform/database", icon: Database },
      { name: "API Keys", href: "/platform/api-keys", icon: Key },
    ],
  },
  {
    name: "Configuration",
    items: [
      { name: "Global Settings", href: "/platform/settings", icon: Settings },
      { name: "Integrations", href: "/platform/integrations", icon: Globe },
      { name: "Feature Flags", href: "/platform/features", icon: Rocket },
      { name: "Templates", href: "/platform/templates", icon: FileText },
    ],
  },
  {
    name: "Support",
    items: [
      { name: "Announcements", href: "/platform/announcements", icon: Send },
      { name: "Support Tools", href: "/platform/support", icon: Wrench },
      { name: "Impersonate", href: "/platform/impersonate", icon: Shield },
    ],
  },
];

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(["System", "Configuration"]);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get admin email from localStorage or session
    const email = localStorage.getItem("platform_admin_email");
    setAdminEmail(email);
  }, []);

  const toggleSection = (name: string) => {
    setExpandedSections((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = async () => {
    // Sign out from Supabase
    await supabase.auth.signOut();
    // Clear platform admin session
    localStorage.removeItem("platform_admin_token");
    localStorage.removeItem("platform_admin_email");
    toast.success("Logged out successfully");
    navigate("/platform/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-white">
        <div className="flex h-16 items-center px-4 md:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link to="/platform" className="flex items-center gap-2 mr-8">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Code2 className="h-5 w-5 text-white" />
            </div>
            <div className="hidden md:block">
              <span className="font-bold text-lg">VTS Platform</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                Admin
              </Badge>
            </div>
          </Link>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* System Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-700">All Systems Operational</span>
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Help */}
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 pl-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/admin.png" />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {adminEmail ? adminEmail.substring(0, 2).toUpperCase() : "SA"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">Platform Admin</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                      {adminEmail || "admin@voyagetech.com"}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Key className="mr-2 h-4 w-4" />
                  API Keys
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 
            bg-white border-r overflow-y-auto
            transform transition-transform duration-200 ease-in-out
            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
        >
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              if ("items" in item) {
                // Section with sub-items
                const isExpanded = expandedSections.includes(item.name);
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => toggleSection(item.name)}
                      className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-100 rounded-lg"
                    >
                      <span>{item.name}</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </button>
                    {isExpanded && (
                      <div className="ml-2 space-y-1">
                        {item.items.map((subItem) => (
                          <Link
                            key={subItem.href}
                            to={subItem.href}
                            className={`
                              flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors
                              ${isActive(subItem.href)
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-muted-foreground hover:bg-slate-100"
                              }
                            `}
                          >
                            <subItem.icon className="h-4 w-4" />
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Regular nav item
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`
                    flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors
                    ${isActive(item.href)
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-muted-foreground hover:bg-slate-100"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white space-y-3">
            <Button 
              variant="outline" 
              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <div className="text-xs text-muted-foreground">
              <p>VTS Platform v2.1.0</p>
              <p className="mt-1">© 2024 Voyage Tech Solutions</p>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
