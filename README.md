# SwasthyaSetu

An offline-first, multilingual rural healthcare guidance and referral PWA. It intentionally provides education, emergency escalation, and explainable symptom safety rules—not disease diagnosis or treatment.

## Features

- English, Marathi, and Hindi interface
- Health library, symptom guidance, emergency danger-sign screen, and report-term explainer
- Health-worker referral note saved locally in the browser
- PWA manifest and service worker for installability and cached local use
- Optional Google sign-in with Better Auth and Supabase PostgreSQL patient-history storage
- Browser voice input for English symptom phrases, where supported

## Run

```powershell
npm install
npm run dev
```

Open `http://localhost:3001`. For an offline demo, open the application once while connected; the service worker caches visited pages and local assets.

## Enable Google login and patient history

1. Copy `.env.example` to `.env.local` and fill in the Google OAuth, Better Auth, and Supabase variables.
2. Add `http://localhost:3001/api/auth/callback/google` as an authorised redirect URI in Google Cloud.
3. Run `npx auth@latest migrate`, then run [`supabase/schema.sql`](supabase/schema.sql) in Supabase SQL Editor.
4. Set `NEXT_PUBLIC_AUTH_ENABLED=true` and restart the development server.

Patient-history requests are authorised server-side from the Better Auth session. The browser never receives the Postgres connection string.

## Before real-world use

- Replace all directory placeholders with verified local PHC, CHC, district hospital, and emergency contacts.
- Obtain a clinician review of every health-content item.
- Do not use the application as an emergency triage system or clinical diagnostic tool.
