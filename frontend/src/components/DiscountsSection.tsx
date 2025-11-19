import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Users, Repeat, User, Baby } from "lucide-react";

const discounts = [
  { icon: GraduationCap, label: "Students", discount: "5% Off" },
  { icon: Users, label: "Groups (5–9 passengers)", discount: "5% Off" },
  { icon: Users, label: "Groups (10+ passengers)", discount: "7% Off" },
  { icon: Repeat, label: "Frequent Travellers", discount: "10% Off" },
  { icon: User, label: "Senior Citizens", discount: "15% Off" },
  { icon: Baby, label: "Children", discount: "15% Off" },
];

export default function DiscountsSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="py-16 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 animate-pulse">Discounts & Special Offers</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {discounts.map((item, index) => {
            const Icon = item.icon;
            const isHovered = hoveredIndex === index;
            return (
              <Card 
                key={item.label} 
                className="p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  animation: `float ${3 + index * 0.5}s ease-in-out infinite`,
                  animationDelay: `${index * 0.2}s`
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isHovered ? 'bg-primary scale-110' : ''
                  }`}>
                    <Icon className={`h-6 w-6 transition-colors duration-300 ${
                      isHovered ? 'text-white' : 'text-primary'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.label}</h3>
                    <Badge variant="secondary" className={`text-primary transition-all duration-300 ${
                      isHovered ? 'scale-110 bg-primary text-white' : ''
                    }`}>
                      {item.discount}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          Terms & Conditions Apply
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) rotate(1deg);
          }
          50% {
            transform: translateY(-5px) rotate(-1deg);
          }
          75% {
            transform: translateY(-15px) rotate(0.5deg);
          }
        }
      `}</style>
    </div>
  );
}
