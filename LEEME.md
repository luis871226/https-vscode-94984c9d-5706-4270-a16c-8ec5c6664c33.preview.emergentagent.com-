# escalaN.es Colección - Instalación en Windows

## Requisitos Previos

Antes de ejecutar la aplicación, instala:

1. **Node.js v18+**: https://nodejs.org (versión LTS)
2. **Python 3.9+**: https://python.org (marca "Add to PATH")
3. **MongoDB Community**: https://www.mongodb.com/try/download/community

## Instalación (solo la primera vez)

### 1. Crear carpeta de datos de MongoDB
```cmd
mkdir C:\data\db
```

### 2. Instalar dependencias del Backend
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Instalar dependencias del Frontend
```cmd
cd frontend
npm install
```

## Ejecutar la Aplicación

### Opción 1: Doble clic
- **Iniciar**: Doble clic en `iniciar-escalan.bat`
- **Cerrar**: Doble clic en `cerrar-escalan.bat`

### Opción 2: Manual
Abre 3 terminales:

**Terminal 1 - MongoDB:**
```cmd
mongod --dbpath C:\data\db
```

**Terminal 2 - Backend:**
```cmd
cd backend
venv\Scripts\activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

**Terminal 3 - Frontend:**
```cmd
cd frontend
npm start
```

## Acceder a la Aplicación

Abre tu navegador en: **http://localhost:3000**

## Solución de Problemas

### MongoDB no inicia
- Verifica que la carpeta `C:\data\db` existe
- Ejecuta CMD como Administrador

### Error de Python
- Verifica que Python está en el PATH: `python --version`
- Reinstala Python marcando "Add to PATH"

### Error de Node.js
- Verifica la instalación: `node --version`
- Debe mostrar v18 o superior

### Puerto en uso
- Backend usa puerto 8001
- Frontend usa puerto 3000
- Cierra otras aplicaciones que usen estos puertos

## Estructura de Archivos

```
escalaN-coleccion/
├── iniciar-escalan.bat    <- Doble clic para iniciar
├── cerrar-escalan.bat     <- Doble clic para cerrar
├── LEEME.md               <- Este archivo
├── backend/
│   ├── server.py
│   ├── requirements.txt
│   ├── .env
│   └── venv/              <- Se crea en la instalación
└── frontend/
    ├── package.json
    ├── .env
    ├── node_modules/      <- Se crea en la instalación
    └── src/
```

## Contacto

Aplicación creada con Emergent (https://emergentagent.com)
