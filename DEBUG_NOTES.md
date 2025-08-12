# 调试笔记 - 运行时错误修复

## 发现的主要问题及修复方案

### 1. PMTiles协议注册错误
**问题**: MapLibre GL与PMTiles版本不兼容，导致协议注册失败
**错误信息**: `Argument of type '(params: RequestParameters, callback: ResponseCallback) => Cancelable' is not assignable to parameter of type 'AddProtocolAction'`
**根本原因**: PMTiles 2.8.0版本的回调函数签名与MapLibre GL 5.6.2不匹配
**修复方案**: 
- 使用Promise包装器来适配不同的协议签名
- 添加错误处理，优雅降级到基础地图
- 添加null/undefined类型转换

### 2. 环境变量类型错误
**问题**: TypeScript无法识别`import.meta.env`属性
**错误信息**: `Property 'env' does not exist on type 'ImportMeta'`
**根本原因**: Vite环境变量类型定义缺失
**修复方案**: 使用类型断言`(import.meta as any).env`并提供默认值

### 3. 类别颜色映射错误
**问题**: 地图上的城市点显示为默认颜色，不显示类别颜色
**根本原因**: MapLibre样式表达式中的类别匹配逻辑错误，使用了错误的表达式语法
**修复方案**: 
- 重写样式表达式，使用正确的`['==', ['get', 'category'], 'CategoryName']`语法
- 添加向后兼容性支持（Wishlist -> Planned）
- 确保CATEGORY_COLORS正确导入和使用

### 4. 缺少地图点击选择功能
**问题**: 用户需要手动输入经纬度坐标
**根本原因**: 缺少地图交互功能来自动获取坐标和城市信息
**修复方案**: 
- 添加地图点击事件处理
- 实现`queryRenderedFeatures`来获取城市和国家信息
- 添加位置选择模式和用户界面反馈

### 5. 国家列表不完整
**问题**: 下拉列表中只有17个热门国家
**根本原因**: 硬编码的国家列表不够全面
**修复方案**: 
- 创建完整的ISO-3166国家参考数据文件
- 实现热门国家和完整国家列表的分组显示
- 添加搜索和过滤功能

### 6. 叠加层颜色显示修复（v2.1.0更新）
**问题**: 地图上城市标记颜色不正确，使用了错误的样式表达式
**根本原因**: 使用 `case` 表达式进行多值匹配，应该使用 `match` 表达式
**修复方案**: 
- 将 `circle-color` 表达式改为使用 `match` 语法：
  ```typescript
  'circle-color': [
    'case',
    ['has', 'point_count'], '#666666', // 聚合点颜色
    ['match', ['get', 'category'],
      'Visited', '#52c41a',     // 绿色
      'Planned', '#1890ff',     // 蓝色
      'Wishlist', '#00bcd4',    // 青色
      'Favorite', '#f5222d',    // 红色
      'Business', '#faad14',    // 橙色
      'Transit', '#722ed1',     // 紫色
      '#6d6d6d'                 // 默认灰色
    ]
  ]
  ```
- 更新 `CATEGORY_COLORS` 常量以匹配新颜色

### 7. PMTiles 层信息和属性名称
**重要信息**: 由于当前PMTiles协议暂时被禁用，以下信息基于常见的PMTiles数据结构：

**预期的层ID和属性**:
- **城市/地点层**: `cities`, `place`
  - 属性: `name`, `name_en`, `name_zh`
- **行政区层**: `admin`, `country`  
  - 属性: `name`, `name_en`, `iso_a2`

**地图点击查询逻辑**:
```typescript
// 查找城市特征
const cityFeature = renderedFeatures.find((f: any) => 
  f.layer?.id?.includes('cities') || 
  f.layer?.id?.includes('place') ||
  (f.properties?.name && f.geometry?.type === 'Point')
);

// 查找行政区特征
const adminFeature = renderedFeatures.find((f: any) => 
  f.layer?.id?.includes('admin') || 
  f.layer?.id?.includes('country') ||
  f.properties?.iso_a2 ||
  f.properties?.name_en
);
```

**注意事项**:
- 重新启用PMTiles时需要验证实际的层ID和属性名称
- 不同PMTiles数据源可能使用不同命名约定
- 建议在控制台输出 `renderedFeatures` 来检查实际数据结构

### 8. 叠加层渲染修复（v2.1.1更新）
**问题**: 叠加层标记不显示或颜色不正确
**根本原因**: 
1. 数据格式不一致：需要确保GeoJSON Feature格式正确
2. 图层顺序问题：叠加层需要放在基础图层之上
3. 类别匹配问题：需要处理大小写和空格

**修复方案**:
1. **数据标准化**: 确保保存时生成正确的GeoJSON Feature：
   ```typescript
   const feature = {
     type: "Feature",
     id: uniqueId, // 用于feature-state
     properties: { city, country, category, notes, visitDate },
     geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] }
   };
   ```

2. **图层顺序**: 使用 `map.addLayer()` 确保叠加层在最上层

3. **类别匹配**: 使用 `match` 表达式进行精确匹配：
   ```typescript
   'circle-color': [
     'match', ['get', 'category'],
     'Visited', CATEGORY_COLORS.Visited,
     'Planned', CATEGORY_COLORS.Planned,
     // ... 其他类别
     '#7f8c8d' // 默认颜色
   ]
   ```

4. **实时更新**: 使用 `setData()` 而非重建图层：
   ```typescript
   map.getSource("myCities")?.setData(featureCollection);
   ```

**调试步骤**:
1. 检查控制台输出：`myCities features: N sample: {...}`
2. 验证图层顺序：`layers: [...]`
3. 确认setData调用：`setData called, features: N`
4. 临时调试图层：红色debug-dots确认渲染路径

## 预防措施

### 依赖版本兼容性
- 在更新依赖前检查版本兼容性
- 使用适配器模式处理API变化
- 添加优雅降级机制

### 类型安全
- 为所有外部API添加类型定义
- 使用类型断言时添加运行时检查
- 定期更新TypeScript类型定义

### 用户体验
- 为所有异步操作添加加载状态
- 提供清晰的错误消息和用户反馈
- 实现功能的渐进增强

### 数据完整性
- 使用标准化的数据源（如ISO标准）
- 添加数据验证和清理逻辑
- 提供数据更新机制

## 性能优化建议

1. **延迟加载**: 大型数据集（如完整国家列表）可以按需加载
2. **缓存机制**: 对地理编码结果和地图瓦片实施缓存
3. **虚拟化**: 当城市数量超过200时启用聚合显示
4. **内存管理**: 正确清理地图事件监听器和协议注册

## 测试建议

1. **单元测试**: 为地图交互和数据处理逻辑添加测试
2. **集成测试**: 测试PMTiles协议注册和地图加载
3. **用户接受测试**: 验证地图点击选择的准确性
4. **性能测试**: 测试大量城市数据的渲染性能
