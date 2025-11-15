# Google Maps Integration Setup Guide

## 📋 Prerequisites

1. Google Cloud Platform account
2. Credit card (required for Google Maps API, but free tier is generous)
3. Node.js and npm installed

---

## 🚀 Step 1: Install Required Package

```bash
cd frontend
npm install @react-google-maps/api
```

---

## 🔑 Step 2: Get Google Maps API Key

### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `KJ-Khandala-Bus-Tracking`
4. Click "Create"

### 2.2 Enable Required APIs

1. In the Cloud Console, go to **APIs & Services** → **Library**
2. Search and enable these APIs:
   - **Maps JavaScript API** (Required)
   - **Geocoding API** (Optional, for address lookup)
   - **Directions API** (Optional, for route planning)

### 2.3 Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API Key**
3. Copy the API key (it will look like: `AIzaSyD...`)

### 2.4 Restrict API Key (Recommended for Security)

1. Click on your API key to edit it
2. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Add your domains:
     ```
     http://localhost:8080/*
     http://localhost:5173/*
     https://yourdomain.com/*
     ```
3. Under **API restrictions**:
   - Select **Restrict key**
   - Select only the APIs you enabled
4. Click **Save**

---

## ⚙️ Step 3: Configure Environment Variables

### 3.1 Update `.env` file

```bash
# In frontend folder, create or update .env file
cd frontend
```

Add this line to your `.env` file:
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD_your_actual_api_key_here
```

### 3.2 Example `.env` file

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://hhuxihkpetkeftffuyhi.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD_your_actual_api_key_here

# App Configuration
VITE_APP_NAME=KJ Khandala Bus Services
VITE_APP_URL=http://localhost:8080
```

---

## 🎨 Step 4: Features Implemented

### ✅ Live GPS Map
- Real-time bus location tracking
- Color-coded markers:
  - 🟢 **Green** = Moving (speed > 5 km/h)
  - 🟡 **Yellow** = Idle (speed 0-5 km/h)
  - ⚪ **Gray** = Stopped (speed = 0)

### ✅ Interactive Markers
- Click on any bus marker to see details:
  - Bus registration number
  - Make and model
  - Current status
  - Current speed
  - Last GPS update time

### ✅ Map Controls
- Zoom controls
- Map type selector (Map/Satellite)
- Fullscreen mode
- Pan and zoom with mouse/touch

### ✅ Auto-Refresh
- GPS data updates every 10 seconds
- Manual refresh button available
- Last update timestamp displayed

---

## 🧪 Step 5: Testing

### 5.1 Start Development Server

```bash
cd frontend
npm run dev
```

### 5.2 Access Live Tracking

1. Navigate to: `http://localhost:8080/operations/live-tracking`
2. You should see:
   - Summary cards with bus statistics
   - Bus list table
   - Active trips table
   - **Live GPS Map** with bus markers

### 5.3 Test Different Scenarios

**Scenario 1: No API Key**
- Remove `VITE_GOOGLE_MAPS_API_KEY` from `.env`
- Restart server
- Should see yellow warning with instructions

**Scenario 2: Invalid API Key**
- Use wrong API key
- Should see red error message

**Scenario 3: No GPS Data**
- Empty `bus_locations` table
- Should see blue info message

**Scenario 4: Working Map**
- Valid API key + GPS data
- Should see map with bus markers

---

## 📊 Step 6: Add Sample GPS Data

Run this SQL in Supabase to add test data:

```sql
-- Insert sample GPS locations for testing
INSERT INTO bus_locations (bus_id, latitude, longitude, speed, heading, status)
SELECT
  id,
  -24.6282 + (random() * 0.1 - 0.05), -- Gaborone area
  25.9231 + (random() * 0.1 - 0.05),
  (random() * 100)::numeric(5,2),      -- Speed 0-100 km/h
  (random() * 360)::numeric(5,2),      -- Heading 0-360°
  CASE
    WHEN random() > 0.7 THEN 'moving'
    WHEN random() > 0.4 THEN 'idle'
    ELSE 'stopped'
  END
FROM buses
WHERE status = 'active'
LIMIT 10;
```

---

## 💰 Pricing Information

### Google Maps Free Tier (Monthly)

- **Maps JavaScript API**: $200 free credit
- **28,000 map loads** per month (free)
- **40,000 geocoding requests** per month (free)

### Typical Usage for Small Fleet (10-50 buses)

- **Map loads**: ~1,000/month (well within free tier)
- **Cost**: $0/month (free tier sufficient)

### If You Exceed Free Tier

- **Maps JavaScript API**: $7 per 1,000 loads
- **Geocoding API**: $5 per 1,000 requests
- Set up billing alerts in Google Cloud Console

---

## 🔒 Security Best Practices

### 1. Restrict API Key
✅ Already covered in Step 2.4

### 2. Environment Variables
```bash
# Never commit .env file to git
echo ".env" >> .gitignore
```

### 3. Rate Limiting
- Google automatically rate limits
- Monitor usage in Google Cloud Console

### 4. Domain Restrictions
- Only allow your production domain
- Remove localhost in production

---

## 🐛 Troubleshooting

### Issue 1: Map Not Loading
**Symptoms:** Gray box or loading spinner forever

**Solutions:**
1. Check API key is correct in `.env`
2. Verify APIs are enabled in Google Cloud
3. Check browser console for errors
4. Restart dev server after changing `.env`

### Issue 2: "This page can't load Google Maps correctly"
**Symptoms:** Error overlay on map

**Solutions:**
1. API key restrictions too strict
2. Billing not enabled (required even for free tier)
3. Wrong API enabled (need Maps JavaScript API)

### Issue 3: Markers Not Showing
**Symptoms:** Map loads but no markers

**Solutions:**
1. Check `bus_locations` table has data
2. Verify latitude/longitude are valid numbers
3. Check browser console for errors

### Issue 4: "RefreshAccessToken" Error
**Symptoms:** Map loads then shows error

**Solutions:**
1. Enable billing in Google Cloud (required)
2. Wait a few minutes for billing to activate
3. Clear browser cache

---

## 📱 Mobile Optimization

The map is already mobile-responsive:
- Touch gestures for pan/zoom
- Responsive container
- Mobile-friendly info windows

---

## 🎯 Next Steps (Optional Enhancements)

### 1. Route Visualization
```typescript
import { Polyline } from '@react-google-maps/api';

<Polyline
  path={routeCoordinates}
  options={{
    strokeColor: '#2563eb',
    strokeWeight: 3,
  }}
/>
```

### 2. Traffic Layer
```typescript
import { TrafficLayer } from '@react-google-maps/api';

<TrafficLayer />
```

### 3. Heatmap
```typescript
import { HeatmapLayer } from '@react-google-maps/api';

<HeatmapLayer data={heatmapData} />
```

### 4. Clustering (for many buses)
```bash
npm install @googlemaps/markerclusterer
```

---

## ✅ Verification Checklist

- [ ] Google Cloud project created
- [ ] Maps JavaScript API enabled
- [ ] API key created and copied
- [ ] API key restrictions configured
- [ ] `.env` file updated with API key
- [ ] `@react-google-maps/api` package installed
- [ ] Dev server restarted
- [ ] Map loads successfully
- [ ] Markers appear on map
- [ ] Info windows work on click
- [ ] Auto-refresh working (10s interval)

---

## 📞 Support

If you encounter issues:

1. **Check Google Cloud Console** → APIs & Services → Dashboard
   - Verify API is enabled
   - Check quota usage
   - Review error logs

2. **Browser Console**
   - Press F12
   - Check for JavaScript errors
   - Look for API key errors

3. **Supabase**
   - Verify `bus_locations` table exists
   - Check data is being inserted
   - Verify RLS policies allow reads

---

## 🎉 Success!

Once everything is working, you'll have:
- ✅ Real-time GPS tracking
- ✅ Interactive map with bus markers
- ✅ Click-to-view bus details
- ✅ Color-coded status indicators
- ✅ Auto-refreshing data
- ✅ Professional fleet management dashboard

**Your live tracking system is now production-ready!** 🚀
