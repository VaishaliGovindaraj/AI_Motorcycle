"""
Setup Verification Script
Run this to check if everything is configured correctly
"""

import os
import sys
from dotenv import load_dotenv

def check_env_file(filename):
    """Check if environment file exists"""
    print(f"\n{'='*60}")
    print(f"Checking {filename}...")
    print('='*60)

    if not os.path.exists(filename):
        print(f"❌ {filename} not found!")
        print(f"   Create this file with your Supabase credentials")
        return False

    print(f"✅ {filename} exists")

    # Load and check variables
    load_dotenv(filename)

    if filename == '.env.local':
        url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

        if not url or not key:
            print(f"❌ Missing variables in {filename}")
            print("   Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY")
            return False

        print(f"   NEXT_PUBLIC_SUPABASE_URL: {url[:30]}...")
        print(f"   NEXT_PUBLIC_SUPABASE_ANON_KEY: {key[:20]}...")

    elif filename == '.env':
        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_KEY')

        if not url or not key:
            print(f"❌ Missing variables in {filename}")
            print("   Required: SUPABASE_URL, SUPABASE_KEY")
            return False

        print(f"   SUPABASE_URL: {url[:30]}...")
        print(f"   SUPABASE_KEY: {key[:20]}...")

    print(f"✅ All required variables present")
    return True

def check_dependencies():
    """Check if required Python packages are installed"""
    print(f"\n{'='*60}")
    print("Checking Python Dependencies...")
    print('='*60)

    required = ['requests', 'supabase', 'dotenv', 'schedule']
    missing = []

    for package in required:
        try:
            if package == 'dotenv':
                __import__('dotenv')
            else:
                __import__(package)
            print(f"✅ {package} is installed")
        except ImportError:
            print(f"❌ {package} is NOT installed")
            missing.append(package)

    if missing:
        print(f"\n❌ Missing packages: {', '.join(missing)}")
        print("   Install with: pip install -r requirements.txt")
        return False

    print("✅ All Python dependencies installed")
    return True

def check_database_connection():
    """Check if we can connect to Supabase"""
    print(f"\n{'='*60}")
    print("Testing Database Connection...")
    print('='*60)

    try:
        from supabase import create_client
        load_dotenv('../.env')

        url = os.getenv('SUPABASE_URL')
        key = os.getenv('SUPABASE_KEY')

        if not url or not key:
            print("❌ Cannot test connection - credentials not found")
            return False

        supabase = create_client(url, key)

        # Try to query the table
        result = supabase.table('motorcycle_shops').select('id').limit(1).execute()

        print("✅ Successfully connected to Supabase")
        print(f"   Database is accessible")

        # Check if table has data
        count_result = supabase.table('motorcycle_shops').select('id', count='exact').limit(1).execute()
        count = count_result.count if hasattr(count_result, 'count') else 0

        if count > 0:
            print(f"✅ Table has data ({count} records)")
        else:
            print("⚠️  Table is empty - you need to fetch data")
            print("   Run: python fetch_multi_country_data.py --country DE")

        return True

    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("   Check your Supabase credentials")
        return False

def check_nodejs():
    """Check if Node.js dependencies are installed"""
    print(f"\n{'='*60}")
    print("Checking Node.js Setup...")
    print('='*60)

    # Check if node_modules exists
    if os.path.exists('../node_modules'):
        print("✅ node_modules directory exists")
    else:
        print("❌ node_modules not found")
        print("   Run: npm install")
        return False

    # Check if package.json exists
    if os.path.exists('../package.json'):
        print("✅ package.json exists")
    else:
        print("❌ package.json not found")
        return False

    return True

def main():
    """Run all checks"""
    print("\n" + "="*60)
    print("MOTORCYCLE SHOPS - SETUP VERIFICATION")
    print("="*60)

    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    os.chdir('..')  # Go to project root

    results = []

    # Check environment files
    results.append(("Environment (.env.local)", check_env_file('.env.local')))
    results.append(("Environment (.env)", check_env_file('.env')))

    # Go to scripts directory for other checks
    os.chdir('scripts')

    # Check dependencies
    results.append(("Python Dependencies", check_dependencies()))

    # Check database
    results.append(("Database Connection", check_database_connection()))

    # Check Node.js
    results.append(("Node.js Setup", check_nodejs()))

    # Summary
    print(f"\n{'='*60}")
    print("VERIFICATION SUMMARY")
    print('='*60)

    for name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}")

    all_passed = all(result[1] for result in results)

    print('='*60)

    if all_passed:
        print("\n🎉 All checks passed! You're ready to go!")
        print("\nNext steps:")
        print("1. Start the dev server: npm run dev")
        print("2. Open http://localhost:3000")
        print("3. If no data, fetch it: cd scripts && python fetch_multi_country_data.py --country DE")
    else:
        print("\n⚠️  Some checks failed. Please fix the issues above.")
        print("\nRefer to SETUP_GUIDE.md for detailed instructions")

    print('='*60 + "\n")

    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
