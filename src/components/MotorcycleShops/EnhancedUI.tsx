'use client'

import { useEffect, useState, useMemo } from "react";
import { supabase } from "../../../supabase/supabaseClient"
import styles from './EnhancedUI.module.css';

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

export default function EnhancedMotorcycleShops() {
  // State management
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

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'city') {
        return (a.address?.city || '').localeCompare(b.address?.city || '');
      } else { // recent
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

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('favorites');
    if (saved) {
      setFavorites(new Set(JSON.parse(saved)));
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading motorcycle shops across Europe...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1>European Motorcycle Shops Directory</h1>
            <p className={styles.subtitle}>Find motorcycle shops and repair services across Europe</p>
          </div>
          <button className={styles.filterToggle} onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

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
            <span className={styles.statLabel}>Results</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{favorites.size}</span>
            <span className={styles.statLabel}>Favorites</span>
          </div>
        </div>
      </header>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search by name, city, street, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.controlGroup}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className={styles.sortSelect}
          >
            <option value="name">Sort by Name</option>
            <option value="city">Sort by City</option>
            <option value="recent">Recently Updated</option>
          </select>

          <select
            value={filterByContact}
            onChange={(e) => setFilterByContact(e.target.value as any)}
            className={styles.sortSelect}
          >
            <option value="all">All Contacts</option>
            <option value="phone">Has Phone</option>
            <option value="website">Has Website</option>
            <option value="email">Has Email</option>
          </select>

          <div className={styles.viewToggle}>
            <button
              className={viewMode === 'grid' ? styles.activeView : ''}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              Grid
            </button>
            <button
              className={viewMode === 'list' ? styles.activeView : ''}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              List
            </button>
            <button
              className={viewMode === 'map' ? styles.activeView : ''}
              onClick={() => setViewMode('map')}
              title="Map View"
            >
              Map
            </button>
          </div>

          <button onClick={exportData} className={styles.exportButton} title="Export to CSV">
            Export CSV
          </button>

          {(selectedCountry || selectedCity || searchTerm || filterByContact !== 'all') && (
            <button onClick={resetFilters} className={styles.resetButton}>
              Reset All
            </button>
          )}
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Sidebar - Conditional */}
        {showFilters && (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <h3>Countries ({countries.length})</h3>
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

            {selectedCountry && cities.length > 0 && (
              <div className={styles.sidebarSection}>
                <h3>Cities ({cities.length})</h3>
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
        )}

        {/* Main Content Area */}
        <main className={`${styles.shopsContainer} ${!showFilters ? styles.fullWidth : ''}`}>
          {/* Breadcrumb */}
          {(selectedCountry || selectedCity) && (
            <div className={styles.breadcrumb}>
              <span onClick={() => { setSelectedCountry(null); setSelectedCity(null); }} className={styles.breadcrumbLink}>
                All Countries
              </span>
              {selectedCountry && (
                <>
                  <span className={styles.breadcrumbSeparator}>/</span>
                  <span
                    onClick={() => setSelectedCity(null)}
                    className={selectedCity ? styles.breadcrumbLink : styles.breadcrumbCurrent}
                  >
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

          {/* Results */}
          {filteredShops.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No shops found</h3>
              <p>Try adjusting your filters or search term</p>
            </div>
          ) : viewMode === 'map' ? (
            <div className={styles.mapView}>
              <iframe
                src={`https://www.google.com/maps/d/embed?mid=1&ll=${filteredShops[0]?.lat || 50},${filteredShops[0]?.lon || 10}&z=5`}
                className={styles.map}
                loading="lazy"
              ></iframe>
              <div className={styles.mapSidebar}>
                <h3>{filteredShops.length} Locations</h3>
                <div className={styles.mapList}>
                  {filteredShops.slice(0, 50).map(shop => (
                    <div key={shop.id} className={styles.mapItem}>
                      <strong>{shop.name || 'Unnamed'}</strong>
                      <small>{shop.address?.city}, {shop.country_code}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? styles.shopsGrid : styles.shopsList}>
              {filteredShops.map((shop) => (
                <div key={shop.id} className={styles.shopCard}>
                  <div className={styles.shopHeader}>
                    <h3 className={styles.shopName}>
                      {shop.name || 'Unnamed Shop'}
                    </h3>
                    <div className={styles.shopHeaderRight}>
                      <span className={styles.shopCountry}>{shop.country_code}</span>
                      <button
                        className={`${styles.favoriteBtn} ${favorites.has(shop.id) ? styles.isFavorite : ''}`}
                        onClick={() => toggleFavorite(shop.id)}
                        title={favorites.has(shop.id) ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        ★
                      </button>
                    </div>
                  </div>

                  {shop.shop_info?.brand && (
                    <div className={styles.shopBrand}>
                      Brand: {shop.shop_info.brand}
                    </div>
                  )}

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

                    {shop.shop_info?.opening_hours && (
                      <div className={styles.shopDetail}>
                        <span className={styles.icon}>🕐</span>
                        <span className={styles.openingHours}>{shop.shop_info.opening_hours}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.shopActions}>
                    {shop.contact?.website && (
                      <a
                        href={shop.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionButton}
                      >
                        🌐 Website
                      </a>
                    )}
                    {(shop.lat && shop.lon) && (
                      <a
                        href={`https://www.google.com/maps?q=${shop.lat},${shop.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionButton}
                      >
                        🗺️ Map
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
