@echo off
chcp 65001 >nul
title World Cities Map - 智能启动器

echo ======================================
echo    World Cities Map 智能启动器
echo ======================================
echo.

:: 设置Node.js路径到环境变量
set "PATH=C:\Program Files\nodejs;%USERPROFILE%\AppData\Roaming\npm;%PATH%"

:: 检查Node.js安装
echo [1/3] 检查Node.js环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未找到
    echo 📥 请安装 Node.js: https://nodejs.org/
    echo 💡 或使用: winget install OpenJS.NodeJS
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
node --version
npm --version
echo.

:: 检查项目依赖
echo [2/3] 检查项目依赖...
if not exist node_modules (
    echo 📦 正在安装项目依赖...
    echo ⏳ 这可能需要几分钟，请耐心等待...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        echo 💡 可能的解决方案：
        echo    1. 检查网络连接
        echo    2. 清除npm缓存: npm cache clean --force
        echo    3. 删除package-lock.json后重试
        echo.
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
)

:: 启动应用
echo [3/3] 启动开发服务器...
echo 🌍 正在启动 World Cities Map...
echo 📡 服务器将在 http://localhost:3000 启动
echo 🌐 浏览器将自动打开应用
echo.
echo 💡 停止服务器请按 Ctrl+C
echo 🎯 基于坐标的智能地名显示系统已就绪
echo ======================================
echo.

npm start

if %errorlevel% neq 0 (
    echo.
    echo ❌ 启动失败，可能的解决方案：
    echo    1. 确保端口3000未被占用
    echo    2. 删除node_modules文件夹后重新运行
    echo    3. 检查防火墙设置
    echo    4. 重启终端后重试
    echo.
    pause
) 