# ⚡ QUICK START GUIDE - Production Implementation

## 🚀 Get Started in 30 Minutes

This guide helps you start implementing production features immediately.

---

## 📋 **PREREQUISITES**

```bash
# Already installed
✅ Node.js & npm
✅ PostgreSQL database
✅ Prisma ORM
✅ React + TypeScript
✅ TanStack Query

# Need to install
npm install socket.io-client
npm install axios
npm install @react-google-maps/api
npm install jspdf jspdf-autotable
npm install idb
npm install firebase
npm install react-ga4
```

---

## 🔌 **STEP 1: API Integration (Start Here)**

### **1. Create API Service**

```bash
# Create services directory
mkdir src/services
touch src/services/api.ts
```

```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### **2. Create Service Modules**

```typescript
// src/services/tripService.ts
import api from './api';

export const tripService = {
  getAll: () => api.get('/trips'),
  getById: (id: string) => api.get(`/trips/${id}`),
  create: (data: any) => api.post('/trips', data),
  update: (id: string, data: any) => api.put(`/trips/${id}`, data),
  delete: (id: string) => api.delete(`/trips/${id}`),
  getByRoute: (routeId: string) => api.get(`/trips/route/${routeId}`),
  getAvailable: (date: string) => api.get(`/trips/available?date=${date}`),
};

// src/services/bookingService.ts
export const bookingService = {
  create: (data: any) => api.post('/bookings', data),
  getById: (id: string) => api.get(`/bookings/${id}`),
  getByUser: (userId: string) => api.get(`/bookings/user/${userId}`),
  cancel: (id: string) => api.post(`/bookings/${id}/cancel`),
  checkIn: (id: string) => api.post(`/bookings/${id}/check-in`),
};
```

### **3. Use React Query Hooks**

```typescript
// src/hooks/useTrips.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripService } from '@/services/tripService';

export const useTrips = () => {
  return useQuery({
    queryKey: ['trips'],
    queryFn: async () => {
      const response = await tripService.getAll();
      return response.data;
    },
    staleTime: 30000, // 30 seconds
  });
};

export const useTrip = (id: string) => {
  return useQuery({
    queryKey: ['trip', id],
    queryFn: async () => {
      const response = await tripService.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateTrip = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tripService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
};
```

### **4. Update Components to Use Real Data**

```typescript
// Example: Update OperationsDashboard.tsx
import { useTrips } from '@/hooks/useTrips';

export default function OperationsDashboard() {
  const { data: trips, isLoading, error } = useTrips();
  
  if (isLoading) return <div>Loading trips...</div>;
  if (error) return <div>Error loading trips</div>;
  
  return (
    <OperationsLayout>
      <div className="space-y-6">
        {/* Use real data instead of mock data */}
        <Card>
          <CardHeader>
            <CardTitle>Active Trips</CardTitle>
          </CardHeader>
          <CardContent>
            {trips?.map((trip: any) => (
              <div key={trip.id}>
                {trip.route} - {trip.departureTime}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </OperationsLayout>
  );
}
```

---

## 🔄 **STEP 2: WebSocket for Real-Time Updates**

### **1. Install Socket.io Client**

```bash
npm install socket.io-client
```

### **2. Create Socket Service**

```typescript
// src/services/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
```

### **3. Use in Components**

```typescript
// src/pages/operations/OperationsDashboard.tsx
import { useEffect } from 'react';
import { getSocket } from '@/services/socket';
import { useQueryClient } from '@tanstack/react-query';

export default function OperationsDashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join operations room
    socket.emit('join-dashboard', 'operations');

    // Listen for trip updates
    socket.on('trip-updated', (data) => {
      console.log('Trip updated:', data);
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    });

    // Listen for new bookings
    socket.on('booking-created', (data) => {
      console.log('New booking:', data);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    });

    return () => {
      socket.off('trip-updated');
      socket.off('booking-created');
    };
  }, [queryClient]);

  // ... rest of component
}
```

---

## 💳 **STEP 3: Payment Integration (Quick Setup)**

### **1. Environment Variables**

```bash
# .env
VITE_FLUTTERWAVE_PUBLIC_KEY=your_public_key
VITE_PAYMENT_CALLBACK_URL=http://localhost:8080/payment/callback
```

### **2. Payment Service**

```typescript
// src/services/paymentService.ts
import api from './api';

export const paymentService = {
  initializePayment: async (bookingData: any) => {
    const response = await api.post('/payments/initialize', {
      amount: bookingData.totalAmount,
      currency: 'BWP',
      email: bookingData.email,
      phone: bookingData.phone,
      booking_id: bookingData.id,
      callback_url: import.meta.env.VITE_PAYMENT_CALLBACK_URL,
    });
    return response.data;
  },

  verifyPayment: async (transactionId: string) => {
    const response = await api.get(`/payments/verify/${transactionId}`);
    return response.data;
  },
};
```

### **3. Payment Component**

```typescript
// src/pages/Payment.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/paymentService';

export default function Payment() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePayment = async () => {
    setLoading(true);
    try {
      const booking = JSON.parse(localStorage.getItem('currentBooking') || '{}');
      const paymentData = await paymentService.initializePayment(booking);
      
      // Redirect to payment gateway
      window.location.href = paymentData.link;
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>
    </div>
  );
}
```

---

## 🗺️ **STEP 4: Google Maps Integration**

### **1. Install Package**

```bash
npm install @react-google-maps/api
```

### **2. Environment Variable**

```bash
# .env
VITE_GOOGLE_MAPS_API_KEY=your_api_key
```

### **3. Map Component**

```typescript
// src/components/tracking/LiveMap.tsx
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '500px',
};

export default function LiveMap({ buses }: { buses: any[] }) {
  const center = {
    lat: -24.6282, // Gaborone
    lng: 25.9231,
  };

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
      >
        {buses.map((bus) => (
          <Marker
            key={bus.id}
            position={{ lat: bus.latitude, lng: bus.longitude }}
            title={bus.busNumber}
            icon={{
              url: '/bus-icon.png',
              scaledSize: new window.google.maps.Size(40, 40),
            }}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
}
```

---

## 📱 **STEP 5: Push Notifications (Optional)**

### **1. Firebase Setup**

```bash
npm install firebase
```

### **2. Firebase Config**

```typescript
// src/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging);
      console.log('FCM Token:', token);
      return token;
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
};

export { messaging, onMessage };
```

---

## 🎯 **IMPLEMENTATION PRIORITY**

### **Week 1-2: Core API Integration**
- [ ] Set up API service layer
- [ ] Create service modules (trips, bookings, routes)
- [ ] Implement React Query hooks
- [ ] Replace mock data in Admin dashboard
- [ ] Replace mock data in Operations dashboard

### **Week 3-4: Real-Time Features**
- [ ] Set up WebSocket connection
- [ ] Implement real-time trip updates
- [ ] Add live booking notifications
- [ ] Update Driver dashboard with real data

### **Week 5-6: Payment Processing**
- [ ] Integrate payment gateway
- [ ] Implement payment flow
- [ ] Add receipt generation
- [ ] Test payment reconciliation

### **Week 7-8: GPS & Tracking**
- [ ] Add Google Maps
- [ ] Implement live tracking
- [ ] Add route visualization
- [ ] Calculate ETAs

---

## 🧪 **TESTING CHECKLIST**

### **API Integration:**
- [ ] All endpoints return data correctly
- [ ] Error handling works
- [ ] Loading states display
- [ ] Token refresh works
- [ ] Offline error handling

### **Real-Time:**
- [ ] Socket connects successfully
- [ ] Updates appear immediately
- [ ] Reconnection works
- [ ] Multiple users sync correctly

### **Payments:**
- [ ] Payment gateway redirects
- [ ] Callback handles success/failure
- [ ] Receipts generate correctly
- [ ] Refunds process properly

### **Maps:**
- [ ] Maps load correctly
- [ ] Markers display
- [ ] Routes render
- [ ] Performance is acceptable

---

## 📚 **HELPFUL COMMANDS**

```bash
# Start development
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Check types
npm run type-check

# Lint code
npm run lint

# Format code
npm run format
```

---

## 🆘 **COMMON ISSUES & SOLUTIONS**

### **CORS Errors:**
```typescript
// backend/src/index.ts
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

### **Socket Connection Issues:**
```typescript
// Check firewall
// Ensure backend is running
// Verify VITE_SOCKET_URL is correct
```

### **Payment Callback Not Working:**
```typescript
// Ensure callback URL is publicly accessible
// Check payment gateway dashboard for errors
// Verify webhook signature
```

---

## 🎉 **YOU'RE READY TO START!**

**Begin with Step 1 (API Integration) and work your way through each step.**

**Each step builds on the previous one, so follow the order for best results.**

**Good luck building the future of bus transportation!** 🚌🚀
