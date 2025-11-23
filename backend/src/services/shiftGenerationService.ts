import { supabase } from '../lib/supabase';

interface ShiftGenerationInput {
  selectedDate: string; // YYYY-MM-DD
  selectedRoutes: string[]; // array of route IDs
  maxHoursPerDriver?: number; // default 10
  prioritizeExperienced?: boolean; // default true
}

interface Trip {
  id: string;
  route_id: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  status: string;
  total_seats: number;
  route?: any;
}

interface Driver {
  id: string;
  full_name: string;
  license_number: string;
  license_expiry: string;
  status: string;
  rating: number;
  assigned_hours?: number;
}

interface Bus {
  id: string;
  registration_number: string;
  seating_capacity: number;
  status: string;
  service_status: string;
}

interface ShiftAssignment {
  trip_id: string;
  trip_number: string;
  route: string;
  departure_time: string;
  arrival_time: string;
  driver_id: string | null;
  driver_name: string | null;
  bus_id: string | null;
  bus_registration: string | null;
  status: 'assigned' | 'conflict' | 'no_driver' | 'no_bus';
  conflicts: string[];
}

export class ShiftGenerationService {
  /**
   * Main function to generate shifts
   */
  async generateShifts(input: ShiftGenerationInput): Promise<{
    preview: ShiftAssignment[];
    stats: {
      total_trips: number;
      assigned: number;
      conflicts: number;
      no_driver: number;
      no_bus: number;
    };
  }> {
    const maxHours = input.maxHoursPerDriver || 10;

    // Step 1: Fetch all required data
    const trips = await this.fetchTrips(input.selectedDate, input.selectedRoutes);
    const drivers = await this.fetchAvailableDrivers(input.selectedDate);
    const buses = await this.fetchAvailableBuses(input.selectedDate);

    // Step 2: Sort drivers by priority
    const sortedDrivers = this.sortDriversByPriority(drivers, input.prioritizeExperienced);

    // Step 3: Track assignments
    const assignments: ShiftAssignment[] = [];
    const driverAssignments = new Map<string, { hours: number; trips: Trip[] }>();
    const busAssignments = new Map<string, Trip[]>();

    // Initialize tracking
    sortedDrivers.forEach(driver => {
      driverAssignments.set(driver.id, { hours: 0, trips: [] });
    });
    buses.forEach(bus => {
      busAssignments.set(bus.id, []);
    });

    // Step 4: Process each trip
    for (const trip of trips) {
      const assignment = await this.assignTripResources(
        trip,
        sortedDrivers,
        buses,
        driverAssignments,
        busAssignments,
        maxHours
      );

      assignments.push(assignment);
    }

    // Step 5: Calculate stats
    const stats = {
      total_trips: trips.length,
      assigned: assignments.filter(a => a.status === 'assigned').length,
      conflicts: assignments.filter(a => a.status === 'conflict').length,
      no_driver: assignments.filter(a => a.status === 'no_driver').length,
      no_bus: assignments.filter(a => a.status === 'no_bus').length,
    };

    return { preview: assignments, stats };
  }

  /**
   * Confirm and save shifts to database
   */
  async confirmShifts(assignments: ShiftAssignment[], selectedDate: string): Promise<void> {
    const shiftsToInsert = assignments
      .filter(a => a.status === 'assigned')
      .map(a => ({
        id: crypto.randomUUID(),
        shift_date: selectedDate,
        trip_id: a.trip_id,
        driver_id: a.driver_id,
        bus_id: a.bus_id,
        status: 'upcoming',
        created_at: new Date().toISOString(),
      }));

    if (shiftsToInsert.length === 0) {
      throw new Error('No valid shifts to save');
    }

    // Insert shifts
    const { error: shiftError } = await supabase
      .from('driver_shifts')
      .insert(shiftsToInsert);

    if (shiftError) throw shiftError;

    // Update trips with assignments
    for (const assignment of assignments.filter(a => a.status === 'assigned')) {
      const { error: tripError } = await supabase
        .from('trips')
        .update({
          driver_id: assignment.driver_id,
          bus_id: assignment.bus_id,
        })
        .eq('id', assignment.trip_id);

      if (tripError) console.error('Error updating trip:', tripError);
    }
  }

  /**
   * Fetch trips for selected date and routes
   */
  private async fetchTrips(selectedDate: string, routeIds: string[]): Promise<Trip[]> {
    const startOfDay = `${selectedDate}T00:00:00`;
    const endOfDay = `${selectedDate}T23:59:59`;

    let query = supabase
      .from('trips')
      .select(`
        id,
        trip_number,
        route_id,
        scheduled_departure,
        scheduled_arrival,
        status,
        total_seats,
        driver_id,
        bus_id,
        conductor_id,
        route:routes(id, origin, destination, distance_km)
      `)
      .gte('scheduled_departure', startOfDay)
      .lte('scheduled_departure', endOfDay)
      .neq('status', 'CANCELLED')
      .order('scheduled_departure', { ascending: true });

    if (routeIds.length > 0) {
      query = query.in('route_id', routeIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data || [];
  }

  /**
   * Fetch available drivers (not already assigned for the date)
   */
  private async fetchAvailableDrivers(selectedDate: string): Promise<Driver[]> {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'active')
      .gte('license_expiry', selectedDate);

    if (error) throw error;

    // Filter out drivers already assigned
    const { data: existingShifts } = await supabase
      .from('driver_shifts')
      .select('driver_id')
      .eq('shift_date', selectedDate);

    const assignedDriverIds = new Set(existingShifts?.map(s => s.driver_id) || []);
    
    return (data || []).filter(driver => !assignedDriverIds.has(driver.id));
  }

  /**
   * Fetch available buses
   */
  private async fetchAvailableBuses(selectedDate: string): Promise<Bus[]> {
    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    // Filter out buses already assigned
    const { data: existingShifts } = await supabase
      .from('driver_shifts')
      .select('bus_id')
      .eq('shift_date', selectedDate);

    const assignedBusIds = new Set(existingShifts?.map(s => s.bus_id) || []);
    
    return (data || []).filter(bus => !assignedBusIds.has(bus.id));
  }

  /**
   * Sort drivers by priority
   */
  private sortDriversByPriority(drivers: Driver[], prioritizeExperienced: boolean = true): Driver[] {
    return drivers.sort((a, b) => {
      if (prioritizeExperienced) {
        // Sort by rating (higher first), then by assigned hours (lower first)
        if (b.rating !== a.rating) {
          return (b.rating || 0) - (a.rating || 0);
        }
      }
      return (a.assigned_hours || 0) - (b.assigned_hours || 0);
    });
  }

  /**
   * Assign resources (driver, bus, conductor) to a trip
   */
  private async assignTripResources(
    trip: Trip,
    drivers: Driver[],
    buses: Bus[],
    driverAssignments: Map<string, { hours: number; trips: Trip[] }>,
    busAssignments: Map<string, Trip[]>,
    maxHours: number
  ): Promise<ShiftAssignment> {
    const conflicts: string[] = [];
    let assignedDriver: Driver | null = null;
    let assignedBus: Bus | null = null;

    // Skip if trip already has assignments
    if (trip.driver_id || trip.bus_id) {
      conflicts.push('Trip already has assignments');
      return this.createAssignment(trip, null, null, 'conflict', conflicts);
    }

    // Calculate trip duration in hours
    const tripDuration = this.calculateTripDuration(trip.scheduled_departure, trip.scheduled_arrival);

    // Find available driver
    for (const driver of drivers) {
      const driverData = driverAssignments.get(driver.id)!;
      
      // Check if driver has exceeded max hours
      if (driverData.hours + tripDuration > maxHours) {
        continue;
      }

      // Check for time conflicts
      if (this.hasTimeConflict(trip, driverData.trips)) {
        continue;
      }

      // Assign driver
      assignedDriver = driver;
      driverData.hours += tripDuration;
      driverData.trips.push(trip);
      break;
    }

    if (!assignedDriver) {
      return this.createAssignment(trip, null, null, 'no_driver', ['No available driver']);
    }

    // Find available bus
    for (const bus of buses) {
      const busTrips = busAssignments.get(bus.id)!;

      // Check if bus has enough capacity
      if (bus.seating_capacity < trip.total_seats) {
        continue;
      }

      // Check for time conflicts
      if (this.hasTimeConflict(trip, busTrips)) {
        continue;
      }

      // Assign bus
      assignedBus = bus;
      busTrips.push(trip);
      break;
    }

    if (!assignedBus) {
      // Rollback driver assignment
      const driverData = driverAssignments.get(assignedDriver.id)!;
      driverData.hours -= tripDuration;
      driverData.trips = driverData.trips.filter(t => t.id !== trip.id);
      
      return this.createAssignment(trip, assignedDriver, null, 'no_bus', ['No available bus']);
    }

    return this.createAssignment(
      trip,
      assignedDriver,
      assignedBus,
      'assigned',
      []
    );
  }

  /**
   * Check if trip has time conflict with existing trips
   */
  private hasTimeConflict(newTrip: Trip, existingTrips: Trip[]): boolean {
    const newStart = new Date(newTrip.scheduled_departure).getTime();
    const newEnd = new Date(newTrip.scheduled_arrival).getTime();

    for (const existingTrip of existingTrips) {
      const existingStart = new Date(existingTrip.scheduled_departure).getTime();
      const existingEnd = new Date(existingTrip.scheduled_arrival).getTime();

      // Check overlap: new_start < existing_end AND existing_start < new_end
      if (newStart < existingEnd && existingStart < newEnd) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate trip duration in hours
   */
  private calculateTripDuration(departure: string, arrival: string): number {
    const start = new Date(departure).getTime();
    const end = new Date(arrival).getTime();
    return (end - start) / (1000 * 60 * 60); // Convert ms to hours
  }

  /**
   * Create assignment object
   */
  private createAssignment(
    trip: Trip,
    driver: Driver | null,
    bus: Bus | null,
    status: ShiftAssignment['status'],
    conflicts: string[]
  ): ShiftAssignment {
    return {
      trip_id: trip.id,
      trip_number: (trip as any).trip_number || 'N/A',
      route: trip.route ? `${trip.route.origin} → ${trip.route.destination}` : 'N/A',
      departure_time: trip.scheduled_departure,
      arrival_time: trip.scheduled_arrival,
      driver_id: driver?.id || null,
      driver_name: driver?.full_name || null,
      bus_id: bus?.id || null,
      bus_registration: bus?.registration_number || null,
      status,
      conflicts,
    };
  }

  /**
   * Get shift statistics for a date
   */
  async getShiftStats(selectedDate: string): Promise<{
    active: number;
    upcoming: number;
    completed: number;
  }> {
    const now = new Date();
    const { data: shifts } = await supabase
      .from('driver_shifts')
      .select(`
        *,
        trip:trips(scheduled_departure, scheduled_arrival)
      `)
      .eq('shift_date', selectedDate);

    if (!shifts) return { active: 0, upcoming: 0, completed: 0 };

    let active = 0;
    let upcoming = 0;
    let completed = 0;

    shifts.forEach(shift => {
      const trip = (shift as any).trip;
      if (!trip) return;

      const start = new Date(trip.scheduled_departure);
      const end = new Date(trip.scheduled_arrival);

      if (now >= start && now < end) {
        active++;
      } else if (now < start) {
        upcoming++;
      } else {
        completed++;
      }
    });

    return { active, upcoming, completed };
  }
}

export const shiftGenerationService = new ShiftGenerationService();
