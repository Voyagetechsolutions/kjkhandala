import { useJsApiLoader, Libraries } from '@react-google-maps/api';

// Centralized Google Maps configuration
// This ensures all components use the same loader options
const libraries: Libraries = ['visualization', 'geometry', 'places'];

export const useGoogleMaps = () => {
  return useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
  });
};

export { libraries };
