import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PassengerDetails from './steps/PassengerDetails';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PassengerDetailsPage() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [seats, setSeats] = useState<string[]>([]);

  useEffect(() => {
    // Load trip and passenger count from sessionStorage
    const storedTrip = sessionStorage.getItem('selectedTrip');
    const storedCount = sessionStorage.getItem('passengerCount');
    
    if (!storedTrip) {
      toast.error('No trip selected. Please search for a trip first.');
      navigate('/');
      return;
    }

    const tripData = JSON.parse(storedTrip);
    const count = parseInt(storedCount || '1');
    
    setTrip(tripData);
    setPassengerCount(count);
    
    // Generate seat placeholders (will be selected in next step)
    const seatPlaceholders = Array.from({ length: count }, (_, i) => `Seat ${i + 1}`);
    setSeats(seatPlaceholders);
  }, [navigate]);

  const handleNext = () => {
    // Validate that all passengers have required info
    const allValid = passengers.every(p => 
      p.title && p.fullName && p.gender && p.email && p.mobile && 
      p.idType && p.idNumber && p.emergencyName && p.emergencyPhone && 
      p.country && p.address
    );

    if (!allValid) {
      toast.error('Please fill in all required fields for all passengers');
      return;
    }

    // Store passenger details
    sessionStorage.setItem('passengerDetails', JSON.stringify(passengers));
    
    // Navigate to seat selection
    navigate('/book/seat-selection');
  };

  const handleBack = () => {
    navigate('/');
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
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  1
                </div>
                <span className="font-semibold">Passenger Details</span>
              </div>
              <div className="flex-1 h-1 bg-gray-300 mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-semibold">
                  2
                </div>
                <span className="text-gray-600">Seat Selection</span>
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

          {/* Trip Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Trip Summary</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Route:</span>
                <p className="font-medium">{trip.route?.origin} → {trip.route?.destination}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Departure:</span>
                <p className="font-medium">
                  {new Date(trip.scheduled_departure).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Passengers:</span>
                <p className="font-medium">{passengerCount}</p>
              </div>
            </div>
          </div>

          {/* Passenger Details Form */}
          <PassengerDetails
            seats={seats}
            onDetailsSubmit={setPassengers}
            passengers={passengers}
          />

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Search
            </Button>
            <Button onClick={handleNext} size="lg">
              Continue to Seat Selection
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
