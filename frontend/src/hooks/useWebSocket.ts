import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import socketService from '@/services/socket';
import { Socket } from 'socket.io-client';

export function useWebSocket() {
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const socketInstance = socketService.connect();
    setSocket(socketInstance);

    // Trip updates
    const handleTripUpdate = (data: any) => {
      console.log('Trip update received:', data);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
      queryClient.invalidateQueries({ queryKey: ['trip', data.tripId] });
    };

    // Location updates
    const handleLocationUpdate = (data: any) => {
      console.log('Location update received:', data);
      queryClient.setQueryData(['trip', data.tripId, 'location'], data);
    };

    // Booking updates
    const handleBookingUpdate = (data: any) => {
      console.log('Booking update received:', data);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', data.bookingId] });
    };

    // Maintenance alerts
    const handleMaintenanceAlert = (data: any) => {
      console.log('Maintenance alert received:', data);
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
    };

    // Work order updates
    const handleWorkOrderUpdate = (data: any) => {
      console.log('Work order update received:', data);
      queryClient.invalidateQueries({ queryKey: ['work-orders'] });
    };

    // Employee updates
    const handleEmployeeUpdate = (data: any) => {
      console.log('Employee update received:', data);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    };

    // Register listeners
    socketService.onTripUpdate(handleTripUpdate);
    socketService.onLocationUpdate(handleLocationUpdate);
    socketService.onBookingUpdate(handleBookingUpdate);
    socketService.onMaintenanceAlert(handleMaintenanceAlert);
    socketService.onWorkOrderUpdate(handleWorkOrderUpdate);
    socketService.onEmployeeUpdate(handleEmployeeUpdate);

    // Cleanup
    return () => {
      socketService.offTripUpdate(handleTripUpdate);
      socketService.offLocationUpdate(handleLocationUpdate);
      socketService.offBookingUpdate(handleBookingUpdate);
      socketService.offMaintenanceAlert(handleMaintenanceAlert);
      socketService.offWorkOrderUpdate(handleWorkOrderUpdate);
      socketService.offEmployeeUpdate(handleEmployeeUpdate);
      socketService.disconnect();
      setSocket(null);
    };
  }, [queryClient]);

  return { socket };
}
