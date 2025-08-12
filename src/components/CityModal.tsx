import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  message,
  Row,
  Col,
  Button,
  Space 
} from 'antd';
import { City, CONTINENT_MAPPING, CATEGORY_COLORS } from '../types';
import dayjs from 'dayjs';
import countriesData from '../data/countries.json';

const { TextArea } = Input;
const { Option } = Select;

interface CityModalProps {
  visible: boolean;
  city?: City;
  onCancel: () => void;
  onSave: (city: City) => void;
  onPickLocation?: () => void;
  isPickingLocation?: boolean;
}

const CityModal: React.FC<CityModalProps> = ({ visible, city, onCancel, onSave, onPickLocation, isPickingLocation = false }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Expose form instance globally for map click handling
  useEffect(() => {
    if (visible) {
      (window as any).currentCityForm = form;
    }
    return () => {
      (window as any).currentCityForm = null;
    };
  }, [visible, form]);

  useEffect(() => {
    if (visible) {
             if (city) {
         // Edit mode - populate form with city data
         form.setFieldsValue({
           ...city,
           lng: city.coordinates[0],
           lat: city.coordinates[1],
           visitDate: city.visitDate ? dayjs(city.visitDate) : undefined
         });
      } else {
        // Add mode - reset form
        form.resetFields();
      }
    }
  }, [visible, city, form]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Validate coordinates
      if (!isFinite(values.lng) || !isFinite(values.lat)) {
        message.error('坐标必须是有效的数字');
        return;
      }
      if (values.lng < -180 || values.lng > 180) {
        message.error('经度必须在 -180 到 180 之间');
        return;
      }
      if (values.lat < -90 || values.lat > 90) {
        message.error('纬度必须在 -90 到 90 之间');
        return;
      }
      
      // Validate country is not the same as city name
      if (values.country === values.name) {
        message.error('国家不能与城市名称相同，请重新选择国家');
        return;
      }
      
      // Auto-detect continent if not provided
      const continent = values.continent || CONTINENT_MAPPING[values.country] || 'Unknown';
      
      const cityData: City = {
        id: city?.id || `city-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: values.name,
        country: values.country,
        coordinates: [Number(values.lng), Number(values.lat)], // Ensure [lng, lat] order
        category: values.category.trim(), // Normalize category
        visitDate: values.visitDate ? values.visitDate.toISOString().split('T')[0] : undefined,
        notes: values.notes,
        continent
      };

      onSave(cityData);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Get all countries from the data file
  const allCountries = countriesData.map(country => country.name).sort();
  
  // Popular countries for quick access
  const popularCountries = [
    'China', 'United States', 'Japan', 'France', 'Germany', 'United Kingdom',
    'Italy', 'Spain', 'Australia', 'Canada', 'South Korea', 'Thailand',
    'Singapore', 'Netherlands', 'Switzerland', 'Brazil', 'India'
  ];

  // Validate coordinates
  const validateLatitude = (_: any, value: number) => {
    if (value === undefined || value === null) {
      return Promise.reject(new Error('请输入纬度'));
    }
    if (value < -90 || value > 90) {
      return Promise.reject(new Error('纬度必须在 -90 到 90 之间'));
    }
    return Promise.resolve();
  };

  const validateLongitude = (_: any, value: number) => {
    if (value === undefined || value === null) {
      return Promise.reject(new Error('请输入经度'));
    }
    if (value < -180 || value > 180) {
      return Promise.reject(new Error('经度必须在 -180 到 180 之间'));
    }
    return Promise.resolve();
  };

  return (
    <Modal
      title={city ? '编辑城市' : '添加城市'}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          category: 'Visited'
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="城市名称"
              name="name"
              rules={[{ required: true, message: '请输入城市名称' }]}
            >
              <Input placeholder="例如：北京" />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label="国家"
              name="country"
              rules={[{ required: true, message: '请输入国家名称' }]}
            >
              <Select
                placeholder="请选择或输入国家"
                showSearch
                allowClear
                filterOption={(input: string, option: any) => {
                  const children = option?.children;
                  if (typeof children === 'string') {
                    return children.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                  }
                  return false;
                }}
              >
                <Option disabled style={{ fontWeight: 'bold', color: '#1890ff' }}>
                  热门国家
                </Option>
                {popularCountries.map(country => (
                  <Option key={`popular-${country}`} value={country}>
                    🌟 {country}
                  </Option>
                ))}
                <Option disabled style={{ fontWeight: 'bold', color: '#666', marginTop: '8px' }}>
                  所有国家
                </Option>
                {allCountries.filter(country => !popularCountries.includes(country)).map(country => (
                  <Option key={country} value={country}>
                    {country}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="坐标位置">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                  type={isPickingLocation ? "primary" : "default"}
                  onClick={onPickLocation}
                  disabled={!onPickLocation}
                  style={{ width: '100%' }}
                >
                  {isPickingLocation ? "🎯 正在选择位置，请点击地图" : "📍 点击地图选择位置"}
                </Button>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="经度"
                      name="lng"
                      rules={[{ validator: validateLongitude }]}
                    >
                      <InputNumber 
                        style={{ width: '100%' }}
                        precision={6}
                        readOnly
                        placeholder="通过地图选择位置"
                      />
                    </Form.Item>
                  </Col>
                  
                  <Col span={12}>
                    <Form.Item
                      label="纬度"
                      name="lat"
                      rules={[{ validator: validateLatitude }]}
                    >
                      <InputNumber 
                        style={{ width: '100%' }}
                        precision={6}
                        readOnly
                        placeholder="通过地图选择位置"
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Space>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="类别"
              name="category"
              rules={[{ required: true, message: '请选择类别' }]}
            >
              <Select placeholder="请选择城市类别">
                {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                  <Option key={category} value={category}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          marginRight: '8px',
                          border: '1px solid #d9d9d9'
                        }}
                      />
                      {category}
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              label="访问日期"
              name="visitDate"
              extra="可选，仅用于已访问的城市"
            >
              <DatePicker 
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
                placeholder="选择访问日期"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="大洲"
          name="continent"
          extra="留空将自动根据国家推断"
        >
          <Select
            placeholder="请选择大洲（可选）"
            allowClear
          >
            <Option value="Asia">亚洲</Option>
            <Option value="Europe">欧洲</Option>
            <Option value="North America">北美洲</Option>
            <Option value="South America">南美洲</Option>
            <Option value="Africa">非洲</Option>
            <Option value="Oceania">大洋洲</Option>
            <Option value="Antarctica">南极洲</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="备注"
          name="notes"
          extra="记录您的旅行回忆、景点推荐等"
        >
          <TextArea
            rows={4}
            placeholder="分享您的旅行体验、推荐景点或其他备注..."
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>
      
      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: '#f6f8fa', 
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666'
      }}>
        💡 小贴士：您可以在 Google Maps 中搜索城市，右键点击获取精确的经纬度坐标
      </div>
    </Modal>
  );
};

export default CityModal; 