import { Bus, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  Services
                </Link>
              </li>
              <li>
                <Link to="/charters" className="text-muted-foreground hover:text-primary transition-colors">
                  Charters
                </Link>
              </li>
              <li>
                <Link to="/our-coaches" className="text-muted-foreground hover:text-primary transition-colors">
                  Our Fleet
                </Link>
              </li>
              <li>
                <Link to="/routes" className="text-muted-foreground hover:text-primary transition-colors">
                  Routes
                </Link>
              </li>
              <li>
                <Link to="/booking-offices" className="text-muted-foreground hover:text-primary transition-colors">
                  Booking Offices
                </Link>
              </li>
              <li>
                <Link to="/careers" className="text-muted-foreground hover:text-primary transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          {/* Travel Information */}
          <div>
            <h3 className="font-semibold mb-4">Travel Information</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faqs" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link to="/ticket-rules" className="text-muted-foreground hover:text-primary transition-colors">
                  Ticket Rules
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/service-advisories" className="text-muted-foreground hover:text-primary transition-colors">
                  Service Advisories
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/risk" className="text-muted-foreground hover:text-primary transition-colors">
                  Acceptance of Risk
                </Link>
              </li>
            </ul>
          </div>

          {/* Get In Touch */}
          <div>
            <h3 className="font-semibold mb-4">Get In Touch</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="tel:+26771799129" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +267 71 799 129
                </a>
              </li>
              <li>
                <a href="tel:+26772692610" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  +267 72 692 610
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/26773442135" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp +267 73 442 135
                </a>
              </li>
              <li>
                <a href="mailto:info@kjkhandala.com" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Bus className="h-4 w-4" />
                  info@kjkhandala.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="font-semibold mb-4">Social Media</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  TikTok
                </a>
              </li>
              <li>
                <a href="#" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} KJ Khandala Travel & Tours. All Rights Reserved.</p>
          <p className="mt-2">Built by <a href="https://voyagetechsolutions.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Voyagetech Solutions</a></p>
        </div>
      </div>
    </footer>
  );
}
