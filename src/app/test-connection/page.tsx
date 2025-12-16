'use client'

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase/supabaseClient';
import styles from './test.module.css';

export default function TestConnection() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [message, setMessage] = useState('Testing database connection...');
  const [stats, setStats] = useState<any>(null);
  const [sampleData, setSampleData] = useState<any[]>([]);

  useEffect(() => {
    testConnection();
  }, []);

  async function testConnection() {
    try {
      setStatus('testing');
      setMessage('Connecting to Supabase...');

      // Test basic connection
      const { data, error, count } = await supabase
        .from('motorcycle_shops')
        .select('*', { count: 'exact' })
        .limit(5);

      if (error) throw error;

      // Get statistics
      const allData = await supabase
        .from('motorcycle_shops')
        .select('country_code, address, contact');

      if (allData.error) throw allData.error;

      // Calculate stats
      const countries = new Set(allData.data?.map((s: any) => s.country_code)).size;
      const cities = new Set(allData.data?.map((s: any) => s.address?.city).filter(Boolean)).size;
      const withPhone = allData.data?.filter((s: any) => s.contact?.phone).length || 0;
      const withWebsite = allData.data?.filter((s: any) => s.contact?.website).length || 0;

      setStats({
        total: count || 0,
        countries,
        cities,
        withPhone,
        withWebsite,
        phonePercent: ((withPhone / (count || 1)) * 100).toFixed(1),
        websitePercent: ((withWebsite / (count || 1)) * 100).toFixed(1)
      });

      setSampleData(data || []);
      setStatus('success');
      setMessage('Database connection successful!');

    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to connect to database');
      console.error('Connection test failed:', err);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Database Connection Test</h1>

        <div className={`${styles.statusBox} ${styles[status]}`}>
          <div className={styles.statusIcon}>
            {status === 'testing' && <div className={styles.spinner}></div>}
            {status === 'success' && <span>✅</span>}
            {status === 'error' && <span>❌</span>}
          </div>
          <div className={styles.statusText}>{message}</div>
        </div>

        {status === 'success' && stats && (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.stat}>
                <div className={styles.statValue}>{stats.total}</div>
                <div className={styles.statLabel}>Total Shops</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{stats.countries}</div>
                <div className={styles.statLabel}>Countries</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{stats.cities}</div>
                <div className={styles.statLabel}>Cities</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{stats.phonePercent}%</div>
                <div className={styles.statLabel}>Has Phone</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statValue}>{stats.websitePercent}%</div>
                <div className={styles.statLabel}>Has Website</div>
              </div>
            </div>

            <div className={styles.sampleSection}>
              <h2>Sample Data (First 5 records)</h2>
              <div className={styles.sampleGrid}>
                {sampleData.map((shop, idx) => (
                  <div key={shop.id} className={styles.sampleCard}>
                    <div className={styles.sampleHeader}>
                      <strong>{shop.name || 'Unnamed Shop'}</strong>
                      <span className={styles.badge}>{shop.country_code}</span>
                    </div>
                    <div className={styles.sampleDetails}>
                      {shop.address?.city && <div>📍 {shop.address.city}</div>}
                      {shop.contact?.phone && <div>📞 {shop.contact.phone}</div>}
                      {shop.contact?.website && <div>🌐 Website available</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <a href="/" className={styles.button}>
                Go to Main App
              </a>
              <button onClick={testConnection} className={styles.buttonSecondary}>
                Test Again
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <div className={styles.errorHelp}>
            <h3>Troubleshooting Steps:</h3>
            <ol>
              <li>Check if you created the <code>.env.local</code> file in the project root</li>
              <li>Verify your Supabase credentials are correct</li>
              <li>Make sure the <code>motorcycle_shops</code> table exists in Supabase</li>
              <li>Check if the table has Row Level Security (RLS) policies allowing public read access</li>
              <li>Verify your internet connection</li>
            </ol>

            <div className={styles.actions}>
              <button onClick={testConnection} className={styles.button}>
                Retry Connection
              </button>
              <a href="/setup-guide" className={styles.buttonSecondary}>
                View Setup Guide
              </a>
            </div>
          </div>
        )}

        <div className={styles.infoBox}>
          <h3>Environment Check</h3>
          <div className={styles.envCheck}>
            <div>
              <strong>Supabase URL:</strong>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ?
                <span className={styles.success}>✓ Set</span> :
                <span className={styles.error}>✗ Missing</span>
              }
            </div>
            <div>
              <strong>Supabase Key:</strong>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?
                <span className={styles.success}>✓ Set</span> :
                <span className={styles.error}>✗ Missing</span>
              }
            </div>
          </div>

          {(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && (
            <div className={styles.warning}>
              <strong>⚠️ Missing environment variables!</strong>
              <p>Create a <code>.env.local</code> file in your project root with:</p>
              <pre>{`NEXT_PUBLIC_SUPABASE_URL=your_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here`}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
