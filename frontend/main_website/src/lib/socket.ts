import { io, Socket } from 'socket.io-client';

type Handler<T = any> = (data: T) => void;

const DEFAULT_SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || '';

class SocketService {
  private socket: Socket | null = null;

  connect(url: string = DEFAULT_SOCKET_URL): Socket {
    if (this.socket && this.socket.connected) return this.socket;

    this.socket = io(url, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    });

    return this.socket;
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
  }

  onTripUpdate(handler: Handler) {
    this.socket?.on('trip:update', handler);
  }

  offTripUpdate(handler: Handler) {
    this.socket?.off('trip:update', handler);
  }

  onLocationUpdate(handler: Handler) {
    this.socket?.on('location:update', handler);
  }

  offLocationUpdate(handler: Handler) {
    this.socket?.off('location:update', handler);
  }

  onBookingUpdate(handler: Handler) {
    this.socket?.on('booking:update', handler);
  }

  offBookingUpdate(handler: Handler) {
    this.socket?.off('booking:update', handler);
  }

  onMaintenanceAlert(handler: Handler) {
    this.socket?.on('maintenance:alert', handler);
  }

  offMaintenanceAlert(handler: Handler) {
    this.socket?.off('maintenance:alert', handler);
  }

  onWorkOrderUpdate(handler: Handler) {
    this.socket?.on('workorder:update', handler);
  }

  offWorkOrderUpdate(handler: Handler) {
    this.socket?.off('workorder:update', handler);
  }

  onEmployeeUpdate(handler: Handler) {
    this.socket?.on('employee:update', handler);
  }

  offEmployeeUpdate(handler: Handler) {
    this.socket?.off('employee:update', handler);
  }
}

const socketService = new SocketService();
export default socketService;
