import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TicketingFlowWizard, { useTicketingFlow } from '@/components/ticketing/TicketingFlowWizard';
import TripSearch from './steps/TripSearch';
import SeatSelection from './steps/SeatSelection';
import PassengerDetails from './steps/PassengerDetails';
import PaymentStep from './steps/PaymentStep';
import BookingConfirmation from './steps/BookingConfirmation';
import { toast } from 'sonner';

export default function BookingFlow() {
  const navigate = useNavigate();
  const { flowData, updateFlowData, resetFlow } = useTicketingFlow();
  const [bookingId, setBookingId] = useState<string | null>(null);

  const handleComplete = () => {
    toast.success('Booking completed successfully!');
    // Navigate to ticket page or dashboard
    if (bookingId) {
      navigate(`/my-bookings/${bookingId}`);
    } else {
      navigate('/my-bookings');
    }
    resetFlow();
  };

  const steps = [
    {
      id: 'search',
      title: 'Search Trips',
      description: 'Find available trips for your journey',
      component: (
        <TripSearch
          onTripSelect={(trip, isReturnTrip) => {
            if (isReturnTrip) {
              updateFlowData('search', { 
                ...flowData.search,
                selectedReturnTrip: trip 
              });
            } else {
              updateFlowData('search', { 
                ...flowData.search,
                selectedTrip: trip 
              });
            }
          }}
          selectedTrip={flowData.search?.selectedTrip}
          selectedReturnTrip={flowData.search?.selectedReturnTrip}
        />
      ),
    },
    {
      id: 'seats',
      title: 'Select Seats',
      description: 'Choose your preferred seats',
      component: (
        <SeatSelection
          trip={flowData.search?.selectedTrip}
          returnTrip={flowData.search?.selectedReturnTrip}
          onSeatsSelect={(seats, isReturnTrip) => {
            if (isReturnTrip) {
              updateFlowData('seats', { 
                ...flowData.seats,
                selectedReturnSeats: seats 
              });
            } else {
              updateFlowData('seats', { 
                ...flowData.seats,
                selectedSeats: seats 
              });
            }
          }}
          selectedSeats={flowData.seats?.selectedSeats}
          selectedReturnSeats={flowData.seats?.selectedReturnSeats}
        />
      ),
    },
    {
      id: 'passengers',
      title: 'Passenger Details',
      description: 'Enter passenger information',
      component: (
        <PassengerDetails
          seats={flowData.seats?.selectedSeats}
          returnSeats={flowData.seats?.selectedReturnSeats}
          onDetailsSubmit={(passengers) => {
            updateFlowData('passengers', { passengers });
          }}
          passengers={flowData.passengers?.passengers}
        />
      ),
    },
    {
      id: 'payment',
      title: 'Payment',
      description: 'Complete your payment',
      component: (
        <PaymentStep
          trip={flowData.search?.selectedTrip}
          returnTrip={flowData.search?.selectedReturnTrip}
          seats={flowData.seats?.selectedSeats}
          returnSeats={flowData.seats?.selectedReturnSeats}
          passengers={flowData.passengers?.passengers}
          onPaymentComplete={(paymentData) => {
            updateFlowData('payment', paymentData);
            setBookingId(paymentData.bookingId);
          }}
          paymentData={flowData.payment}
        />
      ),
    },
    {
      id: 'confirmation',
      title: 'Booking Confirmation',
      description: 'Your booking is confirmed!',
      component: (
        <BookingConfirmation
          bookingId={bookingId}
          trip={flowData.search?.selectedTrip}
          returnTrip={flowData.search?.selectedReturnTrip}
          seats={flowData.seats?.selectedSeats}
          returnSeats={flowData.seats?.selectedReturnSeats}
          passengers={flowData.passengers?.passengers}
          payment={flowData.payment}
        />
      ),
    },
  ];

  return <TicketingFlowWizard steps={steps} onComplete={handleComplete} />;
}
