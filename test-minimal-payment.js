// Test minimal payment insertion
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dglzvzdyfnakfxymgnea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzM3MCwiZXhwIjoyMDc4NjUzMzcwfQ.JJLiN93FCDH-ASs2gHYoMX5s2vVqiPTVYzDn9CRG8fw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMinimalPayment() {
  try {
    console.log('Testing minimal payment insertion...');
    
    // Try with just required fields
    const minimalData = {
      booking_id: 'test-booking-123',
      amount: 100.00,
      status: 'pending',
    };
    
    console.log('Trying minimal data:', minimalData);
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(minimalData)
      .select()
      .single();

    if (paymentError) {
      console.error('Minimal payment error:', paymentError);
      
      // Try with different field names
      console.log('Trying with different field names...');
      const altData = {
        booking_id: 'test-booking-123',
        amount: 100.00,
        payment_status: 'pending',
      };
      
      const { data: altPayment, error: altError } = await supabase
        .from('payments')
        .insert(altData)
        .select()
        .single();
        
      if (altError) {
        console.error('Alternative payment error:', altError);
      } else {
        console.log('Alternative payment successful:', altPayment);
      }
    } else {
      console.log('Minimal payment successful:', payment);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testMinimalPayment();
