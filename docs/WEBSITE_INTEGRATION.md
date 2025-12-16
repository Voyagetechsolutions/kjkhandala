# VTS SaaS Website Integration Guide

This guide explains how external company websites can integrate with the VTS booking system.

## Overview

There are **3 ways** to integrate your company website with VTS:

1. **Redirect Integration** - Redirect users to VTS for booking (simplest)
2. **Embed Integration** - Embed booking widget in your website
3. **API Integration** - Full API access for custom implementations

---

## 1. Redirect Integration (Recommended for Most)

### Setup

1. Get your company **slug** from the VTS admin dashboard
2. Add the VTS integration library to your website

### Usage

```javascript
// Redirect to VTS booking page
window.location.href = 'https://vts-saas.com/book/your-company-slug';

// With pre-filled search
window.location.href = 'https://vts-saas.com/book/your-company-slug?from=Johannesburg&to=Durban&date=2024-12-25';
```

### Authentication Flow

```javascript
// 1. Redirect user to VTS login
const returnUrl = encodeURIComponent(window.location.href);
window.location.href = `https://vts-saas.com/auth/external-login?company=your-slug&return_to=${returnUrl}`;

// 2. After login, user is redirected back with token
// URL: https://yoursite.com/page?token=xxx&user_id=yyy

// 3. Parse and store the token
const params = new URLSearchParams(window.location.search);
const token = params.get('token');
const userId = params.get('user_id');

if (token) {
  localStorage.setItem('vts_token', token);
  localStorage.setItem('vts_user_id', userId);
}
```

---

## 2. Embed Integration

### Iframe Embed

Add this to your website where you want the booking widget:

```html
<iframe 
  src="https://vts-saas.com/book/your-company-slug?embed=true" 
  width="100%" 
  height="600px" 
  frameborder="0"
  allow="payment"
  style="border: none; border-radius: 8px;"
></iframe>
```

### With Pre-filled Search

```html
<iframe 
  src="https://vts-saas.com/book/your-company-slug?embed=true&from=Johannesburg&to=Durban" 
  width="100%" 
  height="600px" 
  frameborder="0"
></iframe>
```

---

## 3. API Integration

### Get API Key

1. Login to VTS Admin Dashboard
2. Go to **Settings > API Integration**
3. Generate a new API key
4. Configure allowed domains

### API Endpoints

Base URL: `https://vts-saas.com/api/v1`

#### Search Trips

```bash
GET /api/v1/trips/search?from={city}&to={city}&date={YYYY-MM-DD}
Authorization: Bearer YOUR_API_KEY
```

#### Get Trip Details

```bash
GET /api/v1/trips/{trip_id}
Authorization: Bearer YOUR_API_KEY
```

#### Create Booking

```bash
POST /api/v1/bookings
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "trip_id": "uuid",
  "passengers": [
    {
      "name": "John Doe",
      "id_number": "1234567890",
      "seat_number": "A1"
    }
  ],
  "contact_email": "john@example.com",
  "contact_phone": "+27123456789"
}
```

---

## React Integration (for React websites)

### Install

The VTS integration is built into the main_website. For other React projects:

```bash
# Copy these files to your project:
# - src/lib/vts-integration.ts
# - src/hooks/useVTSAuth.ts
```

### Usage

```tsx
import { useVTSAuth } from '@/hooks/useVTSAuth';
import { redirectToBooking } from '@/lib/vts-integration';

function BookingButton() {
  const { user, isAuthenticated, login, logout } = useVTSAuth();

  if (!isAuthenticated) {
    return <button onClick={() => login()}>Login to Book</button>;
  }

  return (
    <div>
      <p>Welcome, {user?.fullName}</p>
      <button onClick={() => redirectToBooking()}>Book Now</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Initialize VTS

```tsx
// In your app initialization
import { initVTS } from '@/lib/vts-integration';

initVTS({
  saasUrl: 'https://vts-saas.com',
  companySlug: 'your-company-slug',
});
```

---

## Environment Variables

For React/Vite projects, add to `.env`:

```env
VITE_VTS_SAAS_URL=https://vts-saas.com
VITE_COMPANY_SLUG=your-company-slug
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Branding

Your booking pages will automatically use your company's branding:
- Logo
- Primary color
- Secondary color
- Company name

Configure these in **VTS Admin > Settings > API Integration > Branding**.

---

## Webhook Notifications

Configure webhooks to receive booking notifications:

1. Go to **VTS Admin > Settings > API Integration > Webhooks**
2. Add your webhook URL
3. Select events to receive:
   - `booking.created`
   - `booking.confirmed`
   - `booking.cancelled`
   - `payment.completed`

### Webhook Payload Example

```json
{
  "event": "booking.created",
  "timestamp": "2024-12-16T12:00:00Z",
  "data": {
    "booking_id": "uuid",
    "trip_id": "uuid",
    "passenger_count": 2,
    "total_amount": 450.00,
    "status": "pending"
  }
}
```

---

## Support

- Email: support@voyagetech.com
- Documentation: https://docs.vts-saas.com
- API Status: https://status.vts-saas.com
