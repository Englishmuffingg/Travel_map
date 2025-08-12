@echo off
chcp 65001 >nul
title World Cities Map - English Launcher

echo =====================================
echo    World Cities Map Launcher
echo =====================================
echo.

:: 检查是否安装了Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found
    echo Please install Node.js: https://nodejs.org/
    echo Or use: winget install OpenJS.NodeJS
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js installed
node --version
npm --version
echo.

:: Check dependencies
if not exist node_modules (
    echo [INFO] Installing dependencies...
    echo This may take a few minutes, please wait...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install dependencies
        echo [TIPS] Possible solutions:
        echo    1. Check network connection
        echo    2. Clear npm cache: npm cache clean --force
        echo    3. Delete package-lock.json and retry
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed successfully!
    echo.
)

echo [STARTING] Development server...
echo Browser will open http://localhost:3000
echo Press Ctrl+C to stop the server
echo =====================================
echo.

:: 启动开发服务器
npm start 