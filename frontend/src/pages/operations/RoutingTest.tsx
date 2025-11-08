import { Link } from 'react-router-dom';
import OperationsLayout from '@/components/operations/OperationsLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

export default function RoutingTest() {
  const routes = [
    { path: '/operations', label: 'Dashboard' },
    { path: '/operations/trips', label: 'Trip Management' },
    { path: '/operations/fleet', label: 'Fleet Operations' },
    { path: '/operations/drivers', label: 'Driver Operations' },
    { path: '/operations/incidents', label: 'Incident Management' },
    { path: '/operations/delays', label: 'Delay Management' },
    { path: '/operations/reports', label: 'Reports & Analytics' },
    { path: '/operations/terminal', label: 'Terminal Operations' },
  ];

  return (
    <OperationsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">🧪 Routing Test Page</h1>
          <p className="text-muted-foreground">Test all Operations routes</p>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <CheckCircle className="h-5 w-5" />
              This Page Loaded Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-800">
              If you can see this page, it means:
            </p>
            <ul className="list-disc list-inside mt-2 text-green-800 space-y-1">
              <li>React Router is working</li>
              <li>OperationsLayout component loads</li>
              <li>You have access to the Operations module</li>
              <li>The sidebar should be visible on the left</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test All Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                Click each link below. If it loads without 404, that route works!
              </p>
              {routes.map((route) => (
                <div key={route.path} className="flex items-center gap-2">
                  <Link
                    to={route.path}
                    className="flex-1 p-3 border rounded hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{route.label}</div>
                    <div className="text-xs text-muted-foreground">{route.path}</div>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Frontend is running</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>React Router is working</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>You are authenticated</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>OperationsLayout renders correctly</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Click each route link above</li>
              <li>If a page shows 404, note which one</li>
              <li>Check browser console (F12) for errors</li>
              <li>Try using the sidebar navigation instead</li>
              <li>If sidebar works but direct links don't, there's a routing config issue</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </OperationsLayout>
  );
}
