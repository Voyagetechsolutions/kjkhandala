// Test final payment with real booking ID
const axios = require('axios');

async function testFinalPayment() {
  try {
    console.log('Testing final payment with real booking ID...');
    
    // First get a real booking ID
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = 'https://dglzvzdyfnakfxymgnea.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzM3MCwiZXhwIjoyMDc4NjUzMzcwfQ.JJLiN93FCDH-ASs2gHYoMX5s2vVqiPTVYzDn9CRG8fw';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id')
      .limit(1);
    
    if (!bookings || bookings.length === 0) {
      console.error('No bookings found');
      return;
    }
    
    const realBookingId = bookings[0].id;
    console.log('Using real booking ID:', realBookingId);
    
    // Test the payment API with real booking ID
    const response = await axios.post('http://localhost:3001/api/payments/initialize', {
      bookingId: realBookingId,
      amount: 100,
      currency: 'BWP',
      customerEmail: 'test@example.com',
      customerFirstName: 'John',
      customerLastName: 'Doe',
      customerPhone: '+26771234567',
      customerCountry: 'BW',
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('SUCCESS! Payment initialization:', response.data);
  } catch (error) {
    console.error('Payment initialization failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testFinalPayment();
