import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import OperationsLayout from './operations/OperationsLayout';

interface RouteWrapperProps {
  children: ReactNode;
  forceLayout?: 'admin' | 'operations';
}

/**
 * RouteWrapper - Intelligently wraps content in the appropriate layout
 * based on the current route or forced layout prop
 */
export default function RouteWrapper({ children, forceLayout }: RouteWrapperProps) {
  const location = useLocation();
  
  // Determine which layout to use
  const useAdminLayout = forceLayout === 'admin' || 
    location.pathname.startsWith('/admin');
  
  const useOperationsLayout = forceLayout === 'operations' || 
    (!useAdminLayout && location.pathname.startsWith('/operations'));

  if (useAdminLayout) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  if (useOperationsLayout) {
    return <OperationsLayout>{children}</OperationsLayout>;
  }

  // Default: no layout wrapper (for public pages)
  return <>{children}</>;
}
