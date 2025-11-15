import { ReactElement, cloneElement } from 'react';
import AdminLayout from './admin/AdminLayout';

/**
 * WithAdminLayout - Wraps Operations pages with AdminLayout instead of OperationsLayout
 * This allows Admin users to access Operations pages while maintaining the Admin sidebar
 * 
 * Usage in App.tsx:
 * <Route path="/admin/operations" element={<WithAdminLayout><OperationsDashboard /></WithAdminLayout>} />
 */
export default function WithAdminLayout({ children }: { children: ReactElement }) {
  // The children (Operations pages) have OperationsLayout wrapping their content
  // We need to extract the content and wrap it with AdminLayout instead
  
  // For now, we'll render the page as-is and let it use its own layout
  // TODO: Refactor Operations pages to accept layout as prop or extract content components
  
  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This Operations page is displayed within the Admin dashboard. 
            The content below uses the Operations layout. For full integration, Operations pages 
            need to be refactored to be layout-agnostic.
          </p>
        </div>
        {/* Render the Operations page - it will have its own OperationsLayout */}
        <div className="-mx-6 -my-8">
          {children}
        </div>
      </div>
    </AdminLayout>
  );
}
