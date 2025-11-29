// Test Supabase connection
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dglzvzdyfnakfxymgnea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzM3MCwiZXhwIjoyMDc4NjUzMzcwfQ.JJLiN93FCDH-ASs2gHYoMX5s2vVqiPTVYzDn9CRG8fw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('bookings').select('count').single();
    
    if (error) {
      console.error('Supabase connection error:', error);
      return;
    }
    
    console.log('Supabase connection successful!');
    
    // Test if payments table exists
    const { data: paymentsData, error: paymentsError } = await supabase.from('payments').select('count').single();
    
    if (paymentsError) {
      console.error('Payments table error:', paymentsError);
      console.log('Payments table might not exist. Need to run migration.');
    } else {
      console.log('Payments table exists!');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSupabase();
