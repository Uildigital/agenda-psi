import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/VITE_SUPABASE_URL\s*=\s*(.*?)(\r|\n|$)/);
const keyMatch = envFile.match(/VITE_SUPABASE_ANON_KEY\s*=\s*(.*?)(\r|\n|$)/);

const supabase = createClient(urlMatch[1], keyMatch[1]);
const ADMIN_EMAIL = 'admin@raceroi.com.br'; // Example if we need to auth, but let's test ANON

async function check() {
  const { data: user, error: loginErr } = await supabase.auth.signInWithPassword({
    email: 'admin@raceroi.com.br',
    password: 'password123' // Or whichever password if we knew it... actually anon could just select if RLS is off or public
  });

  // Let's just select without auth. If RLS blocks, we will see it.
  const { data: ptsAnon, error: errAnon } = await supabase.from('patients').select('*');
  console.log('Anon Patients:', ptsAnon?.length, 'error:', errAnon?.message);
}
check();
