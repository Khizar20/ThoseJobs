export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface ProviderWithLocation {
  id: string;
  name: string;
  service_category: string;
  bio: string;
  experience: string;
  location: string;
  profile_image: string;
  is_verified: boolean;
  rating: number;
  reviews_count: number;
  jobs_pricing: Record<string, Array<{ job: string; price: number }>>;
  created_at: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get user's current location
export function getUserLocation(): Promise<Location> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

// Request location permission
export function requestLocationPermission(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!navigator.permissions) {
      // Fallback for browsers that don't support permissions API
      resolve(true);
      return;
    }

    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((permissionStatus) => {
        if (permissionStatus.state === 'granted') {
          resolve(true);
        } else if (permissionStatus.state === 'denied') {
          resolve(false);
        } else {
          // Permission state is 'prompt', we'll try to get location
          getUserLocation()
            .then(() => resolve(true))
            .catch(() => resolve(false));
        }
      })
      .catch(() => {
        // Fallback if permissions API fails
        resolve(true);
      });
  });
}

// Get Google Maps API key from environment
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8';

// Houston area boundaries (approximate)
const HOUSTON_BOUNDS = {
  north: 30.1,  // North boundary
  south: 29.5,  // South boundary
  east: -95.0,  // East boundary
  west: -95.8   // West boundary
};

// Check if coordinates are within Houston area
export function isInHoustonArea(latitude: number, longitude: number): boolean {
  return (
    latitude >= HOUSTON_BOUNDS.south &&
    latitude <= HOUSTON_BOUNDS.north &&
    longitude >= HOUSTON_BOUNDS.west &&
    longitude <= HOUSTON_BOUNDS.east
  );
}

// Check if address string contains Houston area indicators
export function isHoustonAddress(address: string): boolean {
  const houstonIndicators = ['houston', 'tx', 'texas', '77001', '77002', '77003', '77004', '77005', '77006', '77007', '77008', '77009', '77010'];
  const lowerAddress = address.toLowerCase();
  return houstonIndicators.some(indicator => lowerAddress.includes(indicator));
}

// Geocode address to coordinates using Google Geocoding API
export async function geocodeAddress(address: string): Promise<Location | null> {
  try {
    console.log('Geocoding address:', address);
    
    // Add "Houston, TX" to the address if not already present for better results
    let searchAddress = address;
    if (!address.toLowerCase().includes('houston') && !address.toLowerCase().includes('tx')) {
      searchAddress = `${address}, Houston, TX`;
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        searchAddress
      )}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    console.log('Geocoding response:', data);

    if (data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const result = {
        latitude: location.lat,
        longitude: location.lng,
        address: data.results[0].formatted_address,
      };
      console.log('Geocoding successful:', result);
      return result;
    }
    
    // If no results, try with just the city name
    if (address.includes(',')) {
      const cityName = address.split(',')[0].trim();
      console.log('Trying with city name:', cityName);
      
      const cityResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          `${cityName}, Houston, TX`
        )}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const cityData = await cityResponse.json();
      
      if (cityData.results && cityData.results.length > 0) {
        const location = cityData.results[0].geometry.location;
        const result = {
          latitude: location.lat,
          longitude: location.lng,
          address: cityData.results[0].formatted_address,
        };
        console.log('Geocoding successful with city fallback:', result);
        return result;
      }
    }
    
    console.log('Geocoding failed for address:', address);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Format distance for display
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

// Get map URL with markers for user and providers
export function getMapWithMarkersUrl(
  userLocation: Location,
  providers: ProviderWithLocation[]
): string {
  const markers = [
    `markers=color:blue|label:U|${userLocation.latitude},${userLocation.longitude}`,
    ...providers
      .filter((p) => p.latitude && p.longitude)
      .map((p, index) => `markers=color:red|label:${index + 1}|${p.latitude},${p.longitude}`),
  ].join('&');

  return `https://maps.googleapis.com/maps/api/staticmap?size=600x400&${markers}&key=${GOOGLE_MAPS_API_KEY}`;
}

// Get directions URL
export function getDirectionsUrl(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${toLat},${toLng}&key=${GOOGLE_MAPS_API_KEY}`;
}

// Get static map URL for a single location
export function getStaticMapUrl(
  latitude: number,
  longitude: number,
  zoom: number = 15,
  size: string = "400x300"
): string {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${size}&markers=color:red|${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
} 