import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Phone, MapPin, Building2 } from "lucide-react";
import HeroCarousel from "./HeroCarousel";

export default function Hero() {
  const navigate = useNavigate();

  return (
    <div className="bg-background">
      {/* Hero Banner */}
      <div className="relative min-h-[500px] flex items-center justify-center bg-gradient-to-br from-primary via-primary-hover to-secondary overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjIiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-10" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fade-in">
            Welcome to KJ Khandala
          </h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto animate-fade-in">
            South Africa's favourite premium coach solution since 1984
          </p>
        </div>
      </div>

      {/* Three Cards Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Online Bookings */}
          <Card className="p-6 text-center hover:shadow-elegant transition-shadow">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Online Bookings</h3>
            <p className="text-muted-foreground mb-6">
              Book your KJ Khandala bus tickets online from the comfort of your own home.
            </p>
            <Button onClick={() => navigate("/routes")} className="w-full">
              Book Online Now
            </Button>
          </Card>

          {/* Phone Bookings */}
          <Card className="p-6 text-center hover:shadow-elegant transition-shadow">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Phone Bookings</h3>
            <p className="text-muted-foreground mb-6">
              Our call centre operates 24 hours a day, 365 days a year, for around-the-clock support.
            </p>
            <Button asChild variant="secondary" className="w-full">
              <a href="tel:+26771799129">Call +267 71 799 129</a>
            </Button>
          </Card>

          {/* Booking Offices */}
          <Card className="p-6 text-center hover:shadow-elegant transition-shadow">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-3">Booking Offices</h3>
            <p className="text-muted-foreground mb-6">
              Book your KJ Khandala bus tickets in person at one of our many booking offices.
            </p>
            <Button onClick={() => navigate("/booking-offices")} variant="outline" className="w-full">
              Find a location
            </Button>
          </Card>
        </div>
      </div>

      {/* Our Popular Routes Section */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Our Popular Routes</h2>
          
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Slideshow */}
            <div>
              <HeroCarousel />
            </div>

            {/* About Text */}
            <div className="space-y-4">
              <p className="text-lg leading-relaxed">
                Since 1984, KJ Khandala has brought you South Africa's favourite premium coach solution, 
                connecting cities as old as the country itself and towns as brilliantly curious as the 
                cultures that connect us.
              </p>
              <p className="text-lg leading-relaxed">
                KJ Khandala will continue to be the safe and reliable premium coach traveling partner with 
                high standards and morals. When luxury yearns for affordability, our liners shine the brightest. 
                Our coaches are built to 5-star specifications and an experience defined by professionalism, 
                punctuality and good ol' fashioned politeness.
              </p>
              <Button onClick={() => navigate("/routes")} size="lg" className="mt-6">
                View All Routes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
