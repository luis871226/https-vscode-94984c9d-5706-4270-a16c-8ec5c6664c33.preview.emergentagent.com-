@echo off
title escalaN.es Coleccion - Iniciando...
color 0A

echo.
echo  ========================================
echo     escalaN.es Coleccion
echo     Sistema de Gestion de Trenes
echo  ========================================
echo.

:: Configurar rutas (EDITA ESTAS RUTAS SEGUN TU PC)
set APP_DIR=%~dp0
set BACKEND_DIR=%APP_DIR%backend
set FRONTEND_DIR=%APP_DIR%frontend

echo [1/4] Verificando MongoDB...
:: Verificar si MongoDB esta corriendo
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo       MongoDB ya esta corriendo
) else (
    echo       Iniciando MongoDB...
    start "MongoDB" cmd /k "mongod --dbpath C:\data\db"
    timeout /t 3 >nul
)

echo.
echo [2/4] Iniciando Backend (FastAPI)...
cd /d "%BACKEND_DIR%"
start "Backend - escalaN.es" cmd /k "call venv\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8001 --reload"
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
echo  Abre tu navegador en: http://localhost:3000
echo.
echo  Para cerrar la aplicacion, cierra todas
echo  las ventanas de comandos abiertas.
echo.
echo  Presiona cualquier tecla para cerrar esta ventana...
pause >nul
