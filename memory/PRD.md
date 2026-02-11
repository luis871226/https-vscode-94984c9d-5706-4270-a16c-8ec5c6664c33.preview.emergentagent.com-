# Railway Collection Manager - PRD

## Problem Statement Original
Aplicación para PC para gestionar una colección de modelismo ferroviario (Escala N) con base de datos dinámica, incluyendo apartado digital con decodificadores, funciones programadas, CVs y proyectos de sonido. Incluye sección de vagones y coches de viajeros.

## User Personas
- **Coleccionista de modelismo ferroviario**: Usuario que desea catalogar y gestionar su colección de trenes escala N
- **Entusiasta DCC Digital**: Usuario interesado en documentar configuraciones de decodificadores, funciones programadas y proyectos de sonido

## Core Requirements (Static)
1. Gestión de locomotoras con campos: marca, modelo, referencia, **tipo de locomotora** (eléctrica, diesel, vapor, automotor, alta velocidad), dirección DCC, decodificador, proyecto de sonido, fecha compra, precio, estado, época, compañía ferroviaria, notas, fotos
2. Gestión de funciones programadas F0-F28 con descripción y tipo (sonido/no sonido)
3. Seguimiento de modificaciones de CVs
4. Catálogo de decodificadores con especificaciones técnicas
5. Gestión de proyectos de sonido
6. **Sección de Vagones y Coches** (sin apartado digital): marca, modelo, referencia, tipo (vagón mercancías, coche viajeros, furgón), fecha compra, precio, estado, época, compañía, notas, fotos
7. Dashboard con estadísticas de la colección
8. Subida de fotos
9. Tema visual claro

## What's Been Implemented - 11/02/2026

### Backend (FastAPI + MongoDB)
- ✅ API CRUD locomotoras con campo locomotive_type
- ✅ API CRUD vagones/coches (rolling-stock) - sin apartado digital
- ✅ API CRUD decodificadores
- ✅ API CRUD proyectos de sonido
- ✅ Estadísticas con locomotoras por tipo y vagones por tipo
- ✅ Valor total incluye locomotoras + vagones

### Frontend (React + Tailwind + Shadcn UI)
- ✅ Dashboard con 4 estadísticas: locomotoras, vagones/coches, decodificadores, valor total
- ✅ Navegación completa con 5 secciones
- ✅ Lista locomotoras con campo "Tipo de Locomotora"
- ✅ Formulario locomotora con selector de tipo (eléctrica, diesel, vapor, automotor, alta velocidad)
- ✅ **Nueva sección Vagones y Coches**:
  - Lista con filtros por tipo y estado
  - Formulario sin campos digitales (sin DCC, decodificador, funciones, CVs)
  - Vista detallada
- ✅ Gestión completa de decodificadores
- ✅ Gestión completa de proyectos de sonido
- ✅ Tema claro "Collector's Studio"

## Testing Status - 11/02/2026
- Backend: 93.8% tests passed
- Frontend: 95% functional
- All CRUD operations working

## Prioritized Backlog

### P0 - Done
- [x] CRUD Locomotoras con tipo
- [x] CRUD Vagones/Coches (rolling-stock)
- [x] CRUD Decodificadores
- [x] CRUD Proyectos Sonido
- [x] Dashboard con estadísticas

### P1 - Next Features
- [ ] Exportar catálogo a PDF
- [ ] Lista de deseos para modelos futuros
- [ ] Ordenación por columnas

### P2 - Nice to Have
- [ ] Importar/Exportar en JSON/CSV
- [ ] Gráficos de valor en el tiempo
- [ ] Duplicar elementos existentes

## Next Tasks
1. Exportación a PDF del catálogo completo
2. Lista de deseos para futuros modelos
3. Mejoras en filtros y ordenación
