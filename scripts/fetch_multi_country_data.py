"""
Enhanced Multi-Country Motorcycle Shop Data Fetcher
Fetches motorcycle shop data from OpenStreetMap for multiple European countries
"""

import os
import json
import time
import logging
from datetime import datetime
from typing import List, Dict, Any
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'data_fetch_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

load_dotenv()

# ---------- Supabase setup ----------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------- European countries with metadata ----------
EU_COUNTRIES = [
    {"code": "DE", "name": "Germany", "priority": 1},
    {"code": "FR", "name": "France", "priority": 1},
    {"code": "IT", "name": "Italy", "priority": 1},
    {"code": "ES", "name": "Spain", "priority": 1},
    {"code": "NL", "name": "Netherlands", "priority": 1},
    {"code": "PL", "name": "Poland", "priority": 2},
    {"code": "SE", "name": "Sweden", "priority": 2},
    {"code": "FI", "name": "Finland", "priority": 2},
    {"code": "BE", "name": "Belgium", "priority": 2},
    {"code": "AT", "name": "Austria", "priority": 1},
    {"code": "CZ", "name": "Czech Republic", "priority": 2},
    {"code": "SK", "name": "Slovakia", "priority": 3},
    {"code": "HU", "name": "Hungary", "priority": 3},
    {"code": "PT", "name": "Portugal", "priority": 2},
    {"code": "IE", "name": "Ireland", "priority": 2},
    {"code": "DK", "name": "Denmark", "priority": 2},
    {"code": "EE", "name": "Estonia", "priority": 3},
    {"code": "LT", "name": "Lithuania", "priority": 3},
    {"code": "LV", "name": "Latvia", "priority": 3},
    {"code": "SI", "name": "Slovenia", "priority": 3},
    {"code": "HR", "name": "Croatia", "priority": 3},
    {"code": "RO", "name": "Romania", "priority": 3},
    {"code": "BG", "name": "Bulgaria", "priority": 3},
    {"code": "CY", "name": "Cyprus", "priority": 3},
    {"code": "LU", "name": "Luxembourg", "priority": 3},
    {"code": "MT", "name": "Malta", "priority": 3},
    {"code": "GR", "name": "Greece", "priority": 2},
]

class MotorcycleShopFetcher:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'MotorcycleShopDirectory/1.0'
        })
        self.stats = {
            'total_fetched': 0,
            'total_inserted': 0,
            'errors': 0,
            'countries_processed': 0
        }

    def fetch_overpass_data(self, country_code: str, country_name: str) -> Dict[str, Any]:
        """Fetch motorcycle shop data from Overpass API for a specific country"""
        url = "https://overpass-api.de/api/interpreter"

        # Enhanced query to get more types of motorcycle-related shops
        query = f"""
        [out:json][timeout:90];
        area["ISO3166-1"="{country_code}"][admin_level=2];
        (
          node["shop"="motorcycle"](area);
          way["shop"="motorcycle"](area);
          node["craft"="motorcycle"](area);
          way["craft"="motorcycle"](area);
          node["amenity"="motorcycle_repair"](area);
          way["amenity"="motorcycle_repair"](area);
          node["shop"="motorcycle_repair"](area);
          way["shop"="motorcycle_repair"](area);
        );
        out center;
        """

        logger.info(f"Fetching data for {country_name} ({country_code})...")

        try:
            response = self.session.get(url, params={'data': query}, timeout=120)
            response.raise_for_status()
            data = response.json()
            logger.info(f"Successfully fetched {len(data.get('elements', []))} elements for {country_name}")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"Error fetching data for {country_code}: {e}")
            raise

    def format_records(self, data: Dict[str, Any], country_code: str, country_name: str) -> List[Dict[str, Any]]:
        """Format OSM data into database records"""
        records = []

        for element in data.get("elements", []):
            tags = element.get("tags", {})
            if not tags:
                continue

            # Get center coordinates (for ways) or direct coordinates (for nodes)
            lat = element.get("lat") or element.get("center", {}).get("lat")
            lon = element.get("lon") or element.get("center", {}).get("lon")

            record = {
                "id": element["id"],
                "country_code": country_code,
                "country_name": country_name,
                "name": tags.get("name") or tags.get("operator"),
                "lat": lat,
                "lon": lon,
                "address": {
                    "city": tags.get("addr:city"),
                    "street": tags.get("addr:street"),
                    "housenumber": tags.get("addr:housenumber"),
                    "postcode": tags.get("addr:postcode"),
                    "suburb": tags.get("addr:suburb"),
                    "state": tags.get("addr:state"),
                    "country": tags.get("addr:country", country_code)
                },
                "contact": {
                    "phone": tags.get("contact:phone") or tags.get("phone"),
                    "fax": tags.get("contact:fax"),
                    "website": tags.get("contact:website") or tags.get("website"),
                    "email": tags.get("contact:email") or tags.get("email"),
                    "facebook": tags.get("contact:facebook"),
                    "instagram": tags.get("contact:instagram")
                },
                "shop_info": {
                    "brand": tags.get("brand"),
                    "opening_hours": tags.get("opening_hours"),
                    "description": tags.get("description"),
                    "service": tags.get("service"),
                    "shop_type": tags.get("shop") or tags.get("craft") or tags.get("amenity")
                },
                "shop_tags": tags,
                "source_country": country_code,
                "last_updated": datetime.utcnow().isoformat()
            }

            records.append(record)

        return records

    def save_to_supabase(self, records: List[Dict[str, Any]], country_code: str) -> int:
        """Save records to Supabase in batches"""
        if not records:
            logger.warning(f"No records to save for {country_code}")
            return 0

        total_inserted = 0
        batch_size = 100

        try:
            for i in range(0, len(records), batch_size):
                chunk = records[i:i+batch_size]
                result = supabase.table("motorcycle_shops").upsert(chunk).execute()
                total_inserted += len(chunk)
                logger.info(f"Inserted batch {i//batch_size + 1}: {len(chunk)} records for {country_code}")

                # Small delay between batches
                time.sleep(0.5)

            logger.info(f"Total inserted for {country_code}: {total_inserted} records")
            return total_inserted

        except Exception as e:
            logger.error(f"Error saving to Supabase for {country_code}: {e}")
            raise

    def fetch_country(self, country: Dict[str, str]) -> bool:
        """Fetch and save data for a single country"""
        code = country['code']
        name = country['name']

        try:
            # Fetch data
            data = self.fetch_overpass_data(code, name)
            self.stats['total_fetched'] += len(data.get('elements', []))

            # Format records
            records = self.format_records(data, code, name)

            if not records:
                logger.warning(f"No valid records found for {name}")
                return True

            # Save to database
            inserted = self.save_to_supabase(records, code)
            self.stats['total_inserted'] += inserted
            self.stats['countries_processed'] += 1

            logger.info(f"Successfully processed {name}: {inserted} shops")
            return True

        except Exception as e:
            logger.error(f"Failed to process {name}: {e}")
            self.stats['errors'] += 1
            return False

    def fetch_all_countries(self, priority_filter: int = None):
        """Fetch data for all countries or filtered by priority"""
        countries_to_fetch = EU_COUNTRIES

        if priority_filter:
            countries_to_fetch = [c for c in EU_COUNTRIES if c['priority'] <= priority_filter]

        logger.info(f"Starting data fetch for {len(countries_to_fetch)} countries...")
        logger.info("=" * 80)

        for idx, country in enumerate(countries_to_fetch, 1):
            logger.info(f"\n[{idx}/{len(countries_to_fetch)}] Processing {country['name']}...")

            success = self.fetch_country(country)

            # Respectful delay between countries (Overpass API rate limiting)
            if idx < len(countries_to_fetch):
                delay = 15 if success else 30
                logger.info(f"Waiting {delay} seconds before next country...")
                time.sleep(delay)

        # Print final statistics
        logger.info("\n" + "=" * 80)
        logger.info("DATA FETCH COMPLETED")
        logger.info("=" * 80)
        logger.info(f"Countries Processed: {self.stats['countries_processed']}/{len(countries_to_fetch)}")
        logger.info(f"Total Elements Fetched: {self.stats['total_fetched']}")
        logger.info(f"Total Records Inserted: {self.stats['total_inserted']}")
        logger.info(f"Errors: {self.stats['errors']}")
        logger.info("=" * 80)

def main():
    """Main execution function"""
    import argparse

    parser = argparse.ArgumentParser(description='Fetch motorcycle shop data from OpenStreetMap')
    parser.add_argument('--priority', type=int, choices=[1, 2, 3],
                       help='Fetch only countries with priority <= specified value (1=high, 3=low)')
    parser.add_argument('--country', type=str,
                       help='Fetch data for a specific country code (e.g., DE, FR, IT)')

    args = parser.parse_args()

    fetcher = MotorcycleShopFetcher()

    if args.country:
        # Fetch single country
        country = next((c for c in EU_COUNTRIES if c['code'] == args.country.upper()), None)
        if country:
            logger.info(f"Fetching data for single country: {country['name']}")
            fetcher.fetch_country(country)
        else:
            logger.error(f"Country code {args.country} not found")
    else:
        # Fetch all or filtered countries
        fetcher.fetch_all_countries(priority_filter=args.priority)

if __name__ == "__main__":
    main()
