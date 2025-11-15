import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, Globe, Briefcase, Users, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

const services = [
  {
    title: "Intercity Travel",
    description: "Reliable local and long-distance routes across Botswana & South Africa.",
    icon: Bus,
    action: "Learn More",
    link: "/routes",
  },
  {
    title: "Cross-Border Travel",
    description: "Seamless regional trips handled by trained international drivers.",
    icon: Globe,
    action: "Learn More",
    link: "/routes",
  },
  {
    title: "Luxury Charters",
    description: "Corporate, school, church & event charters with premium safety standards.",
    icon: Briefcase,
    action: "Get a Quote",
    link: "/charters",
  },
  {
    title: "Staff Transport",
    description: "Safe and efficient workforce mobility for companies and mines.",
    icon: Users,
    action: "Learn More",
    link: "/charters",
  },
  {
    title: "Parcel Services",
    description: "Fast, secure parcel delivery across Botswana and South Africa.",
    icon: Package,
    action: "Send Parcel",
    link: "/contact",
  },
];

export default function ServicesSection() {
  const navigate = useNavigate();

  return (
    <div className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
          <p className="text-lg text-muted-foreground">
            Premium coach solutions for every type of traveller.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Card key={service.title} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col h-full">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                  <p className="text-muted-foreground mb-6 flex-1">{service.description}</p>
                  <Button
                    onClick={() => navigate(service.link)}
                    variant={service.action === "Get a Quote" ? "default" : "outline"}
                    className="w-full"
                  >
                    {service.action}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
