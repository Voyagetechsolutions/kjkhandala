import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, Home } from 'lucide-react';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any>(null);

  const companyRef = searchParams.get('ref');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (companyRef) {
      cancelPayment();
    }
  }, [companyRef]);

  const cancelPayment = async () => {
    try {
      await axios.post(`${API_URL}/payments/cancel/${companyRef}`);
    } catch (error) {
      console.error('Cancel payment error:', error);
    }
  };

  const retryPayment = () => {
    if (booking) {
      navigate(`/booking/payment?bookingId=${booking.id}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Cancel Header */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-red-500 flex items-center justify-center">
                  <XCircle className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-red-900 mb-2">
                    Payment Cancelled
                  </h1>
                  <p className="text-red-700">
                    Your payment was cancelled. Your booking has not been confirmed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information */}
          <Card>
            <CardHeader>
              <CardTitle>What Happened?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                You cancelled the payment process or closed the payment window before completing
                the transaction.
              </p>
              <p>
                No charges have been made to your account. Your booking is still pending and will
                expire if not paid within the time limit.
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={retryPayment} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          {/* Help Section */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-800 mb-3">
                If you're experiencing issues with payment, please contact our support team:
              </p>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Email: support@kjkhandala.com</li>
                <li>• Phone: +267 1234 5678</li>
                <li>• WhatsApp: +267 7234 5678</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
