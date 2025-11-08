import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import QRCode from "qrcode";

interface Passenger {
  name: string;
  phone: string;
  email: string;
  idNumber: string;
}

export default function ETicket() {
  const location = useLocation();
  const navigate = useNavigate();
  const { schedule, form, passengers, selectedSeats, total, paymentMethod, paymentRef } = location.state || {};
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  if (!schedule || !form || !passengers || !selectedSeats || !total || !paymentMethod || !paymentRef) {
    return <div className="text-red-500">Missing ticket data. Please start your booking again.</div>;
  }

  // Generate QR Code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrData = JSON.stringify({
          ref: paymentRef,
          route: `${schedule.routes.origin}-${schedule.routes.destination}`,
          date: schedule.departure_date,
          seats: selectedSeats,
          total: total
        });
        const url = await QRCode.toDataURL(qrData, {
          width: 200,
          margin: 2,
          color: {
            dark: '#DC2626',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Error generating QR code:', err);
      }
    };
    generateQR();
  }, [paymentRef, schedule, selectedSeats, total]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("KJ Khandala Travel and Tour", 20, 20);
    doc.setFontSize(14);
    doc.text(`E-Ticket`, 20, 35);
    doc.setFontSize(12);
    doc.text(`Booking Reference: ${paymentRef}`, 20, 45);
    doc.text(`Trip: ${schedule.routes.origin} → ${schedule.routes.destination}`, 20, 55);
    doc.text(`Date: ${schedule.departure_date} | Time: ${schedule.departure_time}`, 20, 65);
    doc.text(`Seats: ${selectedSeats.join(", ")}`, 20, 75);
    doc.text(`Passengers: ${passengers.map((p) => p.name).join(", ")}`, 20, 85);
    doc.text(`Total Paid: P${total}`, 20, 95);
    doc.text(`Payment Method: ${paymentMethod}`, 20, 105);
    
    // Add QR code to PDF
    if (qrCodeUrl) {
      doc.addImage(qrCodeUrl, 'PNG', 20, 115, 50, 50);
    }
    
    doc.text("Thank you for booking with KJ Khandala!", 20, 175);
    doc.save(`KJ-Khandala-E-Ticket-${paymentRef}.pdf`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Your E-Ticket</h1>
      <Card className="p-6 mb-6">
        <div className="text-2xl font-bold text-primary mb-4">KJ Khandala Travel and Tour</div>
        <div className="mb-4 font-semibold text-lg">E-Ticket</div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="text-sm"><span className="font-semibold">Booking Reference:</span> {paymentRef}</div>
            <div className="text-sm"><span className="font-semibold">Trip:</span> {schedule.routes.origin} → {schedule.routes.destination}</div>
            <div className="text-sm"><span className="font-semibold">Date:</span> {schedule.departure_date}</div>
            <div className="text-sm"><span className="font-semibold">Time:</span> {schedule.departure_time}</div>
            <div className="text-sm"><span className="font-semibold">Seats:</span> {selectedSeats.join(", ")}</div>
            <div className="text-sm"><span className="font-semibold">Passengers:</span> {passengers.map((p: Passenger) => p.name).join(", ")}</div>
            <div className="text-sm"><span className="font-semibold">Total Paid:</span> P{total}</div>
            <div className="text-sm"><span className="font-semibold">Payment Method:</span> {paymentMethod}</div>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            {qrCodeUrl && (
              <div className="border-4 border-primary p-2 rounded-lg">
                <img src={qrCodeUrl} alt="Booking QR Code" className="w-48 h-48" />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2 text-center">Scan for booking details</p>
          </div>
        </div>
        
        <div className="text-sm mt-6 pt-4 border-t text-center">Thank you for booking with KJ Khandala!</div>
      </Card>
      <Button onClick={handleDownloadPDF} className="w-full mb-4">Download PDF Ticket</Button>
      <Button variant="secondary" className="w-full" onClick={() => navigate("/")}>Back to Home</Button>
    </div>
  );
}
