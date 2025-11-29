// Test simple payment without booking dependency
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://dglzvzdyfnakfxymgnea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzM3MCwiZXhwIjoyMDc4NjUzMzcwfQ.JJLiN93FCDH-ASs2gHYoMX5s2vVqiPTVYzDn9CRG8fw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimplePayment() {
  try {
    console.log('Testing simple payment without booking...');
    
    // Create a payment with a dummy UUID for booking_id
    const bookingId = uuidv4();
    console.log('Using dummy booking UUID:', bookingId);
    
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
    
    console.log('Creating payment:', paymentData);
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error('Payment creation error:', paymentError);
      console.error('Error details:', JSON.stringify(paymentError, null, 2));
    } else {
      console.log('Payment created successfully:', payment);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSimplePayment();
