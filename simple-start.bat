@echo off
chcp 65001 >nul
title World Cities Map - 快速启动

echo 🌍 World Cities Map 快速启动器
echo ======================================
echo.

set "PATH=C:\Program Files\nodejs;%USERPROFILE%\AppData\Roaming\npm;%PATH%"

if exist node_modules (
    echo ✅ 依赖已存在
) else (
    echo 📦 安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo 🚀 启动应用...
echo 📡 服务器地址: http://localhost:3000
echo 💡 停止服务器请按 Ctrl+C
echo ======================================
echo.

npm start
pause 