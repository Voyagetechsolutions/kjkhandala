import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase';

const PAYMENT_METHODS = [
	{ id: "paypal", label: "PayPal" },
	{ id: "ozow", label: "Ozow" },
	{ id: "payfast", label: "PayFast" },
];

interface Passenger {
	name: string;
	phone: string;
	email: string;
	idNumber: string;
}

export default function Payment() {
	const location = useLocation();
	const navigate = useNavigate();
	const { schedule, form, passengers, selectedSeats } = location.state || {};
	const [paymentMethod, setPaymentMethod] = useState("paypal");
	const [reservationTimer, setReservationTimer] = useState(600); // 10 minutes in seconds
	const [processing, setProcessing] = useState(false);

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
			alert("Reservation expired. Please start again.");
			navigate("/book");
		}
	}, [reservationTimer, navigate]);

	if (!schedule || !form || !passengers || !selectedSeats) {
		return (
			<div className="text-red-500">
				Missing booking data. Please start your booking again.
			</div>
		);
	}

	const total = schedule.routes.price * selectedSeats.length;

	const handlePayment = async () => {
		setProcessing(true);
		try {
			// Insert a booking for each passenger/seat
			const bookingRefs: string[] = [];
			for (let i = 0; i < passengers.length; i++) {
				const bookingRef = `VB${Date.now().toString().slice(-8)}${i}`;
				bookingRefs.push(bookingRef);
				const { error } = await supabase.from("bookings").insert({
					schedule_id: schedule.id,
					passenger_name: passengers[i].name,
					passenger_phone: passengers[i].phone,
					passenger_email: passengers[i].email,
					passenger_id_number: passengers[i].idNumber,
					seat_number: selectedSeats[i],
					total_amount: schedule.routes.price,
					status: "confirmed",
					booking_reference: bookingRef,
				});
				if (error) throw error;
			}
			setProcessing(false);
			navigate("/book/eticket", {
				state: {
					schedule,
					form,
					passengers,
					selectedSeats,
					total,
					paymentMethod,
					paymentRef: bookingRefs.join(", "),
				},
			});
		} catch (err: any) {
			setProcessing(false);
			alert("Booking failed: " + err.message);
		}
	};

	return (
		<div className="max-w-2xl mx-auto py-8">
			<h1 className="text-2xl font-bold mb-4">Payment</h1>
			<Card className="p-4 mb-6">
				<div className="mb-2 font-semibold">
					Trip: {schedule.routes.origin} → {schedule.routes.destination}
				</div>
				<div className="text-sm text-muted-foreground">
					Date: {schedule.departure_date} | Time:{" "}
					{schedule.departure_time}
				</div>
				<div className="text-sm">
					Seats: {selectedSeats.join(", ")}
				</div>
				<div className="text-sm">
					Passengers: {passengers.map((p: Passenger) => p.name).join(", ")}
				</div>
				<div className="text-lg font-bold mt-2">Total: P{total}</div>
			</Card>
			<Card className="p-4 mb-6">
				<div className="mb-2 font-semibold">Select Payment Method</div>
				<div className="flex gap-4 mb-4">
					{PAYMENT_METHODS.map((method) => (
						<label
							key={method.id}
							className="flex items-center gap-2 cursor-pointer"
						>
							<input
								type="radio"
								name="paymentMethod"
								value={method.id}
								checked={paymentMethod === method.id}
								onChange={() => setPaymentMethod(method.id)}
							/>
							{method.label}
						</label>
					))}
				</div>
				<div className="text-sm text-muted-foreground mb-2">
					Reservation will be held for{" "}
					<span className="font-semibold">
						{Math.floor(reservationTimer / 60)}:
						{(reservationTimer % 60).toString().padStart(2, "0")}
					</span>{" "}
					minutes.
				</div>
				<Button
					onClick={handlePayment}
					className="w-full"
					disabled={processing || reservationTimer === 0}
				>
					{processing ? "Processing Payment..." : `Pay P${total}`}
				</Button>
			</Card>
		</div>
	);
}
