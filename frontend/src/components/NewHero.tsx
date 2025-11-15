import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Users } from "lucide-react";
import HeroSlideshow from "./HeroSlideshow";
import { supabase } from "@/lib/supabase";

export default function NewHero() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<string[]>([]);
  const [form, setForm] = useState({
    from: "",
    to: "",
    travelDate: "",
    returnDate: "",
    passengers: 1,
  });

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase
          .from('cities')
          .select('name')
          .order('name');
        
        if (error) throw error;
        setCities(data?.map(city => city.name) || []);
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      }
    };
    fetchCities();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to trip search page with search parameters
    navigate("/book", { state: { searchParams: form } });
  };

  return (
    <div className="relative min-h-[600px] w-full flex items-center justify-center overflow-hidden">
      {/* Background Slideshow - Absolute positioned behind content */}
      <div className="absolute inset-0 w-full h-full">
        <HeroSlideshow />
      </div>

      {/* Content - Centered with proper z-index */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Travel in Comfort. Arrive in Style.
          </h1>
          <p className="text-xl md:text-2xl text-white/95 drop-shadow-lg">
            Botswana's trusted premium coach solution since 1984.
          </p>
        </div>

        {/* Booking Widget */}
        <Card className="max-w-5xl mx-auto p-6 bg-white/95 backdrop-blur-sm shadow-2xl">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid md:grid-cols-5 gap-4">
              {/* From */}
              <div>
                <Label htmlFor="from" className="text-sm font-medium mb-2 block">
                  From
                </Label>
                <select
                  id="from"
                  value={form.from}
                  onChange={(e) => setForm({ ...form, from: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* To */}
              <div>
                <Label htmlFor="to" className="text-sm font-medium mb-2 block">
                  To
                </Label>
                <select
                  id="to"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select city</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>

              {/* Travel Date */}
              <div>
                <Label htmlFor="travelDate" className="text-sm font-medium mb-2 block">
                  Travel Date
                </Label>
                <div className="relative">
                  <Input
                    id="travelDate"
                    type="date"
                    value={form.travelDate}
                    onChange={(e) => setForm({ ...form, travelDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full"
                    required
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Return Date */}
              <div>
                <Label htmlFor="returnDate" className="text-sm font-medium mb-2 block">
                  Return Date (Optional)
                </Label>
                <div className="relative">
                  <Input
                    id="returnDate"
                    type="date"
                    value={form.returnDate}
                    onChange={(e) => setForm({ ...form, returnDate: e.target.value })}
                    min={form.travelDate || new Date().toISOString().split('T')[0]}
                    className="w-full"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Passengers */}
              <div>
                <Label htmlFor="passengers" className="text-sm font-medium mb-2 block">
                  Passengers
                </Label>
                <div className="relative">
                  <Input
                    id="passengers"
                    type="number"
                    min="1"
                    max="60"
                    value={form.passengers}
                    onChange={(e) => setForm({ ...form, passengers: parseInt(e.target.value) || 1 })}
                    className="w-full"
                    required
                  />
                  <Users className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full md:w-auto px-12">
              Search Trips
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
