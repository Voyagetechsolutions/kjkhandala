import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Code,
  Globe,
  Key,
  Lock,
  Server,
  Zap,
  BookOpen,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const endpoints = [
  {
    category: "Configuration",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/config",
        description: "Get company branding, features, and settings",
        auth: "API Key",
        response: `{
  "success": true,
  "data": {
    "company": {
      "name": "ABC Bus Lines",
      "slug": "abc-bus-lines",
      "is_verified": true
    },
    "branding": {
      "logo_url": "https://...",
      "primary_color": "#1E40AF",
      "secondary_color": "#3B82F6"
    },
    "features": {
      "online_booking": true,
      "seat_selection": true
    },
    "settings": {
      "currency": "USD",
      "timezone": "Africa/Harare"
    }
  }
}`,
      },
    ],
  },
  {
    category: "Routes",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/routes",
        description: "List all active routes",
        auth: "API Key",
        response: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "origin": "Harare",
      "destination": "Bulawayo",
      "fare": 25.00,
      "distance_km": 440,
      "duration_hours": 5.5
    }
  ],
  "count": 10
}`,
      },
      {
        method: "GET",
        path: "/api/v1/routes/:id",
        description: "Get route details with stops",
        auth: "API Key",
        response: `{
  "success": true,
  "data": {
    "id": "uuid",
    "origin": "Harare",
    "destination": "Bulawayo",
    "stops": [
      { "city_name": "Kwekwe", "stop_order": 1 }
    ]
  }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/routes/cities/list",
        description: "Get all cities served",
        auth: "API Key",
        response: `{
  "success": true,
  "data": ["Harare", "Bulawayo", "Mutare"],
  "count": 3
}`,
      },
    ],
  },
  {
    category: "Trips",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/trips/search",
        description: "Search available trips",
        auth: "API Key",
        params: "origin, destination, date, passengers (optional)",
        response: `{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "trip_number": "TRP-001",
      "departure": {
        "time": "2024-12-08T06:00:00Z",
        "city": "Harare"
      },
      "arrival": {
        "time": "2024-12-08T11:30:00Z",
        "city": "Bulawayo"
      },
      "seats": {
        "total": 45,
        "available": 32
      },
      "fare": 25.00,
      "status": "scheduled"
    }
  ],
  "count": 5
}`,
      },
      {
        method: "GET",
        path: "/api/v1/trips/:id",
        description: "Get trip details",
        auth: "API Key",
        response: `{
  "success": true,
  "data": {
    "id": "uuid",
    "trip_number": "TRP-001",
    "bus": {
      "name": "Luxury Coach A",
      "type": "luxury"
    },
    "seats": {
      "total": 45,
      "available": 32,
      "booked": ["1", "2", "15"]
    }
  }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/trips/:id/seats",
        description: "Get seat availability map",
        auth: "API Key",
        response: `{
  "success": true,
  "data": {
    "trip_id": "uuid",
    "total_seats": 45,
    "seats": [
      { "number": "1", "status": "booked", "is_available": false },
      { "number": "2", "status": "available", "is_available": true }
    ]
  }
}`,
      },
    ],
  },
  {
    category: "Bookings",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/bookings",
        description: "Create a new booking",
        auth: "API Key",
        body: `{
  "trip_id": "uuid",
  "passengers": [
    {
      "name": "John Doe",
      "phone": "+263771234567",
      "email": "john@example.com",
      "id_number": "63-123456A78"
    }
  ],
  "contact_email": "john@example.com",
  "contact_phone": "+263771234567",
  "seat_numbers": ["12"]
}`,
        response: `{
  "success": true,
  "data": {
    "booking_reference": "VTS-ABC123-XYZ",
    "trip_id": "uuid",
    "passengers": 1,
    "seats": ["12"],
    "pricing": {
      "base_fare": 25.00,
      "subtotal": 25.00,
      "tax": 0,
      "total": 25.00,
      "currency": "USD"
    },
    "status": "pending",
    "expires_at": "2024-12-08T07:00:00Z"
  }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/bookings/:reference",
        description: "Get booking details",
        auth: "API Key",
        response: `{
  "success": true,
  "data": {
    "booking_reference": "VTS-ABC123-XYZ",
    "status": "confirmed",
    "payment_status": "completed",
    "trip": {
      "departure": { "time": "...", "city": "Harare" },
      "arrival": { "time": "...", "city": "Bulawayo" }
    },
    "passengers": [
      { "name": "John Doe", "seat_number": "12" }
    ],
    "total_amount": 25.00
  }
}`,
      },
      {
        method: "POST",
        path: "/api/v1/bookings/:reference/cancel",
        description: "Cancel a booking",
        auth: "API Key",
        body: `{ "reason": "Customer request" }`,
        response: `{
  "success": true,
  "data": {
    "booking_reference": "VTS-ABC123-XYZ",
    "status": "cancelled",
    "refund": {
      "eligible": true,
      "amount": 20.00,
      "percentage": 80
    }
  }
}`,
      },
    ],
  },
  {
    category: "Payments",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/payments/initiate",
        description: "Initiate payment for a booking",
        auth: "API Key",
        body: `{
  "booking_reference": "VTS-ABC123-XYZ",
  "payment_method": "card",
  "return_url": "https://yoursite.com/success",
  "cancel_url": "https://yoursite.com/cancel"
}`,
        response: `{
  "success": true,
  "data": {
    "payment_id": "uuid",
    "payment_reference": "PAY-XYZ123",
    "amount": 25.00,
    "currency": "USD",
    "payment_url": "https://pay.example.com/checkout?ref=...",
    "expires_at": "2024-12-08T07:00:00Z"
  }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/payments/:reference/status",
        description: "Check payment status",
        auth: "API Key",
        response: `{
  "success": true,
  "data": {
    "payment_reference": "PAY-XYZ123",
    "status": "completed",
    "booking_status": "confirmed",
    "paid_at": "2024-12-08T06:45:00Z"
  }
}`,
      },
    ],
  },
  {
    category: "Live Tracking",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/tracking/trip/:tripId",
        description: "Get live bus location for a trip",
        auth: "API Key",
        feature: "live_tracking",
        response: `{
  "success": true,
  "data": {
    "trip": {
      "id": "uuid",
      "status": "in_progress"
    },
    "location": {
      "latitude": -17.8292,
      "longitude": 31.0522,
      "speed_kmh": 80,
      "heading": 225,
      "last_updated": "2024-12-08T08:30:00Z"
    },
    "estimated_arrival": "2024-12-08T11:15:00Z"
  }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/tracking/booking/:reference",
        description: "Track bus by booking reference",
        auth: "API Key",
        feature: "live_tracking",
        response: `{
  "success": true,
  "data": {
    "booking": { "reference": "VTS-ABC123-XYZ" },
    "trip": { "status": "in_progress" },
    "location": { "latitude": -17.8292, "longitude": 31.0522 }
  }
}`,
      },
    ],
  },
];

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied to clipboard");
};

export default function ApiDocumentation() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            API Documentation
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete reference for the Voyage Tech Solutions Public API v1
          </p>
        </div>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Quick Start
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">1. Get API Key</p>
                  <p className="text-sm text-muted-foreground">
                    Generate your API key from the Developer Dashboard
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">2. Authenticate</p>
                  <p className="text-sm text-muted-foreground">
                    Include <code className="bg-muted px-1 rounded">x-api-key</code> header
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">3. Make Requests</p>
                  <p className="text-sm text-muted-foreground">
                    Call endpoints with your company context
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm overflow-x-auto">
              <div className="flex justify-between items-start">
                <pre>{`curl -X GET "${window.location.origin}/api/v1/config" \\
  -H "x-api-key: vts_your_api_key_here" \\
  -H "Content-Type: application/json"`}</pre>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:text-white"
                  onClick={() => copyToClipboard(`curl -X GET "${window.location.origin}/api/v1/config" -H "x-api-key: vts_your_api_key_here"`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Base URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Base URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="bg-muted px-3 py-2 rounded-lg font-mono">
                {window.location.origin}/api/v1
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`${window.location.origin}/api/v1`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              All API requests should be made to this base URL
            </p>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              All API requests require authentication using an API key. Include your API key in the
              request header:
            </p>
            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm">
              <pre>x-api-key: vts_your_api_key_here</pre>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Rate Limiting</h4>
                <p className="text-sm text-muted-foreground">
                  API requests are rate limited based on your subscription tier. Check the
                  <code className="bg-muted px-1 rounded mx-1">X-RateLimit-*</code>
                  response headers for your current usage.
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Error Responses</h4>
                <p className="text-sm text-muted-foreground">
                  All errors return a JSON object with <code className="bg-muted px-1 rounded">error</code>,
                  <code className="bg-muted px-1 rounded mx-1">message</code>, and
                  <code className="bg-muted px-1 rounded">code</code> fields.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              API Endpoints
            </CardTitle>
            <CardDescription>
              Complete list of available endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={endpoints[0].category.toLowerCase()} className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1">
                {endpoints.map((category) => (
                  <TabsTrigger
                    key={category.category}
                    value={category.category.toLowerCase()}
                    className="text-sm"
                  >
                    {category.category}
                  </TabsTrigger>
                ))}
              </TabsList>

              {endpoints.map((category) => (
                <TabsContent
                  key={category.category}
                  value={category.category.toLowerCase()}
                  className="mt-4 space-y-4"
                >
                  {category.endpoints.map((endpoint, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden">
                      <div className="p-4 bg-muted/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={endpoint.method === "GET" ? "secondary" : "default"}
                            className={
                              endpoint.method === "GET"
                                ? "bg-green-100 text-green-700"
                                : endpoint.method === "POST"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-orange-100 text-orange-700"
                            }
                          >
                            {endpoint.method}
                          </Badge>
                          <code className="font-mono text-sm">{endpoint.path}</code>
                        </div>
                        {endpoint.feature && (
                          <Badge variant="outline">Requires: {endpoint.feature}</Badge>
                        )}
                      </div>
                      <div className="p-4 space-y-4">
                        <p className="text-sm">{endpoint.description}</p>

                        {endpoint.params && (
                          <div>
                            <p className="text-sm font-medium mb-1">Query Parameters:</p>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {endpoint.params}
                            </code>
                          </div>
                        )}

                        {endpoint.body && (
                          <div>
                            <p className="text-sm font-medium mb-1">Request Body:</p>
                            <ScrollArea className="h-[150px]">
                              <pre className="bg-slate-950 text-slate-50 p-3 rounded-lg text-xs overflow-x-auto">
                                {endpoint.body}
                              </pre>
                            </ScrollArea>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium mb-1">Response:</p>
                          <ScrollArea className="h-[200px]">
                            <pre className="bg-slate-950 text-slate-50 p-3 rounded-lg text-xs overflow-x-auto">
                              {endpoint.response}
                            </pre>
                          </ScrollArea>
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Events</CardTitle>
            <CardDescription>
              Subscribe to real-time notifications for these events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { event: "booking.created", description: "New booking created" },
                { event: "booking.confirmed", description: "Booking confirmed after payment" },
                { event: "booking.cancelled", description: "Booking was cancelled" },
                { event: "payment.completed", description: "Payment successfully processed" },
                { event: "payment.failed", description: "Payment attempt failed" },
                { event: "trip.departed", description: "Bus has departed" },
                { event: "trip.arrived", description: "Bus has arrived at destination" },
              ].map((item) => (
                <div key={item.event} className="flex items-center gap-3 p-3 border rounded-lg">
                  <code className="bg-muted px-2 py-1 rounded text-sm">{item.event}</code>
                  <span className="text-sm text-muted-foreground">{item.description}</span>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Webhook Payload Format:</p>
              <pre className="bg-slate-950 text-slate-50 p-3 rounded-lg text-xs overflow-x-auto">
{`{
  "event": "booking.confirmed",
  "data": {
    "booking_reference": "VTS-ABC123-XYZ",
    "trip_id": "uuid",
    "amount": 25.00
  },
  "timestamp": "2024-12-08T06:45:00Z"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* SDKs */}
        <Card>
          <CardHeader>
            <CardTitle>SDKs & Libraries</CardTitle>
            <CardDescription>
              Official client libraries for popular languages
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg text-center">
                <div className="text-3xl mb-2">🟨</div>
                <p className="font-medium">JavaScript / TypeScript</p>
                <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block">
                  npm install @voyage/sdk
                </code>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-3xl mb-2">🐍</div>
                <p className="font-medium">Python</p>
                <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block">
                  pip install voyage-sdk
                </code>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <div className="text-3xl mb-2">🐘</div>
                <p className="font-medium">PHP</p>
                <code className="text-xs bg-muted px-2 py-1 rounded mt-2 block">
                  composer require voyage/sdk
                </code>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4 text-center">
              SDKs coming soon. For now, use the REST API directly.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
