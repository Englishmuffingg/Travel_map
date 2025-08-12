#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🗺️ 开始构建矢量瓦片...\n');

// 配置
const config = {
  inputDir: './data/raw',           // 原始GeoJSON数据目录
  outputDir: './public/tiles',      // 输出PMTiles目录
  tempDir: './temp',                // 临时MBTiles目录
  layers: [
    {
      name: 'cities',
      input: 'cities.geojson',
      minZoom: 0,
      maxZoom: 14,
      options: [
        '--drop-densest-as-needed',
        '--extend-zooms-if-still-dropping',
        '--simplification=10'
      ]
    },
    {
      name: 'admin',
      input: 'admin.geojson', 
      minZoom: 0,
      maxZoom: 10,
      options: [
        '--drop-densest-as-needed',
        '--extend-zooms-if-still-dropping'
      ]
    },
    {
      name: 'roads',
      input: 'roads.geojson',
      minZoom: 0,
      maxZoom: 12,
      options: [
        '--drop-densest-as-needed',
        '--extend-zooms-if-still-dropping'
      ]
    }
  ]
};

// 创建输出目录
function ensureDirectories() {
  [config.outputDir, config.tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 创建目录: ${dir}`);
    }
  });
}

// 检查依赖
function checkDependencies() {
  try {
    execSync('tippecanoe --version', { stdio: 'pipe' });
    console.log('✅ tippecanoe 已安装');
  } catch (error) {
    console.error('❌ tippecanoe 未安装');
    console.log('💡 请安装 tippecanoe:');
    console.log('   macOS: brew install tippecanoe');
    console.log('   Ubuntu: sudo apt-get install tippecanoe');
    console.log('   Windows: 请访问 https://github.com/mapbox/tippecanoe');
    process.exit(1);
  }

  try {
    execSync('pmtiles --version', { stdio: 'pipe' });
    console.log('✅ pmtiles 已安装');
  } catch (error) {
    console.error('❌ pmtiles 未安装');
    console.log('💡 请安装 pmtiles:');
    console.log('   go install github.com/protomaps/go-pmtiles/cmd/pmtiles@latest');
    process.exit(1);
  }
}

// 转换单个图层
function convertLayer(layer) {
  const inputPath = path.join(config.inputDir, layer.input);
  const mbtilesPath = path.join(config.tempDir, `${layer.name}.mbtiles`);
  const pmtilesPath = path.join(config.outputDir, `${layer.name}.pmtiles`);

  console.log(`\n🔄 处理图层: ${layer.name}`);
  
  // 检查输入文件
  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  跳过 ${layer.name}: 输入文件不存在 (${inputPath})`);
    return;
  }

  // 使用 tippecanoe 转换为 MBTiles
  console.log(`📊 转换为 MBTiles...`);
  const tippecanoeCmd = [
    'tippecanoe',
    `--output=${mbtilesPath}`,
    `--minimum-zoom=${layer.minZoom}`,
    `--maximum-zoom=${layer.maxZoom}`,
    ...layer.options,
    inputPath
  ].join(' ');

  try {
    execSync(tippecanoeCmd, { stdio: 'inherit' });
    console.log(`✅ MBTiles 转换完成: ${mbtilesPath}`);
  } catch (error) {
    console.error(`❌ MBTiles 转换失败: ${layer.name}`);
    return;
  }

  // 转换为 PMTiles
  console.log(`🔄 转换为 PMTiles...`);
  const pmtilesCmd = `pmtiles convert ${mbtilesPath} ${pmtilesPath}`;
  
  try {
    execSync(pmtilesCmd, { stdio: 'inherit' });
    console.log(`✅ PMTiles 转换完成: ${pmtilesPath}`);
    
    // 清理临时文件
    fs.unlinkSync(mbtilesPath);
    console.log(`🗑️  清理临时文件: ${mbtilesPath}`);
  } catch (error) {
    console.error(`❌ PMTiles 转换失败: ${layer.name}`);
  }
}

// 生成环境变量文件
function generateEnvFile() {
  const envContent = `# 矢量瓦片配置
# 这些URL应该指向您的PMTiles文件托管位置
VITE_CITIES_TILES_URL=./tiles/cities.pmtiles
VITE_ADMIN_TILES_URL=./tiles/admin.pmtiles
VITE_ROADS_TILES_URL=./tiles/roads.pmtiles
VITE_MAP_STYLE_URL=https://basemaps.cartocdn.com/gl/positron-gl-style/style.json

# 自定义样式配置
VITE_MAP_CENTER_LNG=0
VITE_MAP_CENTER_LAT=20
VITE_MAP_DEFAULT_ZOOM=2
`;

  fs.writeFileSync('.env.local', envContent);
  console.log('\n📝 已生成 .env.local 文件');
}

// 主函数
function main() {
  console.log('🔍 检查依赖...');
  checkDependencies();
  
  console.log('\n📁 准备目录...');
  ensureDirectories();
  
  console.log('\n🔄 开始转换图层...');
  config.layers.forEach(convertLayer);
  
  console.log('\n📝 生成配置文件...');
  generateEnvFile();
  
  console.log('\n🎉 瓦片构建完成！');
  console.log(`📁 输出目录: ${config.outputDir}`);
  console.log('💡 请将PMTiles文件部署到您的静态托管服务');
  console.log('🌐 然后更新 .env.local 中的URL配置');
}

// 运行
if (require.main === module) {
  main();
}

module.exports = { config, convertLayer }; 