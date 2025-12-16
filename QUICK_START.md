# Quick Start Guide - 5 Minutes to Running

## Prerequisites
- Supabase account (free tier works)
- Node.js and Python installed

---

## 1️⃣ Set Up Database (5 minutes)

### Create Supabase Project
1. Go to https://supabase.com → New Project
2. Wait for initialization (2-3 minutes)

### Create Table
1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `supabase/schema.sql`
3. Paste and click "Run"

### Get Credentials
1. Go to Settings → API
2. Copy these three values:
   - Project URL
   - anon public key
   - service_role key

---

## 2️⃣ Configure Environment (2 minutes)

Create `.env.local` in project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Create `.env` in project root:
```bash
SUPABASE_URL=your_project_url
SUPABASE_KEY=your_service_role_key
```

---

## 3️⃣ Install & Verify (3 minutes)

```bash
# Install Node dependencies
npm install

# Install Python dependencies
cd scripts
pip install -r requirements.txt

# Verify setup
python verify_setup.py
```

If all checks pass ✅, continue!

---

## 4️⃣ Get Initial Data (5 minutes)

```bash
# Still in scripts directory
# Fetch Germany data (good test country)
python fetch_multi_country_data.py --country DE

# Optional: Fetch more countries
python fetch_multi_country_data.py --priority 1
```

Wait for completion. You'll see progress messages.

---

## 5️⃣ Run Application (1 minute)

```bash
# Go back to project root
cd ..

# Start server
npm run dev
```

Open: http://localhost:3000

You should see the motorcycle shops directory with data!

---

## 6️⃣ Enable Auto-Updates (Optional)

```bash
cd scripts

# Run AI agent in background
nohup python ai_data_agent.py --mode continuous --interval 24 &
```

---

## Troubleshooting

### No data showing?
```bash
cd scripts
python verify_setup.py
```

### Database connection error?
- Check your `.env` and `.env.local` files
- Verify Supabase credentials are correct
- Make sure table was created

### Need help?
See `SETUP_GUIDE.md` for detailed instructions

---

## Key Files

- `SETUP_GUIDE.md` - Detailed step-by-step guide
- `supabase/schema.sql` - Database schema
- `scripts/verify_setup.py` - Check your setup
- `.env.local` - Frontend credentials (create this)
- `.env` - Backend credentials (create this)

---

**Total Time: ~15 minutes** (including data fetch)

Once running, explore:
- Click countries to filter
- Search for shops
- Toggle grid/list view
- View shops on Google Maps
