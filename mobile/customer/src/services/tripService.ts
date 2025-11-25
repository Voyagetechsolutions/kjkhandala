import { supabase } from '../lib/supabase';
import { Trip, SearchParams } from '../types';

/**
 * Generate projected trips from route_frequencies (same logic as frontend BookingWidget)
 */
const generateProjectedTrips = (
  schedules: any[],
  targetDate: string,
  origin: string,
  destination: string
): Trip[] => {
  const projected: Trip[] = [];
  const date = new Date(targetDate);
  const dayOfWeek = date.getDay();

  schedules.forEach((schedule: any) => {
    let shouldGenerate = false;

    if (schedule.frequency_type === 'DAILY') {
      shouldGenerate = true;
    } else if (schedule.frequency_type === 'SPECIFIC_DAYS') {
      shouldGenerate = schedule.days_of_week?.includes(dayOfWeek);
    } else if (schedule.frequency_type === 'WEEKLY') {
      shouldGenerate = schedule.days_of_week?.includes(dayOfWeek);
    }

    if (
      shouldGenerate &&
      schedule.routes?.origin === origin &&
      schedule.routes?.destination === destination
    ) {
      const [hours, minutes] = schedule.departure_time.split(':');
      const departureDate = new Date(date);
      departureDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const arrivalDate = new Date(departureDate);
      arrivalDate.setHours(
        arrivalDate.getHours() +
          (schedule.duration_hours ||
            schedule.routes?.duration_hours ||
            0)
      );

      projected.push({
        id: `projected-${schedule.id}-${targetDate}`,
        trip_number: `AUTO-${schedule.id.slice(0, 8)}`,
        scheduled_departure: departureDate.toISOString(),
        scheduled_arrival: arrivalDate.toISOString(),
        fare: schedule.fare_per_seat,
        status: 'SCHEDULED',
        total_seats: schedule.buses?.seating_capacity || 60,
        available_seats: schedule.buses?.seating_capacity || 60,
        route: {
          origin: schedule.routes?.origin,
          destination: schedule.routes?.destination,
        },
        bus: {
          name:
            schedule.buses?.registration_number ||
            schedule.buses?.name ||
            'TBA',
          bus_type: schedule.buses?.bus_type || 'Standard',
        },
        is_projected: true,
      });
    }
  });

  return projected;
};

/**
 * Search for trips based on search parameters
 */
export const searchTrips = async (
  params: SearchParams
): Promise<{ outbound: Trip[]; return: Trip[] }> => {
  try {
    // Fetch existing trips for outbound
    const { data: outboundData, error: outboundError } = await supabase
      .from('trips')
      .select(
        `
        id,
        trip_number,
        scheduled_departure,
        scheduled_arrival,
        fare,
        status,
        total_seats,
        available_seats,
        is_generated_from_schedule,
        routes!inner (origin, destination),
        buses (name, bus_type, registration_number)
      `
      )
      .eq('routes.origin', params.from)
      .eq('routes.destination', params.to)
      .gte('scheduled_departure', `${params.travelDate}T00:00:00`)
      .lte('scheduled_departure', `${params.travelDate}T23:59:59`)
      .in('status', ['SCHEDULED', 'BOARDING'])
      .eq('is_generated_from_schedule', true)
      .gte('available_seats', params.passengers)
      .order('scheduled_departure');

    if (outboundError) throw outboundError;

    // Fetch active schedules for projection
    const { data: schedData, error: schedError } = await supabase
      .from('route_frequencies')
      .select('*')
      .eq('active', true);

    if (schedError) throw schedError;

    // Fetch related data
    const routeIds = [
      ...new Set(schedData?.map((s) => s.route_id).filter(Boolean)),
    ];
    const busIds = [
      ...new Set(schedData?.map((s) => s.bus_id).filter(Boolean)),
    ];

    const [routesRes, busesRes] = await Promise.all([
      routeIds.length > 0
        ? supabase
            .from('routes')
            .select('id, origin, destination, duration_hours')
            .in('id', routeIds)
        : { data: [] },
      busIds.length > 0
        ? supabase
            .from('buses')
            .select('id, registration_number, name, bus_type, seating_capacity')
            .in('id', busIds)
        : { data: [] },
    ]);

    const routesMap = new Map(
      routesRes.data?.map((r: any) => [r.id, r] as const) || []
    );
    const busesMap = new Map(
      busesRes.data?.map((b: any) => [b.id, b] as const) || []
    );

    const schedules = schedData?.map((sched) => ({
      ...sched,
      routes: routesMap.get(sched.route_id) || null,
      buses: busesMap.get(sched.bus_id) || null,
    }));

    // Transform existing trips
    const transformedOutbound = (outboundData || []).map((trip: any) => ({
      id: trip.id,
      trip_number: trip.trip_number,
      scheduled_departure: trip.scheduled_departure,
      scheduled_arrival: trip.scheduled_arrival,
      fare: trip.fare,
      status: trip.status,
      total_seats: trip.total_seats,
      available_seats: trip.available_seats,
      route: {
        origin: Array.isArray(trip.routes)
          ? trip.routes[0]?.origin
          : trip.routes?.origin,
        destination: Array.isArray(trip.routes)
          ? trip.routes[0]?.destination
          : trip.routes?.destination,
      },
      bus: {
        name: Array.isArray(trip.buses)
          ? trip.buses[0]?.registration_number || trip.buses[0]?.name
          : trip.buses?.registration_number || trip.buses?.name || 'TBA',
        bus_type: Array.isArray(trip.buses)
          ? trip.buses[0]?.bus_type
          : trip.buses?.bus_type || 'Standard',
      },
      is_projected: false,
    }));

    // Generate projected trips
    const projectedOutbound = generateProjectedTrips(
      schedules || [],
      params.travelDate,
      params.from,
      params.to
    );

    // Combine and deduplicate
    const existingTimes = new Set(
      transformedOutbound.map((t: any) =>
        new Date(t.scheduled_departure).toISOString().slice(0, 16)
      )
    );
    const uniqueProjected = projectedOutbound.filter(
      (pt: any) =>
        !existingTimes.has(
          new Date(pt.scheduled_departure).toISOString().slice(0, 16)
        )
    );

    const allOutbound = [...transformedOutbound, ...uniqueProjected].sort(
      (a, b) =>
        new Date(a.scheduled_departure).getTime() -
        new Date(b.scheduled_departure).getTime()
    );

    // Handle return trips if needed
    let allReturn: Trip[] = [];
    if (params.tripType === 'return' && params.returnDate) {
      const { data: returnData, error: returnError } = await supabase
        .from('trips')
        .select(
          `
          id,
          trip_number,
          scheduled_departure,
          scheduled_arrival,
          fare,
          status,
          total_seats,
          available_seats,
          is_generated_from_schedule,
          routes!inner (origin, destination),
          buses (name, bus_type, registration_number)
        `
        )
        .eq('routes.origin', params.to)
        .eq('routes.destination', params.from)
        .gte('scheduled_departure', `${params.returnDate}T00:00:00`)
        .lte('scheduled_departure', `${params.returnDate}T23:59:59`)
        .in('status', ['SCHEDULED', 'BOARDING'])
        .eq('is_generated_from_schedule', true)
        .gte('available_seats', params.passengers)
        .order('scheduled_departure');

      if (returnError) throw returnError;

      const transformedReturn = (returnData || []).map((trip: any) => ({
        id: trip.id,
        trip_number: trip.trip_number,
        scheduled_departure: trip.scheduled_departure,
        scheduled_arrival: trip.scheduled_arrival,
        fare: trip.fare,
        status: trip.status,
        total_seats: trip.total_seats,
        available_seats: trip.available_seats,
        route: {
          origin: Array.isArray(trip.routes)
            ? trip.routes[0]?.origin
            : trip.routes?.origin,
          destination: Array.isArray(trip.routes)
            ? trip.routes[0]?.destination
            : trip.routes?.destination,
        },
        bus: {
          name: Array.isArray(trip.buses)
            ? trip.buses[0]?.registration_number || trip.buses[0]?.name
            : trip.buses?.registration_number || trip.buses?.name || 'TBA',
          bus_type: Array.isArray(trip.buses)
            ? trip.buses[0]?.bus_type
            : trip.buses?.bus_type || 'Standard',
        },
        is_projected: false,
      }));

      const projectedReturn = generateProjectedTrips(
        schedules || [],
        params.returnDate,
        params.to,
        params.from
      );

      const existingReturnTimes = new Set(
        transformedReturn.map((t: any) =>
          new Date(t.scheduled_departure).toISOString().slice(0, 16)
        )
      );
      const uniqueProjectedReturn = projectedReturn.filter(
        (pt: any) =>
          !existingReturnTimes.has(
            new Date(pt.scheduled_departure).toISOString().slice(0, 16)
          )
      );

      allReturn = [...transformedReturn, ...uniqueProjectedReturn].sort(
        (a, b) =>
          new Date(a.scheduled_departure).getTime() -
          new Date(b.scheduled_departure).getTime()
      );
    }

    return {
      outbound: allOutbound,
      return: allReturn,
    };
  } catch (error) {
    console.error('Error searching trips:', error);
    throw error;
  }
};

/**
 * Fetch cities for dropdown
 */
export const fetchCities = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('cities')
      .select('name')
      .order('name');

    if (error) throw error;
    return data?.map((city) => city.name) || [];
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
};
