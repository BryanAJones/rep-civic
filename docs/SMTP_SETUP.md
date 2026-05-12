# SMTP Setup (B6-10)

The default Supabase auth sender caps at ~4 emails per hour per project. That cap is fine for development but blocks real candidate self-claim attempts as soon as more than four people try in an hour. Worse, the rate-limit error surfaces as `OTP_RATE_LIMIT` to the user — they see "we sent too many emails recently," not "your magic link is on the way." Until custom SMTP is configured, no real candidate dogfooding can validate the self-claim flow at any scale beyond one careful attempt.

This doc is the setup checklist. It is meant to be run end-to-end in one sitting; do not stop partway.

---

## 1. Pick a provider

You only need to pick one. All three terminate at the same Supabase Auth → SMTP Settings panel.

| Provider | Free tier | Why pick it |
|----------|-----------|-------------|
| **Resend** | 3,000 emails/month, 100/day | Fewest steps. Modern API, clean dashboard, single-domain DKIM auto-config. Recommended unless you already have an account elsewhere. |
| **SendGrid** | 100 emails/day (forever-free) | Battle-tested but onboarding is heavier (sender authentication wizard, several confirmation emails). |
| **AWS SES** | 62,000 emails/month from EC2, $0.10 per 1k otherwise | Cheapest at scale. Out-of-sandbox approval can take 24h. Overkill unless you're already in AWS. |

Default recommendation: **Resend**.

---

## 2. Domain authentication

Whatever provider you pick, candidates will see emails from `noreply@getrep.org` (or whatever sender you configure). Email clients reject mail from unauthenticated domains. You need SPF + DKIM at minimum; DMARC is strongly recommended.

### Resend path

1. Sign up at resend.com (Google sign-in is fastest).
2. Add the domain `getrep.org` under **Domains → Add Domain**.
3. Resend shows three DNS records — one SPF, one DKIM, one MX-for-bounces. Add all three to your DNS provider (wherever `getrep.org` is registered; likely Cloudflare or Namecheap based on the Cloudflare Pages setup).
4. Click **Verify** in the Resend dashboard. Propagation is usually < 5 minutes but can take up to 24h.
5. Once green: go to **API Keys → Create API Key**, scope it to **Sending access only**, copy the key.

### SendGrid path

1. Sign up at sendgrid.com. They will ask several onboarding questions (use "transactional" for the use case).
2. **Settings → Sender Authentication → Authenticate Your Domain**. Pick `getrep.org`, follow the wizard, add the CNAME records they show.
3. Wait for the green checkmark.
4. **Settings → API Keys → Create API Key → Restricted Access → Mail Send only**. Copy the key.

---

## 3. Wire into Supabase

1. Go to https://supabase.com/dashboard/project/ocpcejomntxqsboswhrx/auth/templates (or **Auth → SMTP Settings** from the sidebar).
2. Toggle **Enable Custom SMTP** on.
3. Fill in:

   | Field | Resend | SendGrid | AWS SES |
   |-------|--------|----------|---------|
   | Host | `smtp.resend.com` | `smtp.sendgrid.net` | `email-smtp.us-east-1.amazonaws.com` (or your region) |
   | Port | `465` | `587` | `587` |
   | Username | `resend` (literal string) | `apikey` (literal string) | your SES SMTP username |
   | Password | the API key from step 2 | the API key from step 2 | your SES SMTP password |
   | Sender email | `noreply@getrep.org` | `noreply@getrep.org` | `noreply@getrep.org` |
   | Sender name | `Rep.` | `Rep.` | `Rep.` |

4. Click **Save**.

---

## 4. Verify

1. From an incognito browser, open https://getrep.org and complete the basic onboarding (any GA address).
2. From the You page, hit **Sign in / verify email** and trigger a magic link to a test address you control.
3. Check the inbox. The email should:
   - Arrive within ~30 seconds.
   - Show sender `noreply@getrep.org` (not a `supabase.co` address).
   - Pass SPF + DKIM (visible in raw headers — look for `Authentication-Results: spf=pass; dkim=pass`).
4. Click the link, confirm the session upgrades to non-anonymous.
5. (Optional but worthwhile) From an incognito mobile browser, run `scripts/seed-test-claim.ts` with your email and complete a full claim cycle end-to-end. The test URL is stable so you can re-run.

If verification fails, the dashboard's **Logs → Auth Logs** view shows the SMTP handshake error verbatim.

---

## 5. Capacity headroom

For dogfooding (1–10 candidates over the next month), every provider's free tier is dramatically over-spec. The capacity question only matters at scale — revisit if Rep ever has 50+ candidates actively claiming in a month.

---

## 6. Rotating the API key

Treat the SMTP API key the same as a service-role key. If it leaks:
1. Revoke the key in the provider dashboard.
2. Generate a new one.
3. Replace it in Supabase Auth → SMTP Settings.
4. Save.

No application redeploy needed — Supabase Auth uses the new key on the next send.
