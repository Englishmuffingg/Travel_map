import React, { useState } from 'react';
import { 
  Layout, 
  Button, 
  Space, 
  Dropdown, 
  Switch, 
  Upload, 
  message, 
  Modal,
  Typography 
} from 'antd';
import { 
  PlusOutlined,
  SettingOutlined,
  DownloadOutlined,
  UploadOutlined,
  BulbOutlined,
  MenuOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import type { MenuProps, UploadProps } from 'antd';
import { City, AppSettings } from '../types';
import { exportCitiesAsJSON, importCitiesFromJSON } from '../utils/storage';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

interface HeaderProps {
  settings: AppSettings;
  onSettingsChange: (settings: Partial<AppSettings>) => void;
  onAddCity: () => void;
  onImportCities: (cities: City[]) => void;
  cities: City[];
}

const Header: React.FC<HeaderProps> = ({
  settings,
  onSettingsChange,
  onAddCity,
  onImportCities,
  cities
}) => {
  const [aboutVisible, setAboutVisible] = useState(false);

  const handleExport = () => {
    if (cities.length === 0) {
      message.warning('没有城市数据可导出');
      return;
    }
    exportCitiesAsJSON(cities);
    message.success('城市数据已导出');
  };

  const uploadProps: UploadProps = {
    accept: '.json',
    showUploadList: false,
    beforeUpload: (file) => {
      importCitiesFromJSON(file)
        .then((importedCities) => {
          onImportCities(importedCities);
        })
        .catch((error) => {
          message.error(`导入失败：${error.message}`);
        });
      return false; // Prevent automatic upload
    },
  };

  const settingsItems: MenuProps['items'] = [
    {
      key: 'theme',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '160px' }}>
          <span>深色模式</span>
          <Switch
            size="small"
            checked={settings.theme.darkMode}
            onChange={(checked) => 
              onSettingsChange({ 
                theme: { ...settings.theme, darkMode: checked }
              })
            }
          />
        </div>
      ),
    },
    {
      key: 'sidebar',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '160px' }}>
          <span>显示侧边栏</span>
          <Switch
            size="small"
            checked={settings.showSidebar}
            onChange={(checked) => onSettingsChange({ showSidebar: checked })}
          />
        </div>
      ),
    },
    {
      key: 'labels',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '160px' }}>
          <span>显示城市标签</span>
          <Switch
            size="small"
            checked={settings.showCityLabels}
            onChange={(checked) => onSettingsChange({ showCityLabels: checked })}
          />
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'export',
      icon: <DownloadOutlined />,
      label: '导出数据',
      onClick: handleExport,
    },
    {
      key: 'import',
      icon: <UploadOutlined />,
      label: (
        <Upload {...uploadProps}>
          <span>导入数据</span>
        </Upload>
      ),
    },
    { type: 'divider' },
    {
      key: 'about',
      icon: <BulbOutlined />,
      label: '关于应用',
      onClick: () => setAboutVisible(true),
    },
  ];

  const quickActions: MenuProps['items'] = [
    {
      key: 'add',
      icon: <PlusOutlined />,
      label: '添加城市',
      onClick: onAddCity,
    },
    {
      key: 'export',
      icon: <DownloadOutlined />,
      label: '导出数据',
      onClick: handleExport,
    },
  ];

  return (
    <>
      <AntHeader 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: settings.theme.darkMode ? '#001529' : '#fff',
          borderBottom: `1px solid ${settings.theme.darkMode ? '#303030' : '#f0f0f0'}`,
          padding: '0 24px',
          height: '64px'
        }}
      >
        {/* Logo and Title */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <GlobalOutlined 
            style={{ 
              fontSize: '24px', 
              color: '#1890ff', 
              marginRight: '12px' 
            }} 
          />
          <Title 
            level={3} 
            style={{ 
              margin: 0, 
              color: settings.theme.darkMode ? '#fff' : '#000',
              fontWeight: 600
            }}
          >
            World Cities Map
          </Title>
          <div style={{ 
            marginLeft: '16px', 
            fontSize: '12px', 
            color: settings.theme.darkMode ? '#999' : '#666',
            display: 'flex',
            alignItems: 'center'
          }}>
            {cities.length} 个城市
          </div>
        </div>

        {/* Actions */}
        <Space size="middle">
          {/* Mobile Menu */}
          <div className="mobile-only" style={{ display: 'none' }}>
            <Dropdown 
              menu={{ items: quickActions }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button type="text" icon={<MenuOutlined />} />
            </Dropdown>
          </div>

          {/* Desktop Actions */}
          <div className="desktop-only">
            <Space size="small">
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={onAddCity}
              >
                添加城市
              </Button>
              
              <Button 
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={cities.length === 0}
              >
                导出
              </Button>

              <Dropdown 
                menu={{ items: settingsItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button icon={<SettingOutlined />}>
                  设置
                </Button>
              </Dropdown>
            </Space>
          </div>
        </Space>
      </AntHeader>

      {/* About Modal */}
      <Modal
        title="关于 World Cities Map"
        open={aboutVisible}
        onCancel={() => setAboutVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAboutVisible(false)}>
            关闭
          </Button>
        ]}
        width={500}
      >
        <div style={{ lineHeight: '1.8' }}>
          <div style={{ marginBottom: '16px' }}>
            <strong>世界城市地图</strong> - 记录您的旅行足迹
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <strong>功能特性：</strong>
          </div>
          <ul style={{ paddingLeft: '20px', color: '#666' }}>
            <li>在世界地图上可视化您访问过的城市</li>
            <li>支持多种城市类别（已访问、计划中、最喜欢等）</li>
            <li>详细的统计分析和图表展示</li>
            <li>数据本地存储，支持导入/导出</li>
            <li>响应式设计，支持深色主题</li>
            <li>搜索和筛选功能</li>
          </ul>

          <div style={{ marginTop: '16px' }}>
            <strong>技术栈：</strong>
          </div>
          <div style={{ color: '#666', fontSize: '14px' }}>
            React + TypeScript + Ant Design + MapLibre GL + PMTiles
          </div>

          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#f6f8fa', 
            borderRadius: '6px',
            fontSize: '12px',
            color: '#666'
          }}>
            💡 提示：所有数据都保存在浏览器本地，不会上传到服务器
          </div>
        </div>
      </Modal>

      {/* Responsive CSS */}
      <style>
        {`
          @media (max-width: 768px) {
            .desktop-only { display: none !important; }
            .mobile-only { display: block !important; }
          }
        `}
      </style>
    </>
  );
};

export default Header; 