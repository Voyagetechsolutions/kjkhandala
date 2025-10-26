import { Bus, Phone, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-card border-t mt-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Top Section - Contact */}
        <div className="text-center mb-8 pb-8 border-b">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-lg">
            <a href="tel:+26771799129" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone className="h-5 w-5" />
              <span>+267 71 799 129</span>
            </a>
            <span className="hidden md:inline text-muted-foreground">|</span>
            <a 
              href="https://wa.me/26773442135" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span>WhatsApp +267 73 442 135</span>
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/routes" className="text-muted-foreground hover:text-primary transition-colors">
                  Schedule on Time
                </Link>
              </li>
              <li>
                <Link to="/routes" className="text-muted-foreground hover:text-primary transition-colors">
                  Online Booking
                </Link>
              </li>
              <li>
                <Link to="/our-coaches" className="text-muted-foreground hover:text-primary transition-colors">
                  Meet Our Team
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors">
                  FAQ & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Get In Touch */}
          <div>
            <h3 className="font-semibold mb-4">Get In Touch</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="tel:+26771799129" className="text-muted-foreground hover:text-primary transition-colors">
                  +267 71 799 129
                </a>
              </li>
              <li>
                <a 
                  href="https://wa.me/26773442135" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  WhatsApp +267 73 442 135
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Bus className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">KJ Khandala</span>
          </div>
          <p>&copy; {new Date().getFullYear()} KJ Khandala. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
