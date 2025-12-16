import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, CreditCard, Smartphone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface BotswanaPaymentProps {
  bookingId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  onSuccess: (paymentData: any) => void;
  onCancel?: () => void;
}

export default function BotswanaPayment({
  bookingId,
  amount,
  currency = 'BWP',
  customerEmail,
  customerFirstName,
  customerLastName,
  customerPhone,
  onSuccess,
  onCancel,
}: BotswanaPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile'>('card');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [mobileOptions, setMobileOptions] = useState<any[]>([]);
  const [selectedMobile, setSelectedMobile] = useState<any>(null);
  const [mobileNumber, setMobileNumber] = useState('');
  const [verifying, setVerifying] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  console.log('BotswanaPayment API_URL:', API_URL);

  // Botswana mobile money providers
  const botswanaProviders = ['orange', 'orange money', 'mascom', 'myzaka', 'btc'];

  /**
   * Initialize payment
   */
  const initializePayment = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/payments/initialize`, {
        bookingId,
        amount,
        currency,
        customerEmail,
        customerFirstName,
        customerLastName,
        customerPhone,
        customerCountry: 'BW',
      });

      if (response.data.success) {
        setPaymentData(response.data);
        
        // If card payment, redirect to DPO payment page
        if (paymentMethod === 'card') {
          window.location.href = response.data.paymentURL;
        } else if (paymentMethod === 'mobile') {
          // Fetch mobile payment options
          await fetchMobileOptions(response.data.transToken);
        }
      } else {
        toast.error(response.data.message || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch mobile payment options and filter for Botswana providers
   */
  const fetchMobileOptions = async (transToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/payments/mobile-options/${transToken}`);
      if (response.data.success && response.data.options?.mobileoption) {
        const options = Array.isArray(response.data.options.mobileoption)
          ? response.data.options.mobileoption
          : [response.data.options.mobileoption];
        
        // Filter for Botswana providers only
        const botswanaOptions = options.filter((option: any) => {
          const providerName = option.paymentname?.toLowerCase();
          const countryCode = option.countryCode?.toLowerCase();
          const country = option.country?.toLowerCase();
          
          return (
            botswanaProviders.some(provider => providerName.includes(provider)) ||
            countryCode === 'bw' ||
            country === 'botswana' ||
            country === 'botswana' ||
            option.celluarprefix?.startsWith('+267')
          );
        });

        setMobileOptions(botswanaOptions);
        
        if (botswanaOptions.length === 0) {
          toast.warning('No Botswana mobile money providers available. Please use card payment.');
        }
      }
    } catch (error) {
      console.error('Error fetching mobile options:', error);
      toast.error('Failed to load mobile payment options');
    }
  };

  /**
   * Process mobile payment
   */
  const processMobilePayment = async () => {
    if (!selectedMobile || !mobileNumber) {
      toast.error('Please select a payment method and enter your phone number');
      return;
    }

    // Validate Botswana phone number
    const botswanaPhoneRegex = /^(\+267|267)?[0-9]{8}$/;
    if (!botswanaPhoneRegex.test(mobileNumber.replace(/\s/g, ''))) {
      toast.error('Please enter a valid Botswana phone number (e.g., +26712345678 or 26712345678)');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/payments/charge-mobile`, {
        transToken: paymentData.transToken,
        phoneNumber: mobileNumber,
        mno: selectedMobile.paymentname,
        mnoCountry: 'Botswana',
      });

      if (response.data.success) {
        toast.success('Payment request sent! Please check your phone.');
        
        // Show instructions
        if (response.data.instructions) {
          toast.info(response.data.instructions, { duration: 10000 });
        }

        // Start polling for payment verification
        startPaymentVerification();
      } else {
        toast.error('Failed to process mobile payment');
      }
    } catch (error: any) {
      console.error('Mobile payment error:', error);
      toast.error(error.response?.data?.message || 'Failed to process mobile payment');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start polling for payment verification
   */
  const startPaymentVerification = () => {
    setVerifying(true);
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(
          `${API_URL}/payments/verify/${paymentData.companyRef}`
        );

        if (response.data.success && response.data.status === 'completed') {
          clearInterval(interval);
          setVerifying(false);
          toast.success('Payment successful!');
          onSuccess(response.data.payment);
        } else if (response.data.status === 'failed' || response.data.status === 'cancelled') {
          clearInterval(interval);
          setVerifying(false);
          toast.error('Payment failed or was cancelled');
        }
      } catch (error) {
        console.error('Verification error:', error);
      }
    }, 5000); // Check every 5 seconds

    // Stop after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setVerifying(false);
    }, 300000);
  };

  /**
   * Handle payment method change
   */
  const handlePaymentMethodChange = (method: 'card' | 'mobile') => {
    setPaymentMethod(method);
    setPaymentData(null);
    setMobileOptions([]);
    setSelectedMobile(null);
  };

  /**
   * Format phone number for display
   */
  const formatPhoneNumber = (number: string) => {
    // Remove all non-digit characters
    const cleanNumber = number.replace(/\D/g, '');
    
    // Add +267 if missing and number starts with 7 or 8
    if (cleanNumber.length === 8 && (cleanNumber.startsWith('7') || cleanNumber.startsWith('8'))) {
      return `+267${cleanNumber}`;
    }
    
    // Add +267 if it starts with 267 but no +
    if (cleanNumber.length === 11 && cleanNumber.startsWith('267')) {
      return `+${cleanNumber}`;
    }
    
    return number;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>Choose how you'd like to pay for your booking</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange as any}>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-muted-foreground">
                      Pay securely with Visa, Mastercard, or other cards
                    </p>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                <RadioGroupItem value="mobile" id="mobile" />
                <Label htmlFor="mobile" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Smartphone className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Mobile Money</p>
                    <p className="text-sm text-muted-foreground">
                      Pay with Orange Money, Mascom MyZaka, and other Botswana providers
                    </p>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">
                {currency} {amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing Fee</span>
              <span className="font-medium">{currency} 0.00</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">
                  {currency} {amount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Payment Options */}
      {paymentMethod === 'mobile' && mobileOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Mobile Money Provider</CardTitle>
            <CardDescription>Choose your Botswana mobile money provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mobileOptions.map((option: any, index: number) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 cursor-pointer hover:border-primary ${
                    selectedMobile === option ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedMobile(option)}
                >
                  {option.logo && (
                    <img src={option.logo} alt={option.paymentname} className="h-8 mb-2" />
                  )}
                  <p className="font-medium capitalize">{option.paymentname}</p>
                  <p className="text-sm text-muted-foreground">{option.country}</p>
                  {option.celluarprefix && (
                    <p className="text-xs text-muted-foreground">
                      Prefix: {option.celluarprefix}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {selectedMobile && (
              <div className="space-y-2">
                <Label htmlFor="mobile-number">Botswana Phone Number</Label>
                <Input
                  id="mobile-number"
                  type="tel"
                  placeholder="+267 71234567"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(formatPhoneNumber(e.target.value))}
                  className="text-lg"
                />
                <p className="text-sm text-muted-foreground">
                  Amount: {selectedMobile.currency} {selectedMobile.amount}
                </p>
                <p className="text-xs text-muted-foreground">
                  Enter your Botswana mobile number (e.g., +26771234567 or 26771234567)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Botswana Mobile Providers Available */}
      {paymentMethod === 'mobile' && mobileOptions.length === 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900">No Botswana Mobile Money Available</p>
                <p className="text-sm text-orange-700">
                  Currently, no Botswana mobile money providers are available. Please use card payment or contact support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Status */}
      {verifying && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Waiting for payment confirmation...</p>
                <p className="text-sm text-blue-700">
                  Please complete the payment on your phone. This may take a few moments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={loading || verifying}>
            Cancel
          </Button>
        )}
        <Button
          className="flex-1"
          onClick={paymentMethod === 'mobile' && mobileOptions.length > 0 ? processMobilePayment : initializePayment}
          disabled={loading || verifying}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {paymentMethod === 'card' && 'Proceed to Payment'}
              {paymentMethod === 'mobile' && (mobileOptions.length > 0 ? 'Pay Now' : 'Continue')}
            </>
          )}
        </Button>
      </div>

      {/* Botswana Payment Notice */}
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <AlertCircle className="h-4 w-4 mt-0.5" />
        <p>
          Your payment is secured by DPO Pay. All transactions are processed in Botswana Pula (BWP) and support local payment methods.
        </p>
      </div>

      {/* Support Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Payment Support in Botswana</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• Card payments: All major credit/debit cards accepted</p>
            <p>• Mobile Money: Orange Money, Mascom MyZaka</p>
            <p>• Currency: Botswana Pula (BWP)</p>
            <p>• Support: +267 1234 5678</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
