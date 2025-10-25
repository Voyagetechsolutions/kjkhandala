import { Button } from "@/components/ui/button";
import { Bus, MapPin, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Hero() {
  return (
    <div className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-primary via-primary-hover to-primary">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnptLTEyIDI0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center text-white mb-12 space-y-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Bus className="h-12 w-12" />
            <h1 className="text-5xl md:text-7xl font-bold">Voyage Bus</h1>
          </div>
          <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto">
            Your journey begins here. Book comfortable bus travel across Botswana with ease.
          </p>
        </div>

        {/* Search Card */}
        <Card className="max-w-4xl mx-auto p-6 md:p-8 shadow-2xl">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground mb-6">Find Your Route</h2>
            
            <div className="grid md:grid-cols-3 gap-4">
              {/* From */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  From
                </label>
                <select className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent transition-all">
                  <option>Select city</option>
                  <option>Gaborone</option>
                  <option>Francistown</option>
                  <option>Maun</option>
                </select>
              </div>

              {/* To */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  To
                </label>
                <select className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent transition-all">
                  <option>Select destination</option>
                  <option>Durban</option>
                  <option>Johannesburg</option>
                  <option>Pretoria</option>
                </select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Travel Date
                </label>
                <input 
                  type="date" 
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>
            </div>

            <Button className="w-full mt-6" size="lg">
              Search Available Buses
            </Button>
          </div>
        </Card>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          {[
            { icon: "🎫", title: "Easy Booking", desc: "Book in minutes" },
            { icon: "💳", title: "Secure Payment", desc: "Safe & encrypted" },
            { icon: "📱", title: "E-Tickets", desc: "Instant confirmation" }
          ].map((feature, i) => (
            <Card key={i} className="p-6 text-center bg-white/95 backdrop-blur hover:shadow-lg transition-shadow">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}