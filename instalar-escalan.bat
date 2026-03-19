@echo off
title escalaN.es - Instalador
color 0B

echo.
echo  ================================================================================
echo                         escalaN.es Coleccion
echo                    INSTALADOR AUTOMATICO
echo  ================================================================================
echo.
echo  Este script instalara todas las dependencias necesarias.
echo  Asegurate de tener instalados: Python 3.11, Node.js 20 y MongoDB 8.x
echo.
echo  Presiona cualquier tecla para continuar o CTRL+C para cancelar...
pause >nul

echo.
echo  ================================================================================
echo  [1/5] Verificando requisitos previos...
echo  ================================================================================

:: Verificar Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERROR: Python no esta instalado o no esta en el PATH.
    echo  Por favor, instala Python 3.11 desde: https://www.python.org/downloads/
    echo  IMPORTANTE: Marca la casilla "Add Python to PATH" al instalar.
    echo.
    pause
    exit /b 1
)
echo  [OK] Python encontrado

:: Verificar Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERROR: Node.js no esta instalado o no esta en el PATH.
    echo  Por favor, instala Node.js 20 LTS desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo  [OK] Node.js encontrado

:: Verificar npm
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo  ERROR: npm no esta disponible.
    echo  Por favor, reinstala Node.js desde: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo  [OK] npm encontrado

echo.
echo  ================================================================================
echo  [2/5] Creando carpeta de datos de MongoDB...
echo  ================================================================================

if not exist "C:\data\db" (
    mkdir C:\data\db
    echo  [OK] Carpeta C:\data\db creada
) else (
    echo  [OK] Carpeta C:\data\db ya existe
)

echo.
echo  ================================================================================
echo  [3/5] Creando archivos de configuracion (.env)...
echo  ================================================================================

set APP_DIR=%~dp0

:: Crear .env del frontend
echo REACT_APP_BACKEND_URL=http://localhost:8001> "%APP_DIR%frontend\.env"
echo  [OK] frontend\.env creado

:: Crear .env del backend
echo MONGO_URL=mongodb://localhost:27017> "%APP_DIR%backend\.env"
echo DB_NAME=escalan_coleccion>> "%APP_DIR%backend\.env"
echo  [OK] backend\.env creado

echo.
echo  ================================================================================
echo  [4/5] Instalando dependencias del Backend (Python)...
echo  ================================================================================
echo  Esto puede tardar unos minutos...
echo.

cd /d "%APP_DIR%backend"

:: Crear entorno virtual si no existe
if not exist "venv" (
    echo  Creando entorno virtual...
    python -m venv venv
)

:: Activar entorno virtual e instalar dependencias
call venv\Scripts\activate.bat
echo  Instalando paquetes de Python...
pip install -r requirements.txt --quiet
echo.
echo  [OK] Dependencias del Backend instaladas

echo.
echo  ================================================================================
echo  [5/5] Instalando dependencias del Frontend (Node.js)...
echo  ================================================================================
echo  Esto puede tardar varios minutos...
echo.

cd /d "%APP_DIR%frontend"

:: Instalar dependencias de npm
echo  Instalando paquetes de npm...
call npm install --legacy-peer-deps --silent 2>nul
call npm install ajv@8 --legacy-peer-deps --silent 2>nul
echo.
echo  [OK] Dependencias del Frontend instaladas

echo.
echo  ================================================================================
echo                    INSTALACION COMPLETADA
echo  ================================================================================
echo.
echo  La aplicacion se ha instalado correctamente.
echo.
echo  Para iniciar la aplicacion:
echo    - Haz doble clic en "iniciar-escalan.bat"
echo.
echo  Para cerrar la aplicacion:
echo    - Haz doble clic en "cerrar-escalan.bat"
echo.
echo  ================================================================================
echo.
echo  Presiona cualquier tecla para salir...
pause >nul
