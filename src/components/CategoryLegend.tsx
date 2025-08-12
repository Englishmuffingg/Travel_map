import React from 'react';
import { Card, Checkbox, Space, Typography } from 'antd';
import { CATEGORY_COLORS } from '../types';

const { Text } = Typography;

interface CategoryLegendProps {
  visibleCategories: string[];
  onCategoryToggle: (category: string, visible: boolean) => void;
  style?: React.CSSProperties;
}

const CategoryLegend: React.FC<CategoryLegendProps> = ({
  visibleCategories,
  onCategoryToggle,
  style
}) => {
  const categories = Object.keys(CATEGORY_COLORS);

  return (
    <Card 
      size="small" 
      title="类别图例" 
      style={{ 
        minWidth: '200px',
        ...style 
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {categories.map(category => (
          <div key={category} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: CATEGORY_COLORS[category],
                  marginRight: '8px',
                  border: '1px solid #d9d9d9'
                }}
              />
              <Text style={{ fontSize: '12px' }}>{category}</Text>
            </div>
            <Checkbox
              checked={visibleCategories.includes(category)}
              onChange={(e) => onCategoryToggle(category, e.target.checked)}
            />
          </div>
        ))}
      </Space>
      
      <div style={{ 
        marginTop: '12px', 
        paddingTop: '8px', 
        borderTop: '1px solid #f0f0f0',
        fontSize: '10px',
        color: '#666'
      }}>
        💡 取消勾选可隐藏对应类别的城市
      </div>
    </Card>
  );
};

export default CategoryLegend;
