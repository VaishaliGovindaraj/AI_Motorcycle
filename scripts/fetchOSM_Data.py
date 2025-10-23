import os
import json
import time
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv() 

# ---------- Supabase setup ----------
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# 👇 Add this here temporarily
print("SUPABASE_URL:", SUPABASE_URL)
print("SUPABASE_KEY prefix:", SUPABASE_KEY[:10])

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------- EU country codes ----------
EU_COUNTRIES = [
    "DE", "FR", "IT", "ES", "PL", "NL", "SE", "FI", "BE", "AT", "CZ", "SK",
    "HU", "PT", "IE", "DK", "EE", "LT", "LV", "SI", "HR", "RO", "BG",
    "CY", "LU", "MT", "EL"
]

# ---------- Helper function to fetch data ----------
def fetch_overpass_data(country_code):
    url = "https://overpass-api.de/api/interpreter"
    query = f"""
    [out:json][timeout:60];
    area["ISO3166-1"="{country_code}"][admin_level=2];
    (
      node["shop"="motorcycle"](area);
      node["craft"="motorcycle"](area);
      node["amenity"="car_repair"]["motorcycle"="yes"](area);
    );
    out center;
    """
    print(f"Fetching {country_code}...")
    response = requests.get(url, params={'data': query})
    response.raise_for_status()
    return response.json()

# ---------- Helper to format data ----------
def format_records(data, country_code):
    records = []
    for element in data.get("elements", []):
        tags = element.get("tags", {})
        if not tags:
            continue

        record = {
            "id": element["id"],
            "country_code": tags.get("addr:country", country_code),
            "name": tags.get("name"),
            "lat": element.get("lat"),
            "lon": element.get("lon"),
            "address": {
                "city": tags.get("addr:city"),
                "street": tags.get("addr:street"),
                "housenumber": tags.get("addr:housenumber"),
                "postcode": tags.get("addr:postcode"),
                "suburb": tags.get("addr:suburb")
            },
            "contact": {
                "phone": tags.get("contact:phone") or tags.get("phone"),
                "fax": tags.get("contact:fax"),
                "website": tags.get("contact:website") or tags.get("website"),
                "email": tags.get("contact:email") or tags.get("email")
            },
            "shop_tags": tags,
            "source_country": country_code
        }
        records.append(record)
    return records

# ---------- Main loop ----------
for code in EU_COUNTRIES:
    try:
        data = fetch_overpass_data(code)
        records = format_records(data, code)

        if not records:
            print(f"No data for {code}")
            continue

        # Batch insert (100 rows at a time)
        for i in range(0, len(records), 100):
            chunk = records[i:i+100]
            supabase.table("motorcycle_shops").upsert(chunk).execute()

        print(f"Inserted {len(records)} records for {code}")
        
        # Be kind to Overpass API
        time.sleep(10)

    except Exception as e:
        print(f"❌ Error for {code}: {e}")
        time.sleep(20)
