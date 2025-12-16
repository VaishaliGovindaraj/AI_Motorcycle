# Step-by-Step Setup Guide

## Complete Setup Instructions for Motorcycle Shops Directory

Follow these steps in order to get the project fully operational.

---

## STEP 1: Set Up Supabase Database

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click **"New Project"**
4. Fill in the details:
   - **Name**: Motorcycle Shops EU
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free tier is fine for development
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to initialize

### 1.2 Create Database Table

1. In your Supabase dashboard, go to **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Copy and paste this SQL:

```sql
-- Create the motorcycle_shops table
CREATE TABLE IF NOT EXISTS motorcycle_shops (
  id BIGINT PRIMARY KEY,
  country_code TEXT,
  country_name TEXT,
  name TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  address JSONB,
  contact JSONB,
  shop_info JSONB,
  shop_tags JSONB,
  source_country TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_motorcycle_shops_country
  ON motorcycle_shops(country_code);

CREATE INDEX IF NOT EXISTS idx_motorcycle_shops_city
  ON motorcycle_shops((address->>'city'));

CREATE INDEX IF NOT EXISTS idx_motorcycle_shops_updated
  ON motorcycle_shops(last_updated);

-- Enable Row Level Security (RLS)
ALTER TABLE motorcycle_shops ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access"
  ON motorcycle_shops
  FOR SELECT
  TO anon
  USING (true);

-- Create policy to allow authenticated writes
CREATE POLICY "Allow authenticated writes"
  ON motorcycle_shops
  FOR ALL
  TO authenticated
  USING (true);
```

4. Click **"Run"** (or press Ctrl+Enter)
5. You should see: "Success. No rows returned"

### 1.3 Get API Credentials

1. Go to **"Settings"** (left sidebar) → **"API"**
2. You'll need these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...` - click "Reveal" to see it)

**IMPORTANT**: Keep these credentials safe!

---

## STEP 2: Set Up Local Environment

### 2.1 Create Environment Files

Navigate to your project directory and create two environment files:

#### For Next.js Frontend (`.env.local`):

```bash
# Create the file
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
EOF
```

Replace with your actual values:
- `your_project_url_here` → Your Project URL from Supabase
- `your_anon_key_here` → Your anon public key from Supabase

#### For Python Scripts (`.env`):

```bash
# Create the file
cat > .env << 'EOF'
SUPABASE_URL=your_project_url_here
SUPABASE_KEY=your_service_role_key_here
EOF
```

Replace with your actual values:
- `your_project_url_here` → Your Project URL from Supabase
- `your_service_role_key_here` → Your service_role key from Supabase

### 2.2 Verify Environment Files

```bash
# Check if files exist
ls -la .env*

# You should see:
# .env
# .env.local
```

---

## STEP 3: Install Dependencies

### 3.1 Install Node.js Dependencies

```bash
# Make sure you're in the project root
pwd  # Should show: /home/user/AI_Motorcycle

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

### 3.2 Install Python Dependencies

```bash
# Install Python packages
cd scripts
pip install -r requirements.txt

# Verify installation
pip list | grep -E "(requests|supabase|python-dotenv|schedule)"

# Go back to project root
cd ..
```

---

## STEP 4: Fetch Initial Data

Now we'll populate the database with motorcycle shop data.

### 4.1 Test with One Country First

```bash
cd scripts

# Test with Germany (usually has good data)
python fetch_multi_country_data.py --country DE
```

**Expected Output:**
```
2024-XX-XX XX:XX:XX - INFO - Fetching data for Germany (DE)...
2024-XX-XX XX:XX:XX - INFO - Successfully fetched XX elements for Germany
2024-XX-XX XX:XX:XX - INFO - Inserted batch 1: XX records for DE
2024-XX-XX XX:XX:XX - INFO - Total inserted for DE: XX records
```

**If you see errors:**
- Check your `.env` file has correct Supabase credentials
- Make sure the table was created successfully
- Check internet connection

### 4.2 Fetch High Priority Countries

Once the test works, fetch more countries:

```bash
# Fetch high priority countries (DE, FR, IT, ES, NL, AT)
python fetch_multi_country_data.py --priority 1
```

This will take about 10-15 minutes. You'll see progress for each country.

### 4.3 Verify Data in Supabase

1. Go to your Supabase dashboard
2. Click **"Table Editor"** (left sidebar)
3. Select **"motorcycle_shops"** table
4. You should see rows of data with shops from various countries

---

## STEP 5: Run the Application

### 5.1 Start Development Server

```bash
# Make sure you're in project root
cd /home/user/AI_Motorcycle

# Start the server
npm run dev
```

**Expected Output:**
```
> motorcycledatabase@0.1.0 dev
> next dev

  ▲ Next.js 16.0.0
  - Local:        http://localhost:3000

 ✓ Starting...
 ✓ Ready in XXXms
```

### 5.2 Test the Application

1. Open browser to: http://localhost:3000
2. You should see:
   - **Header**: "European Motorcycle Shops Directory"
   - **Statistics**: Shows number of shops and countries
   - **Sidebar**: Lists countries with shop counts
   - **Main area**: Shows shop cards in grid view

### 5.3 Test Features

Try these interactions:
- ✅ Click on a country → Cities should appear
- ✅ Click on a city → Filter to that city
- ✅ Type in search bar → Results filter in real-time
- ✅ Toggle Grid/List view → Layout changes
- ✅ Click "View on Map" → Opens Google Maps
- ✅ Click website links → Opens shop website

---

## STEP 6: Set Up AI Data Agent (Optional but Recommended)

The AI agent automatically updates data periodically.

### 6.1 Test AI Agent

```bash
cd scripts

# Run a single batch update
python ai_data_agent.py --mode once
```

**Expected Output:**
```
2024-XX-XX XX:XX:XX - [AI_DataAgent] - INFO - AI Data Agent initialized
2024-XX-XX XX:XX:XX - [AI_DataAgent] - INFO - Creating intelligent update schedule...
2024-XX-XX XX:XX:XX - [AI_DataAgent] - INFO - Analyzing data freshness...
...
EXECUTION SUMMARY
...
```

### 6.2 Run Continuously (Background Mode)

For continuous updates, choose ONE of these methods:

#### Option A: Using nohup (Simple)

```bash
cd scripts

# Run in background
nohup python ai_data_agent.py --mode continuous --interval 24 > agent.log 2>&1 &

# Check it's running
ps aux | grep ai_data_agent

# View logs
tail -f agent.log

# To stop later
pkill -f ai_data_agent
```

#### Option B: Using screen (Recommended for testing)

```bash
# Start a screen session
screen -S motorcycle_agent

# Inside screen, run the agent
cd /home/user/AI_Motorcycle/scripts
python ai_data_agent.py --mode continuous --interval 24

# Detach from screen: Press Ctrl+A, then D

# To reattach later
screen -r motorcycle_agent

# To kill the session
screen -X -S motorcycle_agent quit
```

#### Option C: Using systemd (Production)

```bash
# Create service file
sudo nano /etc/systemd/system/motorcycle-agent.service

# Paste this content (adjust paths):
[Unit]
Description=Motorcycle Shop Data Agent
After=network.target

[Service]
Type=simple
User=user
WorkingDirectory=/home/user/AI_Motorcycle/scripts
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/python3 /home/user/AI_Motorcycle/scripts/ai_data_agent.py --mode continuous --interval 24
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Save and exit (Ctrl+X, Y, Enter)

# Enable and start
sudo systemctl enable motorcycle-agent
sudo systemctl start motorcycle-agent

# Check status
sudo systemctl status motorcycle-agent

# View logs
sudo journalctl -u motorcycle-agent -f
```

---

## STEP 7: Fetch More Countries (Optional)

If you want data for all European countries:

```bash
cd scripts

# Fetch all countries (takes 45-60 minutes)
python fetch_multi_country_data.py

# Or fetch by priority
python fetch_multi_country_data.py --priority 2  # Medium priority
```

---

## Troubleshooting

### Issue: "Error fetching data"

**Solution:**
```bash
# Check environment variables
cat .env.local
cat .env

# Test Supabase connection
curl "YOUR_SUPABASE_URL/rest/v1/motorcycle_shops?limit=1" \
  -H "apikey: YOUR_ANON_KEY"
```

### Issue: "No shops found" in UI

**Solution:**
```bash
# Verify data in database
# 1. Go to Supabase dashboard
# 2. Table Editor → motorcycle_shops
# 3. Check if rows exist

# If no data, fetch again
cd scripts
python fetch_multi_country_data.py --country DE
```

### Issue: Python script fails with "ModuleNotFoundError"

**Solution:**
```bash
# Reinstall dependencies
pip install --upgrade -r scripts/requirements.txt
```

### Issue: AI agent not updating data

**Solution:**
```bash
# Check logs
tail -f scripts/ai_agent_*.log

# Manually trigger update
python scripts/ai_data_agent.py --mode once
```

### Issue: Rate limiting from Overpass API

**Solution:**
- Wait 5-10 minutes before retrying
- The script automatically handles this with delays
- Don't run multiple instances simultaneously

---

## Quick Reference Commands

```bash
# Start development server
npm run dev

# Fetch single country
cd scripts && python fetch_multi_country_data.py --country DE

# Fetch high priority countries
cd scripts && python fetch_multi_country_data.py --priority 1

# Run AI agent once
cd scripts && python ai_data_agent.py --mode once

# Run AI agent continuously
cd scripts && nohup python ai_data_agent.py --mode continuous --interval 24 &

# Check AI agent status
python scripts/ai_data_agent.py --status

# View logs
tail -f scripts/*.log
```

---

## Project URLs

After setup, you can access:

- **Frontend**: http://localhost:3000
- **Supabase Dashboard**: https://supabase.com/dashboard
- **API Docs**: Your Supabase URL + `/rest/v1/`

---

## Next Steps After Setup

1. ✅ Verify data is showing in the UI
2. ✅ Test all filtering features
3. ✅ Set up AI agent for continuous updates
4. ✅ (Optional) Deploy to Vercel/Netlify for production
5. ✅ (Optional) Add more countries as needed

---

## Need Help?

If you encounter issues:
1. Check the logs in `scripts/*.log`
2. Verify environment variables are set correctly
3. Check Supabase dashboard for errors
4. Ensure internet connection is stable
5. Make sure API rate limits aren't exceeded

---

**Estimated Setup Time:**
- Steps 1-3: 10-15 minutes
- Step 4: 5-20 minutes (depending on how many countries)
- Step 5: 2-5 minutes
- Step 6: 5-10 minutes

**Total: 22-50 minutes** (most time is waiting for data fetching)
