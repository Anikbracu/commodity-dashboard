# Commodity Dashboard — Starter Project

Live, publicly-hosted commodity dashboard with guest (no login), user, and admin access.

## What's in here

- `schema.sql` — Supabase database schema (commodities, prices, user roles, security rules)
- `ingest/` — Node script that fetches live prices and writes them to the database
- `.github/workflows/fetch-prices.yml` — runs the ingest script automatically every day, for free, via GitHub Actions
- `web/` — the Next.js dashboard (guest view, login, admin panel)

## Setup, in order

### 1. Create a Supabase project
1. Go to https://supabase.com → New project (free tier).
2. Once created, open **SQL Editor → New query**, paste in the contents of `schema.sql`, and run it. This creates your tables and seeds the six commodities.
3. Go to **Project Settings → API**. Copy:
   - `Project URL` → used as `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → used as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → used as `SUPABASE_SERVICE_ROLE_KEY` (keep this secret, never put it in the frontend)

### 2. Get your free API keys
- Alpha Vantage (WTI, Wheat, Cotton): https://www.alphavantage.co/support/#api-key — instant, just an email.
- MetalpriceAPI (Gold): https://metalpriceapi.com — free tier, sign up for a key.

### 3. Create your admin account
1. In Supabase: **Authentication → Users → Add user**, enter your email/password.
2. In **SQL Editor**, run:
   ```sql
   insert into profiles (id, role)
   values ('PASTE-THE-USER-ID-HERE', 'admin');
   ```
   (Get the user ID from the Authentication → Users list.)

### 4. Run the ingestion script once, locally, to test it
```bash
cd ingest
npm install
export SUPABASE_URL=https://YOUR-PROJECT.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
export ALPHA_VANTAGE_KEY=your-alpha-vantage-key
export METALPRICE_API_KEY=your-metalprice-key
npm run fetch
```
You should see "Upserted wti_crude...", etc. Check the `prices` table in Supabase to confirm.

### 5. Automate it with GitHub Actions (free, no server needed)
1. Push this project to a GitHub repo.
2. In the repo: **Settings → Secrets and variables → Actions**, add the four secrets from step 4 (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALPHA_VANTAGE_KEY`, `METALPRICE_API_KEY`).
3. The workflow in `.github/workflows/fetch-prices.yml` will now run daily automatically. You can also trigger it manually from the Actions tab.

### 6. Run the dashboard locally
```bash
cd web
cp .env.local.example .env.local   # fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```
Open http://localhost:3000 — this is the guest view, live, no login. Go to `/login` to sign in as admin and reach `/admin`.

### 7. Deploy publicly
1. Push to GitHub (if not already).
2. Go to https://vercel.com → New Project → import your repo → set the **root directory to `web`**.
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel's project settings.
4. Deploy. You'll get a public URL immediately.

## What's automated vs. manual right now

| Commodity | Status |
|---|---|
| WTI Crude Oil | Automated (Alpha Vantage) |
| Wheat | Automated (Alpha Vantage) |
| Cotton | Automated (Alpha Vantage) |
| Gold | Automated (MetalpriceAPI) |
| Soybean Oil | Manual — no free live API exists; enter via `/admin` |
| Copra | Manual — Philippine-specific, no market-data API; enter via `/admin` |

## Next steps once this is running
- Import your existing Excel price history into `prices` for richer 1-year/YTD charts (Supabase's table editor supports CSV import).
- Add a chart per commodity (e.g. using `recharts`) on the dashboard page.
- If you later find a paid data vendor for Soybean Oil or a Copra source you trust, add a new `fetch...()` function to `ingest/fetch-prices.js` following the same pattern.
