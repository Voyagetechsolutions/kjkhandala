// Test to find actual column names
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = 'https://dglzvzdyfnakfxymgnea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzM3MCwiZXhwIjoyMDc4NjUzMzcwfQ.JJLiN93FCDH-ASs2gHYoMX5s2vVqiPTVYzDn9CRG8fw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findActualColumns() {
  try {
    console.log('Testing different column combinations...');
    
    const bookingId = uuidv4();
    
    // Test 1: Try with minimal columns
    console.log('\n=== Test 1: Minimal columns ===');
    const minimalData = {
      booking_id: bookingId,
      amount: 100.00,
    };
    
    const { data: payment1, error: error1 } = await supabase
      .from('payments')
      .insert(minimalData)
      .select()
      .single();

    if (error1) {
      console.log('Minimal test error:', error1.message);
    } else {
      console.log('Minimal test success:', payment1);
      return;
    }
    
    // Test 2: Try with different status column names
    console.log('\n=== Test 2: Different status columns ===');
    const statusTests = ['status', 'payment_status', 'transaction_status'];
    
    for (const statusCol of statusTests) {
      const testData = {
        booking_id: bookingId,
        amount: 100.00,
        [statusCol]: 'pending',
      };
      
      const { data: payment2, error: error2 } = await supabase
        .from('payments')
        .insert(testData)
        .select()
        .single();

      if (error2) {
        console.log(`${statusCol} test error:`, error2.message);
      } else {
        console.log(`${statusCol} test success!`);
        return;
      }
    }
    
    // Test 3: Try without currency
    console.log('\n=== Test 3: Without currency ===');
    const noCurrencyData = {
      booking_id: bookingId,
      amount: 100.00,
      status: 'pending',
    };
    
    const { data: payment3, error: error3 } = await supabase
      .from('payments')
      .insert(noCurrencyData)
      .select()
      .single();

    if (error3) {
      console.log('No currency test error:', error3.message);
    } else {
      console.log('No currency test success:', payment3);
      return;
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

findActualColumns();
