import { Card } from "@/components/ui/card";
import { Star, Clock, Shield, DollarSign } from "lucide-react";

const pillars = [
  {
    icon: Star,
    title: "Premium Coaches",
    description: "5-star build quality, AC, reclining seats, safety-first design.",
  },
  {
    icon: Clock,
    title: "Punctual & Reliable",
    description: "Strict schedules, professional drivers, 24/7 support.",
  },
  {
    icon: Shield,
    title: "Safety First",
    description: "Licensed drivers & regularly maintained fleet.",
  },
  {
    icon: DollarSign,
    title: "Affordable Luxury",
    description: "Pay less, travel comfortably.",
  },
];

export default function WhyChooseUsSection() {
  return (
    <div className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Travel with KJ Khandala?</h2>
          <p className="text-lg text-muted-foreground">
            Premium comfort backed by 40+ years of trusted service.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{pillar.title}</h3>
                <p className="text-muted-foreground">{pillar.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
