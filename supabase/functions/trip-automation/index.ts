// =====================================================
// TRIP AUTOMATION EDGE FUNCTIONS
// =====================================================
// Supabase Edge Functions for automated trip management
// =====================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// =====================================================
// 1️⃣ TRIP GENERATION & ASSIGNMENT
// =====================================================

async function generateTripFromSchedule(supabase: any, scheduleId: string) {
  // Fetch schedule details
  const { data: schedule, error: schedError } = await supabase
    .from('route_frequencies')
    .select(`
      *,
      routes:route_id (id, origin, destination, duration_hours)
    `)
    .eq('id', scheduleId)
    .single()

  if (schedError) throw schedError

  // Calculate next trip datetime
  const targetDate = new Date()
  targetDate.setDate(targetDate.getDate() + 1)
  
  const [hours, minutes] = schedule.departure_time.split(':')
  const departureTime = new Date(targetDate)
  departureTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
  
  const arrivalTime = new Date(departureTime)
  arrivalTime.setHours(arrivalTime.getHours() + schedule.duration_hours)

  // Check if trip already exists
  const { data: existingTrip } = await supabase
    .from('trips')
    .select('id')
    .eq('route_id', schedule.route_id)
    .eq('scheduled_departure', departureTime.toISOString())
    .single()

  if (existingTrip) {
    return { success: false, message: 'Trip already exists', tripId: existingTrip.id }
  }

  // Insert trip (triggers will auto-assign driver, bus, conductor)
  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      route_id: schedule.route_id,
      scheduled_departure: departureTime.toISOString(),
      scheduled_arrival: arrivalTime.toISOString(),
      fare: schedule.fare_per_seat,
      status: 'SCHEDULED',
      is_generated_from_schedule: true,
    })
    .select()
    .single()

  if (tripError) throw tripError

  return { success: true, trip }
}

async function assignDriver(supabase: any, scheduleId: string, tripId: string) {
  // Get trip details
  const { data: trip } = await supabase
    .from('trips')
    .select('route_id, scheduled_departure, scheduled_arrival')
    .eq('id', tripId)
    .single()

  // Try rotation first
  const { data: rotationDriver } = await supabase
    .rpc('assign_driver_by_rotation', {
      p_route_id: trip.route_id,
      p_trip_id: tripId,
      p_departure: trip.scheduled_departure,
      p_arrival: trip.scheduled_arrival,
    })

  if (rotationDriver) {
    await supabase
      .from('trips')
      .update({ driver_id: rotationDriver })
      .eq('id', tripId)

    return { driverId: rotationDriver, method: 'rotation' }
  }

  // Fallback: get available drivers
  const { data: drivers } = await supabase
    .rpc('get_available_drivers', {
      p_start: trip.scheduled_departure,
      p_end: trip.scheduled_arrival,
    })

  if (drivers && drivers.length > 0) {
    const selectedDriver = drivers[0].driver_id

    await supabase
      .from('trips')
      .update({ driver_id: selectedDriver })
      .eq('id', tripId)

    return { driverId: selectedDriver, method: 'availability' }
  }

  return { driverId: null, method: 'none' }
}

// =====================================================
// 2️⃣ SHIFT MANAGEMENT
// =====================================================

async function startShift(supabase: any, tripId: string) {
  const now = new Date().toISOString()

  // Update driver shift
  await supabase
    .from('driver_shifts')
    .update({ 
      status: 'on_duty',
      actual_start: now,
    })
    .eq('trip_id', tripId)
    .eq('status', 'scheduled')

  // Update bus shift
  await supabase
    .from('bus_shifts')
    .update({ status: 'ACTIVE' })
    .eq('trip_id', tripId)

  // Update conductor shift
  await supabase
    .from('conductor_shifts')
    .update({ status: 'ACTIVE' })
    .eq('trip_id', tripId)

  // Update trip status
  await supabase
    .from('trips')
    .update({ status: 'BOARDING' })
    .eq('id', tripId)

  return { success: true, message: 'Shift started' }
}

async function completeShift(supabase: any, tripId: string) {
  const now = new Date().toISOString()

  // Update driver shift
  const { data: shift } = await supabase
    .from('driver_shifts')
    .select('start_time, actual_start')
    .eq('trip_id', tripId)
    .single()

  const actualStart = shift?.actual_start || shift?.start_time
  const hoursWorked = (new Date(now).getTime() - new Date(actualStart).getTime()) / (1000 * 60 * 60)

  await supabase
    .from('driver_shifts')
    .update({ 
      status: 'completed',
      actual_end: now,
      hours_worked: hoursWorked,
    })
    .eq('trip_id', tripId)

  // Update other shifts
  await supabase
    .from('bus_shifts')
    .update({ status: 'COMPLETED' })
    .eq('trip_id', tripId)

  await supabase
    .from('conductor_shifts')
    .update({ status: 'COMPLETED' })
    .eq('trip_id', tripId)

  // Update trip
  await supabase
    .from('trips')
    .update({ status: 'COMPLETED' })
    .eq('id', tripId)

  // Resolve alerts
  await supabase
    .from('alerts')
    .update({ resolved: true })
    .eq('trip_id', tripId)
    .eq('resolved', false)

  return { success: true, message: 'Shift completed', hoursWorked }
}

async function markDelayed(supabase: any, tripId: string, delayMinutes: number) {
  let severity = 'MINOR'
  if (delayMinutes >= 60) severity = 'CRITICAL'
  else if (delayMinutes >= 30) severity = 'MODERATE'

  // Update trip status
  await supabase
    .from('trips')
    .update({ status: 'DELAYED' })
    .eq('id', tripId)

  // Create alert
  await supabase
    .from('alerts')
    .insert({
      trip_id: tripId,
      severity,
      message: `Delay detected: ${delayMinutes} minutes`,
    })

  // Queue notification for critical delays
  if (severity === 'CRITICAL') {
    await supabase
      .from('outbound_notifications')
      .insert({
        to_contact: 'operations@example.com',
        channel: 'email',
        payload: { trip_id: tripId, delay_minutes: delayMinutes },
        status: 'PENDING',
      })
  }

  return { success: true, severity, delayMinutes }
}

// =====================================================
// 3️⃣ REPORTING
// =====================================================

async function generateDailyShiftReports(supabase: any, date: string) {
  const { error } = await supabase.rpc('generate_shift_reports_for_yesterday')
  
  if (error) throw error

  return { success: true, message: 'Reports generated', date }
}

async function getDriverAvailability(supabase: any, start: string, end: string) {
  const { data, error } = await supabase
    .rpc('get_available_drivers', {
      p_start: start,
      p_end: end,
    })

  if (error) throw error

  return { drivers: data || [] }
}

// =====================================================
// 4️⃣ DELAY DETECTION
// =====================================================

async function detectDelays(supabase: any) {
  const { error } = await supabase.rpc('detect_and_mark_delays')
  
  if (error) throw error

  return { success: true, message: 'Delay detection completed' }
}

async function resolveDelay(supabase: any, tripId: string) {
  await supabase
    .from('alerts')
    .update({ resolved: true })
    .eq('trip_id', tripId)
    .eq('resolved', false)

  return { success: true, message: 'Delay resolved' }
}

// =====================================================
// 5️⃣ REAL-TIME APIs
// =====================================================

async function getActiveTrips(supabase: any) {
  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      routes:route_id (origin, destination),
      drivers:driver_id (full_name),
      buses:bus_id (registration_number),
      conductors:conductor_id (full_name)
    `)
    .in('status', ['BOARDING', 'DEPARTED'])
    .order('scheduled_departure')

  if (error) throw error

  return { trips: data || [] }
}

async function getUpcomingTrips(supabase: any, hoursAhead: number) {
  const now = new Date()
  const future = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from('trips')
    .select(`
      *,
      routes:route_id (origin, destination),
      drivers:driver_id (full_name),
      buses:bus_id (registration_number)
    `)
    .eq('status', 'SCHEDULED')
    .gte('scheduled_departure', now.toISOString())
    .lte('scheduled_departure', future.toISOString())
    .order('scheduled_departure')

  if (error) throw error

  return { trips: data || [] }
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { action, ...params } = await req.json()

    let result

    switch (action) {
      // Trip Generation
      case 'generateTripFromSchedule':
        result = await generateTripFromSchedule(supabaseClient, params.scheduleId)
        break
      case 'assignDriver':
        result = await assignDriver(supabaseClient, params.scheduleId, params.tripId)
        break

      // Shift Management
      case 'startShift':
        result = await startShift(supabaseClient, params.tripId)
        break
      case 'completeShift':
        result = await completeShift(supabaseClient, params.tripId)
        break
      case 'markDelayed':
        result = await markDelayed(supabaseClient, params.tripId, params.delayMinutes)
        break

      // Reporting
      case 'generateDailyShiftReports':
        result = await generateDailyShiftReports(supabaseClient, params.date)
        break
      case 'getDriverAvailability':
        result = await getDriverAvailability(supabaseClient, params.start, params.end)
        break

      // Delay Detection
      case 'detectDelays':
        result = await detectDelays(supabaseClient)
        break
      case 'resolveDelay':
        result = await resolveDelay(supabaseClient, params.tripId)
        break

      // Real-time APIs
      case 'getActiveTrips':
        result = await getActiveTrips(supabaseClient)
        break
      case 'getUpcomingTrips':
        result = await getUpcomingTrips(supabaseClient, params.hoursAhead || 24)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
