# Railway Collection Manager - PRD

## Problem Statement Original
Aplicación para PC para gestionar una colección de modelismo ferroviario (Escala N) con base de datos dinámica, incluyendo apartado digital con decodificadores, funciones programadas, CVs y proyectos de sonido. Incluye sección de vagones/coches y sistema de backup/restore.

## User Personas
- **Coleccionista de modelismo ferroviario**: Usuario que desea catalogar y gestionar su colección de trenes escala N
- **Entusiasta DCC Digital**: Usuario interesado en documentar configuraciones de decodificadores, funciones programadas y proyectos de sonido

## Core Requirements (Static)
1. **Locomotoras** con campos:
   - Básicos: marca, modelo, referencia, tipo (eléctrica, diesel, vapor, automotor, alta velocidad)
   - **Prototipo**: esquema de pintura, matrícula/número, tipo prototipo
   - DCC: dirección, decodificador, proyecto de sonido
   - Compra: fecha, precio, estado, época, compañía ferroviaria
   - Funciones F0-F28 y modificaciones de CVs
   - Notas y fotos

2. **Vagones/Coches** (sin apartado digital): marca, modelo, referencia, tipo, fecha compra, precio, estado, época, compañía, notas, fotos

3. **Decodificadores**: marca, modelo, tipo, escala, interfaz, capacidad sonido

4. **Proyectos de Sonido**: nombre, decodificador, tipo locomotora, sonidos incluidos

5. **Backup/Restore**: Guardar y recuperar toda la base de datos en formato JSON

6. **Importación JMRI**: Importar locomotoras desde archivos XML de JMRI

## What's Been Implemented

### 11/02/2026 - Implementación JMRI Import
- ✅ **Backend endpoint** POST /api/import/jmri - Parsea archivos XML de JMRI
- ✅ **Frontend página** /jmri-import - Interfaz para subir archivos XML
- ✅ **Integración en Backup** - Tarjeta de acceso a importación JMRI
- ✅ Extracción de datos: marca (mfg), modelo (roadName), matrícula (roadNumber), dirección DCC, decodificador, CVs
- ✅ Detección automática de tipo de locomotora (eléctrica, diesel, vapor, etc.)
- ✅ Soporte para múltiples archivos XML a la vez
- ✅ Registro de importaciones en historial de backup

### Backend (FastAPI + MongoDB)
- ✅ CRUD Locomotoras con campos Prototipo (paint_scheme, registration_number, prototype_type)
- ✅ CRUD Vagones/Coches (rolling-stock)
- ✅ CRUD Decodificadores
- ✅ CRUD Proyectos de sonido
- ✅ **Backup endpoint** GET /api/backup - Exporta toda la BD
- ✅ **Restore endpoint** POST /api/restore - Restaura desde backup
- ✅ **JMRI Import endpoint** POST /api/import/jmri - Importa desde XML
- ✅ Estadísticas completas
- ✅ Historial de backups
- ✅ Configuración de recordatorios de backup

### Frontend (React + Tailwind + Shadcn UI)
- ✅ Dashboard con estadísticas
- ✅ Formulario locomotoras con **sección Prototipo**
- ✅ Vista detallada locomotoras muestra prototipo
- ✅ Sección Vagones/Coches completa
- ✅ Gestión de decodificadores
- ✅ Gestión de proyectos de sonido
- ✅ **Página Backup/Restore** con descarga, restauración e importación JMRI
- ✅ **Página JMRI Import** con upload de archivos XML
- ✅ Navegación con 6 secciones

## Testing Status - 11/02/2026
- Backend JMRI Import: 100% (11/11 pytest tests passed)
- Frontend JMRI Import: 100% (all UI elements and flows working)
- Backup/Restore: Working
- Test file: /app/backend/tests/test_jmri_import.py

## Prioritized Backlog

### P0 - Done
- [x] CRUD completo todas las entidades
- [x] Campos Prototipo en locomotoras
- [x] Sistema Backup/Restore
- [x] Dashboard con estadísticas
- [x] **Importación desde JMRI XML**

### P1 - Next Features
- [ ] Exportar catálogo a PDF
- [ ] Lista de deseos
- [ ] Ordenación de columnas

### P2 - Nice to Have
- [ ] Composiciones de trenes (locomotora + vagones)
- [ ] Importar desde CSV
- [ ] Historial de precios

## Code Architecture
```
/app
├── backend/
│   ├── server.py          # FastAPI app con todos los endpoints
│   ├── tests/
│   │   └── test_jmri_import.py  # Tests de importación JMRI
│   └── .env
├── frontend/
│   └── src/
│       ├── lib/
│       │   └── api.js     # Servicios API incluyendo importJMRI
│       ├── components/
│       │   ├── Layout.jsx # Navegación principal
│       │   └── ui/        # Componentes Shadcn
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Locomotives.jsx
│           ├── LocomotiveForm.jsx
│           ├── LocomotiveDetail.jsx
│           ├── RollingStock.jsx
│           ├── RollingStockForm.jsx
│           ├── RollingStockDetail.jsx
│           ├── Decoders.jsx
│           ├── DecoderForm.jsx
│           ├── SoundProjects.jsx
│           ├── SoundProjectForm.jsx
│           ├── BackupRestore.jsx  # Incluye enlace a JMRI Import
│           └── JMRIImport.jsx     # Página de importación JMRI
└── memory/
    └── PRD.md
```

## API Endpoints
- `GET, POST /api/locomotives`
- `GET, PUT, DELETE /api/locomotives/{id}`
- `GET, POST /api/rolling-stock`
- `GET, PUT, DELETE /api/rolling-stock/{id}`
- `GET, POST /api/decoders`
- `GET, PUT, DELETE /api/decoders/{id}`
- `GET, POST /api/sound-projects`
- `GET, PUT, DELETE /api/sound-projects/{id}`
- `GET /api/backup` - Exportar todo
- `POST /api/restore` - Restaurar desde JSON
- `GET /api/backup/history` - Historial de backups
- `POST /api/import/jmri` - Importar desde JMRI XML
- `GET /api/stats` - Estadísticas

## Next Tasks
1. Exportación a PDF del catálogo
2. Lista de deseos para modelos pendientes
