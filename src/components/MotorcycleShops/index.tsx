'use client'

import { useEffect, useState } from "react";
import { supabase } from "../../../supabase/supabaseClient"
import styles from './MotorcycleShops.module.css';

// Define TypeScript types for your table
interface Address {
  city?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  suburb?: string;
}

interface Contact {
  phone?: string;
  fax?: string;
  website?: string;
  email?: string;
}

interface MotorcycleShop {
  id: number;
  name?: string;
  lat?: number;
  lon?: number;
  address?: Address;
  contact?: Contact;
  country_code?: string;
  country_name?:string;
  shop_tags?: Record<string, string>;
}

interface CountryData {
  code: string;
  name: string;
  shopCount: number;
}

interface CityData {
  name: string;
  shopCount: number;
}

const COUNTRY_NAMES: Record<string, string> = {
  'DE': 'Germany',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
  'PL': 'Poland',
  'NL': 'Netherlands',
  'SE': 'Sweden',
  'FI': 'Finland',
  'BE': 'Belgium',
  'AT': 'Austria',
  'CZ': 'Czech Republic',
  'SK': 'Slovakia',
  'HU': 'Hungary',
  'PT': 'Portugal',
  'IE': 'Ireland',
  'DK': 'Denmark',
  'EE': 'Estonia',
  'LT': 'Lithuania',
  'LV': 'Latvia',
  'SI': 'Slovenia',
  'HR': 'Croatia',
  'RO': 'Romania',
  'BG': 'Bulgaria',
  'CY': 'Cyprus',
  'LU': 'Luxembourg',
  'MT': 'Malta',
  'EL': 'Greece'
};

export default function MotorcycleShops() {
  const [shops, setShops] = useState<MotorcycleShop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [cities, setCities] = useState<CityData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    async function fetchShops() {
      const { data, error } = await supabase
        .from("motorcycle_shops")
        .select("*");

      if (error) {
        console.error("Error fetching data:", error);
      } else if (data) {
        setShops(data as MotorcycleShop[]);

        // Process countries
        const countryMap = new Map<string, number>();
        data.forEach((shop: MotorcycleShop) => {
          const code = shop.country_code || 'Unknown';
          countryMap.set(code, (countryMap.get(code) || 0) + 1);
        });

        const countriesData: CountryData[] = Array.from(countryMap.entries())
          .map(([code, count]) => ({
            code,
            name: COUNTRY_NAMES[code] || code,
            shopCount: count
          }))
          .sort((a, b) => b.shopCount - a.shopCount);

        setCountries(countriesData);
      }
      setLoading(false);
    }

    fetchShops();
  }, []);

  // Update cities when country is selected
  useEffect(() => {
    if (selectedCountry) {
      const filteredShops = shops.filter(shop => shop.country_code === selectedCountry);
      const cityMap = new Map<string, number>();

      filteredShops.forEach(shop => {
        const city = shop.address?.city || 'Unknown';
        cityMap.set(city, (cityMap.get(city) || 0) + 1);
      });

      const citiesData: CityData[] = Array.from(cityMap.entries())
        .map(([name, count]) => ({
          name,
          shopCount: count
        }))
        .sort((a, b) => b.shopCount - a.shopCount);

      setCities(citiesData);
      setSelectedCity(null); // Reset city selection when country changes
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedCountry, shops]);

  const filteredShops = shops.filter(shop => {
    const matchesCountry = !selectedCountry || shop.country_code === selectedCountry;
    const matchesCity = !selectedCity || shop.address?.city === selectedCity;
    const matchesSearch = !searchTerm ||
      shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.address?.street?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCountry && matchesCity && matchesSearch;
  });

  const handleCountrySelect = (code: string) => {
    setSelectedCountry(code === selectedCountry ? null : code);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city === selectedCity ? null : city);
  };

  const resetFilters = () => {
    setSelectedCountry(null);
    setSelectedCity(null);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading motorcycle shops across Europe...</p>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <div>
      <h1>Motorcycle Shops in EU</h1>
      <ul>
        {shops.map((shop) => (
          <li key={shop.id} className="info_container">
             <strong>{shop.name}</strong> — {shop.address?.city}, {shop.country_name} ({shop.country_code})
            <br />
            {shop.contact?.phone && <span>📞 {shop.contact.phone}</span>}
            <br />
            {shop.contact?.website && (
              <a
                href={shop.contact.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                🌐 Website
              </a>
            )}
          </li>
        ))}
      </ul>
=======
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>European Motorcycle Shops Directory</h1>
        <p className={styles.subtitle}>Find motorcycle shops and repair services across Europe</p>
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{shops.length}</span>
            <span className={styles.statLabel}>Total Shops</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{countries.length}</span>
            <span className={styles.statLabel}>Countries</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{filteredShops.length}</span>
            <span className={styles.statLabel}>Filtered Results</span>
          </div>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by name, city, or street..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.viewToggle}>
          <button
            className={viewMode === 'grid' ? styles.activeView : ''}
            onClick={() => setViewMode('grid')}
          >
            Grid
          </button>
          <button
            className={viewMode === 'list' ? styles.activeView : ''}
            onClick={() => setViewMode('list')}
          >
            List
          </button>
        </div>

        {(selectedCountry || selectedCity || searchTerm) && (
          <button onClick={resetFilters} className={styles.resetButton}>
            Reset Filters
          </button>
        )}
      </div>

      <div className={styles.mainContent}>
        {/* Countries Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSection}>
            <h3>Countries</h3>
            <div className={styles.countryList}>
              {countries.map(country => (
                <button
                  key={country.code}
                  className={`${styles.countryItem} ${selectedCountry === country.code ? styles.selected : ''}`}
                  onClick={() => handleCountrySelect(country.code)}
                >
                  <span className={styles.countryFlag}>{country.code}</span>
                  <span className={styles.countryName}>{country.name}</span>
                  <span className={styles.countryCount}>{country.shopCount}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cities List (shown when country is selected) */}
          {selectedCountry && cities.length > 0 && (
            <div className={styles.sidebarSection}>
              <h3>Cities in {COUNTRY_NAMES[selectedCountry]}</h3>
              <div className={styles.cityList}>
                {cities.map(city => (
                  <button
                    key={city.name}
                    className={`${styles.cityItem} ${selectedCity === city.name ? styles.selected : ''}`}
                    onClick={() => handleCitySelect(city.name)}
                  >
                    <span className={styles.cityName}>{city.name}</span>
                    <span className={styles.cityCount}>{city.shopCount}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Shops Display */}
        <main className={styles.shopsContainer}>
          {selectedCountry && (
            <div className={styles.breadcrumb}>
              <span onClick={() => setSelectedCountry(null)} className={styles.breadcrumbLink}>
                All Countries
              </span>
              {selectedCountry && (
                <>
                  <span className={styles.breadcrumbSeparator}>/</span>
                  <span className={styles.breadcrumbCurrent}>
                    {COUNTRY_NAMES[selectedCountry]}
                  </span>
                </>
              )}
              {selectedCity && (
                <>
                  <span className={styles.breadcrumbSeparator}>/</span>
                  <span className={styles.breadcrumbCurrent}>{selectedCity}</span>
                </>
              )}
            </div>
          )}

          {filteredShops.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No shops found</h3>
              <p>Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? styles.shopsGrid : styles.shopsList}>
              {filteredShops.map((shop) => (
                <div key={shop.id} className={styles.shopCard}>
                  <div className={styles.shopHeader}>
                    <h3 className={styles.shopName}>
                      {shop.name || 'Unnamed Shop'}
                    </h3>
                    <span className={styles.shopCountry}>{shop.country_code}</span>
                  </div>

                  <div className={styles.shopDetails}>
                    {shop.address?.city && (
                      <div className={styles.shopDetail}>
                        <span className={styles.icon}>📍</span>
                        <span>
                          {shop.address.city}
                          {shop.address.postcode && ` ${shop.address.postcode}`}
                        </span>
                      </div>
                    )}

                    {(shop.address?.street || shop.address?.housenumber) && (
                      <div className={styles.shopDetail}>
                        <span className={styles.icon}>🏠</span>
                        <span>
                          {shop.address.street} {shop.address.housenumber}
                        </span>
                      </div>
                    )}

                    {shop.contact?.phone && (
                      <div className={styles.shopDetail}>
                        <span className={styles.icon}>📞</span>
                        <a href={`tel:${shop.contact.phone}`}>{shop.contact.phone}</a>
                      </div>
                    )}

                    {shop.contact?.email && (
                      <div className={styles.shopDetail}>
                        <span className={styles.icon}>✉️</span>
                        <a href={`mailto:${shop.contact.email}`}>{shop.contact.email}</a>
                      </div>
                    )}

                    {shop.contact?.website && (
                      <div className={styles.shopDetail}>
                        <a
                          href={shop.contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.websiteLink}
                        >
                          🌐 Visit Website
                        </a>
                      </div>
                    )}

                    {(shop.lat && shop.lon) && (
                      <div className={styles.shopDetail}>
                        <a
                          href={`https://www.google.com/maps?q=${shop.lat},${shop.lon}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.mapLink}
                        >
                          🗺️ View on Map
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
>>>>>>> 704677618f18aac4896606d86ba358fdddaf6885
    </div>
  );
}
