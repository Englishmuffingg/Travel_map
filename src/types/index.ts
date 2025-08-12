// City data structure
export interface City {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number]; // [longitude, latitude]
  category: 'Visited' | 'Planned' | 'Wishlist' | 'Favorite' | 'Business' | 'Transit';
  visitDate?: string; // ISO date string
  notes?: string;
  continent?: string;
}

// Statistics data structure
export interface CityStats {
  totalCities: number;
  totalCountries: number;
  totalContinents: number;
  categoryBreakdown: Record<string, number>;
  continentBreakdown: Record<string, number>;
  yearlyBreakdown: Record<string, number>;
  totalDistance?: number; // in kilometers
}

// Theme settings
export interface ThemeSettings {
  darkMode: boolean;
  mapStyle: 'default' | 'satellite' | 'minimal';
}

// App settings
export interface AppSettings {
  theme: ThemeSettings;
  showSidebar: boolean;
  defaultZoom: number;
  enableClustering: boolean;
  showCityLabels: boolean;
}

// Search and filter options
export interface FilterOptions {
  searchTerm: string;
  selectedCategories: string[];
  selectedCountries: string[];
  selectedContinents: string[];
  dateRange: {
    start?: string;
    end?: string;
  };
}

// Map marker props
export interface MarkerProps {
  city: City;
  selected?: boolean;
  onMarkerClick: (city: City) => void;
  onMarkerHover?: (city: City | null) => void;
}

// Modal props
export interface CityModalProps {
  visible: boolean;
  city?: City; // undefined for add mode, City for edit mode
  onCancel: () => void;
  onSave: (city: City) => void;
}

// Continent mapping
export const CONTINENT_MAPPING: Record<string, string> = {
  'China': 'Asia',
  'Japan': 'Asia', 
  'Korea': 'Asia',
  'Thailand': 'Asia',
  'Singapore': 'Asia',
  'India': 'Asia',
  'France': 'Europe',
  'Germany': 'Europe',
  'Italy': 'Europe',
  'Spain': 'Europe',
  'United Kingdom': 'Europe',
  'Netherlands': 'Europe',
  'Switzerland': 'Europe',
  'Austria': 'Europe',
  'USA': 'North America',
  'United States': 'North America',
  'Canada': 'North America',
  'Mexico': 'North America',
  'Brazil': 'South America',
  'Argentina': 'South America',
  'Chile': 'South America',
  'Australia': 'Oceania',
  'New Zealand': 'Oceania',
  'South Africa': 'Africa',
  'Egypt': 'Africa',
  'Morocco': 'Africa',
  'Kenya': 'Africa',
  'Russia': 'Europe' // or could be Asia depending on the city
};

// Category colors
export const CATEGORY_COLORS: Record<string, string> = {
  'Visited': '#52c41a',     // Green
  'Planned': '#1890ff',     // Blue
  'Wishlist': '#00bcd4',    // Cyan
  'Favorite': '#f5222d',    // Red
  'Business': '#faad14',    // Orange
  'Transit': '#722ed1'      // Purple
}; 