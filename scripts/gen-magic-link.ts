/**
 * Mint a magic link for an email without going through the OTP send.
 * Useful when the project-level email cap is exhausted or you want a
 * single-use link without inbox round-trip.
 *
 * Usage: npx tsx --env-file=.env scripts/gen-magic-link.ts [email]
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const admin = createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
  auth: { persistSession: false },
});

const email = process.argv[2] ?? 'bajones5791@gmail.com';

const { data, error } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email,
  options: { redirectTo: 'https://getrep.org/app/claim/finalize' },
});

if (error) {
  console.error('generateLink error:', error);
  process.exit(1);
}

console.log('Magic link for', email);
console.log(data.properties?.action_link);
