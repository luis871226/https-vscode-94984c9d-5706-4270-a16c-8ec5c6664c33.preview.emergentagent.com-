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

:: Verificar si MongoDB ya esta corriendo
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [1/4] MongoDB ya esta corriendo...
) else (
    echo [1/4] Iniciando MongoDB...
    start /MIN "MongoDB" cmd /c "%MONGO_PATH% --dbpath C:\data\db"
    timeout /t 3 >nul
)

echo [2/4] Iniciando Backend (FastAPI)...
cd /d "%BACKEND_DIR%"
start /MIN "Backend" cmd /c "venv\Scripts\activate && uvicorn server:app --host 0.0.0.0 --port 8001"
timeout /t 4 >nul

echo [3/4] Iniciando Frontend (React)...
cd /d "%FRONTEND_DIR%"
start /MIN "Frontend" cmd /c "set BROWSER=none && npm start"
timeout /t 8 >nul

echo [4/4] Abriendo navegador...
start http://localhost:3000

echo.
echo  ========================================
echo     APLICACION INICIADA
echo  ========================================
echo.
echo  La aplicacion esta disponible en:
echo  http://localhost:3000
echo.
echo  Las ventanas de servidor estan minimizadas.
echo  Para cerrar todo, ejecuta: cerrar-escalan.bat
echo.
echo  Presiona cualquier tecla para cerrar esta ventana...
pause >nul
