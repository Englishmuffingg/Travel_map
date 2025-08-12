import { City, CityStats, CONTINENT_MAPPING } from '../types';
import { format } from 'date-fns';

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Calculate total travel distance (rough approximation)
const calculateTotalDistance = (cities: City[]): number => {
  const visitedCities = cities
    .filter(city => city.category === 'Visited' && city.visitDate)
    .sort((a, b) => new Date(a.visitDate!).getTime() - new Date(b.visitDate!).getTime());

  if (visitedCities.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < visitedCities.length; i++) {
    const prev = visitedCities[i - 1];
    const curr = visitedCities[i];
    totalDistance += calculateDistance(prev.coordinates[1], prev.coordinates[0], curr.coordinates[1], curr.coordinates[0]);
  }

  return Math.round(totalDistance);
};

// Get continent for a country
const getContinent = (country: string): string => {
  return CONTINENT_MAPPING[country] || 'Unknown';
};

// Calculate comprehensive statistics
export const calculateCityStats = (cities: City[]): CityStats => {
  const categoryBreakdown: Record<string, number> = {};
  const continentBreakdown: Record<string, number> = {};
  const yearlyBreakdown: Record<string, number> = {};
  const uniqueCountries = new Set<string>();
  const uniqueContinents = new Set<string>();

  cities.forEach(city => {
    // Category breakdown
    categoryBreakdown[city.category] = (categoryBreakdown[city.category] || 0) + 1;

    // Country tracking
    uniqueCountries.add(city.country);

    // Continent breakdown
    const continent = city.continent || getContinent(city.country);
    uniqueContinents.add(continent);
    continentBreakdown[continent] = (continentBreakdown[continent] || 0) + 1;

    // Yearly breakdown (only for visited cities with dates)
    if (city.visitDate && city.category === 'Visited') {
      try {
        const year = format(new Date(city.visitDate), 'yyyy');
        yearlyBreakdown[year] = (yearlyBreakdown[year] || 0) + 1;
      } catch (error) {
        console.warn('Invalid date format for city:', city.name);
      }
    }
  });

  return {
    totalCities: cities.length,
    totalCountries: uniqueCountries.size,
    totalContinents: uniqueContinents.size,
    categoryBreakdown,
    continentBreakdown,
    yearlyBreakdown,
    totalDistance: calculateTotalDistance(cities)
  };
};

// Get cities timeline (sorted by visit date)
export const getCitiesTimeline = (cities: City[]): City[] => {
  return cities
    .filter(city => city.visitDate && city.category === 'Visited')
    .sort((a, b) => new Date(b.visitDate!).getTime() - new Date(a.visitDate!).getTime());
};

// Get random city recommendation
export const getRandomRecommendation = (cities: City[]): City | null => {
  const plannedCities = cities.filter(city => city.category === 'Planned');
  if (plannedCities.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * plannedCities.length);
  return plannedCities[randomIndex];
};

// Search and filter utilities
export const filterCities = (
  cities: City[], 
  searchTerm: string, 
  selectedCategories: string[] = [],
  selectedCountries: string[] = [],
  selectedContinents: string[] = []
): City[] => {
  return cities.filter(city => {
    // Text search
    const matchesSearch = !searchTerm || 
      city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (city.notes && city.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    // Category filter
    const matchesCategory = selectedCategories.length === 0 || 
      selectedCategories.includes(city.category);

    // Country filter
    const matchesCountry = selectedCountries.length === 0 || 
      selectedCountries.includes(city.country);

    // Continent filter
    const continent = city.continent || getContinent(city.country);
    const matchesContinent = selectedContinents.length === 0 || 
      selectedContinents.includes(continent);

    return matchesSearch && matchesCategory && matchesCountry && matchesContinent;
  });
}; 