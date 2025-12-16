/**
 * BookingWidget - Redirect Integration
 * 
 * This widget collects search criteria and redirects to VTS SaaS for booking.
 * Uses Option 1: Redirect Integration
 */

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Loader2, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import DateInput from './DateInput';
import { redirectToBooking } from '@/lib/vts-integration';

export default function BookingWidget() {
  const [cities, setCities] = useState<string[]>([]);
  const [form, setForm] = useState({
    from: '',
    to: '',
    travelDate: '',
    returnDate: '',
    passengers: 1,
    tripType: 'one-way' as 'one-way' | 'return',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

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
      // Fallback cities if fetch fails
      setCities(['Gaborone', 'Francistown', 'Maun', 'Kasane', 'Nata', 'Palapye']);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.from || !form.to || !form.travelDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (form.tripType === 'return' && !form.returnDate) {
      toast.error('Please select a return date');
      return;
    }

    if (form.from === form.to) {
      toast.error('Origin and destination cannot be the same');
      return;
    }

    setLoading(true);
    
    // Show toast and redirect to VTS SaaS booking page
    toast.info('Redirecting to booking system...');
    
    // Small delay for UX
    setTimeout(() => {
      redirectToBooking({
        from: form.from,
        to: form.to,
        date: form.travelDate,
        returnDate: form.tripType === 'return' ? form.returnDate : undefined,
        passengers: form.passengers,
        tripType: form.tripType,
      });
    }, 500);
  };

  return (
    <Card className="max-w-5xl mx-auto bg-white/95 backdrop-blur-sm shadow-2xl">
      <CardContent className="p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Trip Type Toggle */}
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => setForm({ ...form, tripType: 'one-way' })}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                form.tripType === 'one-way'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              One-Way
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, tripType: 'return' })}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                form.tripType === 'return'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Return Trip
            </button>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
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
                {form.tripType === 'return' ? 'Departure Date' : 'Travel Date'}
              </Label>
              <DateInput
                id="travelDate"
                value={form.travelDate}
                onChange={(value) => setForm({ ...form, travelDate: value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            {/* Return Date - Only show for return trips */}
            {form.tripType === 'return' && (
              <div>
                <Label htmlFor="returnDate" className="text-sm font-medium mb-2 block">
                  Return Date
                </Label>
                <DateInput
                  id="returnDate"
                  value={form.returnDate}
                  onChange={(value) => setForm({ ...form, returnDate: value })}
                  min={form.travelDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            )}

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

          <Button 
            type="submit" 
            size="lg" 
            className="w-full md:w-auto px-12" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Search & Book
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
