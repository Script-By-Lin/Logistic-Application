const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://woybjmaqbslonjdkkvxq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_cxGW9zOD7Zac3s8L1mdiOw_29CKi1bv';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function run() {
  console.log("Connecting to Supabase...");
  const { data: users, error } = await supabase.from('app_users').select('*');
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }
  
  console.log("Existing users:", users);
  
  if (users.length === 0) {
    console.log("No users found. Creating default admin account: admin@company.com / admin123");
    const passHash = hashPassword('admin123');
    const { data, error: insertError } = await supabase.from('app_users').insert([
      { email: 'admin@company.com', password_hash: passHash, role: 'admin' }
    ]).select();
    
    if (insertError) {
      console.error("Failed to insert user:", insertError);
    } else {
      console.log("Inserted user successfully:", data);
    }
  }
}

run();
