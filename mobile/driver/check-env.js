// Quick script to check if .env file is properly configured
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('\n.env file content:');
  console.log(content);
  
  // Check for required variables
  const hasUrl = content.includes('EXPO_PUBLIC_SUPABASE_URL=');
  const hasKey = content.includes('EXPO_PUBLIC_SUPABASE_ANON_KEY=');
  
  console.log('\n✅ Has EXPO_PUBLIC_SUPABASE_URL:', hasUrl);
  console.log('✅ Has EXPO_PUBLIC_SUPABASE_ANON_KEY:', hasKey);
  
  if (!hasUrl || !hasKey) {
    console.log('\n❌ Missing required environment variables!');
    console.log('\nYour .env file should contain:');
    console.log('EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
    console.log('EXPO_PUBLIC_APP_ENV=development');
  }
} else {
  console.log('❌ .env file not found!');
  console.log('\nPlease create a .env file with:');
  console.log('EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key');
  console.log('EXPO_PUBLIC_APP_ENV=development');
}
