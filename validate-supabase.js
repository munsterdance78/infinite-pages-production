// Supabase Key Validator - Run this in your project directory
// Usage: node validate-supabase.js

const fs = require('fs');
const path = require('path');

console.log('🔍 SUPABASE CONFIGURATION VALIDATOR\n');
console.log('=' .repeat(60));

// Read .env.local
let localEnv = {};
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      localEnv[key.trim()] = valueParts.join('=').trim();
    }
  });
  console.log('✅ Found .env.local file\n');
} catch (error) {
  console.log('❌ Could not read .env.local file\n');
  process.exit(1);
}

// Extract keys
const supabaseUrl = localEnv.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = localEnv.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('📋 LOCAL ENVIRONMENT VARIABLES:\n');

// Validate URL
console.log('1. SUPABASE URL:');
if (supabaseUrl) {
  console.log(`   ✅ Found: ${supabaseUrl}`);
  const projectIdMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (projectIdMatch) {
    const projectId = projectIdMatch[1];
    console.log(`   📌 Project ID: ${projectId}`);
  } else {
    console.log('   ⚠️  URL format seems incorrect');
  }
} else {
  console.log('   ❌ NEXT_PUBLIC_SUPABASE_URL not found');
}
console.log('');

// Validate Anon Key
console.log('2. ANON KEY:');
if (anonKey) {
  console.log(`   ✅ Found (length: ${anonKey.length} chars)`);
  console.log(`   🔑 Starts with: ${anonKey.substring(0, 20)}...`);

  // Decode JWT to check
  try {
    const payload = JSON.parse(Buffer.from(anonKey.split('.')[1], 'base64').toString());
    console.log(`   📊 Role: ${payload.role || 'unknown'}`);
    if (payload.role !== 'anon') {
      console.log('   ⚠️  WARNING: This should have role "anon"');
    }
  } catch (e) {
    console.log('   ⚠️  Could not decode JWT - might be invalid');
  }
} else {
  console.log('   ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found');
}
console.log('');

// Validate Service Role Key
console.log('3. SERVICE ROLE KEY:');
if (serviceKey) {
  console.log(`   ✅ Found (length: ${serviceKey.length} chars)`);
  console.log(`   🔑 Starts with: ${serviceKey.substring(0, 20)}...`);

  // Decode JWT to check
  try {
    const payload = JSON.parse(Buffer.from(serviceKey.split('.')[1], 'base64').toString());
    console.log(`   📊 Role: ${payload.role || 'unknown'}`);
    if (payload.role !== 'service_role') {
      console.log('   ⚠️  WARNING: This should have role "service_role"');
      console.log('   ❌ YOU ARE USING THE WRONG KEY! This is likely your ANON key.');
    } else {
      console.log('   ✅ Correct role detected');
    }

    // Check project match
    if (payload.iss && supabaseUrl) {
      const issProjectId = payload.iss.match(/https:\/\/([^.]+)\.supabase\.co/);
      const urlProjectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);

      if (issProjectId && urlProjectId) {
        if (issProjectId[1] === urlProjectId[1]) {
          console.log('   ✅ Key matches project URL');
        } else {
          console.log('   ❌ KEY AND URL ARE FROM DIFFERENT PROJECTS!');
          console.log(`      Key is for: ${issProjectId[1]}`);
          console.log(`      URL is for: ${urlProjectId[1]}`);
        }
      }
    }
  } catch (e) {
    console.log('   ⚠️  Could not decode JWT - might be invalid');
  }
} else {
  console.log('   ❌ SUPABASE_SERVICE_ROLE_KEY not found');
}
console.log('');

// Check if anon and service keys are the same (common mistake)
if (anonKey && serviceKey && anonKey === serviceKey) {
  console.log('❌ CRITICAL ERROR: ANON KEY AND SERVICE KEY ARE IDENTICAL!');
  console.log('   You are using the same key for both. They should be different.');
  console.log('');
}

console.log('=' .repeat(60));
console.log('\n📝 SUMMARY:\n');

const issues = [];

if (!supabaseUrl) issues.push('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!anonKey) issues.push('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
if (!serviceKey) issues.push('Missing SUPABASE_SERVICE_ROLE_KEY');

if (serviceKey) {
  try {
    const payload = JSON.parse(Buffer.from(serviceKey.split('.')[1], 'base64').toString());
    if (payload.role !== 'service_role') {
      issues.push('WRONG KEY: Service role key has wrong role - you copied the anon key');
    }
  } catch (e) {
    issues.push('Service role key is not a valid JWT');
  }
}

if (anonKey && serviceKey && anonKey === serviceKey) {
  issues.push('Anon and service keys are identical (they should be different)');
}

if (issues.length === 0) {
  console.log('✅ All checks passed! Your local configuration looks correct.');
  console.log('\n💡 Next step: Make sure your Vercel environment variables match these exactly.');
} else {
  console.log('❌ Issues found:\n');
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
}

console.log('\n' + '=' .repeat(60));
