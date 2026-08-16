# HMC LABELING STORAGE

Inventory app with cloud backup via Supabase.

## Run locally

```bash
npm install
npm run dev
```

---

## Connect Supabase (cloud save + history)

**Do not paste your keys in chat.** Keep them in a local `.env` file only.

### Step 1 — Create Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. **New project** → pick a name (e.g. `hmc-storage`) → set a database password → create

### Step 2 — Run the SQL

1. In Supabase, open **SQL Editor** → **New query**
2. Copy everything from [`supabase/schema.sql`](supabase/schema.sql) and click **Run**

You should see two tables: `app_state` and `change_log`.

### Step 3 — Get your API keys

1. **Project Settings** (gear icon) → **API**
2. Copy these two values:

| Setting | Where | Goes in `.env` as |
|---|---|---|
| **Project URL** | Project URL | `VITE_SUPABASE_URL` |
| **anon public** key | Project API keys | `VITE_SUPABASE_ANON_KEY` |

### Step 4 — Create `.env` in the project folder

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Then edit `.env`:

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5 — Restart the app

```bash
npm run dev
```

Header should show **Cloud saved** after you make a change. Dashboard shows **Backup History** to restore older saves.

---

## SQL reference (`supabase/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS app_state (
  id TEXT PRIMARY KEY DEFAULT 'main',
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS change_log_created_at_idx ON change_log (created_at DESC);

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read write app_state"
  ON app_state FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read write change_log"
  ON change_log FOR ALL USING (true) WITH CHECK (true);
```

---

## What gets stored

| Table | Purpose |
|---|---|
| `app_state` | Live inventory (all sheets, items, locations, activity) |
| `change_log` | Full JSON snapshot on every save — for looking back / restore |

Browser **localStorage** is also used as a local cache.

## Build

```bash
npm run build
```
