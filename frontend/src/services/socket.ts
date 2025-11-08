import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('authToken'),
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 WebSocket connection error:', error);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
      }
    });

    this.socket.on('error', (error) => {
      console.error('🔴 WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Trip Updates
  onTripUpdate(callback: (data: any) => void) {
    this.socket?.on('trip:update', callback);
  }

  offTripUpdate(callback: (data: any) => void) {
    this.socket?.off('trip:update', callback);
  }

  // Driver Location Updates
  onLocationUpdate(callback: (data: any) => void) {
    this.socket?.on('location:update', callback);
  }

  offLocationUpdate(callback: (data: any) => void) {
    this.socket?.off('location:update', callback);
  }

  // Booking Updates
  onBookingUpdate(callback: (data: any) => void) {
    this.socket?.on('booking:update', callback);
  }

  offBookingUpdate(callback: (data: any) => void) {
    this.socket?.off('booking:update', callback);
  }

  // Maintenance Alerts
  onMaintenanceAlert(callback: (data: any) => void) {
    this.socket?.on('maintenance:alert', callback);
  }

  offMaintenanceAlert(callback: (data: any) => void) {
    this.socket?.off('maintenance:alert', callback);
  }

  // Work Order Updates
  onWorkOrderUpdate(callback: (data: any) => void) {
    this.socket?.on('workorder:update', callback);
  }

  offWorkOrderUpdate(callback: (data: any) => void) {
    this.socket?.off('workorder:update', callback);
  }

  // Employee Updates
  onEmployeeUpdate(callback: (data: any) => void) {
    this.socket?.on('employee:update', callback);
  }

  offEmployeeUpdate(callback: (data: any) => void) {
    this.socket?.off('employee:update', callback);
  }

  // Emit Events
  emitLocationUpdate(data: { tripId: string; lat: number; lng: number; speed?: number }) {
    this.socket?.emit('location:update', data);
  }

  emitTripStatus(data: { tripId: string; status: string }) {
    this.socket?.emit('trip:status', data);
  }

  emitDriverCheckIn(data: { driverId: string; busId: string }) {
    this.socket?.emit('driver:checkin', data);
  }

  emitDriverCheckOut(data: { driverId: string }) {
    this.socket?.emit('driver:checkout', data);
  }

  // Generic event listeners
  on(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.socket?.off(event, callback);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
export default socketService;
