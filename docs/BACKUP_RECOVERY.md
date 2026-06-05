# Backup & Recovery — AltSpaceCW

## Supabase Automatic Backups

| Plan | Frequency | Retention | Point-in-Time Recovery |
|------|-----------|-----------|----------------------|
| Free | Daily | 7 days | ❌ No |
| Pro  | Daily | 14 days | ✅ Yes (1-min granularity) |

**Check backup status:**
Supabase Dashboard → your project → Settings → Backups

---

## Manual Export (run anytime before major changes)

Export critical tables as CSV from Supabase Dashboard:
1. Table Editor → select table → Export as CSV

Critical tables to export:
- `bookings`
- `profiles`
- `tenants`
- `spaces`
- `subscriptions`
- `studio_settings`

Store exports in a secure location outside Supabase (Google Drive, encrypted local disk).

---

## Point-in-Time Restore (Pro plan only)

1. Supabase Dashboard → Settings → Backups
2. Select a timestamp to restore to
3. Confirm restore — this is destructive and cannot be undone

---

## Requesting a Restore (Free plan)

Contact Supabase support at support@supabase.io with:
- Project ref: (stored in Vercel env vars as VITE_SUPABASE_URL)
- Timestamp you want to restore to
- Reason for restore

---

## Ransomware / Account Compromise Response

If you suspect your Supabase account is compromised:

1. **Immediately** go to Supabase Dashboard → Settings → API → Regenerate service role key
2. Regenerate the anon key as well
3. Update both keys in Vercel environment variables
4. Trigger a Vercel redeploy
5. Rotate the Resend API key at resend.com
6. Rotate the Sentry DSN at sentry.io
7. Review audit_log table for suspicious activity:
   ```sql
   SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100;
   ```
8. Check Supabase Auth → Users for any unauthorized accounts
9. Contact Supabase support to report the incident

---

## Environment Variables Checklist

All secrets live in **Vercel Environment Variables** only — never in source code.

| Variable | Where to get it |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| `VITE_SENTRY_DSN` | sentry.io → your project → Settings → Client Keys |

Supabase secrets (set via `npx supabase secrets set`):
| Secret | Where to get it |
|--------|----------------|
| `RESEND_API_KEY` | resend.com → API Keys |

---

## Supabase Project Reference

Stored securely in Vercel env vars. Do not commit to source code.
To find it: Supabase Dashboard → Settings → General → Reference ID
