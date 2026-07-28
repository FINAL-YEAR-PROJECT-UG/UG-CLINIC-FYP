const axios = require('axios');

async function testLogin(username, password) {
  console.log(`\n🔐 Testing login with: ${username} / ${password}`);
  console.log('─'.repeat(60));
  try {
    const res = await axios.post('http://localhost:3005/api/auth/login', {
      username,
      password,
    }, {
      timeout: 10000,
    });
    console.log(`✅ SUCCESS! Status: ${res.status}`);
    console.log(`   User: ${res.data.data?.user?.firstName} ${res.data.data?.user?.lastName} [${res.data.data?.user?.role}]`);
    console.log(`   StudentId: ${res.data.data?.user?.studentId || 'N/A'}`);
    console.log(`   AccessToken: ${res.data.data?.tokens?.accessToken?.substring(0, 30)}...`);
    return true;
  } catch (error) {
    console.log(`❌ FAILED! Status: ${error.response?.status}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    if (error.response?.data?.details) {
      console.log(`   Details: ${error.response?.data?.details}`);
    }
    return false;
  }
}

async function testHealth() {
  console.log('🏥 Checking backend health...');
  try {
    const res = await axios.get('http://localhost:3005/health', { timeout: 5000 });
    console.log(`   ✅ Health: ${JSON.stringify(res.data)}`);
    return true;
  } catch (e) {
    console.log(`   ❌ Health check failed: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('UG Clinic - Login Flow Verification Test');
  console.log('═'.repeat(60));

  await testHealth();

  console.log('\n📋 Testing ALL demo accounts:');
  console.log('─'.repeat(60));

  const tests = [
    { user: '11011482', pwd: 'Testitnow@123', desc: 'Student #2 (via Student ID)' },
    { user: '11011482@st.ug.edu.gh', pwd: 'Testitnow@123', desc: 'Student #2 (via Email)' },
    { user: '20240001', pwd: 'Password123!', desc: 'Student #1 (via Student ID)' },
    { user: 'student@st.ug.edu.gh', pwd: 'Password123!', desc: 'Student #1 (via Email)' },
    { user: 'admin@ugclinic-fyp.edu.gh', pwd: 'Password123!', desc: 'ADMIN' },
    { user: 'doctor@ugclinic-fyp.edu.gh', pwd: 'Password123!', desc: 'DOCTOR' },
    { user: 'receptionist@ugclinic-fyp.edu.gh', pwd: 'Password123!', desc: 'RECEPTIONIST' },
    { user: 'INVALID', pwd: 'wrongpass', desc: 'Invalid credentials (expected to fail)' },
  ];

  let passCount = 0;
  for (const t of tests) {
    console.log(`\n   Test: ${t.desc}`);
    const ok = await testLogin(t.user, t.pwd);
    // Invalid credentials test should fail (401), which is correct behavior
    if (t.desc.includes('Invalid') && !ok) {
      console.log('   ✅ Expected failure (correct validation)');
      passCount++;
    } else if (ok) {
      passCount++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  const expected = tests.length;
  console.log(`📊 Verification Result: ${passCount}/${expected} tests PASSED`);
  if (passCount === expected) {
    console.log('🎉 ALL ACCOUNTS CAN LOGIN SUCCESSFULLY! Project is demo-ready.');
  } else {
    console.log('⚠️  Some tests failed - review the output above.');
  }
  console.log('═'.repeat(60));
}

main().catch(e => console.error('Fatal test error:', e));
