import React from 'react';
import { Card, Row, Col, Statistic, Progress, Divider } from 'antd';
import { 
  GlobalOutlined, 
  EnvironmentOutlined, 
  CalendarOutlined,
  HeartOutlined 
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { City } from '../types';
import { calculateCityStats, getCitiesTimeline } from '../utils/statistics';

interface CityStatsProps {
  cities: City[];
  filteredCities: City[];
  style?: React.CSSProperties;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CityStats: React.FC<CityStatsProps> = ({ cities, filteredCities, style }) => {
  const stats = calculateCityStats(cities);
  const filteredStats = calculateCityStats(filteredCities);
  const timeline = getCitiesTimeline(cities);



  // Prepare chart data
  const categoryData = Object.entries(stats.categoryBreakdown).map(([name, value]) => ({
    name,
    value,
    percentage: stats.totalCities > 0 ? Math.round((value / stats.totalCities) * 100) : 0
  }));

  const continentData = Object.entries(stats.continentBreakdown).map(([name, value]) => ({
    name,
    value,
    percentage: stats.totalCities > 0 ? Math.round((value / stats.totalCities) * 100) : 0
  }));

  const yearlyData = Object.entries(stats.yearlyBreakdown)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({
      year,
      count,
      name: `${year}年`
    }));

  return (
    <div style={style}>
      <Row gutter={[16, 16]}>
        {/* Main Statistics Cards */}
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="总城市数"
              value={filteredStats.totalCities}
              prefix={<EnvironmentOutlined style={{ color: '#1890ff' }} />}
              suffix={stats.totalCities !== filteredStats.totalCities ? `/ ${stats.totalCities}` : ''}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="访问国家"
              value={filteredStats.totalCountries}
              prefix={<GlobalOutlined style={{ color: '#52c41a' }} />}
              suffix={stats.totalCountries !== filteredStats.totalCountries ? `/ ${stats.totalCountries}` : ''}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="涉及大洲"
              value={filteredStats.totalContinents}
              prefix={<CalendarOutlined style={{ color: '#faad14' }} />}
              suffix={stats.totalContinents !== filteredStats.totalContinents ? `/ ${stats.totalContinents}` : ''}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="总旅程"
              value={stats.totalDistance || 0}
              suffix="公里"
              prefix={<HeartOutlined style={{ color: '#f5222d' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        {/* Category Breakdown */}
        <Col xs={24} lg={8}>
          <Card 
            title="城市类别分布" 
            size="small"
            style={{ height: 'auto', minHeight: '400px' }}
          >
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}个`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                暂无数据
              </div>
            )}
            
            <Divider style={{ margin: '12px 0' }} />
            
            {categoryData.map((item, index) => (
              <div key={item.name} style={{ marginBottom: '8px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  fontSize: '12px'
                }}>
                  <span>{item.name}</span>
                  <span>{item.value} 个</span>
                </div>
                <Progress 
                  percent={item.percentage} 
                  size="small" 
                  strokeColor={COLORS[index % COLORS.length]}
                  showInfo={false}
                />
              </div>
            ))}
          </Card>
        </Col>

        {/* Continent Distribution */}
        <Col xs={24} lg={8}>
          <Card 
            title="大洲分布" 
            size="small"
            style={{ height: 'auto', minHeight: '400px' }}
          >
            {continentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={continentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1890ff" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                暂无数据
              </div>
            )}
          </Card>
        </Col>

        {/* Yearly Timeline */}
        <Col xs={24} lg={8}>
          <Card 
            title="访问时间线" 
            size="small"
            style={{ height: 'auto', minHeight: '400px' }}
          >
            {yearlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#52c41a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                暂无访问记录
              </div>
            )}
            
            <Divider style={{ margin: '12px 0' }} />
            
            {/* Recent visits */}
            <div style={{ maxHeight: '80px', overflowY: 'auto' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                最近访问:
              </div>
              {timeline.slice(0, 3).map((city, index) => (
                <div key={city.id} style={{ 
                  fontSize: '11px', 
                  color: '#666',
                  marginBottom: '2px'
                }}>
                  {index + 1}. {city.name} ({new Date(city.visitDate!).getFullYear()})
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CityStats; 