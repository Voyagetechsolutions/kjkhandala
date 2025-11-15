import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TripSummary from "@/components/TripSummary";
import { CreditCard, Smartphone, Building2, Clock } from "lucide-react";
import { generateBookingReference, generateTicketNumber } from "@/lib/bookingReference";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { id: "dpo", label: "Credit/Debit Card (DPO Group)", icon: CreditCard, description: "Visa, Mastercard, American Express" },
  { id: "orange", label: "Orange Money", icon: Smartphone, description: "Mobile money payment" },
  { id: "myzaka", label: "MyZaka", icon: Smartphone, description: "Mobile money payment" },
  { id: "smega", label: "Smega", icon: Smartphone, description: "Mobile money payment" },
  { id: "bank", label: "Bank Transfer / EFT", icon: Building2, description: "Direct bank transfer" },
  { id: "office", label: "Cash at Office", icon: Clock, description: "Reserve for 2 hours, pay at office" },
];

interface Passenger {
  name: string;
  phone: string;
  email: string;
  idNumber: string;
}

export default function PaymentNew() {
  const location = useLocation();
  const navigate = useNavigate();
  const { schedule, form, passengers, selectedSeats } = location.state || {};
  const [paymentMethod, setPaymentMethod] = useState("dpo");
  const [reservationTimer, setReservationTimer] = useState(600); // 10 minutes
  const [processing, setProcessing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
  });
  const [mobileNumber, setMobileNumber] = useState("");

  useEffect(() => {
    if (!schedule || !form || !passengers || !selectedSeats) {
      navigate("/book");
      return;
    }
    // Start reservation timer
    const interval = setInterval(() => {
      setReservationTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [schedule, form, passengers, selectedSeats, navigate]);

  useEffect(() => {
    if (reservationTimer === 0) {
      toast.error("Reservation expired. Please start again.");
      navigate("/book");
    }
  }, [reservationTimer, navigate]);

  if (!schedule || !form || !passengers || !selectedSeats) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Missing Booking Data</h2>
            <p className="text-muted-foreground mb-4">Please start your booking again.</p>
            <Button onClick={() => navigate("/")}>Go to Homepage</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const total = schedule.routes.price * selectedSeats.length;
  const minutes = Math.floor(reservationTimer / 60);
  const seconds = reservationTimer % 60;

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const bookingRefs: string[] = [];
      const ticketNumbers: string[] = [];

      // Create bookings for each passenger
      for (let i = 0; i < passengers.length; i++) {
        const bookingRef = generateBookingReference();
        const ticketNumber = generateTicketNumber();
        bookingRefs.push(bookingRef);
        ticketNumbers.push(ticketNumber);

        const { error } = await supabase.from("bookings").insert({
          schedule_id: schedule.id,
          passenger_name: passengers[i].name,
          passenger_phone: passengers[i].phone,
          passenger_email: passengers[i].email,
          passenger_id_number: passengers[i].idNumber,
          seat_number: selectedSeats[i],
          total_amount: schedule.routes.price,
          payment_status: paymentMethod === "office" ? "pending" : "confirmed",
          booking_reference: bookingRef,
          ticket_number: ticketNumber,
          payment_method: paymentMethod,
        });
        if (error) throw error;
      }

      setProcessing(false);
      toast.success("Booking confirmed successfully!");
      
      // Navigate to confirmation page
      navigate("/booking-confirmation", {
        state: {
          schedule,
          passengers,
          selectedSeats,
          total,
          paymentMethod,
          bookingRefs,
          ticketNumbers,
        },
      });
    } catch (err: any) {
      setProcessing(false);
      toast.error("Booking failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Payment</h1>

          {/* Reservation Timer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-yellow-900">Seats Reserved</p>
              <p className="text-sm text-yellow-700">
                Complete payment within {minutes}:{seconds.toString().padStart(2, '0')} minutes
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Payment Method Selection */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Select Payment Method</h2>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="space-y-3">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      return (
                        <div
                          key={method.id}
                          className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${
                            paymentMethod === method.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setPaymentMethod(method.id)}
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <Icon className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <Label htmlFor={method.id} className="font-semibold cursor-pointer">
                              {method.label}
                            </Label>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </Card>

              {/* Payment Details Form */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4">Payment Details</h2>

                {paymentMethod === "dpo" && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={(e) =>
                          setCardDetails({ ...cardDetails, cardNumber: e.target.value })
                        }
                        maxLength={19}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardName">Cardholder Name</Label>
                      <Input
                        id="cardName"
                        placeholder="Name on card"
                        value={cardDetails.cardName}
                        onChange={(e) =>
                          setCardDetails({ ...cardDetails, cardName: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Expiry Date</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={cardDetails.expiryDate}
                          onChange={(e) =>
                            setCardDetails({ ...cardDetails, expiryDate: e.target.value })
                          }
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="123"
                          type="password"
                          value={cardDetails.cvv}
                          onChange={(e) =>
                            setCardDetails({ ...cardDetails, cvv: e.target.value })
                          }
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(paymentMethod === "orange" || paymentMethod === "myzaka" || paymentMethod === "smega") && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mobileNumber">Mobile Number</Label>
                      <Input
                        id="mobileNumber"
                        placeholder="+267 XX XXX XXX"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You will receive a prompt on your phone to authorize the payment.
                    </p>
                  </div>
                )}

                {paymentMethod === "bank" && (
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Bank Details</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Bank:</strong> First National Bank</p>
                        <p><strong>Account Name:</strong> KJ Khandala Travel & Tours</p>
                        <p><strong>Account Number:</strong> 1234567890</p>
                        <p><strong>Branch Code:</strong> 250655</p>
                        <p><strong>Reference:</strong> Use your booking reference</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Please make the transfer and upload proof of payment or email it to payments@kjkhandala.com
                    </p>
                  </div>
                )}

                {paymentMethod === "office" && (
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <h3 className="font-semibold text-yellow-900 mb-2">Cash Payment at Office</h3>
                      <p className="text-sm text-yellow-700">
                        Your seats will be reserved for 2 hours. Please visit any of our booking offices to complete payment.
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/booking-offices")}>
                      View Booking Offices
                    </Button>
                  </div>
                )}

                <Button
                  onClick={handlePayment}
                  disabled={processing}
                  size="lg"
                  className="w-full mt-6"
                >
                  {processing ? "Processing..." : `Pay P${total}`}
                </Button>
              </Card>
            </div>

            {/* Trip Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <TripSummary
                  schedule={schedule}
                  passengers={selectedSeats.length}
                  totalPrice={total}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
