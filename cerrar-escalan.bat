@echo off
title escalaN.es - Cerrar Aplicacion
color 0C

echo.
echo  ========================================
echo     Cerrando escalaN.es Coleccion
echo  ========================================
echo.

echo Cerrando Frontend...
taskkill /F /IM "node.exe" /T 2>nul

echo Cerrando Backend...
taskkill /F /FI "WINDOWTITLE eq Backend*" /T 2>nul

echo.
echo  ========================================
echo     APLICACION CERRADA
echo  ========================================
echo.
echo Presiona cualquier tecla para salir...
pause >nul
