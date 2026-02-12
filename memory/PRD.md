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

9. **Composiciones de Trenes**: Asociar locomotora + vagones con orden específico

10. **Importar desde CSV**: Cargar colección desde archivos CSV con plantillas

## What's Been Implemented

### 12/02/2026 - Composiciones y CSV Import (P0)
- ✅ **Composiciones de Trenes**: CRUD completo con:
  - Nombre, tipo de servicio (pasajeros/mercancías/mixto), época
  - Selección de locomotora desde la colección existente
  - Añadir múltiples vagones con orden específico (posición)
  - Reordenar vagones con botones ▲▼
  - Vista visual de la composición con locomotora y vagones enlazados
- ✅ **Importar desde CSV**:
  - Plantillas descargables para locomotoras y vagones
  - Subir archivo CSV o pegar contenido directamente
  - Validación de campos requeridos
  - Informe de resultados con items importados y errores
- ✅ **Navegación actualizada**: Enlace "Composiciones" en navbar
- ✅ **Testing**: 100% backend (14/14 tests) + 100% frontend

### 12/02/2026 - Funcionalidades P1
- ✅ **Ordenamiento de Tablas**: Cabeceras clicables en Locomotoras, Vagones y Lista de Deseos
- ✅ **Exportar Catálogo PDF**: Botón en Dashboard genera PDF completo
- ✅ **Exportar Locomotora PDF**: Ficha individual con toda la información técnica y DCC
- ✅ **Lista de Deseos Completa**: CRUD + mover a colección + ordenamiento

### 11/02/2026 - JMRI Import & Bug Fixes
- ✅ **Corrección Bug JMRI**: Mapeo correcto model→reference, roadName→model
- ✅ **Funciones JMRI**: Extracción de functionlabels, soundlabels y Project Loco Name

### Backend (FastAPI + MongoDB)
- ✅ CRUD Locomotoras, Vagones/Coches, Decodificadores, Proyectos de sonido
- ✅ CRUD Lista de Deseos + mover a colección
- ✅ CRUD Composiciones con locomotora y vagones ordenados
- ✅ Backup/Restore endpoints
- ✅ JMRI Import endpoint
- ✅ CSV Import endpoints con plantillas
- ✅ PDF Export endpoints (catálogo, locomotoras, vagones)
- ✅ Estadísticas completas incluyendo wishlist y compositions

### Frontend (React + Tailwind + Shadcn UI)
- ✅ Dashboard con estadísticas y exportar catálogo PDF
- ✅ Tablas ordenables con SortableHeader component
- ✅ Composiciones: lista, formulario con drag&drop vagones, vista detallada visual
- ✅ CSV Import: tabs locomotoras/vagones, subir archivo o pegar, resultados
- ✅ Lista de Deseos completa

## Testing Status - 12/02/2026
- Backend: 100% (28+ pytest tests total)
- Frontend: 100% 
- Test files: 
  - /app/backend/tests/test_new_features.py
  - /app/backend/tests/test_compositions_csv.py

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
- [x] Composiciones de trenes
- [x] Importar desde CSV

### P1 - Next Features
- [ ] Historial de precios de compra
- [ ] Estadísticas avanzadas (gráficos)
- [ ] Filtros avanzados en Lista de Deseos

### P2 - Nice to Have
- [ ] Exportar composición a PDF
- [ ] Búsqueda global
- [ ] Modo oscuro

## Code Architecture
```
/app
├── backend/
│   ├── server.py          # FastAPI app con todos los endpoints
│   ├── tests/
│   │   ├── test_jmri_import.py
│   │   ├── test_new_features.py
│   │   └── test_compositions_csv.py
│   └── .env
├── frontend/
│   └── src/
│       ├── lib/
│       │   └── api.js
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── SortableHeader.jsx
│       │   └── ui/
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Locomotives.jsx
│           ├── LocomotiveDetail.jsx
│           ├── RollingStock.jsx
│           ├── Compositions.jsx       # NEW
│           ├── CompositionForm.jsx    # NEW
│           ├── CompositionDetail.jsx  # NEW
│           ├── CSVImport.jsx          # NEW
│           ├── Wishlist.jsx
│           └── ...
└── memory/
    └── PRD.md
```

## API Endpoints
### Core CRUD
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

### Compositions (NEW)
- `GET, POST /api/compositions`
- `GET, PUT, DELETE /api/compositions/{id}` (GET returns locomotive_details, wagons_details)

### Import/Export
- `GET /api/export/catalog/pdf`
- `GET /api/export/locomotive/{id}/pdf`
- `GET /api/export/rolling-stock/{id}/pdf`
- `GET /api/backup`
- `POST /api/restore`
- `POST /api/import/jmri`
- `POST /api/import/csv/locomotives` (NEW)
- `POST /api/import/csv/rolling-stock` (NEW)
- `GET /api/import/csv/template/locomotives` (NEW)
- `GET /api/import/csv/template/rolling-stock` (NEW)

### Stats
- `GET /api/stats` (includes total_compositions)

## Next Tasks
1. Historial de precios de compra
2. Estadísticas avanzadas con gráficos
