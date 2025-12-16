import { useEffect, useState, useRef } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, MapPin, Calendar, Clock, User, Mail, MessageCircle, Printer } from "lucide-react";
import QRCode from "react-qr-code";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { generateQRCodeData } from "@/lib/bookingReference";
import { sendTicketViaEmail, sendTicketViaWhatsApp } from "@/lib/ticketDelivery";
import { toast } from "sonner";

interface BookingDetails {
  id: string;
  booking_reference: string;
  ticket_number: string;
  passenger_name: string;
  passenger_phone: string;
  passenger_email: string;
  seat_number: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  schedules: {
    departure_date: string;
    departure_time: string;
    routes: {
      origin: string;
      destination: string;
      duration_hours: number;
    };
    buses: {
      name: string;
      number_plate: string;
    };
  };
}

export default function BookingConfirmationNew() {
  const location = useLocation();
  const { bookingId } = useParams();
  const ticketRef = useRef<HTMLDivElement>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Get data from navigation state (for immediate confirmation after payment)
  const stateData = location.state;

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else if (stateData) {
      // Use state data for immediate display
      setLoading(false);
    }
  }, [bookingId, stateData]);

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          schedules (
            departure_date,
            departure_time,
            routes (origin, destination, duration_hours),
            buses (name, number_plate)
          )
        `)
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      setBooking(data);
    } catch (error) {
      console.error("Error fetching booking:", error);
      toast.error("Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!ticketRef.current) return;
    
    try {
      toast.info("Generating PDF...");
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`KJ-Khandala-Ticket-${displayData.bookingRef}.pdf`);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const sendViaEmail = async () => {
    if (!displayData.email) {
      toast.error("No email address provided");
      return;
    }
    
    toast.info("Sending e-ticket via email...");
    
    const ticketData = {
      bookingReference: displayData.bookingRef,
      ticketNumber: displayData.ticketNumber,
      passengerName: displayData.passengerName,
      passengerPhone: displayData.phone,
      passengerEmail: displayData.email,
      origin: displayData.origin,
      destination: displayData.destination,
      date: displayData.date,
      time: displayData.time,
      seat: displayData.seat,
      amount: displayData.amount,
      bus: displayData.bus,
    };
    
    const success = await sendTicketViaEmail(ticketData);
    
    if (success) {
      toast.success("E-ticket sent to your email!");
    } else {
      toast.error("Failed to send email. Please try again.");
    }
  };

  const sendViaWhatsApp = () => {
    const ticketData = {
      bookingReference: displayData.bookingRef,
      ticketNumber: displayData.ticketNumber,
      passengerName: displayData.passengerName,
      passengerPhone: displayData.phone,
      passengerEmail: displayData.email,
      origin: displayData.origin,
      destination: displayData.destination,
      date: displayData.date,
      time: displayData.time,
      seat: displayData.seat,
      amount: displayData.amount,
      bus: displayData.bus,
    };
    
    sendTicketViaWhatsApp(ticketData);
    toast.success("Opening WhatsApp...");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  // Determine which data to display
  const displayData = booking ? {
    bookingRef: booking.booking_reference,
    ticketNumber: booking.ticket_number,
    passengerName: booking.passenger_name,
    phone: booking.passenger_phone,
    email: booking.passenger_email,
    seat: booking.seat_number,
    amount: booking.total_amount,
    origin: booking.schedules.routes.origin,
    destination: booking.schedules.routes.destination,
    date: booking.schedules.departure_date,
    time: booking.schedules.departure_time,
    bus: booking.schedules.buses.name,
    busPlate: booking.schedules.buses.number_plate,
    duration: booking.schedules.routes.duration_hours,
    paymentMethod: booking.payment_method,
    paymentStatus: booking.payment_status,
  } : stateData ? {
    bookingRef: stateData.bookingRefs[0],
    ticketNumber: stateData.ticketNumbers[0],
    passengerName: stateData.passengers[0].name,
    phone: stateData.passengers[0].phone,
    email: stateData.passengers[0].email,
    seat: stateData.selectedSeats[0],
    amount: stateData.total,
    origin: stateData.schedule.routes.origin,
    destination: stateData.schedule.routes.destination,
    date: stateData.schedule.departure_date,
    time: stateData.schedule.departure_time,
    bus: stateData.schedule.buses.name,
    busPlate: stateData.schedule.buses.number_plate,
    duration: stateData.schedule.routes.duration_hours,
    paymentMethod: stateData.paymentMethod,
    paymentStatus: "confirmed",
  } : null;

  if (!displayData) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-500 mb-2">Booking Not Found</h2>
            <p className="text-muted-foreground mb-4">Unable to load booking details.</p>
            <Link to="/">
              <Button>Go to Homepage</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const qrData = generateQRCodeData(displayData.bookingRef, displayData.ticketNumber, displayData.passengerName);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Success Message */}
            <div className="text-center mb-8">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold mb-2">Booking Confirmed!</h1>
              <p className="text-lg text-muted-foreground">
                Your e-ticket has been generated and is ready for your journey.
              </p>
              {displayData.paymentStatus === "pending" && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium">
                    Payment Pending: Please complete payment at any of our booking offices within 2 hours.
                  </p>
                </div>
              )}
            </div>

            {/* E-Ticket Card */}
            <Card className="p-8 mb-6" ref={ticketRef}>
              {/* Header */}
              <div className="text-center mb-8 pb-6 border-b-2 border-dashed">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <img src="/logo.png" alt="KJ Khandala" className="h-12" />
                  <div className="text-left">
                    <h2 className="text-2xl font-bold">KJ Khandala Travel & Tours</h2>
                    <p className="text-sm text-muted-foreground">Your Premium Coach Solution</p>
                  </div>
                </div>
                <div className="bg-primary/10 rounded-lg p-4 inline-block">
                  <p className="text-sm text-muted-foreground mb-1">Booking Reference</p>
                  <p className="text-3xl font-bold text-primary">{displayData.bookingRef}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Left: Trip Details */}
                <div className="md:col-span-2 space-y-6">
                  {/* Route */}
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MapPin className="h-5 w-5" />
                      <span className="text-sm font-medium uppercase">Route</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold">{displayData.origin}</span>
                      <span className="text-2xl text-muted-foreground">→</span>
                      <span className="text-2xl font-bold">{displayData.destination}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Duration: {displayData.duration} hours
                    </p>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Calendar className="h-5 w-5" />
                        <span className="text-sm font-medium uppercase">Travel Date</span>
                      </div>
                      <p className="text-xl font-semibold">
                        {new Date(displayData.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Clock className="h-5 w-5" />
                        <span className="text-sm font-medium uppercase">Departure</span>
                      </div>
                      <p className="text-xl font-semibold">{displayData.time}</p>
                    </div>
                  </div>

                  {/* Passenger Details */}
                  <div>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <User className="h-5 w-5" />
                      <span className="text-sm font-medium uppercase">Passenger Details</span>
                    </div>
                    <p className="text-xl font-semibold">{displayData.passengerName}</p>
                    <p className="text-sm text-muted-foreground">{displayData.phone}</p>
                    {displayData.email && (
                      <p className="text-sm text-muted-foreground">{displayData.email}</p>
                    )}
                  </div>

                  {/* Bus & Seat */}
                  <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Coach</p>
                      <p className="text-lg font-semibold">{displayData.bus}</p>
                      <p className="text-sm text-muted-foreground">{displayData.busPlate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Seat Number</p>
                      <p className="text-4xl font-bold text-primary">{displayData.seat}</p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="pt-6 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium">Total Amount Paid</span>
                      <span className="text-3xl font-bold text-primary">P{displayData.amount}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Payment Method: {displayData.paymentMethod.toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* Right: QR Code */}
                <div className="flex flex-col items-center justify-center border-l pl-8">
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <QRCode value={qrData} size={180} />
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Scan this QR code at the terminal for quick check-in
                  </p>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Ticket Number</p>
                    <p className="text-sm font-mono font-semibold">{displayData.ticketNumber}</p>
                  </div>
                </div>
              </div>

              {/* Footer Notice */}
              <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
                <p className="mb-2">
                  Please arrive at the terminal at least 30 minutes before departure.
                </p>
                <p>
                  For assistance, call +267 123 4567 or WhatsApp +267 123 4567
                </p>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Button onClick={downloadPDF} variant="default" size="lg" className="w-full">
                <Download className="mr-2 h-5 w-5" />
                Download PDF
              </Button>
              <Button onClick={sendViaEmail} variant="outline" size="lg" className="w-full">
                <Mail className="mr-2 h-5 w-5" />
                Email Ticket
              </Button>
              <Button onClick={sendViaWhatsApp} variant="outline" size="lg" className="w-full">
                <MessageCircle className="mr-2 h-5 w-5" />
                WhatsApp
              </Button>
              <Button onClick={() => window.print()} variant="outline" size="lg" className="w-full">
                <Printer className="mr-2 h-5 w-5" />
                Print
              </Button>
            </div>

            {/* Additional Actions */}
            <div className="flex gap-4">
              <Link to="/my-bookings" className="flex-1">
                <Button variant="outline" size="lg" className="w-full">
                  View My Bookings
                </Button>
              </Link>
              <Link to="/" className="flex-1">
                <Button size="lg" className="w-full">
                  Book Another Trip
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
