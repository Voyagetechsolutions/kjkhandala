// Check actual payments table schema
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dglzvzdyfnakfxymgnea.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnbHp2emR5Zm5ha2Z4eW1nbmVhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3NzM3MCwiZXhwIjoyMDc4NjUzMzcwfQ.JJLiN93FCDH-ASs2gHYoMX5s2vVqiPTVYzDn9CRG8fw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking payments table schema...');
    
    // Get table info
    const { data, error } = await supabase
      .rpc('get_table_info', { table_name: 'payments' })
      .select('*');
    
    if (error) {
      console.error('Error getting table info:', error);
      
      // Alternative: try to describe the table
      console.log('Trying to describe payments table...');
      const { data: descData, error: descError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'payments')
        .eq('table_schema', 'public');
      
      if (descError) {
        console.error('Error describing table:', descError);
      } else {
        console.log('Payments table columns:');
        console.log(descData);
      }
    } else {
      console.log('Table info:', data);
    }
    
  } catch (error) {
    console.error('Schema check failed:', error);
  }
}

checkSchema();
