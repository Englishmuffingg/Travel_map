import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { City, AppSettings, CATEGORY_COLORS } from '../types';
import CategoryLegend from './CategoryLegend';
import 'maplibre-gl/dist/maplibre-gl.css';

// 暂时注释掉PMTiles导入以避免兼容性问题
// let PMTiles: any, Protocol: any;
// try {
//   const pmtilesModule = require('pmtiles');
//   PMTiles = pmtilesModule.PMTiles;
//   Protocol = pmtilesModule.Protocol;
// } catch (error) {
//   console.warn('PMTiles不可用，将使用基础地图:', error);
// }

interface VectorTileMapProps {
  cities: City[];
  selectedCity: City | null;
  onCitySelect: (city: City) => void;
  settings: AppSettings;
  onMapClick?: (lng: number, lat: number, cityName?: string, country?: string) => void;
  onMapLabelClick?: (lng: number, lat: number, cityName?: string, country?: string) => void;
  isPickingLocation?: boolean;
}

const VectorTileMap: React.FC<VectorTileMapProps> = ({
  cities,
  selectedCity,
  onCitySelect,
  settings,
  onMapClick,
  onMapLabelClick,
  isPickingLocation = false
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pmTilesRegistered, setPmTilesRegistered] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState<string[]>(Object.keys(CATEGORY_COLORS));
  const lastSelectedIdRef = useRef<string | null>(null);

  const handleCategoryToggle = (category: string, visible: boolean) => {
    setVisibleCategories(prev => 
      visible 
        ? [...prev, category]
        : prev.filter(c => c !== category)
    );
    
    // 更新地图过滤器
    if (map.current && map.current.getLayer('myCities-circle')) {
      const allowed = visible 
        ? [...visibleCategories, category]
        : visibleCategories.filter(c => c !== category);
      
      if (allowed.length === 0) {
        // 如果没有类别被选中，隐藏所有点
        map.current.setFilter('myCities-circle', ['==', ['get', 'id'], 'none']);
      } else {
        // 显示选中的类别
        map.current.setFilter('myCities-circle', [
          'all',
          ['!', ['has', 'point_count']],
          ['in', ['get', 'category'], ['literal', allowed]]
        ]);
      }
    }
  };

  // 暂时跳过PMTiles协议注册，直接使用基础地图
  useEffect(() => {
    if (pmTilesRegistered) return;
    
    console.log('⚠️ 暂时跳过PMTiles协议注册，使用基础地图');
    setPmTilesRegistered(true);
  }, [pmTilesRegistered]);

  // 初始化地图
  useEffect(() => {
    if (!mapContainer.current || map.current || !pmTilesRegistered) return;

    console.log('🗺️ 初始化MapLibre地图...');

    // 获取环境变量配置
    const mapStyleUrl = (import.meta as any).env?.VITE_MAP_STYLE_URL || 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
    const centerLng = Number((import.meta as any).env?.VITE_MAP_CENTER_LNG) || 0;
    const centerLat = Number((import.meta as any).env?.VITE_MAP_CENTER_LAT) || 20;
    const defaultZoom = Number((import.meta as any).env?.VITE_MAP_DEFAULT_ZOOM) || 2;

    // 创建地图实例
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyleUrl,
      center: [centerLng, centerLat],
      zoom: defaultZoom,
      attributionControl: undefined
    });

    // 添加导航控件
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // 地图加载完成事件
    map.current.on('load', () => {
      console.log('✅ 地图加载完成');
      setMapLoaded(true);
    });

    // 清理函数
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [pmTilesRegistered]);

  // 添加/更新用户城市覆盖层（使用 setData 而非每次重建）
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // 准备用户城市数据，只显示可见类别的城市
    const filteredCities = cities.filter(city => visibleCategories.includes(city.category));
    const featureCollection = {
      type: 'FeatureCollection' as const,
      features: filteredCities.map(city => ({
        type: 'Feature' as const,
        id: city.id, // 顶层id用于feature-state
        geometry: {
          type: 'Point' as const,
          coordinates: city.coordinates
        },
        properties: {
          id: city.id,
          name: city.name,
          country: city.country,
          category: city.category,
          visitDate: city.visitDate,
          notes: city.notes
        }
      }))
    };

    console.info('myCities features:', featureCollection.features.length, 'sample:', featureCollection.features[featureCollection.features.length - 1]);

    // 创建源（仅首次）
    if (!map.current.getSource('myCities')) {
      map.current.addSource('myCities', {
        type: 'geojson',
        data: featureCollection,
        cluster: filteredCities.length >= 200,
        clusterMaxZoom: 14,
        clusterRadius: 50
      });

      // 非聚合点图层（置于最上层）
      // 将层放到最上方，避免被底图遮挡
      map.current.addLayer({
        id: 'myCities-circle',
        type: 'circle',
        source: 'myCities',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match', ['get', 'category'],
            'Visited', CATEGORY_COLORS.Visited,
            'Planned', CATEGORY_COLORS.Planned,
            'Wishlist', CATEGORY_COLORS.Wishlist,
            'Favorite', CATEGORY_COLORS.Favorite,
            'Business', CATEGORY_COLORS.Business,
            'Transit', CATEGORY_COLORS.Transit,
            '#7f8c8d'
          ],
          'circle-opacity': 0.95,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1,
          'circle-radius': [
            'case',
            ['feature-state', 'selected'], 9,
            8
          ]
        }
      });

      // 聚合圆圈
      map.current.addLayer({
        id: 'myCities-clusters',
        type: 'circle',
        source: 'myCities',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#666666',
          'circle-radius': 12,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1
        }
      });

      // 聚合数量
      map.current.addLayer({
        id: 'myCities-cluster-count',
        type: 'symbol',
        source: 'myCities',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Bold'],
          'text-size': 12
        },
        paint: {
          'text-color': '#ffffff'
        }
      });

      // 打印层顺序，便于诊断
      try {
        console.info('layers:', map.current.getStyle().layers?.map(l => l.id));
      } catch {}
      
        if (process.env.NODE_ENV !== 'production') {
          // 临时调试图层（固定红色）确认渲染路径
          map.current.addLayer({
            id: 'debug-dots',
            type: 'circle',
            source: 'myCities',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#ff0000',
              'circle-radius': 8,
              'circle-opacity': 1
            }
          });
        }
    } else {
      // 更新数据
      (map.current.getSource('myCities') as maplibregl.GeoJSONSource).setData(featureCollection as any);
      console.info('setData called, features:', featureCollection.features.length);
    }

    // 处理选中高亮（feature-state）
    if (lastSelectedIdRef.current && lastSelectedIdRef.current !== selectedCity?.id) {
      map.current.setFeatureState({ source: 'myCities', id: lastSelectedIdRef.current }, { selected: false });
      lastSelectedIdRef.current = null;
    }
    if (selectedCity?.id) {
      map.current.setFeatureState({ source: 'myCities', id: selectedCity.id }, { selected: true });
      lastSelectedIdRef.current = selectedCity.id;
    }

  }, [mapLoaded, cities, visibleCategories, selectedCity]);

  // 处理地图点击事件
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const features = (e as any).features;
      const { lng, lat } = e.lngLat;
      
      // 查询渲染的特征以获取城市名称和国家信息
      const renderedFeatures = map.current!.queryRenderedFeatures(e.point);
      
      // 如果正在选择位置模式
      if (isPickingLocation && onMapClick) {
        let cityName: string | undefined;
        let country: string | undefined;
        
        // 查找城市图层的特征
        const cityFeature = renderedFeatures.find((f: any) => 
          f.layer?.id?.includes('cities') || 
          f.layer?.id?.includes('place') ||
          f.properties?.name
        );
        
        if (cityFeature && cityFeature.properties?.name) {
          cityName = cityFeature.properties.name;
        }
        
        // 查找行政区图层的特征
        const adminFeature = renderedFeatures.find((f: any) => 
          f.layer?.id?.includes('admin') || 
          f.layer?.id?.includes('country') ||
          f.properties?.iso_a2 ||
          f.properties?.name_en
        );
        
        if (adminFeature && adminFeature.properties) {
          country = adminFeature.properties.name_en || 
                   adminFeature.properties.name || 
                   adminFeature.properties.iso_a2;
        }
        
        onMapClick(lng, lat, cityName, country);
        return;
      }
      
      // 检查是否点击了用户城市标记
      if (features && features.length > 0) {
        const userCityFeature = features.find((f: any) => f.source === 'user-cities');
        if (userCityFeature && userCityFeature.properties) {
          const city = cities.find(c => c.id === userCityFeature.properties.id);
          if (city) {
            onCitySelect(city);
            
            // 平滑移动到选中的城市
            map.current!.flyTo({
              center: city.coordinates,
              zoom: Math.max(map.current!.getZoom(), 8),
              duration: 1000
            });
            return;
          }
        }
      }
      
      // 检查是否点击了城市标签或国家多边形（用于快速添加城市）
      if (onMapLabelClick) {
        let cityName: string | undefined;
        let country: string | undefined;
        
        // 查找城市标签特征
        const cityFeature = renderedFeatures.find((f: any) => 
          f.layer?.id?.includes('cities') || 
          f.layer?.id?.includes('place') ||
          (f.properties?.name && f.geometry?.type === 'Point')
        );
        
        if (cityFeature && cityFeature.properties?.name) {
          cityName = cityFeature.properties.name;
        }
        
        // 查找国家/行政区特征
        const adminFeature = renderedFeatures.find((f: any) => 
          f.layer?.id?.includes('admin') || 
          f.layer?.id?.includes('country') ||
          f.properties?.iso_a2 ||
          f.properties?.name_en
        );
        
        if (adminFeature && adminFeature.properties) {
          country = adminFeature.properties.name_en || 
                   adminFeature.properties.name || 
                   adminFeature.properties.iso_a2;
        }
        
        // 只有当找到城市名称或国家信息时才触发回调
        if (cityName || country) {
          onMapLabelClick(lng, lat, cityName, country);
          return;
        }
      }
    };

    map.current.on('click', handleClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleClick);
      }
    };
  }, [cities, onCitySelect, mapLoaded, isPickingLocation, onMapClick, onMapLabelClick]);

  // 添加鼠标悬停效果
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const features = map.current!.queryRenderedFeatures(e.point);
      
      // 检查是否悬停在可点击的图层上
      const clickableFeature = features.find((f: any) => 
        f.source === 'user-cities' ||
        f.layer?.id?.includes('cities') || 
        f.layer?.id?.includes('place') ||
        f.layer?.id?.includes('admin') || 
        f.layer?.id?.includes('country') ||
        (f.properties?.name && (f.geometry?.type === 'Point' || f.properties?.iso_a2))
      );
      
      if (clickableFeature) {
        map.current!.getCanvas().style.cursor = 'pointer';
      } else {
        map.current!.getCanvas().style.cursor = '';
      }
    };

    map.current.on('mousemove', handleMouseMove);

    return () => {
      if (map.current) {
        map.current.off('mousemove', handleMouseMove);
      }
    };
  }, [mapLoaded]);

  // 处理聚合点点击
  useEffect(() => {
    if (!map.current || !mapLoaded || cities.length < 200) return;

    const handleClusterClick = (e: maplibregl.MapMouseEvent) => {
      const features = (e as any).features;
      if (features && features[0].properties.cluster_id) {
        const clusterId = features[0].properties.cluster_id;
        const source = map.current!.getSource('user-cities') as maplibregl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId).then((zoom: any) => {
          map.current!.easeTo({
            center: (features[0].geometry as any).coordinates,
            zoom: zoom,
            duration: 500
          });
        }).catch(() => {
          // 忽略错误
        });
      }
    };

    map.current.on('click', 'user-cities-clusters', handleClusterClick);

    return () => {
      if (map.current) {
        map.current.off('click', 'user-cities-clusters', handleClusterClick);
      }
    };
  }, [mapLoaded, cities.length]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div 
        ref={mapContainer} 
        style={{ 
          width: '100%', 
          height: '100%',
          borderRadius: '8px',
          overflow: 'hidden'
        }} 
      />
      
      {/* 类别图例 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <CategoryLegend
          visibleCategories={visibleCategories}
          onCategoryToggle={handleCategoryToggle}
        />
      </div>

      {/* 地图信息面板 */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: settings.theme.darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
        padding: '12px 16px',
        borderRadius: '8px',
        fontSize: '12px',
        color: settings.theme.darkMode ? '#ffffff' : '#000000',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${settings.theme.darkMode ? '#374151' : '#e5e7eb'}`
      }}>
        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
          🗺️ 矢量瓦片地图
        </div>
        <div style={{ fontSize: '11px', opacity: 0.8 }}>
          {isPickingLocation ? (
            <>
              🎯 点击地图选择位置 | 
              💡 将自动获取城市和国家信息
            </>
          ) : cities.length > 0 ? (
            <>
              📍 {cities.filter(city => visibleCategories.includes(city.category)).length}/{cities.length} 个城市 | 
              🎯 选中: {selectedCity ? selectedCity.name : '无'} |
              {cities.length >= 200 && ' 🗂️ 聚合已启用'}
            </>
          ) : (
            '📝 暂无城市数据'
          )}
        </div>
        <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px' }}>
          🌍 PMTiles 矢量瓦片 | ⚡ 按需加载 | 🎨 实时样式
        </div>
      </div>
    </div>
  );
};

export default VectorTileMap; 