// Test with real booking
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://dglzvzdyfnakfxymgnea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzM3MCwiZXhwIjoyMDc4NjUzMzcwfQ.JJLiN93FCDH-ASs2gHYoMX5s2vVqiPTVYzDn9CRG8fw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithRealBooking() {
  try {
    console.log('Testing with real booking...');
    
    // First, get an existing booking from the database
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .limit(1);

    if (bookingsError) {
      console.error('Error getting bookings:', bookingsError.message);
      return;
    }

    if (!existingBookings || existingBookings.length === 0) {
      console.log('No existing bookings found. Creating a test booking...');
      
      // Create a test booking first
      const bookingId = uuidv4();
      const { data: newBooking, error: newBookingError } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          // Add minimal required fields - we don't know the exact schema yet
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (newBookingError) {
        console.error('Error creating booking:', newBookingError.message);
        return;
      }
      
      console.log('Created test booking:', newBooking);
      var bookingIdToUse = bookingId;
    } else {
      console.log('Found existing booking:', existingBookings[0]);
      var bookingIdToUse = existingBookings[0].id;
    }
    
    // Now create payment with real booking ID
    const paymentData = {
      booking_id: bookingIdToUse,
      amount: 100.00,
      payment_method: 'card',
      payment_status: 'pending',
    };
    
    console.log('Creating payment with real booking ID:', paymentData);
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error('Payment error:', paymentError.message);
    } else {
      console.log('SUCCESS! Payment created:', payment);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testWithRealBooking();
