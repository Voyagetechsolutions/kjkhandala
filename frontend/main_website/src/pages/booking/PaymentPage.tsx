import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PaymentStep from './steps/PaymentStep';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentPage() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [seats, setSeats] = useState<string[]>([]);

  useEffect(() => {
    // Load data from sessionStorage
    const storedTrip = sessionStorage.getItem('selectedTrip');
    const storedPassengers = sessionStorage.getItem('passengerDetails');
    const storedSeats = sessionStorage.getItem('selectedSeats');
    
    if (!storedTrip || !storedPassengers || !storedSeats) {
      toast.error('Missing booking information. Please start from the beginning.');
      navigate('/');
      return;
    }

    setTrip(JSON.parse(storedTrip));
    setPassengers(JSON.parse(storedPassengers));
    setSeats(JSON.parse(storedSeats));
  }, [navigate]);

  const handlePaymentComplete = (paymentData: any) => {
    // Store payment data
    sessionStorage.setItem('paymentData', JSON.stringify(paymentData));
    
    // Navigate to confirmation
    navigate('/book/confirmation');
  };

  const handleBack = () => {
    navigate('/book/seat-selection');
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
                <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold">
                  ✓
                </div>
                <span className="text-green-600 font-semibold">Seat Selection</span>
              </div>
              <div className="flex-1 h-1 bg-green-500 mx-4"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                  3
                </div>
                <span className="font-semibold">Payment</span>
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

          {/* Payment Component */}
          <PaymentStep
            trip={trip}
            seats={seats}
            passengers={passengers}
            onPaymentComplete={handlePaymentComplete}
          />

          {/* Back Button */}
          <div className="flex justify-start mt-8">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Seat Selection
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
