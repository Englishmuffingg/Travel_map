import { City, AppSettings } from '../types';

const CITIES_STORAGE_KEY = 'world-visited-cities';
const SETTINGS_STORAGE_KEY = 'world-visited-cities-settings';

// Default settings
const DEFAULT_SETTINGS: AppSettings = {
  theme: {
    darkMode: false,
    mapStyle: 'default'
  },
  showSidebar: true,
  defaultZoom: 1,
  enableClustering: false,
  showCityLabels: true
};

// Cities storage functions
export const saveCities = (cities: City[]): void => {
  try {
    localStorage.setItem(CITIES_STORAGE_KEY, JSON.stringify(cities));
  } catch (error) {
    console.error('Failed to save cities to localStorage:', error);
  }
};

export const loadCities = (): City[] => {
  try {
    const stored = localStorage.getItem(CITIES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load cities from localStorage:', error);
    return [];
  }
};

// Settings storage functions
export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
};

export const loadSettings = (): AppSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return DEFAULT_SETTINGS;
  }
};

// Export/Import functions
export const exportCitiesAsJSON = (cities: City[]): void => {
  const dataStr = JSON.stringify(cities, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(dataBlob);
  link.download = `world-cities-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importCitiesFromJSON = (file: File): Promise<City[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const cities = JSON.parse(result) as City[];
        
        // Validate the structure
        if (!Array.isArray(cities)) {
          throw new Error('Invalid JSON format: expected an array');
        }
        
        cities.forEach((city, index) => {
          if (!city.name || !city.country || !Array.isArray(city.coordinates) || city.coordinates.length !== 2) {
            throw new Error(`Invalid city data at index ${index}`);
          }
          
          // Add ID if missing
          if (!city.id) {
            city.id = `${city.name.toLowerCase().replace(/\s+/g, '-')}-${city.country.toLowerCase().replace(/\s+/g, '-')}`;
          }
        });
        
        resolve(cities);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

// Clear all data
export const clearAllData = (): void => {
  try {
    localStorage.removeItem(CITIES_STORAGE_KEY);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}; 