import { create } from 'zustand';

interface BusLocation {
  busId: string;
  busNumber: string;
  tripId: string;
  route: string;
  driverName: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  lastUpdated: string;
}

interface TrackingState {
  buses: BusLocation[];
  selectedBus: BusLocation | null;
  isLiveTracking: boolean;
  setBuses: (buses: BusLocation[]) => void;
  updateBusLocation: (busId: string, location: Partial<BusLocation>) => void;
  selectBus: (bus: BusLocation | null) => void;
  setLiveTracking: (isLive: boolean) => void;
}

export const useTrackingStore = create<TrackingState>((set) => ({
  buses: [],
  selectedBus: null,
  isLiveTracking: false,

  setBuses: (buses) => {
    set({ buses });
  },

  updateBusLocation: (busId, location) => {
    set((state) => ({
      buses: state.buses.map((bus) =>
        bus.busId === busId ? { ...bus, ...location } : bus
      ),
      selectedBus:
        state.selectedBus?.busId === busId
          ? { ...state.selectedBus, ...location }
          : state.selectedBus
    }));
  },

  selectBus: (bus) => {
    set({ selectedBus: bus });
  },

  setLiveTracking: (isLive) => {
    set({ isLiveTracking: isLive });
  }
}));
