@echo off
title escalaN.es - Cerrar Aplicacion
color 0C

echo.
echo  ========================================
echo     Cerrando escalaN.es Coleccion
echo  ========================================
echo.

echo Cerrando Frontend (Node.js)...
taskkill /F /IM "node.exe" /T 2>nul

echo Cerrando Backend (Python)...
taskkill /F /IM "python.exe" /T 2>nul

echo Cerrando MongoDB...
taskkill /F /IM "mongod.exe" /T 2>nul

echo.
echo  ========================================
echo     APLICACION CERRADA
echo  ========================================
echo.
echo  Todas las ventanas de comandos se han cerrado.
echo.
echo  Presiona cualquier tecla para salir...
pause >nul
