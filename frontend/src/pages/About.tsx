import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Bus, Users, Globe, Wifi, Wind, Zap, Shield, Clock, Star } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 to-secondary/10 py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              The KJ Khandala Story — A Legacy Built on Trust, Excellence & Unforgettable Travel Experiences
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Founding Story */}
            <section>
              <h2 className="text-3xl font-bold mb-6">Our Beginning</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-4">
                Founded on <strong>02 October 2013</strong>, <strong>KJ KHANDALA</strong> began with a simple but powerful vision: to create a transport brand that would stand among the greats of Botswana — a name built on trust, excellence, and unforgettable travel experiences.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Inspired by the founding fathers of Botswana's transport industry, <strong>Kagiso Julius Khandala</strong> set out to build a legacy and a household brand that reflects reliability, class, and innovation.
              </p>
            </section>

            {/* Growth Story */}
            <section>
              <h2 className="text-3xl font-bold mb-6">Our Growth</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Over the years, the KJ Khandala's name has grown into a diverse transport and travel group, proudly serving thousands of passengers and organizations with comfort, safety, and professionalism at the core of every journey. Today, the company operates through three specialized subsidiaries, each dedicated to meeting unique travel needs:
              </p>
            </section>

            {/* Three Divisions */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">KJ KHANDALA TRANSPORT</h3>
                <p className="text-sm text-primary font-semibold mb-3">"The Travellers' Choice"</p>
                <p className="text-muted-foreground">
                  Specializing in intercity routes, corporate staff transport, mining staff movement, and reliable executive shuttles. From rugged terrains to city centres, we ensure every passenger reaches their destination comfortably and on time.
                </p>
              </Card>

              <Card className="p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">KJ KHANDALA TRAVEL & TOURS</h3>
                <p className="text-sm text-primary font-semibold mb-3">"Creating Memories"</p>
                <p className="text-muted-foreground">
                  Handles bus hire, shuttles, transfers, excursions, and regional cross-border trips. Every journey is more than transportation — it's an experience designed to create lasting memories.
                </p>
              </Card>

              <Card className="p-6">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">MONEOA TRAVEL & TOURS</h3>
                <p className="text-sm text-primary font-semibold mb-3">"The World Is Yours"</p>
                <p className="text-muted-foreground">
                  Our travel agency division offers complete travel solutions including tour packages, hotel bookings, reservations, flight bookings, train tickets, and MSC Cruise packages.
                </p>
              </Card>
            </div>

            {/* Our Fleet */}
            <section>
              <h2 className="text-3xl font-bold mb-6">Our Fleet — Comfort, Safety & Class</h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                KJ Khandala operates a growing fleet of modern coaches designed for different needs:
              </p>

              <div className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-3">Semi-Luxury 65-Seater</h3>
                  <p className="text-muted-foreground">
                    Used mainly for staff transport, offering comfort, reliability, and efficiency for daily movements.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-3">Luxury 60-Seater Coach</h3>
                  <p className="text-muted-foreground">
                    Perfect for bus hire, tours, shuttles, events, transfers, and long-distance comfort travel.
                  </p>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-3">Premium Luxury 60-Seater Coach (With Toilet)</h3>
                  <p className="text-muted-foreground mb-4">
                    Our flagship coach, ideal for premium trips, cross-border travel, VIP transport, tour groups, and special events.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-primary" />
                      <span>On-board toilet</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="h-4 w-4 text-primary" />
                      <span>Wi-Fi</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Wind className="h-4 w-4 text-primary" />
                      <span>Fully air-conditioned</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-primary" />
                      <span>USB charging ports</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-primary" />
                      <span>Reclining seats</span>
                    </div>
                  </div>
                </Card>
              </div>
            </section>

            {/* Our Promise */}
            <section className="bg-muted/30 p-8 rounded-lg">
              <h2 className="text-3xl font-bold mb-6 text-center">Our Promise</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Safety First</h3>
                    <p className="text-muted-foreground">Professional drivers and strict vehicle maintenance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Comfort & Prestige</h3>
                    <p className="text-muted-foreground">Luxury interiors and climate-controlled travel</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Reliability</h3>
                    <p className="text-muted-foreground">On-time service you can depend on</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Experience & Elegance</h3>
                    <p className="text-muted-foreground">A signature touch that makes every trip memorable</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Target Market */}
            <section>
              <h2 className="text-3xl font-bold mb-6">Our Target Market</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                We proudly serve everyone — individuals, families, tourists, schools, churches, corporates, government, parastatals, NGO projects, mining companies, and any organization seeking safe, stylish, and reliable transport.
              </p>
            </section>

            {/* Closing Statement */}
            <section className="text-center py-8">
              <h2 className="text-3xl font-bold mb-4">The Heart of Our Brand</h2>
              <p className="text-xl text-muted-foreground leading-relaxed mb-6">
                KJ Khandala is more than a company — it's a vision, a legacy, and a commitment to excellence in every mile.
              </p>
              <p className="text-2xl font-bold text-primary">
                We move people, but we also move experiences, businesses, dreams, and memories.
              </p>
              <p className="text-xl font-semibold mt-6">
                KJ KHANDALA — A NAME BUILT TO LAST. A JOURNEY BUILT FOR YOU.
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
