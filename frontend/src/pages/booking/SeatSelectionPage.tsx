import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SeatSelection from './steps/SeatSelection';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function SeatSelectionPage() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  useEffect(() => {
    // Load data from sessionStorage
    const storedTrip = sessionStorage.getItem('selectedTrip');
    const storedPassengers = sessionStorage.getItem('passengerDetails');
    
    if (!storedTrip || !storedPassengers) {
      toast.error('Missing booking information. Please start from the beginning.');
      navigate('/');
      return;
    }

    setTrip(JSON.parse(storedTrip));
    setPassengers(JSON.parse(storedPassengers));
  }, [navigate]);

  const handleNext = () => {
    if (selectedSeats.length !== passengers.length) {
      toast.error(`Please select ${passengers.length} seat(s)`);
      return;
    }

    // Update passengers with seat numbers
    const passengersWithSeats = passengers.map((p, i) => ({
      ...p,
      seatNumber: selectedSeats[i]
    }));

    // Store updated passenger details
    sessionStorage.setItem('passengerDetails', JSON.stringify(passengersWithSeats));
    sessionStorage.setItem('selectedSeats', JSON.stringify(selectedSeats));
    
    // Navigate to payment
    navigate('/book/payment-method');
  };

  const handleBack = () => {
    navigate('/book/passenger-details');
  };

  if (!trip) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold">
                  ✓
                </div>
                <span className="text-green-600 font-semibold">Passenger Details</span>
              </div>
              <div className="flex-1 h-1 bg-green-500 mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  2
                </div>
                <span className="font-semibold">Seat Selection</span>
              </div>
              <div className="flex-1 h-1 bg-gray-300 mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold">
                  3
                </div>
                <span className="text-gray-600">Payment</span>
              </div>
              <div className="flex-1 h-1 bg-gray-300 mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold">
                  4
                </div>
                <span className="text-gray-600">Confirmation</span>
              </div>
            </div>
          </div>

          {/* Seat Selection Component */}
          <SeatSelection
            trip={trip}
            onSeatsSelect={setSelectedSeats}
            selectedSeats={selectedSeats}
            passengerCount={passengers.length}
          />

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Passenger Details
            </Button>
            <Button 
              onClick={handleNext} 
              size="lg"
              disabled={selectedSeats.length !== passengers.length}
            >
              Continue to Payment
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
