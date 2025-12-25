
export interface GeocodeResult {
  name: string;
  country: string;
  region: string;
}

export const reverseGeocode = async (lat: number, lng: number, lang: string): Promise<GeocodeResult | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${lang}&addressdetails=1`,
      {
        headers: {
          'Accept-Language': lang === 'zh' ? 'zh-CN,zh;q=0.9' : 'en-US,en;q=0.9',
        },
      }
    );

    if (!response.ok) throw new Error('Geocoding failed');

    const data = await response.json();
    
    // Extracting a meaningful name
    const addr = data.address;
    const city = addr.city || addr.town || addr.village || addr.suburb || '';
    const state = addr.state || addr.province || '';
    const country = addr.country || '';
    
    let name = '';
    if (city && country) {
      name = `${city}, ${country}`;
    } else {
      name = data.display_name.split(',').slice(0, 3).join(',').trim();
    }

    // Mapping regions (rough estimation for grouping)
    const countryCode = addr.country_code?.toUpperCase();
    const region = getRegionFromCountryCode(countryCode);

    return {
      name,
      country,
      region
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

const getRegionFromCountryCode = (code: string): string => {
  const regions: Record<string, string[]> = {
    'Asia': ['CN', 'JP', 'KR', 'IN', 'TH', 'VN', 'MY', 'SG', 'ID', 'PH'],
    'Europe': ['FR', 'IT', 'DE', 'GB', 'ES', 'NL', 'CH', 'BE', 'SE', 'NO', 'FI', 'DK', 'GR', 'PT', 'AT'],
    'North America': ['US', 'CA', 'MX'],
    'South America': ['BR', 'AR', 'CL', 'CO', 'PE'],
    'Oceania': ['AU', 'NZ'],
    'Africa': ['ZA', 'EG', 'NG', 'KE', 'MA']
  };

  for (const [region, codes] of Object.entries(regions)) {
    if (codes.includes(code)) return region;
  }
  return 'Others';
};
