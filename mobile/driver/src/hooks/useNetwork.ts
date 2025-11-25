import { useState, useEffect } from 'react';
import { networkService } from '@/services/network';

export function useNetwork() {
  const [isConnected, setIsConnected] = useState(false);
  const [isInternetReachable, setIsInternetReachable] = useState(false);

  useEffect(() => {
    // Initialize network service
    networkService.init();

    // Subscribe to network changes
    const unsubscribe = networkService.onChange((connected) => {
      setIsConnected(connected);
    });

    // Get initial status
    networkService.getStatus().then((status) => {
      setIsConnected(status.isConnected);
      setIsInternetReachable(status.isInternetReachable);
    });

    return () => {
      unsubscribe();
      networkService.destroy();
    };
  }, []);

  return { isConnected, isInternetReachable };
}
