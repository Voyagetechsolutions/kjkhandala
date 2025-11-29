// Test with required payment_method
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://dglzvzdyfnakfxymgnea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzM3MCwiZXhwIjoyMDc4NjUzMzcwfQ.JJLiN93FCDH-ASs2gHYoMX5s2vVqiPTVYzDn9CRG8fw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithPaymentMethod() {
  try {
    console.log('Testing with required payment_method...');
    
    const bookingId = uuidv4();
    
    // Test with payment_method and payment_status
    const paymentData = {
      booking_id: bookingId,
      amount: 100.00,
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
      console.error('Payment error:', paymentError.message);
      
      // Try without currency
      console.log('\nTrying without currency...');
      const noCurrencyData = {
        booking_id: bookingId,
        amount: 100.00,
        payment_method: 'online',
        payment_status: 'pending',
      };
      
      const { data: payment2, error: error2 } = await supabase
        .from('payments')
        .insert(noCurrencyData)
        .select()
        .single();
        
      if (error2) {
        console.error('No currency error:', error2.message);
      } else {
        console.log('Success without currency:', payment2);
      }
    } else {
      console.log('Payment created successfully:', payment);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testWithPaymentMethod();
