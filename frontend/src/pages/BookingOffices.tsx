import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Building2, MapPin, Clock, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookingOffice {
  id: string;
  name: string;
  location: string;
  operating_hours: string;
  contact_number: string;
}

export default function BookingOffices() {
  const [offices, setOffices] = useState<BookingOffice[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOffices();
  }, []);

  const fetchOffices = async () => {
    try {
      const { data, error } = await supabase
        .from("booking_offices")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      setOffices(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading booking offices",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Booking Offices</h1>
          <p className="text-muted-foreground">
            Visit any of our offices for in-person ticket purchases, trip enquiries, and customer support.
          </p>
        </div>

        <h2 className="text-2xl font-semibold mb-6">Available Offices</h2>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading booking offices...</p>
          </div>
        ) : offices.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No offices listed.</h3>
            <p className="text-muted-foreground">
              Please contact us directly for more information.
            </p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offices.map((office) => (
              <Card key={office.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{office.name}</h3>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{office.location}</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{office.operating_hours}</p>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <a 
                        href={`tel:${office.contact_number}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {office.contact_number}
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
