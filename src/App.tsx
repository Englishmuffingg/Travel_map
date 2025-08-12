import React, { useState, useEffect, useCallback } from 'react';
import { Layout, ConfigProvider, theme, message } from 'antd';
import { City, AppSettings, FilterOptions } from './types';
import { loadCities, saveCities, loadSettings, saveSettings } from './utils/storage';
import { filterCities } from './utils/statistics';
import VectorTileMap from './components/VectorTileMap';
import CityStats from './components/CityStats';
import Sidebar from './components/Sidebar';
import CityModal from './components/CityModal';
import Header from './components/Header';
import initialCities from './data/myCities.json';
import countriesData from './data/countries.json';

const { Content } = Layout;

const App: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [settings, setSettings] = useState<AppSettings>();
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingCity, setEditingCity] = useState<City | undefined>();
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    selectedCategories: [],
    selectedCountries: [],
    selectedContinents: [],
    dateRange: {}
  });

  // Load data on mount
  useEffect(() => {
    const loadedSettings = loadSettings();
    setSettings(loadedSettings);
    
    const loadedCities = loadCities();
    if (loadedCities.length > 0) {
      setCities(loadedCities);
    } else {
      // Initialize with sample data
      setCities(initialCities as City[]);
      saveCities(initialCities as City[]);
    }
  }, []);

  // Apply filters when cities or filters change
  useEffect(() => {
    if (cities.length > 0) {
      const filtered = filterCities(
        cities, 
        filters.searchTerm,
        filters.selectedCategories,
        filters.selectedCountries,
        filters.selectedContinents
      );
      setFilteredCities(filtered);
    }
  }, [cities, filters]);

  // Save cities whenever they change
  useEffect(() => {
    if (cities.length > 0) {
      saveCities(cities);
    }
  }, [cities]);

  // Save settings whenever they change
  useEffect(() => {
    if (settings) {
      saveSettings(settings);
    }
  }, [settings]);

  const handleAddCity = useCallback(() => {
    setEditingCity(undefined);
    setModalVisible(true);
  }, []);

  const handleEditCity = useCallback((city: City) => {
    setEditingCity(city);
    setModalVisible(true);
  }, []);

  const handleDeleteCity = useCallback((cityId: string) => {
    setCities(prev => prev.filter(city => city.id !== cityId));
    message.success('城市已删除');
  }, []);

  const handleSaveCity = useCallback((cityData: City) => {
    if (editingCity) {
      // Edit existing city
      setCities(prev => prev.map(city => 
        city.id === editingCity.id ? { ...cityData, id: editingCity.id } : city
      ));
      message.success('城市信息已更新');
    } else {
      // Add new city
      const newCity: City = {
        ...cityData,
        id: cityData.id || `${cityData.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
      };
      setCities(prev => [...prev, newCity]);
      message.success('城市已添加');
    }
    setModalVisible(false);
    setEditingCity(undefined);
  }, [editingCity]);

  const handleMarkerClick = useCallback((city: City) => {
    setSelectedCity(city);
  }, []);

  const handleMapClick = useCallback((lng: number, lat: number, cityName?: string, country?: string) => {
    if (isPickingLocation) {
      // Auto-fill form with picked coordinates and any detected city/country info
      const form = document.querySelector('.ant-form') as any;
      if (form) {
        // Use Ant Form instance to set values
        const formInstance = (window as any).currentCityForm;
        if (formInstance) {
          const values: any = {
            lng: Number(lng.toFixed(6)),
            lat: Number(lat.toFixed(6))
          };
          
          if (cityName) {
            values.name = cityName;
          }
          
          if (country) {
            values.country = country;
            // Auto-detect continent
            const continent = countriesData.find(c => 
              c.name.toLowerCase() === country.toLowerCase() ||
              c.code.toLowerCase() === country.toLowerCase()
            )?.continent;
            if (continent) {
              values.continent = continent;
            }
          }
          
          formInstance.setFieldsValue(values);
        }
      }
      
      setIsPickingLocation(false);
      message.success(cityName ? `已选择位置：${cityName}` : '已选择位置');
    }
  }, [isPickingLocation]);

  const handlePickLocation = useCallback(() => {
    setIsPickingLocation(true);
    message.info('请在地图上点击选择位置');
  }, []);

  // 处理地图上城市标签或国家多边形点击
  const handleMapLabelClick = useCallback((lng: number, lat: number, cityName?: string, country?: string) => {
    setEditingCity(undefined);
    setModalVisible(true);
    
    // 延迟一帧来确保模态框已经打开并且表单已经初始化
    setTimeout(() => {
      const formInstance = (window as any).currentCityForm;
      if (formInstance) {
        const values: any = {
          lng: Number(lng.toFixed(6)),
          lat: Number(lat.toFixed(6))
        };
        if (cityName) {
          values.name = cityName;
        }
        if (country && country !== cityName) { // 确保国家不是城市名称
          values.country = country;
          // 根据国家推断大洲
          const continent = countriesData.find(c =>
            c.name.toLowerCase() === country.toLowerCase() ||
            c.code.toLowerCase() === country.toLowerCase()
          )?.continent;
          if (continent) {
            values.continent = continent;
          }
        } else if (country === cityName) {
          // 如果国家与城市名称相同，清空国家字段
          values.country = undefined;
          message.warning('无法自动推断国家，请手动选择');
        }
        formInstance.setFieldsValue(values);
      }
    }, 100);
    
    message.success(cityName ? `已预填城市：${cityName}` : '已预填位置信息');
  }, []);



  const handleFilterChange = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleSettingsChange = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => prev ? { ...prev, ...newSettings } : loadSettings());
  }, []);

  const handleImportCities = useCallback((importedCities: City[]) => {
    setCities(importedCities);
    message.success(`成功导入 ${importedCities.length} 个城市`);
  }, []);

  if (!settings) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: settings.theme.darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div data-theme={settings.theme.darkMode ? 'dark' : 'light'}>
        <Layout style={{ minHeight: '100vh' }}>
          <Header
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onAddCity={handleAddCity}
            onImportCities={handleImportCities}
            cities={cities}
          />
          
          <Layout>
            {settings.showSidebar && (
              <Sidebar
                cities={cities}
                filteredCities={filteredCities}
                selectedCity={selectedCity}
                filters={filters}
                onFilterChange={handleFilterChange}
                onCityClick={handleMarkerClick}
                onEditCity={handleEditCity}
                onDeleteCity={handleDeleteCity}
              />
            )}
            
            <Layout style={{ background: settings.theme.darkMode ? '#141414' : '#f0f2f5' }}>
              <Content style={{ margin: 0, background: 'transparent' }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%',
                  padding: '16px'
                }}>
                  <CityStats 
                    cities={cities} 
                    filteredCities={filteredCities}
                    style={{ marginBottom: '16px' }}
                  />
                  
                  <div style={{ 
                    flex: 1, 
                    minHeight: '500px',
                    background: '#fff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                                      <VectorTileMap
                    cities={filteredCities}
                    selectedCity={selectedCity}
                    onCitySelect={handleMarkerClick}
                    settings={settings}
                    onMapClick={handleMapClick}
                    onMapLabelClick={handleMapLabelClick}
                    isPickingLocation={isPickingLocation}
                  />
                  </div>
                </div>
              </Content>
            </Layout>
          </Layout>
          
          <CityModal
            visible={modalVisible}
            city={editingCity}
            onCancel={() => {
              setModalVisible(false);
              setEditingCity(undefined);
              setIsPickingLocation(false);
            }}
            onSave={handleSaveCity}
            onPickLocation={handlePickLocation}
            isPickingLocation={isPickingLocation}
          />
        </Layout>
      </div>
    </ConfigProvider>
  );
};

export default App; 