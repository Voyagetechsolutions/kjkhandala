import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { GraduationCap, Church, Briefcase, PartyPopper, Users, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const charterTypes = [
  { icon: GraduationCap, title: "Schools", description: "Safe and comfortable transport for school trips and excursions" },
  { icon: Church, title: "Churches", description: "Reliable transport for church events, conferences, and retreats" },
  { icon: Briefcase, title: "Corporates", description: "Professional transport solutions for corporate events and staff" },
  { icon: PartyPopper, title: "Events", description: "Special event transport for conferences, festivals, and gatherings" },
  { icon: Users, title: "Weddings", description: "Elegant transport for your special day" },
  { icon: MapPin, title: "Tours", description: "Comfortable coaches for tour groups and sightseeing" },
];

export default function Charters() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    charterType: "",
    passengers: "",
    date: "",
    destination: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Charter Request Sent!",
      description: "We'll get back to you within 24 hours with a quote.",
    });
    setFormData({
      name: "",
      email: "",
      phone: "",
      organization: "",
      charterType: "",
      passengers: "",
      date: "",
      destination: "",
      message: "",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Group & Corporate Charters</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Reliable, premium transport for schools, churches, corporates, events, weddings, and tours
            </p>
          </div>
        </div>

        {/* Charter Types */}
        <div className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">We Serve</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {charterTypes.map((type) => {
              const Icon = type.icon;
              return (
                <Card key={type.title} className="p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{type.title}</h3>
                  <p className="text-muted-foreground">{type.description}</p>
                </Card>
              );
            })}
          </div>

          {/* Quote Request Form */}
          <div className="max-w-3xl mx-auto">
            <Card className="p-8">
              <h2 className="text-3xl font-bold mb-6 text-center">Request a Charter Quote</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+267 XX XXX XXX"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="organization">Organization/Company</Label>
                    <Input
                      id="organization"
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      placeholder="Organization name"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="charterType">Charter Type *</Label>
                    <select
                      id="charterType"
                      value={formData.charterType}
                      onChange={(e) => setFormData({ ...formData, charterType: e.target.value })}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-ring"
                      required
                    >
                      <option value="">Select type</option>
                      <option value="school">School Trip</option>
                      <option value="church">Church Event</option>
                      <option value="corporate">Corporate Event</option>
                      <option value="wedding">Wedding</option>
                      <option value="tour">Tour/Excursion</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="passengers">Number of Passengers *</Label>
                    <Input
                      id="passengers"
                      type="number"
                      min="1"
                      value={formData.passengers}
                      onChange={(e) => setFormData({ ...formData, passengers: e.target.value })}
                      placeholder="e.g., 50"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Preferred Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="destination">Destination</Label>
                    <Input
                      id="destination"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="Where are you going?"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="message">Additional Details</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us more about your charter requirements..."
                    rows={5}
                  />
                </div>

                <Button type="submit" size="lg" className="w-full">
                  Request Charter Quote
                </Button>
              </form>
            </Card>
          </div>

          {/* Contact Info */}
          <div className="mt-12 text-center">
            <h3 className="text-2xl font-bold mb-4">Or Contact Us Directly</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <a href="tel:+26771799129" className="text-primary hover:underline">
                📞 +267 71 799 129
              </a>
              <span className="hidden md:inline text-muted-foreground">|</span>
              <a 
                href="https://wa.me/26773442135" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                📱 WhatsApp +267 73 442 135
              </a>
              <span className="hidden md:inline text-muted-foreground">|</span>
              <a href="mailto:info@kjkhandala.com" className="text-primary hover:underline">
                📧 info@kjkhandala.com
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
