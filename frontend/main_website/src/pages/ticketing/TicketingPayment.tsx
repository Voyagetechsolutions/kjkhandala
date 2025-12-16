import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import TicketingLayout from '@/components/ticketing/TicketingLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, CreditCard, Banknote, Smartphone, Ticket as TicketIcon, 
  Building, Gift, DollarSign, CheckCircle2, Percent 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TicketingPayment() {
  const { user, userRoles, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const Layout = isAdminRoute ? AdminLayout : TicketingLayout;

  const [trip, setTrip] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDetails, setPaymentDetails] = useState({
    amount: 0,
    transaction_id: '',
    card_last_four: '',
    mobile_number: '',
    voucher_code: '',
    company_name: '',
    invoice_number: '',
    notes: '',
  });
  const [discount, setDiscount] = useState({
    amount: 0,
    reason: '',
    requires_approval: false,
  });
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    // Get data from sessionStorage
    const tripData = sessionStorage.getItem('selectedTrip');
    const seatsData = sessionStorage.getItem('selectedSeats');
    const passengersData = sessionStorage.getItem('passengerDetails');

    if (!tripData || !seatsData || !passengersData) {
      toast({
        variant: 'destructive',
        title: 'Missing data',
        description: 'Please complete previous steps',
      });
      navigate('/ticketing/search-trips');
      return;
    }

    const trip = JSON.parse(tripData);
    const seats = JSON.parse(seatsData);
    const passengers = JSON.parse(passengersData);

    setTrip(trip);
    setSelectedSeats(seats);
    setPassengers(passengers);

    // Calculate total
    const total = passengers.reduce((sum: number, p: any) => sum + (trip.base_fare || 0), 0);
    setTotalAmount(total);
    setPaymentDetails({ ...paymentDetails, amount: total });
  }, []);

  const finalAmount = totalAmount - discount.amount;

  const proceedToSummary = () => {
    if (paymentDetails.amount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid amount',
        description: 'Payment amount must be greater than 0',
      });
      return;
    }

    // Validate payment method specific fields
    if (paymentMethod === 'card' && !paymentDetails.card_last_four) {
      toast({
        variant: 'destructive',
        title: 'Missing card details',
        description: 'Please enter last 4 digits of card',
      });
      return;
    }

    if (paymentMethod === 'mobile_money' && !paymentDetails.mobile_number) {
      toast({
        variant: 'destructive',
        title: 'Missing mobile number',
        description: 'Please enter mobile money number',
      });
      return;
    }

    if (paymentMethod === 'voucher' && !paymentDetails.voucher_code) {
      toast({
        variant: 'destructive',
        title: 'Missing voucher code',
        description: 'Please enter voucher code',
      });
      return;
    }

    if (paymentMethod === 'invoice' && !paymentDetails.company_name) {
      toast({
        variant: 'destructive',
        title: 'Missing company details',
        description: 'Please enter company name',
      });
      return;
    }

    // Store payment data
    const paymentData = {
      method: paymentMethod,
      details: paymentDetails,
      discount,
      totalAmount,
      finalAmount,
    };

    sessionStorage.setItem('paymentData', JSON.stringify(paymentData));

    // Navigate to booking summary
    navigate('/ticketing/booking-summary');
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">💳 Payment</h1>
            <p className="text-muted-foreground">
              Process payment for {passengers.length} passenger(s)
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/ticketing/passenger-details')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Passengers
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Select how the customer will pay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                {/* Cash */}
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Cash</div>
                      <div className="text-xs text-muted-foreground">Direct cash payment</div>
                    </div>
                  </Label>
                </div>

                {/* Card */}
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Card (POS)</div>
                      <div className="text-xs text-muted-foreground">Debit/Credit card</div>
                    </div>
                  </Label>
                </div>

                {/* Mobile Money */}
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="mobile_money" id="mobile_money" />
                  <Label htmlFor="mobile_money" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Smartphone className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Mobile Money</div>
                      <div className="text-xs text-muted-foreground">Orange, Mascom, BTC</div>
                    </div>
                  </Label>
                </div>

                {/* Bank Transfer */}
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Bank Transfer</div>
                      <div className="text-xs text-muted-foreground">Direct bank transfer</div>
                    </div>
                  </Label>
                </div>

                {/* Voucher */}
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="voucher" id="voucher" />
                  <Label htmlFor="voucher" className="flex items-center gap-2 cursor-pointer flex-1">
                    <TicketIcon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Voucher/Coupon</div>
                      <div className="text-xs text-muted-foreground">Promotional code</div>
                    </div>
                  </Label>
                </div>

                {/* Invoice */}
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="invoice" id="invoice" />
                  <Label htmlFor="invoice" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Building className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Company Invoice</div>
                      <div className="text-xs text-muted-foreground">Bill to company</div>
                    </div>
                  </Label>
                </div>

                {/* Complimentary */}
                <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="complimentary" id="complimentary" />
                  <Label htmlFor="complimentary" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Gift className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Complimentary</div>
                      <div className="text-xs text-muted-foreground">Free ticket</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>

              {/* Payment Method Specific Fields */}
              <div className="space-y-4 pt-4 border-t">
                {paymentMethod === 'card' && (
                  <>
                    <div className="space-y-2">
                      <Label>Transaction ID</Label>
                      <Input
                        placeholder="Enter POS transaction ID"
                        value={paymentDetails.transaction_id}
                        onChange={(e) =>
                          setPaymentDetails({ ...paymentDetails, transaction_id: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last 4 Digits of Card</Label>
                      <Input
                        placeholder="e.g., 1234"
                        maxLength={4}
                        value={paymentDetails.card_last_four}
                        onChange={(e) =>
                          setPaymentDetails({ ...paymentDetails, card_last_four: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}

                {paymentMethod === 'mobile_money' && (
                  <>
                    <div className="space-y-2">
                      <Label>Mobile Number</Label>
                      <Input
                        placeholder="e.g., 71234567"
                        value={paymentDetails.mobile_number}
                        onChange={(e) =>
                          setPaymentDetails({ ...paymentDetails, mobile_number: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Transaction ID</Label>
                      <Input
                        placeholder="Enter transaction reference"
                        value={paymentDetails.transaction_id}
                        onChange={(e) =>
                          setPaymentDetails({ ...paymentDetails, transaction_id: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}

                {paymentMethod === 'voucher' && (
                  <div className="space-y-2">
                    <Label>Voucher Code</Label>
                    <Input
                      placeholder="Enter voucher code"
                      value={paymentDetails.voucher_code}
                      onChange={(e) =>
                        setPaymentDetails({ ...paymentDetails, voucher_code: e.target.value })
                      }
                    />
                  </div>
                )}

                {paymentMethod === 'invoice' && (
                  <>
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        placeholder="Enter company name"
                        value={paymentDetails.company_name}
                        onChange={(e) =>
                          setPaymentDetails({ ...paymentDetails, company_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice Number (Optional)</Label>
                      <Input
                        placeholder="Auto-generated if left blank"
                        value={paymentDetails.invoice_number}
                        onChange={(e) =>
                          setPaymentDetails({ ...paymentDetails, invoice_number: e.target.value })
                        }
                      />
                    </div>
                  </>
                )}

                {/* Payment Amount */}
                <div className="space-y-2">
                  <Label>Payment Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentDetails.amount}
                    onChange={(e) =>
                      setPaymentDetails({ ...paymentDetails, amount: parseFloat(e.target.value) || 0 })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter partial amount for part-payment
                  </p>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Any additional notes about this payment"
                    value={paymentDetails.notes}
                    onChange={(e) =>
                      setPaymentDetails({ ...paymentDetails, notes: e.target.value })
                    }
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
              <CardDescription>Booking cost breakdown</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base Fare ({passengers.length}x)</span>
                  <span>P {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxes & Levies</span>
                  <span>P 0.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Insurance</span>
                  <span>P 0.00</span>
                </div>

                {/* Discount */}
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-4 w-4" />
                    <Label>Discount</Label>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={discount.amount || ''}
                    onChange={(e) =>
                      setDiscount({ ...discount, amount: parseFloat(e.target.value) || 0 })
                    }
                  />
                  {discount.amount > 0 && (
                    <Input
                      className="mt-2"
                      placeholder="Discount reason (required)"
                      value={discount.reason}
                      onChange={(e) => setDiscount({ ...discount, reason: e.target.value })}
                    />
                  )}
                </div>

                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>P {finalAmount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Paying Now</span>
                  <span>P {paymentDetails.amount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-sm font-medium">
                  <span>Balance</span>
                  <span className={finalAmount - paymentDetails.amount > 0 ? 'text-orange-600' : 'text-green-600'}>
                    P {(finalAmount - paymentDetails.amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <Button onClick={proceedToSummary} className="w-full" size="lg">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Continue to Summary
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
