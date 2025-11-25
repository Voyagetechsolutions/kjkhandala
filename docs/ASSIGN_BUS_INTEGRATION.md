# Assign Bus Integration Guide

## Quick Integration

Add the "Assign Bus" button to your existing trip management pages.

## Option 1: Trip Management Table

Add a button in your trip table actions column:

```tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bus } from "lucide-react";

function TripManagementTable() {
  const navigate = useNavigate();

  return (
    <Table>
      <TableBody>
        {trips.map((trip) => (
          <TableRow key={trip.id}>
            {/* ... other columns ... */}
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/admin/assign-bus?tripId=${trip.id}`)}
                disabled={trip.bus_id !== null}
              >
                <Bus className="w-4 h-4 mr-2" />
                {trip.bus_id ? "Reassign Bus" : "Assign Bus"}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

## Option 2: Trip Details Page

Add to your trip details/edit page:

```tsx
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bus } from "lucide-react";

function TripDetailsPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Trip Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* ... trip details ... */}
        </CardContent>
      </Card>

      {/* Bus Assignment Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5" />
            Bus Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trip.bus_id ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Assigned Bus</p>
                <p className="font-semibold">{trip.bus?.registration}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate(`/admin/assign-bus?tripId=${tripId}`)}
              >
                Change Bus
              </Button>
            </div>
          ) : (
            <div className="text-center py-6">
              <Bus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No bus assigned</p>
              <Button
                onClick={() => navigate(`/admin/assign-bus?tripId=${tripId}`)}
              >
                <Bus className="w-4 h-4 mr-2" />
                Assign Bus
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

## Option 3: Bulk Assignment

Add bulk assignment for multiple trips:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Bus } from "lucide-react";

function BulkTripManagement() {
  const navigate = useNavigate();
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);

  const handleBulkAssign = () => {
    if (selectedTrips.length === 0) {
      toast({
        title: "No trips selected",
        description: "Please select at least one trip",
        variant: "destructive",
      });
      return;
    }

    // For single trip
    if (selectedTrips.length === 1) {
      navigate(`/admin/assign-bus?tripId=${selectedTrips[0]}`);
      return;
    }

    // For multiple trips - implement your bulk logic
    // Could open a modal or navigate to a bulk assignment page
    navigate(`/admin/bulk-assign-buses?tripIds=${selectedTrips.join(",")}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Trip Management</h2>
        <Button
          onClick={handleBulkAssign}
          disabled={selectedTrips.length === 0}
        >
          <Bus className="w-4 h-4 mr-2" />
          Assign Buses ({selectedTrips.length})
        </Button>
      </div>

      <Table>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell>
                <Checkbox
                  checked={selectedTrips.includes(trip.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTrips([...selectedTrips, trip.id]);
                    } else {
                      setSelectedTrips(selectedTrips.filter((id) => id !== trip.id));
                    }
                  }}
                />
              </TableCell>
              {/* ... other columns ... */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## Option 4: Automated Trip Creation

Integrate with automated trip creation:

```tsx
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

async function createTripWithBusAssignment(tripData: any) {
  try {
    // 1. Create the trip
    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .insert(tripData)
      .select()
      .single();

    if (tripError) throw tripError;

    // 2. Get recommended bus
    const { data: recommendedBuses, error: busError } = await supabase
      .rpc("assign_bus");

    if (busError) throw busError;

    if (recommendedBuses && recommendedBuses.length > 0) {
      const recommendedBus = recommendedBuses[0];

      // 3. Auto-assign the recommended bus
      const { error: assignError } = await supabase
        .from("trips")
        .update({ bus_id: recommendedBus.bus_id })
        .eq("id", trip.id);

      if (assignError) throw assignError;

      toast({
        title: "Trip created successfully",
        description: `Bus ${recommendedBus.registration} automatically assigned`,
      });
    } else {
      toast({
        title: "Trip created",
        description: "No available buses. Please assign manually.",
        variant: "default",
      });
    }

    return trip;
  } catch (error) {
    console.error("Error creating trip:", error);
    toast({
      title: "Error",
      description: "Failed to create trip",
      variant: "destructive",
    });
    throw error;
  }
}
```

## Option 5: Context Menu

Add to right-click context menu:

```tsx
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Bus, Edit, Trash } from "lucide-react";

function TripRow({ trip }: { trip: any }) {
  const navigate = useNavigate();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <TableRow>
          {/* ... trip data ... */}
        </TableRow>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => navigate(`/admin/assign-bus?tripId=${trip.id}`)}
        >
          <Bus className="w-4 h-4 mr-2" />
          Assign Bus
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => navigate(`/admin/trips/edit/${trip.id}`)}
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Trip
        </ContextMenuItem>
        <ContextMenuItem onClick={() => handleDelete(trip.id)}>
          <Trash className="w-4 h-4 mr-2" />
          Delete Trip
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

## Option 6: Dashboard Widget

Add a quick-assign widget to your dashboard:

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bus, AlertCircle } from "lucide-react";

function UnassignedTripsWidget() {
  const navigate = useNavigate();
  const [unassignedTrips, setUnassignedTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnassignedTrips();
  }, []);

  const fetchUnassignedTrips = async () => {
    const { data, error } = await supabase
      .from("trips")
      .select(`
        *,
        routes:route_id (origin_city, destination_city)
      `)
      .is("bus_id", null)
      .gte("trip_date", new Date().toISOString().split("T")[0])
      .order("trip_date", { ascending: true })
      .limit(5);

    if (!error) setUnassignedTrips(data || []);
    setLoading(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          Trips Needing Bus Assignment
        </CardTitle>
      </CardHeader>
      <CardContent>
        {unassignedTrips.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            All upcoming trips have buses assigned
          </p>
        ) : (
          <div className="space-y-2">
            {unassignedTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-semibold">
                    {trip.routes?.origin_city} → {trip.routes?.destination_city}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(trip.trip_date).toLocaleDateString()} at{" "}
                    {trip.departure_time}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/admin/assign-bus?tripId=${trip.id}`)}
                >
                  <Bus className="w-4 h-4 mr-2" />
                  Assign
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## Best Practices

### 1. **Disable for Assigned Trips**
```tsx
<Button
  disabled={trip.bus_id !== null}
  onClick={() => navigate(`/admin/assign-bus?tripId=${trip.id}`)}
>
  {trip.bus_id ? "Reassign Bus" : "Assign Bus"}
</Button>
```

### 2. **Show Current Assignment**
```tsx
{trip.bus_id && (
  <div className="text-sm text-muted-foreground">
    Current: {trip.bus?.registration}
  </div>
)}
```

### 3. **Validate Trip ID**
```tsx
const handleAssignBus = (tripId: string) => {
  if (!tripId) {
    toast({
      title: "Error",
      description: "Invalid trip ID",
      variant: "destructive",
    });
    return;
  }
  navigate(`/admin/assign-bus?tripId=${tripId}`);
};
```

### 4. **Refresh After Assignment**
```tsx
// In your trip list component
useEffect(() => {
  const channel = supabase
    .channel("trips-changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "trips" },
      (payload) => {
        // Refresh your trip list
        fetchTrips();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Navigation Paths

### Admin Routes
- `/admin/assign-bus?tripId=<trip-id>`
- `/admin/trips` (return path)

### Operations Routes
- `/operations/assign-bus?tripId=<trip-id>`
- `/operations/trips` (return path)

## Complete Example

Here's a complete integration example for your TripScheduling page:

```tsx
// Add this to your TripScheduling.tsx actions column

<TableCell>
  <div className="flex gap-2">
    {/* Existing buttons */}
    <Button
      variant="outline"
      size="sm"
      onClick={() => handleEditTrip(trip.id)}
    >
      <Edit className="w-4 h-4" />
    </Button>

    {/* New Assign Bus button */}
    <Button
      variant={trip.bus_id ? "outline" : "default"}
      size="sm"
      onClick={() => navigate(`/admin/assign-bus?tripId=${trip.id}`)}
      title={trip.bus_id ? `Current: ${trip.bus?.registration}` : "Assign a bus"}
    >
      <Bus className="w-4 h-4 mr-1" />
      {trip.bus_id ? "Change" : "Assign"}
    </Button>

    {/* Existing buttons */}
    <Button
      variant="destructive"
      size="sm"
      onClick={() => handleDeleteTrip(trip.id)}
    >
      <Trash className="w-4 h-4" />
    </Button>
  </div>
</TableCell>
```

This will give you a clean, integrated experience across your BMS dashboard!
