// Test payment with real UUID
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://dglzvzdyfnakfxymgnea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzM3MCwiZXhwIjoyMDc4NjUzMzcwfQ.JJLiN93FCDH-ASs2gHYoMX5s2vVqiPTVYzDn9CRG8fw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPaymentWithUUID() {
  try {
    console.log('Testing payment with UUID...');
    
    // First, create a test booking
    const bookingId = uuidv4();
    console.log('Creating test booking with ID:', bookingId);
    
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        route_id: 'test-route-id',
        schedule_id: 'test-schedule-id',
        customer_id: 'test-customer-id',
        seats: 1,
        total_amount: 100.00,
        payment_status: 'pending',
        booking_status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return;
    }
    
    console.log('Booking created:', booking);
    
    // Now create payment with the booking UUID
    const paymentData = {
      booking_id: bookingId,
      amount: 100.00,
      currency: 'BWP',
      customer_email: 'test@example.com',
      customer_first_name: 'John',
      customer_last_name: 'Doe',
      customer_phone: '+26771234567',
      customer_country: 'BW',
      payment_method: 'online',
      payment_status: 'pending',
    };
    
    console.log('Creating payment with booking UUID:', paymentData);
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
    } else {
      console.log('Payment created successfully:', payment);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPaymentWithUUID();
