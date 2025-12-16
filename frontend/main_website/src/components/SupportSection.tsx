import { Card } from "@/components/ui/card";
import { Phone, MessageCircle, Mail } from "lucide-react";

export default function SupportSection() {
  return (
    <div className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Need Help? We're Here 24/7</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Call Us</h3>
            <a href="tel:+26771799129" className="text-primary hover:underline block mb-1">
              📞 +267 71 799 129
            </a>
            <a href="tel:+26772692610" className="text-primary hover:underline block">
              📞 +267 72 692 610
            </a>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">WhatsApp</h3>
            <a 
              href="https://wa.me/26773442135" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline block"
            >
              📱 +267 73 442 135
            </a>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Email</h3>
            <a href="mailto:info@kjkhandala.com" className="text-primary hover:underline block">
              📧 info@kjkhandala.com
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}
