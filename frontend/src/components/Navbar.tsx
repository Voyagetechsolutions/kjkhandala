import { Button } from "@/components/ui/button";
import { Bus, User, Menu, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CurrencySelector from "@/components/CurrencySelector";

export default function Navbar() {
  const { user, isAdmin, userRoles, signOut } = useAuth();

  // Get all dashboard links based on user roles
  const getDashboardLinks = () => {
    const links = [];
    
    if (isAdmin || userRoles?.includes('SUPER_ADMIN')) {
      links.push({ path: '/admin', label: 'Admin' });
    }
    if (userRoles?.includes('OPERATIONS_MANAGER')) {
      links.push({ path: '/operations', label: 'Operations' });
    }
    if (userRoles?.includes('TICKETING_AGENT') || userRoles?.includes('TICKETING_SUPERVISOR')) {
      links.push({ path: '/ticketing', label: 'Ticketing' });
    }
    if (userRoles?.includes('FINANCE_MANAGER')) {
      links.push({ path: '/finance', label: 'Finance' });
    }
    if (userRoles?.includes('HR_MANAGER')) {
      links.push({ path: '/hr', label: 'HR' });
    }
    if (userRoles?.includes('MAINTENANCE_MANAGER')) {
      links.push({ path: '/maintenance', label: 'Maintenance' });
    }
    if (userRoles?.includes('DRIVER')) {
      links.push({ path: '/driver', label: 'Driver' });
    }
    
    return links;
  };

  const dashboardLinks = getDashboardLinks();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Bus className="h-6 w-6 text-primary" />
            <span>KJ Khandala</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </Link>
            <Link to="/routes" className="text-sm font-medium hover:text-primary transition-colors">
              Routes
            </Link>
            <Link to="/our-coaches" className="text-sm font-medium hover:text-primary transition-colors">
              Our Coaches
            </Link>
            <Link to="/booking-offices" className="text-sm font-medium hover:text-primary transition-colors">
              Booking Offices
            </Link>
            <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">
              Contact
            </Link>
            {user && (
              <Link to="/my-bookings" className="text-sm font-medium hover:text-primary transition-colors">
                My Bookings
              </Link>
            )}
            {dashboardLinks.map((dashboard) => (
              <Link 
                key={dashboard.path}
                to={dashboard.path} 
                className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-md hover:bg-primary/20 transition-colors"
              >
                {dashboard.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <CurrencySelector />
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
}