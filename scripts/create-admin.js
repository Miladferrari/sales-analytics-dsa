/**
 * Script to create admin user
 * Run with: node scripts/create-admin.js
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.log('Make sure .env.local exists with:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const email = 'admin@dropshipping.com';
  const password = 'Admin123456!';

  console.log('🔐 Creating admin user...\n');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}\n`);

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'admin'
      }
    });

    if (error) throw error;

    console.log('✅ Admin user created successfully!\n');
    console.log('You can now login at http://localhost:3000/login with:');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}\n`);
  } catch (error) {
    console.error('❌ Error creating admin user:');
    console.error(error.message);
    console.log('\n💡 Alternative: Create user manually in Supabase Dashboard:');
    console.log('1. Go to Authentication → Users');
    console.log('2. Click "Add user"');
    console.log('3. Create with email: admin@dropshipping.com');
    console.log('4. Password: Admin123456!');
    console.log('5. Check "Auto Confirm User"');
  }
}

createAdminUser();
