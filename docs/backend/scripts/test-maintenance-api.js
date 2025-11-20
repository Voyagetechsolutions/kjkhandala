#!/usr/bin/env node

/**
 * Test Maintenance API Endpoints
 * Verifies all maintenance endpoints are working correctly
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let authToken = '';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      data,
    };

    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      log(`✅ ${method.toUpperCase()} ${endpoint} - Success`, 'green');
      return { success: true, data: response.data };
    } else {
      log(`⚠️  ${method.toUpperCase()} ${endpoint} - Unexpected status: ${response.status}`, 'yellow');
      return { success: false, status: response.status };
    }
  } catch (error) {
    if (error.response) {
      log(`❌ ${method.toUpperCase()} ${endpoint} - Error: ${error.response.status} ${error.response.statusText}`, 'red');
      return { success: false, error: error.response.data };
    } else {
      log(`❌ ${method.toUpperCase()} ${endpoint} - Error: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
  }
}

async function authenticateUser() {
  log('\n🔐 Authenticating test user...', 'blue');
  
  // Try to login with a test user
  // You may need to adjust these credentials
  const loginData = {
    email: 'admin@voyage.com',
    password: 'admin123'
  };

  const result = await testEndpoint('post', '/auth/login', loginData);
  
  if (result.success && result.data.token) {
    authToken = result.data.token;
    log('✅ Authentication successful', 'green');
    return true;
  } else {
    log('⚠️  Authentication failed. Some tests may not work without auth.', 'yellow');
    log('   Create a user or update credentials in this script.', 'yellow');
    return false;
  }
}

async function runTests() {
  log('🧪 Starting Maintenance API Tests...', 'blue');
  log(`📡 API URL: ${API_URL}`, 'blue');
  
  let passed = 0;
  let failed = 0;

  // Authenticate
  await authenticateUser();
  
  // Test Work Orders
  log('\n📋 Testing Work Orders Endpoints...', 'blue');
  let result = await testEndpoint('get', '/maintenance/work-orders');
  result.success ? passed++ : failed++;
  
  // Test Maintenance Schedules
  log('\n📅 Testing Maintenance Schedules Endpoints...', 'blue');
  result = await testEndpoint('get', '/maintenance/maintenance-schedules');
  result.success ? passed++ : failed++;
  
  // Test Inspections
  log('\n🔍 Testing Inspections Endpoints...', 'blue');
  result = await testEndpoint('get', '/maintenance/inspections');
  result.success ? passed++ : failed++;
  
  // Test Repairs
  log('\n🔧 Testing Repairs Endpoints...', 'blue');
  result = await testEndpoint('get', '/maintenance/repairs');
  result.success ? passed++ : failed++;
  
  // Test Inventory
  log('\n📦 Testing Inventory Endpoints...', 'blue');
  result = await testEndpoint('get', '/maintenance/inventory');
  result.success ? passed++ : failed++;
  
  result = await testEndpoint('get', '/maintenance/inventory?lowStock=true');
  result.success ? passed++ : failed++;
  
  // Test Maintenance Costs
  log('\n💰 Testing Maintenance Costs Endpoints...', 'blue');
  result = await testEndpoint('get', '/maintenance/maintenance-costs');
  result.success ? passed++ : failed++;
  
  // Test Settings
  log('\n⚙️  Testing Settings Endpoints...', 'blue');
  result = await testEndpoint('get', '/maintenance/settings');
  result.success ? passed++ : failed++;
  
  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('📊 Test Summary:', 'blue');
  log(`   ✅ Passed: ${passed}`, 'green');
  log(`   ❌ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`, 'blue');
  log('='.repeat(50), 'blue');
  
  if (failed === 0) {
    log('\n🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Check the output above.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});
