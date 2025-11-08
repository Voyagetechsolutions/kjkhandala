import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SeatMapProps {
  totalSeats: number;
  bookedSeats: string[];
  selectedSeats: string[];
  onSeatSelect: (seatNumber: string) => void;
  maxSeats?: number;
}

type SeatStatus = 'available' | 'selected' | 'booked';

export default function SeatMap({
  totalSeats,
  bookedSeats,
  selectedSeats,
  onSeatSelect,
  maxSeats = 4,
}: SeatMapProps) {
  // Standard bus layout: 4 seats per row (2-2 configuration)
  const seatsPerRow = 4;
  const rows = Math.ceil(totalSeats / seatsPerRow);

  const getSeatStatus = (seatNumber: string): SeatStatus => {
    if (bookedSeats.includes(seatNumber)) return 'booked';
    if (selectedSeats.includes(seatNumber)) return 'selected';
    return 'available';
  };

  const handleSeatClick = (seatNumber: string) => {
    const status = getSeatStatus(seatNumber);
    
    if (status === 'booked') {
      return; // Can't select booked seats
    }
    
    if (status === 'available' && selectedSeats.length >= maxSeats) {
      alert(`You can only select up to ${maxSeats} seats`);
      return;
    }
    
    onSeatSelect(seatNumber);
  };

  const getSeatColor = (status: SeatStatus): string => {
    switch (status) {
      case 'available':
        return 'bg-green-100 hover:bg-green-200 border-green-300 text-green-800';
      case 'selected':
        return 'bg-primary text-primary-foreground border-primary';
      case 'booked':
        return 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed';
    }
  };

  const renderSeat = (seatNumber: string) => {
    const status = getSeatStatus(seatNumber);
    
    return (
      <button
        key={seatNumber}
        onClick={() => handleSeatClick(seatNumber)}
        disabled={status === 'booked'}
        className={cn(
          "w-12 h-12 rounded-lg border-2 font-semibold text-sm transition-all",
          "flex items-center justify-center",
          getSeatColor(status),
          status !== 'booked' && "hover:scale-105 active:scale-95"
        )}
        title={`Seat ${seatNumber} - ${status}`}
      >
        {seatNumber}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded border-2 bg-green-100 border-green-300"></div>
            <span className="text-sm">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded border-2 bg-primary border-primary"></div>
            <span className="text-sm">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded border-2 bg-gray-300 border-gray-400"></div>
            <span className="text-sm">Booked</span>
          </div>
        </div>
      </Card>

      {/* Bus Layout */}
      <Card className="p-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-md mx-auto">
          {/* Driver Section */}
          <div className="mb-6 flex items-center justify-between px-4 py-3 bg-secondary/10 rounded-lg border-2 border-secondary/20">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                🚗
              </div>
              <span className="font-semibold text-sm">Driver</span>
            </div>
            <div className="text-xs text-muted-foreground">Front of Bus</div>
          </div>

          {/* Seats Grid */}
          <div className="space-y-3">
            {Array.from({ length: rows }, (_, rowIndex) => {
              const rowNumber = rowIndex + 1;
              const startSeat = rowIndex * seatsPerRow + 1;
              
              return (
                <div key={rowNumber} className="flex justify-between items-center gap-4">
                  {/* Left side seats (2 seats) */}
                  <div className="flex gap-2">
                    {Array.from({ length: 2 }, (_, seatIndex) => {
                      const seatNumber = String(startSeat + seatIndex);
                      return seatNumber <= String(totalSeats) ? renderSeat(seatNumber) : null;
                    })}
                  </div>

                  {/* Aisle */}
                  <div className="w-8 text-center text-xs text-muted-foreground font-medium">
                    {rowNumber}
                  </div>

                  {/* Right side seats (2 seats) */}
                  <div className="flex gap-2">
                    {Array.from({ length: 2 }, (_, seatIndex) => {
                      const seatNumber = String(startSeat + 2 + seatIndex);
                      return seatNumber <= String(totalSeats) ? renderSeat(seatNumber) : null;
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Back of Bus */}
          <div className="mt-6 text-center text-xs text-muted-foreground py-2 border-t-2 border-dashed">
            Back of Bus
          </div>
        </div>
      </Card>

      {/* Selection Summary */}
      {selectedSeats.length > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Selected Seats:</p>
              <p className="text-sm text-muted-foreground">
                {selectedSeats.join(', ')} ({selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''})
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedSeats.forEach(seat => onSeatSelect(seat))}
            >
              Clear All
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
