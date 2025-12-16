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
              Founded on 02 October 2013, KJ KHANDALA began with a simple but powerful vision: to create a transport brand that would stand among the greats of Botswana — a name built on trust, excellence, and unforgettable travel experiences.
            </p>
            <Button size="lg" onClick={() => navigate("/about")}>
              Read More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
