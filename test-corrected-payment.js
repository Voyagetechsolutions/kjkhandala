// Test with corrected column names
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://dglzvzdyfnakfxymgnea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzM3MCwiZXhwIjoyMDc4NjUzMzcwfQ.JJLiN93FCDH-ASs2gHYoMX5s2vVqiPTVYzDn9CRG8fw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCorrectedPayment() {
  try {
    console.log('Testing with corrected column names...');
    
    const bookingId = uuidv4();
    
    const paymentData = {
      booking_id: bookingId,
      amount: 100.00,
      payment_method: 'card', // Correct enum value
      status: 'pending', // Correct column name
    };
    
    console.log('Creating payment:', paymentData);
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error('Payment error:', paymentError.message);
      
      // Try with currency
      console.log('\nTrying with currency...');
      const withCurrencyData = {
        booking_id: bookingId,
        amount: 100.00,
        currency: 'BWP',
        payment_method: 'card',
        status: 'pending',
      };
      
      const { data: payment2, error: error2 } = await supabase
        .from('payments')
        .insert(withCurrencyData)
        .select()
        .single();
        
      if (error2) {
        console.error('With currency error:', error2.message);
      } else {
        console.log('Success with currency:', payment2);
      }
    } else {
      console.log('Payment created successfully:', payment);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCorrectedPayment();
