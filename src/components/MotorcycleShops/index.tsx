'use client'

import { useEffect, useState } from "react";
import { supabase} from "../../../supabase/supabaseClient"

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

export default function MotorcycleShops() {
  const [shops, setShops] = useState<MotorcycleShop[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

useEffect(() => {
  async function fetchShops() {
    const { data, error } = await supabase
      .from<"motorcycle_shops", MotorcycleShop>("motorcycle_shops")
      .select("*");

    if (error) {
      console.error("Error fetching data:", error);
    } else if (data) {
      setShops(data);
    }
    setLoading(false);
  }

  fetchShops();
}, []);


  if (loading) return <p>Loading...</p>;

  return (
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
    </div>
  );
}
