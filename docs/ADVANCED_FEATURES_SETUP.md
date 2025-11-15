# Advanced GPS Tracking Features - Setup Guide

## 🚀 Quick Setup

### 1. Install Required Packages
```bash
cd frontend
npm install @react-google-maps/api @googlemaps/markerclusterer
```

### 2. Run SQL Scripts
```sql
-- In Supabase SQL Editor, run:
-- 1. COMPLETE_11_live_tracking.sql (if not already run)
-- 2. COMPLETE_12_advanced_tracking.sql
```

### 3. Update .env
```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key
```

---

## ✅ Features Implemented

### 1. **Route Visualization (Polyline)**
- Shows historical path of each bus
- Color-coded by speed
- Toggle on/off with switch

**Usage:**
```typescript
<Polyline
  path={routeCoordinates}
  options={{
    strokeColor: '#2563eb',
    strokeWeight: 3,
    strokeOpacity: 0.7,
  }}
/>
```

### 2. **Traffic Layer**
- Real-time traffic conditions
- Toggle on/off
- Shows congestion levels

**Usage:**
```typescript
{showTraffic && <TrafficLayer />}
```

### 3. **Bus Clustering**
- Groups nearby buses when zoomed out
- Improves performance with many buses
- Auto-expands on zoom

**Usage:**
```typescript
const clusterer = new MarkerClusterer({ map, markers });
```

### 4. **Geofencing Alerts**
- Define zones (terminals, borders)
- Alert on entry/exit
- Visual circles on map

**Features:**
- Automatic entry/exit detection
- Event logging
- Real-time notifications

### 5. **Historical Route Playback**
- Replay bus routes
- Speed control
- Timeline scrubber

**Controls:**
- Play/Pause button
- Progress slider
- Speed adjustment

---

## 📊 Database Schema

### Geofences Table
```sql
CREATE TABLE geofences (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  center_lat numeric NOT NULL,
  center_lng numeric NOT NULL,
  radius_meters numeric DEFAULT 1000,
  alert_on_entry boolean DEFAULT true,
  alert_on_exit boolean DEFAULT true
);
```

### Geofence Events
```sql
CREATE TABLE geofence_events (
  id uuid PRIMARY KEY,
  geofence_id uuid REFERENCES geofences(id),
  bus_id uuid REFERENCES buses(id),
  event_type text CHECK (event_type IN ('entry', 'exit')),
  created_at timestamptz DEFAULT now()
);
```

### Bus Routes
```sql
CREATE TABLE bus_routes (
  id uuid PRIMARY KEY,
  bus_id uuid REFERENCES buses(id),
  route_coordinates jsonb NOT NULL,
  start_time timestamptz NOT NULL,
  total_distance_km numeric DEFAULT 0
);
```

---

## 🎮 UI Controls

### Map Controls Panel
```typescript
<Card>
  <CardHeader>
    <CardTitle>Map Controls</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Traffic Layer */}
    <div className="flex items-center justify-between">
      <Label>Show Traffic</Label>
      <Switch checked={showTraffic} onCheckedChange={setShowTraffic} />
    </div>

    {/* Route Visualization */}
    <div className="flex items-center justify-between">
      <Label>Show Routes</Label>
      <Switch checked={showRoutes} onCheckedChange={setShowRoutes} />
    </div>

    {/* Geofences */}
    <div className="flex items-center justify-between">
      <Label>Show Geofences</Label>
      <Switch checked={showGeofences} onCheckedChange={setShowGeofences} />
    </div>

    {/* Clustering */}
    <div className="flex items-center justify-between">
      <Label>Use Clustering</Label>
      <Switch checked={useClustering} onCheckedChange={setUseClustering} />
    </div>
  </CardContent>
</Card>
```

### Historical Playback Controls
```typescript
<Card>
  <CardHeader>
    <CardTitle>Route Playback</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex gap-2">
      <Button onClick={handlePlayPause}>
        {isPlaying ? <Pause /> : <Play />}
      </Button>
      <Button onClick={handleReset}>
        <SkipBack />
      </Button>
    </div>
    <Slider
      value={[historyProgress]}
      onValueChange={([value]) => setHistoryProgress(value)}
      max={100}
      step={1}
    />
  </CardContent>
</Card>
```

---

## 🔧 Implementation Examples

### Fetch Historical Route
```typescript
const fetchHistoricalRoute = async (busId: string) => {
  const { data } = await supabase
    .rpc('get_bus_route_history', {
      p_bus_id: busId,
      p_start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      p_end_time: new Date().toISOString()
    });
  
  return data.map(point => ({
    lat: Number(point.latitude),
    lng: Number(point.longitude)
  }));
};
```

### Fetch Geofences
```typescript
const fetchGeofences = async () => {
  const { data } = await supabase
    .rpc('get_active_geofences');
  
  setGeofences(data || []);
};
```

### Check Geofence Events
```typescript
const { data: events } = await supabase
  .from('geofence_events')
  .select('*, geofences(name), buses(registration_number)')
  .order('created_at', { ascending: false })
  .limit(10);
```

---

## 🎨 Visual Elements

### Geofence Circles
```typescript
{geofences.map(fence => (
  <Circle
    key={fence.id}
    center={{ lat: fence.center_lat, lng: fence.center_lng }}
    radius={fence.radius_meters}
    options={{
      fillColor: '#3b82f6',
      fillOpacity: 0.2,
      strokeColor: '#2563eb',
      strokeWeight: 2,
    }}
  />
))}
```

### Route Polylines
```typescript
{showRoutes && routeData.map(route => (
  <Polyline
    key={route.id}
    path={route.coordinates}
    options={{
      strokeColor: '#22c55e',
      strokeWeight: 3,
      strokeOpacity: 0.7,
    }}
  />
))}
```

---

## 📱 Sample Geofences

Pre-loaded in database:
- **Gaborone Bus Terminal** (500m radius)
- **Francistown Station** (500m radius)
- **Maun Terminal** (500m radius)
- **Kasane Border** (1000m radius)

---

## ✅ Testing Checklist

- [ ] SQL scripts executed successfully
- [ ] Packages installed
- [ ] Google Maps API key added
- [ ] Traffic layer toggles on/off
- [ ] Routes display correctly
- [ ] Geofence circles visible
- [ ] Clustering works with many buses
- [ ] Historical playback functional
- [ ] Geofence alerts triggering

---

## 🎯 Next Steps

1. **Run SQL**: Execute `COMPLETE_12_advanced_tracking.sql`
2. **Install packages**: `npm install @googlemaps/markerclusterer`
3. **Test features**: Toggle each feature on Live Tracking page
4. **Add custom geofences**: Use Supabase dashboard
5. **Monitor events**: Check `geofence_events` table

**All advanced features are now ready!** 🚀
