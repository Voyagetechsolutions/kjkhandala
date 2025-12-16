import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Smartphone } from "lucide-react";

export default function MobileAppSection() {
  return (
    <div className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto p-8 md:p-12 text-center bg-gradient-to-br from-primary/10 to-secondary/10">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Download Our App</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Book tickets, track your trips, get digital boarding passes.
          </p>
          <Button size="lg" className="gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
            </svg>
            Download on Google Play
          </Button>
        </Card>
      </div>
    </div>
  );
}
