import React, { useState, useMemo } from 'react';
import { 
  Layout, 
  Input, 
  Select, 
  List, 
  Button, 
  Space, 
  Tag,
  Empty,
  Dropdown,
  Collapse
} from 'antd';
import { 
  SearchOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  EnvironmentOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { City, FilterOptions, CATEGORY_COLORS, CONTINENT_MAPPING } from '../types';

const { Sider } = Layout;
const { Option } = Select;

interface SidebarProps {
  cities: City[];
  filteredCities: City[];
  selectedCity: City | null;
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  onCityClick: (city: City) => void;
  onEditCity: (city: City) => void;
  onDeleteCity: (cityId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  cities,
  filteredCities,
  selectedCity,
  filters,
  onFilterChange,
  onCityClick,
  onEditCity,
  onDeleteCity
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Get unique values for filters
  const uniqueCategories = useMemo(() => {
    const categorySet = new Set(cities.map(city => city.category));
    return Array.from(categorySet);
  }, [cities]);
  
  const uniqueCountries = useMemo(() => {
    const countrySet = new Set(cities.map(city => city.country));
    return Array.from(countrySet).sort();
  }, [cities]);
  
  const uniqueContinents = useMemo(() => {
    const continentSet = new Set(cities.map(city => city.continent || CONTINENT_MAPPING[city.country] || 'Unknown'));
    return Array.from(continentSet).sort();
  }, [cities]);

  const handleCityAction = (action: string, city: City) => {
    switch (action) {
      case 'edit':
        onEditCity(city);
        break;
      case 'delete':
        onDeleteCity(city.id);
        break;
      case 'locate':
        onCityClick(city);
        break;
      default:
        break;
    }
  };

  const getCityMenuItems = (city: City): MenuProps['items'] => [
    {
      key: 'locate',
      icon: <EnvironmentOutlined />,
      label: '在地图上定位',
      onClick: () => handleCityAction('locate', city),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑城市',
      onClick: () => handleCityAction('edit', city),
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除城市',
      danger: true,
      onClick: () => handleCityAction('delete', city),
    },
  ];

  const clearAllFilters = () => {
    onFilterChange({
      searchTerm: '',
      selectedCategories: [],
      selectedCountries: [],
      selectedContinents: []
    });
  };

  const renderCityItem = (city: City) => {
    const isSelected = selectedCity?.id === city.id;
    const categoryColor = CATEGORY_COLORS[city.category];

    return (
      <List.Item
        key={city.id}
        style={{
          cursor: 'pointer',
          padding: '12px 16px',
          background: isSelected ? '#e6f7ff' : 'transparent',
          borderLeft: isSelected ? '3px solid #1890ff' : '3px solid transparent',
          transition: 'all 0.2s ease'
        }}
        onClick={() => onCityClick(city)}
        actions={[
          <Dropdown
            menu={{ items: getCityMenuItems(city) }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button 
              type="text" 
              icon={<MoreOutlined />} 
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        ]}
      >
        <List.Item.Meta
          avatar={
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: categoryColor,
                border: '2px solid #fff',
                boxShadow: '0 0 0 1px #d9d9d9'
              }}
            />
          }
          title={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ 
                fontWeight: 600,
                color: isSelected ? '#1890ff' : 'inherit'
              }}>
                {city.name}
              </span>
              <Tag 
                color={categoryColor} 
                style={{ fontSize: '10px' }}
              >
                {city.category}
              </Tag>
            </div>
          }
          description={
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                📍 {city.country}
              </div>
              {city.visitDate && (
                <div style={{ fontSize: '11px', color: '#999', display: 'flex', alignItems: 'center' }}>
                  <CalendarOutlined style={{ marginRight: '4px' }} />
                  {new Date(city.visitDate).toLocaleDateString('zh-CN')}
                </div>
              )}
              {city.notes && (
                <div style={{ 
                  fontSize: '11px', 
                  color: '#999', 
                  marginTop: '4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {city.notes}
                </div>
              )}
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      width={350}
      collapsedWidth={0}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        overflow: 'hidden'
      }}
      breakpoint="lg"
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Search and Filters */}
        <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0' }}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索城市、国家或备注..."
            value={filters.searchTerm}
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
            allowClear
            style={{ marginBottom: '12px' }}
          />

          <Collapse 
            ghost 
            size="small"
            items={[
              {
                key: 'filters',
                label: (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                      <FilterOutlined style={{ marginRight: '8px' }} />
                      筛选选项
                    </span>
                    {(filters.selectedCategories.length > 0 || 
                      filters.selectedCountries.length > 0 || 
                      filters.selectedContinents.length > 0) && (
                      <Tag color="blue" style={{ fontSize: '10px' }}>
                        {filters.selectedCategories.length + filters.selectedCountries.length + filters.selectedContinents.length}
                      </Tag>
                    )}
                  </div>
                ),
                children: (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <div style={{ fontSize: '12px', marginBottom: '4px', color: '#666' }}>
                        类别筛选:
                      </div>
                      <Select
                        mode="multiple"
                        placeholder="选择类别"
                        style={{ width: '100%' }}
                        value={filters.selectedCategories}
                        onChange={(value) => onFilterChange({ selectedCategories: value })}
                        maxTagCount="responsive"
                        size="small"
                      >
                        {uniqueCategories.map(category => (
                          <Option key={category} value={category}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor: CATEGORY_COLORS[category],
                                  marginRight: '8px'
                                }}
                              />
                              {category}
                            </div>
                          </Option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', marginBottom: '4px', color: '#666' }}>
                        国家筛选:
                      </div>
                      <Select
                        mode="multiple"
                        placeholder="选择国家"
                        style={{ width: '100%' }}
                        value={filters.selectedCountries}
                        onChange={(value) => onFilterChange({ selectedCountries: value })}
                        maxTagCount="responsive"
                        size="small"
                        showSearch
                      >
                        {uniqueCountries.map(country => (
                          <Option key={country} value={country}>
                            {country}
                          </Option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <div style={{ fontSize: '12px', marginBottom: '4px', color: '#666' }}>
                        大洲筛选:
                      </div>
                      <Select
                        mode="multiple"
                        placeholder="选择大洲"
                        style={{ width: '100%' }}
                        value={filters.selectedContinents}
                        onChange={(value) => onFilterChange({ selectedContinents: value })}
                        maxTagCount="responsive"
                        size="small"
                      >
                        {uniqueContinents.map(continent => (
                          <Option key={continent} value={continent}>
                            {continent}
                          </Option>
                        ))}
                      </Select>
                    </div>

                    <Button 
                      size="small" 
                      type="link" 
                      onClick={clearAllFilters}
                      style={{ padding: 0, height: 'auto' }}
                    >
                      清除所有筛选
                    </Button>
                  </Space>
                )
              }
            ]}
          />
        </div>

        {/* City List */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ 
            padding: '12px 16px', 
            borderBottom: '1px solid #f0f0f0',
            fontSize: '14px',
            fontWeight: 600,
            color: '#333'
          }}>
            城市列表 ({filteredCities.length}/{cities.length})
          </div>

          {filteredCities.length > 0 ? (
            <List
              dataSource={filteredCities}
              renderItem={renderCityItem}
              style={{ background: '#fff' }}
              split={false}
            />
          ) : (
            <div style={{ padding: '40px 20px' }}>
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  filters.searchTerm || 
                  filters.selectedCategories.length > 0 || 
                  filters.selectedCountries.length > 0 || 
                  filters.selectedContinents.length > 0
                    ? '没有找到匹配的城市'
                    : '还没有添加任何城市'
                }
              />
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div style={{ 
          padding: '12px 16px', 
          borderTop: '1px solid #f0f0f0',
          background: '#fafafa'
        }}>
          <div style={{ fontSize: '11px', color: '#666' }}>
            <div>已访问: {cities.filter(c => c.category === 'Visited').length} 个</div>
            <div>计划中: {cities.filter(c => c.category === 'Planned').length} 个</div>
            <div>最喜欢: {cities.filter(c => c.category === 'Favorite').length} 个</div>
          </div>
        </div>
      </div>
    </Sider>
  );
};

export default Sidebar; 