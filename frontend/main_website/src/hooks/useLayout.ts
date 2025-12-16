import { useLocation } from 'react-router-dom';

/**
 * useLayout - Determines which layout should be used based on the current route
 * 
 * Returns:
 * - 'admin' if the route starts with /admin
 * - 'operations' if the route starts with /operations
 * - 'none' for other routes
 */
export function useLayout(): 'admin' | 'operations' | 'finance' | 'hr' | 'maintenance' | 'ticketing' | 'none' {
  const location = useLocation();
  const path = location.pathname;

  if (path.startsWith('/admin')) {
    return 'admin';
  }
  
  if (path.startsWith('/operations')) {
    return 'operations';
  }
  
  if (path.startsWith('/finance')) {
    return 'finance';
  }
  
  if (path.startsWith('/hr')) {
    return 'hr';
  }
  
  if (path.startsWith('/maintenance')) {
    return 'maintenance';
  }
  
  if (path.startsWith('/ticketing')) {
    return 'ticketing';
  }

  return 'none';
}

/**
 * shouldUseAdminLayout - Helper to check if AdminLayout should be used
 */
export function shouldUseAdminLayout(): boolean {
  const layout = useLayout();
  return layout === 'admin';
}

/**
 * shouldUseOperationsLayout - Helper to check if OperationsLayout should be used  
 */
export function shouldUseOperationsLayout(): boolean {
  const layout = useLayout();
  return layout === 'operations';
}
