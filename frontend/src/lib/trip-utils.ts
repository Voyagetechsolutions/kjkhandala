import { supabase } from './supabase';

/**
 * Creates an actual trip record from a projected trip
 * Projected trips are generated from schedules but don't exist in the database yet
 */
export async function materializeProjectedTrip(projectedTrip: any) {
  // If it's not a projected trip, return the original
  if (!projectedTrip.is_projected || !projectedTrip.id.startsWith('projected-')) {
    return projectedTrip;
  }

  try {
    // Parse the projected trip data
    const departureDate = new Date(projectedTrip.scheduled_departure);
    const arrivalDate = projectedTrip.scheduled_arrival ? new Date(projectedTrip.scheduled_arrival) : null;

    // Check if trip already exists for this route, bus, and departure time
    const { data: existingTrip, error: checkError} = await supabase
      .from('trips')
      .select('*')
      .eq('route_id', projectedTrip.route?.id || projectedTrip.route_id)
      .eq('departure_time', projectedTrip.scheduled_departure)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // If trip already exists, return it
    if (existingTrip) {
      return existingTrip;
    }

    // Create new trip record with correct schema
    const newTrip = {
      route_id: projectedTrip.route?.id || projectedTrip.route_id,
      bus_id: projectedTrip.bus?.id || projectedTrip.bus_id,
      departure_date: departureDate.toISOString().split('T')[0],
      departure_time: projectedTrip.scheduled_departure,
      arrival_time: projectedTrip.scheduled_arrival,
      fare: projectedTrip.fare || 0,
      status: 'SCHEDULED',
    };

    const { data: createdTrip, error: createError } = await supabase
      .from('trips')
      .insert(newTrip)
      .select()
      .single();

    if (createError) throw createError;

    return createdTrip;
  } catch (error) {
    console.error('Error materializing projected trip:', error);
    throw new Error('Failed to create trip record. Please try again.');
  }
}

/**
 * Ensures a trip exists in the database before booking
 * Handles both real and projected trips
 */
export async function ensureTripExists(trip: any) {
  if (!trip) {
    throw new Error('No trip provided');
  }

  // If it's a projected trip, materialize it
  if (trip.is_projected) {
    return await materializeProjectedTrip(trip);
  }

  // For real trips, verify it exists
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', trip.id)
    .single();

  if (error) {
    throw new Error('Trip not found in database');
  }

  return data;
}
