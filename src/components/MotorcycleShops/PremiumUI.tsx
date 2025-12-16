'use client'

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../../supabase/supabaseClient"
import styles from './PremiumUI.module.css';

// TypeScript interfaces
interface Address {
  city?: string;
  street?: string;
  housenumber?: string;
  postcode?: string;
  suburb?: string;
  state?: string;
}

interface Contact {
  phone?: string;
  fax?: string;
  website?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
}

interface ShopInfo {
  brand?: string;
  opening_hours?: string;
  description?: string;
  service?: string;
  shop_type?: string;
}

interface MotorcycleShop {
  id: number;
  name?: string;
  lat?: number;
  lon?: number;
  address?: Address;
  contact?: Contact;
  country_code?: string;
  country_name?: string;
  shop_info?: ShopInfo;
  shop_tags?: Record<string, string>;
  last_updated?: string;
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
  'DE': 'Germany', 'FR': 'France', 'IT': 'Italy', 'ES': 'Spain',
  'PL': 'Poland', 'NL': 'Netherlands', 'SE': 'Sweden', 'FI': 'Finland',
  'BE': 'Belgium', 'AT': 'Austria', 'CZ': 'Czech Republic', 'SK': 'Slovakia',
  'HU': 'Hungary', 'PT': 'Portugal', 'IE': 'Ireland', 'DK': 'Denmark',
  'EE': 'Estonia', 'LT': 'Lithuania', 'LV': 'Latvia', 'SI': 'Slovenia',
  'HR': 'Croatia', 'RO': 'Romania', 'BG': 'Bulgaria', 'CY': 'Cyprus',
  'LU': 'Luxembourg', 'MT': 'Malta', 'GR': 'Greece', 'EL': 'Greece'
};

const COUNTRY_FLAGS: Record<string, string> = {
  'DE': '🇩🇪', 'FR': '🇫🇷', 'IT': '🇮🇹', 'ES': '🇪🇸', 'PL': '🇵🇱',
  'NL': '🇳🇱', 'SE': '🇸🇪', 'FI': '🇫🇮', 'BE': '🇧🇪', 'AT': '🇦🇹',
  'CZ': '🇨🇿', 'SK': '🇸🇰', 'HU': '🇭🇺', 'PT': '🇵🇹', 'IE': '🇮🇪',
  'DK': '🇩🇰', 'EE': '🇪🇪', 'LT': '🇱🇹', 'LV': '🇱🇻', 'SI': '🇸🇮',
  'HR': '🇭🇷', 'RO': '🇷🇴', 'BG': '🇧🇬', 'CY': '🇨🇾', 'LU': '🇱🇺',
  'MT': '🇲🇹', 'GR': '🇬🇷', 'EL': '🇬🇷'
};

const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonHeader}>
      <div className={styles.skeletonTitle}></div>
      <div className={styles.skeletonBadge}></div>
    </div>
    <div className={styles.skeletonLine}></div>
    <div className={styles.skeletonLine}></div>
    <div className={styles.skeletonLine} style={{ width: '70%' }}></div>
  </div>
);

export default function PremiumMotorcycleShops() {
  const [shops, setShops] = useState<MotorcycleShop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'city' | 'recent'>('name');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [filterByContact, setFilterByContact] = useState<'all' | 'phone' | 'website' | 'email'>('all');
  const [darkMode, setDarkMode] = useState(false);
  const [animateStats, setAnimateStats] = useState(false);

  // Fetch shops from database
  useEffect(() => {
    async function fetchShops() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("motorcycle_shops")
          .select("*")
          .order('country_code', { ascending: true });

        if (fetchError) throw fetchError;

        if (data) {
          setShops(data as MotorcycleShop[]);
          setTimeout(() => setAnimateStats(true), 100);
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    }

    fetchShops();
  }, []);

  // Load favorites and dark mode preference
  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) setFavorites(new Set(JSON.parse(saved)));

    const darkModePref = localStorage.getItem('darkMode');
    if (darkModePref === 'true') setDarkMode(true);
  }, []);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', String(darkMode));
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Calculate countries and cities
  const countries = useMemo(() => {
    const countryMap = new Map<string, number>();
    shops.forEach(shop => {
      const code = shop.country_code || 'Unknown';
      countryMap.set(code, (countryMap.get(code) || 0) + 1);
    });

    return Array.from(countryMap.entries())
      .map(([code, count]) => ({
        code,
        name: COUNTRY_NAMES[code] || code,
        shopCount: count
      }))
      .sort((a, b) => b.shopCount - a.shopCount);
  }, [shops]);

  const cities = useMemo(() => {
    if (!selectedCountry) return [];

    const filteredShops = shops.filter(shop => shop.country_code === selectedCountry);
    const cityMap = new Map<string, number>();

    filteredShops.forEach(shop => {
      const city = shop.address?.city || 'Unknown';
      cityMap.set(city, (cityMap.get(city) || 0) + 1);
    });

    return Array.from(cityMap.entries())
      .map(([name, count]) => ({ name, shopCount: count }))
      .sort((a, b) => b.shopCount - a.shopCount);
  }, [shops, selectedCountry]);

  // Filter and sort shops
  const filteredShops = useMemo(() => {
    let result = shops.filter(shop => {
      const matchesCountry = !selectedCountry || shop.country_code === selectedCountry;
      const matchesCity = !selectedCity || shop.address?.city === selectedCity;
      const matchesSearch = !searchTerm ||
        shop.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.address?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.address?.street?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shop.shop_info?.brand?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesContact = filterByContact === 'all' ||
        (filterByContact === 'phone' && shop.contact?.phone) ||
        (filterByContact === 'website' && shop.contact?.website) ||
        (filterByContact === 'email' && shop.contact?.email);

      return matchesCountry && matchesCity && matchesSearch && matchesContact;
    });

    result.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'city') {
        return (a.address?.city || '').localeCompare(b.address?.city || '');
      } else {
        return (b.last_updated || '').localeCompare(a.last_updated || '');
      }
    });

    return result;
  }, [shops, selectedCountry, selectedCity, searchTerm, sortBy, filterByContact]);

  // Handlers
  const handleCountrySelect = (code: string) => {
    setSelectedCountry(code === selectedCountry ? null : code);
    setSelectedCity(null);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city === selectedCity ? null : city);
  };

  const resetFilters = () => {
    setSelectedCountry(null);
    setSelectedCity(null);
    setSearchTerm('');
    setFilterByContact('all');
  };

  const toggleFavorite = (shopId: number) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(shopId)) {
      newFavorites.delete(shopId);
    } else {
      newFavorites.add(shopId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(Array.from(newFavorites)));
  };

  const exportData = () => {
    const csv = [
      ['Name', 'Country', 'City', 'Street', 'Phone', 'Website', 'Email'],
      ...filteredShops.map(shop => [
        shop.name || '',
        shop.country_code || '',
        shop.address?.city || '',
        shop.address?.street || '',
        shop.contact?.phone || '',
        shop.contact?.website || '',
        shop.contact?.email || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motorcycle-shops-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Loading state with skeleton
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.logoAnimation}>
            <div className={styles.motorcycle}>🏍️</div>
          </div>
          <h2>Loading European Motorcycle Shops...</h2>
          <div className={styles.loadingBar}>
            <div className={styles.loadingProgress}></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${darkMode ? styles.dark : ''}`}>
      {/* Premium Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>
              <span className={styles.logoIcon}>🏍️</span>
              <div>
                <h1>MotoShops EU</h1>
                <p className={styles.tagline}>Your European Motorcycle Directory</p>
              </div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button
              className={styles.themeToggle}
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
              <span className={styles.filterIcon}>⚙️</span>
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>
        </div>

        {/* Animated Statistics */}
        <div className={`${styles.stats} ${animateStats ? styles.animate : ''}`}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📊</div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{shops.length.toLocaleString()}</span>
              <span className={styles.statLabel}>Total Shops</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🌍</div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{countries.length}</span>
              <span className={styles.statLabel}>Countries</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>🔍</div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{filteredShops.length.toLocaleString()}</span>
              <span className={styles.statLabel}>Results</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⭐</div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>{favorites.size}</span>
              <span className={styles.statLabel}>Favorites</span>
            </div>
          </div>
        </div>
      </header>

      {/* Premium Controls */}
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>🔎</span>
          <input
            type="text"
            placeholder="Search shops, cities, brands..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          {searchTerm && (
            <button className={styles.clearSearch} onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>

        <div className={styles.filterBar}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={styles.select}
          >
            <option value="name">📝 Name (A-Z)</option>
            <option value="city">🏙️ City (A-Z)</option>
            <option value="recent">🕐 Recently Updated</option>
          </select>

          <select
            value={filterByContact}
            onChange={(e) => setFilterByContact(e.target.value as any)}
            className={styles.select}
          >
            <option value="all">📋 All Shops</option>
            <option value="phone">📞 Has Phone</option>
            <option value="website">🌐 Has Website</option>
            <option value="email">✉️ Has Email</option>
          </select>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              ▦
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === 'map' ? styles.active : ''}`}
              onClick={() => setViewMode('map')}
              title="Map View"
            >
              🗺️
            </button>
          </div>

          <button onClick={exportData} className={styles.exportBtn}>
            ⬇️ Export
          </button>

          {(selectedCountry || selectedCity || searchTerm || filterByContact !== 'all') && (
            <button onClick={resetFilters} className={styles.resetBtn}>
              ↺ Reset
            </button>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Premium Sidebar */}
        {showFilters && (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h3>🌍 Filter by Location</h3>
            </div>

            <div className={styles.sidebarSection}>
              <h4>Countries ({countries.length})</h4>
              <div className={styles.countryList}>
                {countries.map(country => (
                  <button
                    key={country.code}
                    className={`${styles.countryItem} ${selectedCountry === country.code ? styles.selected : ''}`}
                    onClick={() => handleCountrySelect(country.code)}
                  >
                    <span className={styles.flag}>{COUNTRY_FLAGS[country.code] || country.code}</span>
                    <span className={styles.countryName}>{country.name}</span>
                    <span className={styles.badge}>{country.shopCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedCountry && cities.length > 0 && (
              <div className={styles.sidebarSection}>
                <h4>🏙️ Cities ({cities.length})</h4>
                <div className={styles.cityList}>
                  {cities.slice(0, 20).map(city => (
                    <button
                      key={city.name}
                      className={`${styles.cityItem} ${selectedCity === city.name ? styles.selected : ''}`}
                      onClick={() => handleCitySelect(city.name)}
                    >
                      <span className={styles.cityName}>{city.name}</span>
                      <span className={styles.badge}>{city.shopCount}</span>
                    </button>
                  ))}
                  {cities.length > 20 && (
                    <div className={styles.moreText}>+ {cities.length - 20} more cities</div>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* Main Shop Display */}
        <main className={`${styles.shopsContainer} ${!showFilters ? styles.fullWidth : ''}`}>
          {/* Breadcrumb */}
          {(selectedCountry || selectedCity) && (
            <div className={styles.breadcrumb}>
              <span onClick={() => { setSelectedCountry(null); setSelectedCity(null); }} className={styles.breadcrumbLink}>
                All Countries
              </span>
              {selectedCountry && (
                <>
                  <span className={styles.separator}>›</span>
                  <span
                    onClick={() => setSelectedCity(null)}
                    className={selectedCity ? styles.breadcrumbLink : styles.breadcrumbCurrent}
                  >
                    {COUNTRY_FLAGS[selectedCountry]} {COUNTRY_NAMES[selectedCountry]}
                  </span>
                </>
              )}
              {selectedCity && (
                <>
                  <span className={styles.separator}>›</span>
                  <span className={styles.breadcrumbCurrent}>{selectedCity}</span>
                </>
              )}
            </div>
          )}

          {/* Results */}
          {filteredShops.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3>No shops found</h3>
              <p>Try adjusting your filters or search criteria</p>
              <button onClick={resetFilters} className={styles.resetBtn}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? styles.shopsGrid : styles.shopsList}>
              {filteredShops.map((shop) => (
                <div key={shop.id} className={styles.shopCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>
                      <h3>{shop.name || 'Unnamed Shop'}</h3>
                      {shop.shop_info?.brand && (
                        <span className={styles.brandBadge}>🏷️ {shop.shop_info.brand}</span>
                      )}
                    </div>
                    <div className={styles.cardActions}>
                      <span className={styles.countryBadge}>
                        {COUNTRY_FLAGS[shop.country_code || ''] || shop.country_code}
                      </span>
                      <button
                        className={`${styles.favoriteBtn} ${favorites.has(shop.id) ? styles.isFavorite : ''}`}
                        onClick={() => toggleFavorite(shop.id)}
                      >
                        ★
                      </button>
                    </div>
                  </div>

                  <div className={styles.cardBody}>
                    {shop.address?.city && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoIcon}>📍</span>
                        <span>{shop.address.city}{shop.address.postcode && ` ${shop.address.postcode}`}</span>
                      </div>
                    )}

                    {(shop.address?.street || shop.address?.housenumber) && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoIcon}>🏠</span>
                        <span>{shop.address.street} {shop.address.housenumber}</span>
                      </div>
                    )}

                    {shop.contact?.phone && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoIcon}>📞</span>
                        <a href={`tel:${shop.contact.phone}`}>{shop.contact.phone}</a>
                      </div>
                    )}

                    {shop.contact?.email && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoIcon}>✉️</span>
                        <a href={`mailto:${shop.contact.email}`}>{shop.contact.email}</a>
                      </div>
                    )}

                    {shop.shop_info?.opening_hours && (
                      <div className={styles.infoRow}>
                        <span className={styles.infoIcon}>🕐</span>
                        <span className={styles.hours}>{shop.shop_info.opening_hours}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    {shop.contact?.website && (
                      <a
                        href={shop.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionBtn}
                      >
                        🌐 Website
                      </a>
                    )}
                    {(shop.lat && shop.lon) && (
                      <a
                        href={`https://www.google.com/maps?q=${shop.lat},${shop.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionBtn}
                      >
                        🗺️ Directions
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>🏍️ MotoShops EU - Your European Motorcycle Directory</p>
        <p>Data from OpenStreetMap • {shops.length.toLocaleString()} shops across {countries.length} countries</p>
      </footer>
    </div>
  );
}
