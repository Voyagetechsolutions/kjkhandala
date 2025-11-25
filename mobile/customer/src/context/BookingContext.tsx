import React, { createContext, useContext, useState } from 'react';
import { Trip, SearchParams } from '../types';

interface BookingContextType {
  searchParams: SearchParams | null;
  setSearchParams: (params: SearchParams) => void;
  selectedTrip: Trip | null;
  setSelectedTrip: (trip: Trip | null) => void;
  selectedReturnTrip: Trip | null;
  setSelectedReturnTrip: (trip: Trip | null) => void;
  selectedSeats: number[];
  setSelectedSeats: (seats: number[]) => void;
  selectedReturnSeats: number[];
  setSelectedReturnSeats: (seats: number[]) => void;
  passengers: any[];
  setPassengers: (passengers: any[]) => void;
  passengerDetails: {
    name: string;
    email: string;
    phone: string;
  } | null;
  setPassengerDetails: (details: { name: string; email: string; phone: string }) => void;
  paymentMethod: 'office' | 'card' | 'mobile';
  setPaymentMethod: (method: 'office' | 'card' | 'mobile') => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedReturnTrip, setSelectedReturnTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [selectedReturnSeats, setSelectedReturnSeats] = useState<number[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [passengerDetails, setPassengerDetails] = useState<{
    name: string;
    email: string;
    phone: string;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'office' | 'card' | 'mobile'>('office');

  const resetBooking = () => {
    setSearchParams(null);
    setSelectedTrip(null);
    setSelectedReturnTrip(null);
    setSelectedSeats([]);
    setSelectedReturnSeats([]);
    setPassengers([]);
    setPassengerDetails(null);
    setPaymentMethod('office');
  };

  return (
    <BookingContext.Provider
      value={{
        searchParams,
        setSearchParams,
        selectedTrip,
        setSelectedTrip,
        selectedReturnTrip,
        setSelectedReturnTrip,
        selectedSeats,
        setSelectedSeats,
        selectedReturnSeats,
        setSelectedReturnSeats,
        passengers,
        setPassengers,
        passengerDetails,
        setPassengerDetails,
        paymentMethod,
        setPaymentMethod,
        resetBooking,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
};
