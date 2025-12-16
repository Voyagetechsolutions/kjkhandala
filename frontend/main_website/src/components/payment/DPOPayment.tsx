import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Smartphone, Building2, AlertCircle, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import type {
  InitializePaymentResponse,
  MobilePaymentOption,
  BankOption,
  PaymentMethod,
  Currency,
  VerifyPaymentResponse,
} from '@/types/payment';
import { CURRENCY_SYMBOLS } from '@/types/payment';

interface DPOPaymentProps {
  bookingId: string;
  amount: number;
  currency?: Currency;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerAddress?: string;
  customerCity?: string;
  customerCountry?: string;
  onSuccess: (paymentData: any) => void;
  onCancel?: () => void;
}

export default function DPOPayment({
  bookingId,
  amount,
  currency = 'BWP',
  customerEmail,
  customerFirstName,
  customerLastName,
  customerPhone,
  customerAddress,
  customerCity,
  customerCountry = 'BW',
  onSuccess,
  onCancel,
}: DPOPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentData, setPaymentData] = useState<InitializePaymentResponse | null>(null);
  const [mobileOptions, setMobileOptions] = useState<MobilePaymentOption[]>([]);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);
  const [selectedMobile, setSelectedMobile] = useState<MobilePaymentOption | null>(null);
  const [selectedBank, setSelectedBank] = useState<BankOption | null>(null);
  const [mobileNumber, setMobileNumber] = useState(customerPhone || '');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'process' | 'complete'>('select');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  /**
   * Initialize payment
   */
  const initializePayment = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post<InitializePaymentResponse>(`${API_URL}/payments/initialize`, {
        bookingId,
        amount,
        currency,
        customerEmail,
        customerFirstName,
        customerLastName,
        customerPhone,
        customerAddress,
        customerCity,
        customerCountry,
      });

      if (response.data.success) {
        setPaymentData(response.data);
        setStep('process');
        
        // If card payment, redirect to DPO payment page
        if (paymentMethod === 'card') {
          window.location.href = response.data.paymentURL;
        } else if (paymentMethod === 'mobile_money') {
          // Fetch mobile payment options
          await fetchMobileOptions(response.data.transToken);
        } else if (paymentMethod === 'bank_transfer') {
          // Fetch bank transfer options
          await fetchBankOptions(response.data.transToken);
        }
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('Payment initialization error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to initialize payment';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch mobile payment options
   */
  const fetchMobileOptions = async (transToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/payments/mobile-options/${transToken}`);
      if (response.data.success && response.data.options?.mobileoption) {
        const options = Array.isArray(response.data.options.mobileoption)
          ? response.data.options.mobileoption
          : [response.data.options.mobileoption];
        setMobileOptions(options);
      } else {
        setMobileOptions([]);
      }
    } catch (error) {
      console.error('Error fetching mobile options:', error);
      toast.error('Failed to load mobile payment options');
      setMobileOptions([]);
    }
  };

  /**
   * Fetch bank transfer options
   */
  const fetchBankOptions = async (transToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/payments/bank-options/${transToken}`);
      if (response.data.success && response.data.options) {
        setBankOptions(response.data.options);
      } else {
        setBankOptions([]);
      }
    } catch (error) {
      console.error('Error fetching bank options:', error);
      toast.error('Failed to load bank transfer options');
      setBankOptions([]);
    }
  };

  /**
   * Process mobile payment
   */
  const processMobilePayment = async () => {
    if (!selectedMobile || !mobileNumber) {
      toast.error('Please select a payment provider and enter your phone number');
      return;
    }

    if (!paymentData) {
      toast.error('Payment not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/payments/charge-mobile`, {
        transToken: paymentData.transToken,
        phoneNumber: mobileNumber,
        mno: selectedMobile.paymentname,
        mnoCountry: selectedMobile.country,
      });

      if (response.data.success) {
        toast.success('Payment request sent! Please check your phone.');
        
        // Show instructions
        if (response.data.instructions) {
          toast.info(response.data.instructions, { duration: 15000 });
        }

        // Start polling for payment verification
        startPaymentVerification();
      } else {
        throw new Error('Failed to process mobile payment');
      }
    } catch (error: any) {
      console.error('Mobile payment error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to process mobile payment';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Process bank transfer
   */
  const processBankTransfer = async () => {
    if (!selectedBank) {
      toast.error('Please select a bank');
      return;
    }

    if (!paymentData) {
      toast.error('Payment not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/payments/charge-bank-transfer`, {
        transToken: paymentData.transToken,
        bankCode: selectedBank.bankCode,
      });

      if (response.data.success) {
        toast.success('Bank transfer initiated successfully');
        // Show bank instructions
        const instructions = selectedBank.instructions.bankInstructionsEN || '';
        toast.info(instructions, { duration: 20000 });
        // Start polling for payment verification
        startPaymentVerification();
      } else {
        throw new Error(response.data.message || 'Failed to process bank transfer');
      }
    } catch (error: any) {
      console.error('Bank transfer error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to process bank transfer';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start polling for payment verification
   */
  const startPaymentVerification = () => {
    if (!paymentData) return;

    setVerifying(true);
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes (60 * 5 seconds)

    const interval = setInterval(async () => {
      attempts++;
      
      try {
        const response = await axios.get<VerifyPaymentResponse>(
          `${API_URL}/payments/verify/${paymentData.companyRef}`
        );

        if (response.data.success && response.data.status === 'completed') {
          clearInterval(interval);
          setVerifying(false);
          setStep('complete');
          toast.success('Payment successful!');
          onSuccess(response.data.payment);
        } else if (response.data.status === 'failed' || response.data.status === 'cancelled') {
          clearInterval(interval);
          setVerifying(false);
          setError(`Payment ${response.data.status}`);
          toast.error(`Payment ${response.data.status}`);
        }

        // Stop after max attempts
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          setVerifying(false);
          toast.error('Payment verification timeout. Please check your payment status later.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        // Don't stop on error, continue polling
      }
    }, 5000); // Check every 5 seconds
  };

  /**
   * Manual verification
   */
  const manualVerification = async () => {
    if (!paymentData) return;

    setLoading(true);
    try {
      const response = await axios.get<VerifyPaymentResponse>(
        `${API_URL}/payments/verify/${paymentData.companyRef}`
      );

      if (response.data.success && response.data.status === 'completed') {
        setStep('complete');
        toast.success('Payment verified successfully!');
        onSuccess(response.data.payment);
      } else {
        toast.info(`Payment status: ${response.data.status}`);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast.error('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Go back to method selection
   */
  const goBack = () => {
    setStep('select');
    setPaymentData(null);
    setError(null);
    setVerifying(false);
  };

  /**
   * Format currency display
   */
  const formatAmount = (amount: number, currency: Currency) => {
    return `${CURRENCY_SYMBOLS[currency]}${amount.toFixed(2)}`;
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Complete Payment</CardTitle>
            <CardDescription>
              Amount to pay: {formatAmount(amount, currency)}
            </CardDescription>
          </div>
          {step !== 'select' && step !== 'complete' && (
            <Button variant="ghost" size="sm" onClick={goBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select Payment Method */}
        {step === 'select' && (
          <div className="space-y-6">
            <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-sm text-muted-foreground">Pay securely with your card</p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                  <RadioGroupItem value="mobile_money" id="mobile_money" />
                  <Label htmlFor="mobile_money" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Smartphone className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Mobile Money</p>
                      <p className="text-sm text-muted-foreground">
                        Pay with Orange Money and other mobile money providers
                      </p>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building2 className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Bank Transfer</p>
                      <p className="text-sm text-muted-foreground">Pay via bank transfer</p>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>

            <Button
              onClick={initializePayment}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Initializing...
                </>
              ) : (
                `Pay ${formatAmount(amount, currency)}`
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Process Payment */}
        {step === 'process' && paymentMethod === 'mobile_money' && (
          <div className="space-y-6">
            <div className="text-center">
              <Smartphone className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Mobile Money Payment</h3>
              <p className="text-sm text-muted-foreground">
                Select your mobile provider and complete the payment
              </p>
            </div>

            {mobileOptions.length > 0 ? (
              <>
                <div className="space-y-3">
                  <Label>Select Provider</Label>
                  <RadioGroup
                    value={selectedMobile?.paymentname}
                    onValueChange={(value) =>
                      setSelectedMobile(mobileOptions.find((opt) => opt.paymentname === value) || null)
                    }
                  >
                    {mobileOptions.map((option) => (
                      <div
                        key={option.paymentname}
                        className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                      >
                        <RadioGroupItem value={option.paymentname} id={option.paymentname} />
                        <img src={option.logo} alt={option.paymentname} className="h-8 w-8 object-contain" />
                        <Label htmlFor={option.paymentname} className="flex-1 cursor-pointer">
                          <div className="font-medium capitalize">{option.paymentname.replace('_', ' ')}</div>
                          <div className="text-sm text-muted-foreground">
                            {option.country} - {option.currency} {option.amount.toFixed(2)}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile-number">Mobile Number</Label>
                  <Input
                    id="mobile-number"
                    type="tel"
                    placeholder="e.g., 26712345678"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Include country code (e.g., 267 for Botswana)
                  </p>
                </div>

                {selectedMobile?.instructions && (
                  <Alert>
                    <AlertDescription className="text-xs whitespace-pre-wrap">
                      {selectedMobile.instructions}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={processMobilePayment}
                  disabled={loading || !selectedMobile || !mobileNumber || verifying}
                  className="w-full"
                  size="lg"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying payment...
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Send Payment Request'
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading mobile payment options...</p>
              </div>
            )}
          </div>
        )}

        {step === 'process' && paymentMethod === 'bank_transfer' && (
          <div className="space-y-6">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Bank Transfer</h3>
              <p className="text-sm text-muted-foreground">
                Select your bank to get transfer instructions
              </p>
            </div>

            {bankOptions.length > 0 ? (
              <>
                <div className="space-y-3">
                  <Label>Select Bank</Label>
                  <RadioGroup
                    value={selectedBank?.bankCode}
                    onValueChange={(value) =>
                      setSelectedBank(bankOptions.find((opt) => opt.bankCode === value) || null)
                    }
                  >
                    {bankOptions.map((option) => (
                      <div
                        key={option.bankCode}
                        className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent"
                      >
                        <RadioGroupItem value={option.bankCode} id={option.bankCode} />
                        <Label htmlFor={option.bankCode} className="flex-1 cursor-pointer">
                          <div className="font-medium">{option.bankName}</div>
                          <div className="text-xs text-muted-foreground">{option.bankCode}</div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {selectedBank && (
                  <Alert>
                    <AlertDescription className="text-xs whitespace-pre-wrap">
                      {selectedBank.instructions.bankInstructionsEN}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={processBankTransfer}
                  disabled={loading || !selectedBank || verifying}
                  className="w-full"
                  size="lg"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying payment...
                    </>
                  ) : loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Proceed with Bank Transfer'
                  )}
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading bank transfer options...</p>
              </div>
            )}
          </div>
        )}

        {/* Verification Status */}
        {verifying && step === 'process' && (
          <div className="text-center space-y-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <div>
              <h3 className="font-semibold mb-2">Verifying payment...</h3>
              <p className="text-sm text-muted-foreground">Please wait while we confirm your payment</p>
              <p className="text-xs text-muted-foreground mt-2">
                This may take a few moments. Don't close this window.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={manualVerification}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status Now
            </Button>
          </div>
        )}

        {/* Step 3: Payment Complete */}
        {step === 'complete' && (
          <div className="text-center space-y-4 py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Payment Successful!</h3>
              <p className="text-sm text-muted-foreground">
                Your payment of {formatAmount(amount, currency)} has been processed successfully.
              </p>
            </div>
            {paymentData && (
              <div className="bg-muted rounded-lg p-4 space-y-2 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transaction Ref:</span>
                  <span className="font-mono font-semibold">{paymentData.transRef}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Company Ref:</span>
                  <span className="font-mono font-semibold">{paymentData.companyRef}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cancel Button */}
        {onCancel && step !== 'complete' && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={loading || verifying}
            className="w-full"
          >
            Cancel Payment
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
