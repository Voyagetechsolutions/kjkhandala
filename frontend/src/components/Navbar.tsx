import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bus, User, Menu, LogOut, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import CurrencySelector from "@/components/CurrencySelector";

export default function Navbar() {
  const { user, isAdmin, userRoles, signOut } = useAuth();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="KJ Khandala" className="h-16 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {!isHomePage && (
              <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                Home
              </Link>
            )}
            <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/our-coaches" className="text-sm font-medium hover:text-primary transition-colors">
              Our Fleet
            </Link>
            <Link to="/charters" className="text-sm font-medium hover:text-primary transition-colors">
              Charters
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

          {/* Right Side Icons */}
          <div className="hidden md:flex items-center gap-3">
            <CurrencySelector />
            {user ? (
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
            <Link to="/routes">
              <Button size="sm">Book Now</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t py-4 space-y-3">
            {!isHomePage && (
              <Link 
                to="/" 
                className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
            )}
            <Link 
              to="/about" 
              className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link 
              to="/our-coaches" 
              className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Our Fleet
            </Link>
            <Link 
              to="/charters" 
              className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Charters
            </Link>
            <Link 
              to="/contact" 
              className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            {user && (
              <Link 
                to="/my-bookings" 
                className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Bookings
              </Link>
            )}
            {dashboardLinks.map((dashboard) => (
              <Link 
                key={dashboard.path}
                to={dashboard.path} 
                className="block px-4 py-2 text-sm font-medium bg-primary/10 text-primary rounded-md hover:bg-primary/20"
                onClick={() => setMobileMenuOpen(false)}
              >
                {dashboard.label}
              </Link>
            ))}
            <div className="px-4 pt-2 space-y-2">
              <CurrencySelector />
              {user ? (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              )}
              <Link to="/routes" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full">Book Now</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}