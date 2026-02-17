@echo off
title escalaN.es Coleccion - Iniciando...
color 0A

echo.
echo  ========================================
echo     escalaN.es Coleccion
echo     Sistema de Gestion de Trenes N
echo  ========================================
echo.

:: Configurar rutas
set APP_DIR=%~dp0
set BACKEND_DIR=%APP_DIR%backend
set FRONTEND_DIR=%APP_DIR%frontend
set MONGO_PATH="C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"

echo [1/4] Iniciando MongoDB...
start "MongoDB - escalaN.es" cmd /k "%MONGO_PATH% --dbpath C:\data\db"
timeout /t 5 >nul

echo.
echo [2/4] Iniciando Backend (FastAPI)...
cd /d "%BACKEND_DIR%"
start "Backend - escalaN.es" cmd /k "venv\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8001 --reload"
timeout /t 5 >nul

echo.
echo [3/4] Iniciando Frontend (React)...
cd /d "%FRONTEND_DIR%"
start "Frontend - escalaN.es" cmd /k "npm start"
timeout /t 10 >nul

echo.
echo [4/4] Abriendo navegador...
timeout /t 5 >nul
start http://localhost:3000

echo.
echo  ========================================
echo     APLICACION INICIADA
echo  ========================================
echo.
echo  La aplicacion se abrira en: http://localhost:3000
echo.
echo  Se han abierto 3 ventanas de comandos:
echo    - MongoDB (base de datos)
echo    - Backend (servidor API)
echo    - Frontend (interfaz web)
echo.
echo  Para cerrar la aplicacion, ejecuta:
echo    cerrar-escalan.bat
echo.
echo  Presiona cualquier tecla para cerrar esta ventana...
pause >nul
