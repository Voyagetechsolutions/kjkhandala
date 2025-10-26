import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";

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

  if (!schedule || !form || !passengers || !selectedSeats || !total || !paymentMethod || !paymentRef) {
    return <div className="text-red-500">Missing ticket data. Please start your booking again.</div>;
  }

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
    doc.text("Thank you for booking with KJ Khandala!", 20, 120);
    doc.save(`KJ-Khandala-E-Ticket-${paymentRef}.pdf`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Your E-Ticket</h1>
      <Card className="p-4 mb-6">
        <div className="text-2xl font-bold text-primary mb-2">KJ Khandala Travel and Tour</div>
        <div className="mb-2 font-semibold">E-Ticket</div>
        <div className="text-sm mb-1">Booking Reference: {paymentRef}</div>
        <div className="text-sm mb-1">Trip: {schedule.routes.origin} → {schedule.routes.destination}</div>
        <div className="text-sm mb-1">Date: {schedule.departure_date} | Time: {schedule.departure_time}</div>
        <div className="text-sm mb-1">Seats: {selectedSeats.join(", ")}</div>
        <div className="text-sm mb-1">Passengers: {passengers.map((p: Passenger) => p.name).join(", ")}</div>
        <div className="text-sm mb-1">Total Paid: P{total}</div>
        <div className="text-sm mb-1">Payment Method: {paymentMethod}</div>
        <div className="text-sm mt-4">Thank you for booking with KJ Khandala!</div>
      </Card>
      <Button onClick={handleDownloadPDF} className="w-full mb-4">Download PDF Ticket</Button>
      <Button variant="secondary" className="w-full" onClick={() => navigate("/")}>Back to Home</Button>
    </div>
  );
}
