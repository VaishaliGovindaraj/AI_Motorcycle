# European Motorcycle Shops Directory

A comprehensive web application for finding motorcycle shops and repair services across Europe, featuring an intelligent data fetching system and modern UI.

## Features

### Frontend (Next.js + TypeScript)
- **Country & City Navigation**: Browse shops by country and city with an intuitive sidebar
- **Advanced Search**: Search by shop name, city, or street
- **Grid/List Views**: Toggle between grid and list display modes
- **Real-time Statistics**: See total shops, countries covered, and filtered results
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Modern UI**: Beautiful gradient design with smooth animations
- **Interactive Filtering**: Click to filter by country, then by city
- **Map Integration**: Direct links to Google Maps for each shop
- **Contact Information**: Phone, email, and website links for each shop

### Backend & Data
- **Supabase Database**: Scalable cloud database for shop data
- **Multi-Country Support**: Coverage across 27+ European countries
- **AI Data Agent**: Autonomous system for periodic data updates
- **Smart Scheduling**: Updates based on data freshness and country priority
- **OpenStreetMap Integration**: Real-time data from OSM Overpass API

## Getting Started

### Prerequisites
- Node.js 20+ and npm
- Python 3.8+ (for data fetching scripts)
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd AI_Motorcycle
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   cd scripts
   pip install -r requirements.txt
   ```

4. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Create a `.env` file for Python scripts:
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_service_key
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Data Fetching

### Option 1: Manual Fetch (Enhanced Script)

Fetch data for specific countries or priorities:

```bash
# Fetch high priority countries (DE, FR, IT, ES, NL, AT)
python scripts/fetch_multi_country_data.py --priority 1

# Fetch all countries
python scripts/fetch_multi_country_data.py

# Fetch a specific country
python scripts/fetch_multi_country_data.py --country DE
```

### Option 2: AI Agent (Automated)

The AI agent provides intelligent, autonomous data fetching:

```bash
# Run once
python scripts/ai_data_agent.py --mode once

# Run continuously (updates every 24 hours)
python scripts/ai_data_agent.py --mode continuous --interval 24

# Check status
python scripts/ai_data_agent.py --status
```

**AI Agent Features:**
- Analyzes data freshness and only updates stale data
- Prioritizes high-traffic countries
- Automatic retry logic for failed requests
- Comprehensive logging and monitoring
- Respectful API rate limiting
- Background operation support

## Project Structure

```
AI_Motorcycle/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main page
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   └── components/
│       └── MotorcycleShops/
│           ├── index.tsx         # Main component
│           └── MotorcycleShops.module.css  # Component styles
├── scripts/
│   ├── fetchOSM_Data.py          # Original fetch script
│   ├── fetch_multi_country_data.py  # Enhanced fetch script
│   ├── ai_data_agent.py          # AI autonomous agent
│   ├── requirements.txt          # Python dependencies
│   └── README.md                 # Scripts documentation
├── supabase/
│   └── supabaseClient.js         # Supabase configuration
└── public/                       # Static assets
```

## Technologies Used

### Frontend
- **Next.js 16**: React framework with App Router
- **TypeScript**: Type-safe development
- **React 19**: Latest React features
- **CSS Modules**: Scoped component styling
- **Supabase Client**: Real-time database integration

### Backend & Data
- **Supabase**: PostgreSQL database with real-time capabilities
- **Python**: Data fetching and automation
- **Overpass API**: OpenStreetMap data source
- **Schedule**: Task scheduling library

## Countries Covered

### Currently Supported (27 countries):

**Western Europe**: Germany, France, Netherlands, Belgium, Luxembourg, Austria

**Southern Europe**: Italy, Spain, Portugal, Greece, Malta, Cyprus

**Northern Europe**: Sweden, Finland, Denmark, Ireland

**Eastern Europe**: Poland, Czech Republic, Slovakia, Hungary, Slovenia, Croatia, Romania, Bulgaria, Estonia, Latvia, Lithuania

## Database Schema

The `motorcycle_shops` table includes:

```typescript
{
  id: number;
  country_code: string;
  country_name: string;
  name: string;
  lat: number;
  lon: number;
  address: {
    city: string;
    street: string;
    housenumber: string;
    postcode: string;
    suburb: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
    fax: string;
  };
  shop_tags: object;
  last_updated: timestamp;
}
```

## UI Features in Detail

### Country/City Navigation
- **Sidebar Navigation**: All countries listed with shop counts
- **City Filtering**: Click a country to see its cities
- **Breadcrumb Navigation**: Easy navigation back to all countries
- **Active State**: Selected filters are highlighted

### Search & Filter
- **Real-time Search**: Instant filtering as you type
- **Multiple Fields**: Searches across name, city, and street
- **Reset Filters**: One-click to clear all filters
- **Empty States**: Helpful messages when no results found

### Shop Cards
- **Rich Information**: Name, address, contact details
- **Direct Actions**: Click to call, email, or visit website
- **Map Integration**: View location on Google Maps
- **Responsive Layout**: Adapts to screen size

## Development

### Running Locally
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Running the AI Agent in Production

**Using systemd (Linux):**

Create `/etc/systemd/system/motorcycle-agent.service`:
```ini
[Unit]
Description=Motorcycle Shop Data Agent
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/AI_Motorcycle/scripts
Environment="PATH=/usr/bin:/usr/local/bin"
ExecStart=/usr/bin/python3 ai_data_agent.py --mode continuous --interval 24
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable motorcycle-agent
sudo systemctl start motorcycle-agent
sudo systemctl status motorcycle-agent
```

## API Rate Limiting

The scripts respect OpenStreetMap's Overpass API usage guidelines:
- 15-second delay between country requests
- 90-second timeout per request
- Batch processing to avoid overwhelming the API
- Automatic retry with exponential backoff

## Contributing

Contributions are welcome! Please ensure:
- Code follows the existing style
- Scripts respect API rate limits
- UI changes are responsive
- TypeScript types are properly defined

## License

This project is open source and available under the MIT License.

## Acknowledgments

- **OpenStreetMap**: For providing comprehensive map data
- **Overpass API**: For the powerful query interface
- **Supabase**: For the excellent database platform
- **Next.js**: For the amazing React framework

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
