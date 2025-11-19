import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AboutStorySection() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation when component mounts
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="py-16 bg-background overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image on Left - Slides in from left */}
          <div
            className={`transform transition-all duration-1000 ${
              isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
            }`}
          >
            <img
              src="/whitebgbuseskj.png"
              alt="KJ Khandala Buses"
              className="rounded-lg shadow-2xl w-full h-auto"
            />
          </div>

          {/* Content on Right */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Our Story</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Since 1984, KJ Khandala has delivered safe, reliable and comfortable travel across Southern Africa.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Our fleet is built to premium specifications, and every trip is defined by professionalism, punctuality and good old-fashioned courtesy.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Whether you're booking a vacation, business trip, charter or staff transport, we remain committed to excellence, affordability and safety.
            </p>
            <Button size="lg" onClick={() => navigate("/about")}>
              Read More About Us
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
