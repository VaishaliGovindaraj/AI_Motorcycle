"""
Database Analysis Script
Connects to Supabase and analyzes the current data
"""

import os
from supabase import create_client, Client

# You need to set these environment variables or update them here
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("=" * 70)
    print("⚠️  ENVIRONMENT VARIABLES NOT SET")
    print("=" * 70)
    print("\nPlease set your Supabase credentials:")
    print("\nOption 1: Set environment variables")
    print("  export SUPABASE_URL='your_url'")
    print("  export SUPABASE_KEY='your_key'")
    print("\nOption 2: Edit this script and add credentials directly:")
    print("  SUPABASE_URL = 'your_url_here'")
    print("  SUPABASE_KEY = 'your_key_here'")
    print("=" * 70)
    exit(1)

try:
    # Connect to Supabase
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

    print("\n" + "=" * 70)
    print("DATABASE ANALYSIS REPORT")
    print("=" * 70)

    # Get total count
    result = supabase.table("motorcycle_shops").select("*", count='exact').execute()
    total_shops = result.count if hasattr(result, 'count') else len(result.data)

    print(f"\n📊 TOTAL SHOPS: {total_shops}")

    # Get country breakdown
    print("\n" + "-" * 70)
    print("SHOPS BY COUNTRY")
    print("-" * 70)

    # Get all data to analyze
    all_data = supabase.table("motorcycle_shops").select("*").execute()

    # Count by country
    country_counts = {}
    city_counts = {}
    sample_shops = []

    for shop in all_data.data:
        country = shop.get('country_code', 'Unknown')
        country_counts[country] = country_counts.get(country, 0) + 1

        # City breakdown
        city = shop.get('address', {}).get('city', 'Unknown') if isinstance(shop.get('address'), dict) else 'Unknown'
        city_key = f"{country}_{city}"
        city_counts[city_key] = city_counts.get(city_key, 0) + 1

        # Sample shops
        if len(sample_shops) < 5:
            sample_shops.append(shop)

    # Display country stats
    for country, count in sorted(country_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {country}: {count:4d} shops")

    # City breakdown
    print("\n" + "-" * 70)
    print("TOP CITIES (with most shops)")
    print("-" * 70)

    sorted_cities = sorted(city_counts.items(), key=lambda x: x[1], reverse=True)[:20]
    for city_key, count in sorted_cities:
        country, city = city_key.split('_', 1)
        print(f"  {city}, {country}: {count:4d} shops")

    # Sample data
    print("\n" + "-" * 70)
    print("SAMPLE SHOPS (First 5)")
    print("-" * 70)

    for i, shop in enumerate(sample_shops, 1):
        print(f"\n{i}. {shop.get('name', 'Unnamed')}")
        print(f"   Country: {shop.get('country_code', 'N/A')}")
        address = shop.get('address', {})
        if isinstance(address, dict):
            city = address.get('city', 'N/A')
            street = address.get('street', '')
            print(f"   City: {city}")
            if street:
                print(f"   Street: {street}")
        contact = shop.get('contact', {})
        if isinstance(contact, dict):
            phone = contact.get('phone')
            website = contact.get('website')
            if phone:
                print(f"   Phone: {phone}")
            if website:
                print(f"   Website: {website}")

    # Data quality check
    print("\n" + "-" * 70)
    print("DATA QUALITY ANALYSIS")
    print("-" * 70)

    shops_with_name = sum(1 for s in all_data.data if s.get('name'))
    shops_with_city = sum(1 for s in all_data.data if isinstance(s.get('address'), dict) and s.get('address').get('city'))
    shops_with_phone = sum(1 for s in all_data.data if isinstance(s.get('contact'), dict) and s.get('contact').get('phone'))
    shops_with_website = sum(1 for s in all_data.data if isinstance(s.get('contact'), dict) and s.get('contact').get('website'))
    shops_with_coords = sum(1 for s in all_data.data if s.get('lat') and s.get('lon'))

    print(f"  Shops with name:      {shops_with_name:4d} ({shops_with_name/total_shops*100:.1f}%)")
    print(f"  Shops with city:      {shops_with_city:4d} ({shops_with_city/total_shops*100:.1f}%)")
    print(f"  Shops with phone:     {shops_with_phone:4d} ({shops_with_phone/total_shops*100:.1f}%)")
    print(f"  Shops with website:   {shops_with_website:4d} ({shops_with_website/total_shops*100:.1f}%)")
    print(f"  Shops with GPS coords:{shops_with_coords:4d} ({shops_with_coords/total_shops*100:.1f}%)")

    print("\n" + "=" * 70)
    print("✅ DATABASE CONNECTION SUCCESSFUL")
    print("=" * 70 + "\n")

except Exception as e:
    print("\n" + "=" * 70)
    print("❌ ERROR CONNECTING TO DATABASE")
    print("=" * 70)
    print(f"\nError: {e}")
    print("\nPlease check:")
    print("  1. Your SUPABASE_URL is correct")
    print("  2. Your SUPABASE_KEY is correct")
    print("  3. The motorcycle_shops table exists")
    print("  4. Your internet connection is working")
    print("=" * 70 + "\n")
