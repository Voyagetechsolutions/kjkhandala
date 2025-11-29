// Test to find actual working schema
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://dglzvzdyfnakfxymgnea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzM3MCwiZXhwIjoyMDc4NjUzMzcwfQ.JJLiN93FCDH-ASs2gHYoMX5s2vVqiPTVYzDn9CRG8fw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testActualSchema() {
  try {
    console.log('Testing to find actual schema...');
    
    const bookingId = uuidv4();
    
    // Try different status column names that might exist
    const statusColumns = ['payment_status', 'transaction_status', 'order_status', 'booking_status'];
    
    for (const statusCol of statusColumns) {
      console.log(`\nTrying status column: ${statusCol}`);
      
      const testData = {
        booking_id: bookingId,
        amount: 100.00,
        payment_method: 'card',
        [statusCol]: 'pending',
      };
      
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert(testData)
        .select()
        .single();

      if (paymentError) {
        console.log(`${statusCol} error:`, paymentError.message);
      } else {
        console.log(`SUCCESS with ${statusCol}!`, payment);
        
        // Now test currency
        console.log('\nTesting currency...');
        const currencyTest = {
          booking_id: bookingId,
          amount: 100.00,
          payment_method: 'card',
          [statusCol]: 'pending',
          currency: 'BWP',
        };
        
        const { data: payment2, error: error2 } = await supabase
          .from('payments')
          .insert(currencyTest)
          .select()
          .single();
          
        if (error2) {
          console.log('Currency error:', error2.message);
        } else {
          console.log('SUCCESS with currency!', payment2);
        }
        
        return;
      }
    }
    
    console.log('\nNo working status column found. Trying minimal insert...');
    
    // Try absolute minimal
    const minimalData = {
      booking_id: bookingId,
      amount: 100.00,
      payment_method: 'card',
    };
    
    const { data: minimalPayment, error: minimalError } = await supabase
      .from('payments')
      .insert(minimalData)
      .select()
      .single();
      
    if (minimalError) {
      console.error('Minimal insert error:', minimalError.message);
    } else {
      console.log('Minimal insert success:', minimalPayment);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testActualSchema();
