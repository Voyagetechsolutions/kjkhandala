import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon } from 'leaflet';
import { useTrackingStore } from '../../store';
import { Bus, Navigation, Clock } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = new Icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const LiveMap = () => {
  const { buses, selectedBus, selectBus, setBuses, setLiveTracking } = useTrackingStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusLocations();
    setLiveTracking(true);

    // Poll for updates every 10 seconds
    const interval = setInterval(fetchBusLocations, 10000);

    return () => {
      clearInterval(interval);
      setLiveTracking(false);
    };
  }, []);

  const fetchBusLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/tracking/buses', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBuses(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch bus locations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Default center (Botswana)
  const center: [number, number] = [-24.6282, 25.9231];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading live tracking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Live Tracking</h1>
            <p className="text-sm text-gray-600">
              {buses.length} buses currently active
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {buses.map((bus) => (
            <Marker
              key={bus.busId}
              position={[bus.latitude, bus.longitude]}
              icon={DefaultIcon}
              eventHandlers={{
                click: () => selectBus(bus)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[250px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Bus className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-lg">{bus.busNumber}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Route:</span>
                      <span className="ml-2 font-medium">{bus.route}</span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Driver:</span>
                      <span className="ml-2 font-medium">{bus.driverName}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">{bus.speed} km/h</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      <span className="text-xs text-gray-500">
                        Updated: {new Date(bus.lastUpdated).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Selected Bus Info Panel */}
        {selectedBus && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-80 z-[1000]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">{selectedBus.busNumber}</h3>
              <button
                onClick={() => selectBus(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Route</label>
                <p className="font-medium">{selectedBus.route}</p>
              </div>

              <div>
                <label className="text-xs text-gray-600">Driver</label>
                <p className="font-medium">{selectedBus.driverName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600">Speed</label>
                  <p className="font-medium text-lg">{selectedBus.speed} km/h</p>
                </div>
                <div>
                  <label className="text-xs text-gray-600">Heading</label>
                  <p className="font-medium text-lg">{selectedBus.heading}°</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600">Last Updated</label>
                <p className="text-sm">
                  {new Date(selectedBus.lastUpdated).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bus List Sidebar */}
      <div className="absolute left-4 top-24 bottom-4 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-[1000]">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-bold text-lg">Active Buses</h3>
        </div>
        <div className="overflow-y-auto h-full pb-20">
          {buses.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No active buses
            </div>
          ) : (
            buses.map((bus) => (
              <div
                key={bus.busId}
                onClick={() => selectBus(bus)}
                className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedBus?.busId === bus.busId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">{bus.busNumber}</span>
                  <span className="text-sm text-gray-600">{bus.speed} km/h</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{bus.route}</p>
                <p className="text-xs text-gray-500 mt-1">{bus.driverName}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
