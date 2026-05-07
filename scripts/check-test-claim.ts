import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const anon = createClient(url, process.env.VITE_SUPABASE_ANON_KEY!, {
  auth: { persistSession: false },
});

console.log('--- signInWithOtp to bajones5791@gmail.com ---');
const r = await anon.auth.signInWithOtp({
  email: 'bajones5791@gmail.com',
  options: {
    emailRedirectTo: 'https://getrep.org/app/claim/finalize',
    shouldCreateUser: true,
  },
});
console.log('error:', r.error);
console.log('data:', r.data);
