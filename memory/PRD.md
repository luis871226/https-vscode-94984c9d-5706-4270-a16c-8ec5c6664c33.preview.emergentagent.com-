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

7. **Lista de Deseos**: Gestión de items deseados con prioridad, precio estimado y tienda

8. **Exportación PDF**: Catálogo completo y fichas individuales de locomotoras/vagones

## What's Been Implemented

### 12/02/2026 - Nuevas Funcionalidades P1
- ✅ **Ordenamiento de Tablas**: Cabeceras clicables en Locomotoras, Vagones y Lista de Deseos
- ✅ **Exportar Catálogo PDF**: Botón en Dashboard genera PDF completo con locomotoras, vagones y resumen
- ✅ **Exportar Locomotora PDF**: Ficha individual con toda la información técnica y DCC
- ✅ **Exportar Vagón PDF**: Ficha individual de material rodante
- ✅ **Lista de Deseos Completa**: CRUD + mover a colección + ordenamiento por columnas

### 11/02/2026 - JMRI Import & Bug Fixes
- ✅ **Corrección Bug JMRI**: Mapeo correcto model→reference, roadName→model
- ✅ **Funciones JMRI**: Extracción de functionlabels, soundlabels y Project Loco Name

### Backend (FastAPI + MongoDB)
- ✅ CRUD Locomotoras con campos Prototipo
- ✅ CRUD Vagones/Coches
- ✅ CRUD Decodificadores
- ✅ CRUD Proyectos de sonido
- ✅ CRUD Lista de Deseos + mover a colección
- ✅ Backup/Restore endpoints
- ✅ JMRI Import endpoint
- ✅ PDF Export endpoints (catálogo, locomotoras, vagones)
- ✅ Estadísticas completas incluyendo wishlist

### Frontend (React + Tailwind + Shadcn UI)
- ✅ Dashboard con estadísticas y botón exportar catálogo PDF
- ✅ Tablas ordenables en Locomotoras, Vagones y Wishlist (SortableHeader component)
- ✅ Vista detallada con exportar PDF individual
- ✅ Página Lista de Deseos con ordenamiento, edición y mover a colección
- ✅ Formulario de wishlist con todos los campos

## Testing Status - 12/02/2026
- Backend: 100% (14/14 pytest tests)
- Frontend: 100% (sorting, PDF, wishlist flows)
- Test file: /app/backend/tests/test_new_features.py

## Prioritized Backlog

### P0 - Done
- [x] CRUD completo todas las entidades
- [x] Campos Prototipo en locomotoras
- [x] Sistema Backup/Restore
- [x] Dashboard con estadísticas
- [x] Importación desde JMRI XML
- [x] Exportar catálogo a PDF
- [x] Lista de deseos
- [x] Ordenación de columnas

### P1 - Next Features
- [ ] Composiciones de trenes (locomotora + vagones)
- [ ] Importar desde CSV

### P2 - Nice to Have
- [ ] Historial de precios
- [ ] Estadísticas avanzadas (gráficos)

## Code Architecture
```
/app
├── backend/
│   ├── server.py          # FastAPI app con todos los endpoints
│   ├── tests/
│   │   ├── test_jmri_import.py
│   │   └── test_new_features.py  # Tests de sorting, PDF, wishlist
│   └── .env
├── frontend/
│   └── src/
│       ├── lib/
│       │   └── api.js     # Servicios API
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── SortableHeader.jsx  # Cabeceras ordenables
│       │   └── ui/
│       └── pages/
│           ├── Dashboard.jsx       # + Exportar catálogo PDF
│           ├── Locomotives.jsx     # + Ordenamiento
│           ├── LocomotiveDetail.jsx # + Exportar PDF
│           ├── RollingStock.jsx    # + Ordenamiento
│           ├── Wishlist.jsx        # CRUD + ordenamiento
│           ├── WishlistForm.jsx
│           └── ...
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
- `GET, POST /api/wishlist`
- `GET, PUT, DELETE /api/wishlist/{id}`
- `POST /api/wishlist/{id}/move-to-collection`
- `GET /api/export/catalog/pdf`
- `GET /api/export/locomotive/{id}/pdf`
- `GET /api/export/rolling-stock/{id}/pdf`
- `GET /api/backup`
- `POST /api/restore`
- `POST /api/import/jmri`
- `GET /api/stats`

## Next Tasks
1. Composiciones de trenes (locomotora + vagones asociados)
2. Importar colección desde CSV
