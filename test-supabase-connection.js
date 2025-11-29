// Test Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dglzvzdyfnakfxymgnea.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzczNzAsImV4cCI6MjA3ODY1MzM3MH0.-LJB1n1dZAnIuDMwX2a9D7jCC7F_IN_FxRKbbSmMBls';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('job_postings')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Connection error:', error);
    } else {
      console.log('✅ Supabase connection successful!');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('❌ Connection failed:', err);
  }
}

testConnection();
