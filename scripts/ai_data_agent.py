"""
AI Data Fetching Agent for Motorcycle Shops
Automatically fetches and updates motorcycle shop data on a periodic basis
"""

import os
import sys
import time
import json
import logging
import schedule
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(name)s] - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(f'ai_agent_{datetime.now().strftime("%Y%m%d")}.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('AI_DataAgent')

load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class TaskStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SCHEDULED = "scheduled"


class TaskPriority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4


@dataclass
class FetchTask:
    """Represents a data fetching task"""
    task_id: str
    country_code: str
    country_name: str
    status: TaskStatus
    priority: TaskPriority
    scheduled_time: datetime
    last_attempt: Optional[datetime] = None
    attempts: int = 0
    max_attempts: int = 3
    records_fetched: int = 0
    error_message: Optional[str] = None

    def to_dict(self):
        return {
            **asdict(self),
            'status': self.status.value,
            'priority': self.priority.value,
            'scheduled_time': self.scheduled_time.isoformat(),
            'last_attempt': self.last_attempt.isoformat() if self.last_attempt else None
        }


class AIDataAgent:
    """
    Intelligent Data Fetching Agent
    - Schedules periodic data updates
    - Prioritizes countries based on data freshness
    - Handles retries and error recovery
    - Monitors data quality
    - Optimizes API usage
    """

    def __init__(self, config: Optional[Dict] = None):
        self.config = config or self._default_config()
        self.tasks: List[FetchTask] = []
        self.running = False
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'AI-MotorcycleShopAgent/2.0'})

        logger.info("AI Data Agent initialized")
        logger.info(f"Configuration: {json.dumps(self.config, indent=2)}")

    def _default_config(self) -> Dict:
        """Default configuration for the agent"""
        return {
            "update_frequency_days": 7,  # Update each country every 7 days
            "batch_size": 5,  # Process 5 countries per batch
            "api_delay_seconds": 15,  # Delay between API calls
            "max_retries": 3,
            "priority_weights": {
                "high_traffic_countries": ["DE", "FR", "IT", "ES", "NL", "AT"],
                "medium_traffic_countries": ["PL", "SE", "FI", "BE", "CZ", "PT", "IE", "DK", "GR"],
                "low_traffic_countries": ["SK", "HU", "EE", "LT", "LV", "SI", "HR", "RO", "BG", "CY", "LU", "MT"]
            }
        }

    def analyze_data_freshness(self) -> Dict[str, datetime]:
        """Analyze when each country was last updated"""
        logger.info("Analyzing data freshness...")

        try:
            # Query last update time for each country
            result = supabase.table("motorcycle_shops")\
                .select("country_code, last_updated")\
                .execute()

            freshness = {}
            for row in result.data:
                country = row['country_code']
                last_updated = row.get('last_updated')

                if last_updated:
                    try:
                        update_time = datetime.fromisoformat(last_updated.replace('Z', '+00:00'))
                        if country not in freshness or update_time > freshness[country]:
                            freshness[country] = update_time
                    except:
                        pass

            logger.info(f"Found update information for {len(freshness)} countries")
            return freshness

        except Exception as e:
            logger.error(f"Error analyzing data freshness: {e}")
            return {}

    def determine_priority(self, country_code: str) -> TaskPriority:
        """Determine task priority based on country traffic"""
        if country_code in self.config["priority_weights"]["high_traffic_countries"]:
            return TaskPriority.HIGH
        elif country_code in self.config["priority_weights"]["medium_traffic_countries"]:
            return TaskPriority.MEDIUM
        else:
            return TaskPriority.LOW

    def create_update_schedule(self) -> List[FetchTask]:
        """Create an intelligent update schedule based on data freshness"""
        logger.info("Creating intelligent update schedule...")

        countries = [
            {"code": "DE", "name": "Germany"},
            {"code": "FR", "name": "France"},
            {"code": "IT", "name": "Italy"},
            {"code": "ES", "name": "Spain"},
            {"code": "NL", "name": "Netherlands"},
            {"code": "PL", "name": "Poland"},
            {"code": "SE", "name": "Sweden"},
            {"code": "FI", "name": "Finland"},
            {"code": "BE", "name": "Belgium"},
            {"code": "AT", "name": "Austria"},
            {"code": "CZ", "name": "Czech Republic"},
            {"code": "SK", "name": "Slovakia"},
            {"code": "HU", "name": "Hungary"},
            {"code": "PT", "name": "Portugal"},
            {"code": "IE", "name": "Ireland"},
            {"code": "DK", "name": "Denmark"},
            {"code": "GR", "name": "Greece"},
        ]

        freshness = self.analyze_data_freshness()
        tasks = []
        now = datetime.now()
        update_threshold = timedelta(days=self.config["update_frequency_days"])

        for country in countries:
            code = country["code"]
            name = country["name"]

            # Check if update is needed
            last_update = freshness.get(code)
            needs_update = True

            if last_update:
                age = now - last_update
                needs_update = age > update_threshold

            if needs_update:
                task = FetchTask(
                    task_id=f"{code}_{int(time.time())}",
                    country_code=code,
                    country_name=name,
                    status=TaskStatus.SCHEDULED,
                    priority=self.determine_priority(code),
                    scheduled_time=now
                )
                tasks.append(task)
                logger.info(f"Scheduled update for {name} (last updated: {last_update or 'never'})")
            else:
                logger.info(f"Skipping {name} - recently updated ({last_update})")

        # Sort by priority
        tasks.sort(key=lambda x: x.priority.value, reverse=True)

        logger.info(f"Created schedule with {len(tasks)} tasks")
        return tasks

    def fetch_country_data(self, task: FetchTask) -> bool:
        """Fetch data for a specific country"""
        logger.info(f"Fetching data for {task.country_name} (Attempt {task.attempts + 1}/{task.max_attempts})")

        task.status = TaskStatus.RUNNING
        task.last_attempt = datetime.now()
        task.attempts += 1

        try:
            # Overpass API query
            url = "https://overpass-api.de/api/interpreter"
            query = f"""
            [out:json][timeout:90];
            area["ISO3166-1"="{task.country_code}"][admin_level=2];
            (
              node["shop"="motorcycle"](area);
              way["shop"="motorcycle"](area);
              node["craft"="motorcycle"](area);
              way["craft"="motorcycle"](area);
              node["amenity"="motorcycle_repair"](area);
              way["amenity"="motorcycle_repair"](area);
            );
            out center;
            """

            response = self.session.get(url, params={'data': query}, timeout=120)
            response.raise_for_status()
            data = response.json()

            # Process and format data
            records = self._format_records(data, task.country_code, task.country_name)

            if records:
                # Save to database
                self._save_records(records, task.country_code)
                task.records_fetched = len(records)
                task.status = TaskStatus.COMPLETED
                logger.info(f"Successfully fetched {len(records)} records for {task.country_name}")
                return True
            else:
                logger.warning(f"No records found for {task.country_name}")
                task.status = TaskStatus.COMPLETED
                return True

        except Exception as e:
            logger.error(f"Error fetching data for {task.country_name}: {e}")
            task.error_message = str(e)

            if task.attempts >= task.max_attempts:
                task.status = TaskStatus.FAILED
                logger.error(f"Max attempts reached for {task.country_name}")
            else:
                task.status = TaskStatus.SCHEDULED

            return False

    def _format_records(self, data: Dict, country_code: str, country_name: str) -> List[Dict]:
        """Format OSM data into database records"""
        records = []

        for element in data.get("elements", []):
            tags = element.get("tags", {})
            if not tags:
                continue

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
                },
                "contact": {
                    "phone": tags.get("contact:phone") or tags.get("phone"),
                    "fax": tags.get("contact:fax"),
                    "website": tags.get("contact:website") or tags.get("website"),
                    "email": tags.get("contact:email") or tags.get("email"),
                },
                "shop_tags": tags,
                "source_country": country_code,
                "last_updated": datetime.utcnow().isoformat()
            }

            records.append(record)

        return records

    def _save_records(self, records: List[Dict], country_code: str):
        """Save records to Supabase"""
        batch_size = 100

        for i in range(0, len(records), batch_size):
            chunk = records[i:i+batch_size]
            supabase.table("motorcycle_shops").upsert(chunk).execute()
            time.sleep(0.5)

        logger.info(f"Saved {len(records)} records for {country_code}")

    def run_batch(self):
        """Run a batch of scheduled tasks"""
        logger.info("Starting batch execution...")

        if not self.tasks:
            self.tasks = self.create_update_schedule()

        if not self.tasks:
            logger.info("No tasks to execute")
            return

        # Get next batch
        batch = [t for t in self.tasks if t.status in [TaskStatus.SCHEDULED, TaskStatus.PENDING]]
        batch = batch[:self.config["batch_size"]]

        logger.info(f"Executing batch of {len(batch)} tasks")

        for task in batch:
            success = self.fetch_country_data(task)

            # Delay between requests
            if task != batch[-1]:
                delay = self.config["api_delay_seconds"]
                logger.info(f"Waiting {delay} seconds...")
                time.sleep(delay)

        # Log statistics
        completed = sum(1 for t in self.tasks if t.status == TaskStatus.COMPLETED)
        failed = sum(1 for t in self.tasks if t.status == TaskStatus.FAILED)
        pending = sum(1 for t in self.tasks if t.status in [TaskStatus.SCHEDULED, TaskStatus.PENDING])

        logger.info(f"Batch complete - Completed: {completed}, Failed: {failed}, Pending: {pending}")

    def run_continuous(self, interval_hours: int = 24):
        """Run the agent continuously with scheduled intervals"""
        logger.info(f"Starting continuous mode with {interval_hours}h interval")

        self.running = True

        # Schedule the batch job
        schedule.every(interval_hours).hours.do(self.run_batch)

        # Run first batch immediately
        self.run_batch()

        # Main loop
        while self.running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

    def stop(self):
        """Stop the agent"""
        logger.info("Stopping AI Data Agent...")
        self.running = False

    def get_status_report(self) -> Dict:
        """Get current status report"""
        return {
            "total_tasks": len(self.tasks),
            "completed": sum(1 for t in self.tasks if t.status == TaskStatus.COMPLETED),
            "failed": sum(1 for t in self.tasks if t.status == TaskStatus.FAILED),
            "pending": sum(1 for t in self.tasks if t.status in [TaskStatus.SCHEDULED, TaskStatus.PENDING]),
            "running": sum(1 for t in self.tasks if t.status == TaskStatus.RUNNING),
            "total_records_fetched": sum(t.records_fetched for t in self.tasks),
            "tasks": [t.to_dict() for t in self.tasks]
        }


def main():
    """Main execution"""
    import argparse

    parser = argparse.ArgumentParser(description='AI Data Fetching Agent')
    parser.add_argument('--mode', choices=['once', 'continuous'], default='once',
                       help='Run mode: once or continuous')
    parser.add_argument('--interval', type=int, default=24,
                       help='Interval in hours for continuous mode (default: 24)')
    parser.add_argument('--status', action='store_true',
                       help='Show status report')

    args = parser.parse_args()

    agent = AIDataAgent()

    try:
        if args.status:
            report = agent.get_status_report()
            print(json.dumps(report, indent=2))
        elif args.mode == 'once':
            logger.info("Running in single-batch mode")
            agent.run_batch()
            report = agent.get_status_report()
            print("\n" + "="*80)
            print("EXECUTION SUMMARY")
            print("="*80)
            print(json.dumps(report, indent=2))
        elif args.mode == 'continuous':
            logger.info(f"Running in continuous mode (interval: {args.interval}h)")
            agent.run_continuous(interval_hours=args.interval)

    except KeyboardInterrupt:
        logger.info("Received interrupt signal")
        agent.stop()
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
