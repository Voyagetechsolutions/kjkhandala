import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Wifi, Wind, Zap, Phone, MessageCircle } from "lucide-react";

// Fleet images
const fleetImages = [
  { id: 1, name: "Scania Luxury Coach", image: "/scania4.jpg", capacity: 60 },
  { id: 2, name: "Scania Premium", image: "/scania4.jpg", capacity: 60 },
  { id: 3, name: "Scania Executive", image: "/scania4.jpg", capacity: 60 },
  { id: 4, name: "Scania Comfort", image: "/scania4.jpg", capacity: 60 },
  { id: 5, name: "Torino Elite", image: "/torino1.jpg", capacity: 60 },
  { id: 6, name: "Torino Premium", image: "/torino2.jpg", capacity: 60 },
  { id: 7, name: "Torino Deluxe", image: "/torino3.jpg", capacity: 60 },
  { id: 8, name: "Torino Executive", image: "/torino4.jpg", capacity: 60 },
  { id: 9, name: "Express Coach 1", image: "/2buses3.jpg", capacity: 60 },
  { id: 10, name: "Express Coach 2", image: "/2buses4.jpg", capacity: 60 },
  { id: 11, name: "Express Coach 3", image: "/2buses5.jpg", capacity: 60 },
  { id: 12, name: "Express Coach 4", image: "/2buses6.jpg", capacity: 60 },
  { id: 13, name: "Express Coach 5", image: "/2buses7.jpg", capacity: 60 },
  { id: 14, name: "Express Coach 6", image: "/2buses8.jpg", capacity: 60 },
];

export default function OurCoaches() {

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Our Premium Coaches</h1>
          <p className="text-muted-foreground">
            Experience travel the way it should be—luxurious, spacious, and comfortable.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mb-6">Our Fleet</h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fleetImages.map((bus) => (
            <Card key={bus.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Bus Image */}
              <div className="h-48 overflow-hidden bg-gray-100">
                <img 
                  src={bus.image} 
                  alt={bus.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback if image doesn't load
                    e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23e5e7eb" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%236b7280" font-size="20">Bus Image</text></svg>';
                  }}
                />
              </div>

              {/* Bus Details */}
              <div className="p-6 space-y-3">
                <div>
                  <h3 className="text-xl font-bold">{bus.name}</h3>
                  <p className="text-sm text-muted-foreground">Premium Luxury Coach</p>
                </div>

                <div className="flex gap-2">
                  <Badge variant="secondary">
                    2x2 Seating
                  </Badge>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {bus.capacity} Seats
                  </Badge>
                </div>

                {/* Features */}
                <div className="pt-3 border-t space-y-2">
                  <p className="text-sm font-medium">Features:</p>
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Wifi className="h-4 w-4" />
                      <span>WiFi</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Wind className="h-4 w-4" />
                      <span>Air Con</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Zap className="h-4 w-4" />
                      <span>USB Ports</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <Card className="p-6 mt-12 text-center bg-muted/30">
          <h3 className="text-lg font-semibold mb-2">Contact</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-4">
            <a href="tel:+26771799129" className="flex items-center gap-2 text-primary hover:underline">
              <Phone className="h-5 w-5" />
              <span>📞 +267 71 799 129</span>
            </a>
            <span className="hidden md:inline text-muted-foreground">|</span>
            <a 
              href="https://wa.me/26773442135" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <MessageCircle className="h-5 w-5" />
              <span>📱 WhatsApp +267 73 442 135</span>
            </a>
          </div>
        </Card>
      </main>
      
      <Footer />
    </div>
  );
}
