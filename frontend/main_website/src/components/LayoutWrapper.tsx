import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from './admin/AdminLayout';
import OperationsLayout from './operations/OperationsLayout';

interface LayoutWrapperProps {
  children: ReactNode;
}

/**
 * LayoutWrapper - Determines which layout to use based on the current route
 * This allows pages to be layout-agnostic and prevents unwanted sidebar switches
 */
export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const location = useLocation();
  const path = location.pathname;

  // Determine layout based on route prefix
  // Operations routes use OperationsLayout
  // Admin routes use AdminLayout
  const useOperationsLayout = path.startsWith('/operations');

  if (useOperationsLayout) {
    return <OperationsLayout>{children}</OperationsLayout>;
  }

  return <AdminLayout>{children}</AdminLayout>;
}
