import { create } from 'zustand';

type TrackingBus = {
  busId?: string | number;
  bus_id?: string | number;
  busNumber?: string;
  route?: string;
  driverName?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  lastUpdated?: string;
};

type TrackingState = {
  buses: TrackingBus[];
  selectedBus: TrackingBus | null;
  isLiveTracking: boolean;
  setBuses: (buses: TrackingBus[]) => void;
  selectBus: (bus: TrackingBus | null) => void;
  setLiveTracking: (isLive: boolean) => void;
};

export const useTrackingStore = create<TrackingState>((set) => ({
  buses: [],
  selectedBus: null,
  isLiveTracking: false,
  setBuses: (buses) => set({ buses }),
  selectBus: (bus) => set({ selectedBus: bus }),
  setLiveTracking: (isLiveTracking) => set({ isLiveTracking }),
}));
