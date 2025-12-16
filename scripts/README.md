# Motorcycle Shop Data Fetching Scripts

This directory contains scripts for fetching and managing motorcycle shop data from OpenStreetMap.

## Scripts Overview

### 1. `fetchOSM_Data.py` (Original)
Basic script that fetches motorcycle shop data for EU countries.

### 2. `fetch_multi_country_data.py` (Enhanced)
Advanced data fetching with priority-based country selection and better error handling.

**Features:**
- Priority-based country fetching
- Enhanced logging
- Batch processing
- Better error recovery
- Support for single country or filtered fetching

**Usage:**
```bash
# Fetch all countries
python fetch_multi_country_data.py

# Fetch high priority countries only (1)
python fetch_multi_country_data.py --priority 1

# Fetch a specific country
python fetch_multi_country_data.py --country DE
```

### 3. `ai_data_agent.py` (AI Agent)
Intelligent autonomous agent for periodic data fetching and management.

**Features:**
- Automatic scheduling based on data freshness
- Priority-based task management
- Retry logic with exponential backoff
- Continuous monitoring mode
- Smart API rate limiting
- Comprehensive logging and status reporting

**Usage:**
```bash
# Run once (single batch)
python ai_data_agent.py --mode once

# Run continuously (every 24 hours)
python ai_data_agent.py --mode continuous --interval 24

# Get status report
python ai_data_agent.py --status
```

**Running as a Background Service (Linux):**
```bash
# Using nohup
nohup python ai_data_agent.py --mode continuous --interval 24 &

# Using screen
screen -dmS motorcycle_agent python ai_data_agent.py --mode continuous --interval 24

# Using systemd (recommended for production)
# Create a service file in /etc/systemd/system/motorcycle-agent.service
```

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
# Create a .env file in the root directory
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
```

## Data Structure

Each motorcycle shop record includes:
- **Basic Info**: ID, name, country code, country name
- **Location**: Latitude, longitude
- **Address**: City, street, house number, postcode, suburb
- **Contact**: Phone, fax, website, email, social media
- **Shop Info**: Brand, opening hours, description, services
- **Metadata**: Last updated timestamp, source tags

## Countries Covered

### Priority 1 (High Traffic):
Germany, France, Italy, Spain, Netherlands, Austria

### Priority 2 (Medium Traffic):
Poland, Sweden, Finland, Belgium, Czech Republic, Portugal, Ireland, Denmark, Greece

### Priority 3 (Low Traffic):
Slovakia, Hungary, Estonia, Lithuania, Latvia, Slovenia, Croatia, Romania, Bulgaria, Cyprus, Luxembourg, Malta

## AI Agent Features

### Intelligent Scheduling
- Analyzes data freshness for each country
- Only updates countries where data is older than threshold (default: 7 days)
- Prioritizes high-traffic countries

### Task Management
- Creates task queue with priority ordering
- Tracks task status (pending, running, completed, failed)
- Automatic retry logic (max 3 attempts)
- Detailed error logging

### API Rate Limiting
- Configurable delays between requests
- Batch processing to avoid overwhelming the API
- Respectful to Overpass API guidelines

### Monitoring
- Real-time logging to file and console
- Status reports with detailed statistics
- Task completion tracking

## Configuration

The AI agent can be configured by modifying the default config in `ai_data_agent.py`:

```python
{
    "update_frequency_days": 7,  # Update interval
    "batch_size": 5,  # Countries per batch
    "api_delay_seconds": 15,  # Delay between requests
    "max_retries": 3,  # Maximum retry attempts
    "priority_weights": {
        "high_traffic_countries": [...],
        "medium_traffic_countries": [...],
        "low_traffic_countries": [...]
    }
}
```

## Logging

All scripts generate log files with timestamps:
- `fetch_multi_country_data.py`: `data_fetch_YYYYMMDD_HHMMSS.log`
- `ai_data_agent.py`: `ai_agent_YYYYMMDD.log`

## Troubleshooting

### Rate Limiting Errors
If you encounter rate limiting from Overpass API:
- Increase `api_delay_seconds` in the config
- Reduce `batch_size`
- Run during off-peak hours

### Connection Timeouts
- Check your internet connection
- The script will automatically retry failed requests
- Consider increasing the timeout value in the code

### Database Errors
- Verify your Supabase credentials
- Check that the `motorcycle_shops` table exists
- Ensure your Supabase key has write permissions

## Best Practices

1. **For Initial Data Load**: Use `fetch_multi_country_data.py --priority 1` to get high-priority countries first
2. **For Continuous Updates**: Use `ai_data_agent.py --mode continuous` with appropriate interval
3. **For Testing**: Start with a single country using `--country` flag
4. **For Production**: Run the AI agent as a systemd service with proper monitoring

## Support

For issues or questions, please check:
- OpenStreetMap Overpass API documentation
- Supabase documentation
- Project repository issues
