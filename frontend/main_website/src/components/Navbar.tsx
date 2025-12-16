import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import CurrencySelector from "@/components/CurrencySelector";
import { redirectToLogin, isAuthenticated, clearAuth, getStoredAuth } from "@/lib/vts-integration";

export default function Navbar() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Link to="/careers" className="text-sm font-medium hover:text-primary transition-colors">
              Careers
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-3">
            <CurrencySelector />
            <Link to="/faqs">
              <Button variant="outline" size="sm">
                FAQs
              </Button>
            </Link>
            {isAuthenticated() ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  clearAuth();
                  window.location.reload();
                }}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => redirectToLogin()}
              >
                <User className="h-4 w-4 mr-1" />
                Login
              </Button>
            )}
            <Link to="/contact">
              <Button size="sm">Get in Touch</Button>
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
            <Link 
              to="/careers" 
              className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              Careers
            </Link>
            <Link 
              to="/faqs" 
              className="block px-4 py-2 text-sm font-medium hover:bg-muted rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQs
            </Link>
            <div className="px-4 pt-2 space-y-2">
              <CurrencySelector />
              {isAuthenticated() ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    clearAuth();
                    setMobileMenuOpen(false);
                    window.location.reload();
                  }}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    redirectToLogin();
                  }}
                >
                  <User className="h-4 w-4 mr-1" />
                  Login
                </Button>
              )}
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
                <Button size="sm" className="w-full">Get in Touch</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
