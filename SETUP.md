# 环境设置指南 🔧

## 1. 安装 Node.js

由于您的系统中尚未安装 Node.js，请按以下步骤安装：

### Windows 用户

1. **下载 Node.js**
   - 访问 [Node.js 官网](https://nodejs.org/)
   - 下载 LTS 版本（推荐）
   - 选择 Windows Installer (.msi) 64-bit

2. **安装 Node.js**
   - 运行下载的 .msi 文件
   - 按照安装向导操作
   - 确保勾选 "Add to PATH" 选项

3. **验证安装**
   ```bash
   # 在新的 PowerShell 或命令提示符中运行
   node --version
   npm --version
   ```

## 2. 启动项目

安装 Node.js 后，在项目目录中运行：

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start
```

## 3. 访问应用

- 开发服务器启动后，浏览器将自动打开 http://localhost:3000
- 如果没有自动打开，请手动访问该地址

## 4. 构建生产版本

```bash
# 构建优化后的生产版本
npm run build

# 构建文件将在 build/ 目录中
```

## 故障排除

### Node.js 安装问题
- 确保从官网下载最新的 LTS 版本
- 重启 PowerShell 或命令提示符
- 以管理员权限运行安装程序

### 依赖安装失败
```bash
# 清除 npm 缓存
npm cache clean --force

# 删除 node_modules 并重新安装
rm -rf node_modules package-lock.json
npm install
```

### 端口被占用
如果 3000 端口被占用，React 会自动选择其他端口（如 3001）

## 推荐开发工具

- **VS Code**: 推荐的代码编辑器
- **React DevTools**: 浏览器扩展，用于调试 React 应用
- **Chrome DevTools**: 用于调试和性能分析

## 系统要求

- Node.js 14.0 或更高版本
- npm 6.0 或更高版本
- 现代浏览器（Chrome、Firefox、Safari、Edge）

---

安装完成后，您就可以开始使用 World Cities Map 应用了！🚀 