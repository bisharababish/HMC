# Supabase setup for HMC LABELING STORAGE

## What I need from you (paste in chat or put in `.env` yourself)

From Supabase → **Project Settings** → **API**, copy these **2 values only**:

| # | Name in Supabase | Put in `.env` as |
|---|------------------|------------------|
| 1 | **Project URL** | `VITE_SUPABASE_URL` |
| 2 | **anon public** key (under Project API keys) | `VITE_SUPABASE_ANON_KEY` |

**Do NOT share:** database password, `service_role` key, or any secret keys.

Example `.env` (create this file in the project root):

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Then restart: `npm run dev`

---

## Step-by-step in Supabase

### 1. Create project
- Go to https://supabase.com
- **New project** → name it e.g. `hmc-labeling`
- Choose region close to you
- Set database password (save it — not needed for the app, only for Supabase dashboard)

### 2. Run main SQL
- Left menu → **SQL Editor**
- **New query**
- Open [`schema.sql`](schema.sql) from this folder
- Copy **the entire file** → paste → **Run**
- You should see **Success. No rows returned**

### 3. Verify (optional)
- New query → paste [`verify.sql`](verify.sql) → **Run**
- `app_state` should have **1 row**
- Both tables should have **rowsecurity = true**
- Policies `hmc_app_state_all` and `hmc_change_log_all` should appear

### 4. Get API keys
- **Project Settings** (gear) → **API**
- Copy **Project URL** and **anon public** key into `.env`

### 5. Restart app
```bash
npm run dev
```
- Make a small change in the app
- Header should show **Cloud saved**
- Dashboard → **Backup History** appears

---

## What the database stores

| Table | What |
|-------|------|
| `app_state` | Live data: all sheets, items, meters, quantities, locations, recent activity |
| `change_log` | Full JSON copy every time you save — for history & restore |

Data format is JSON (same as before, but online):

```json
{
  "categories": [ "... all sheets, columns, rows/items ..." ],
  "locations": [ "... warehouse, aisle, custom locations ..." ],
  "checkoutLog": [ "... recent stock take-outs ..." ],
  "lang": "en"
}
```

You can also browse data in Supabase → **Table Editor** → `app_state` / `change_log`.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Still says **Local only** | `.env` missing or wrong; restart `npm run dev` after creating `.env` |
| Cloud save fails | Re-run `schema.sql`; check browser console (F12) |
| Empty after connect | Normal on first run — edit something to create first backup |
