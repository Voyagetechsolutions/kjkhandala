import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function AboutStorySection() {
  const navigate = useNavigate();

  return (
    <div className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Story</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Since 1984, KJ Khandala has delivered safe, reliable and comfortable travel across Southern Africa.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-6">
            Our fleet is built to premium specifications, and every trip is defined by professionalism, punctuality and good old-fashioned courtesy.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            Whether you're booking a vacation, business trip, charter or staff transport, we remain committed to excellence, affordability and safety.
          </p>
          <Button size="lg" onClick={() => navigate("/about")}>
            Read More About Us
          </Button>
        </div>
      </div>
    </div>
  );
}
