# Railway Collection Manager - PRD

## Problem Statement Original
Aplicación para PC para gestionar una colección de modelismo ferroviario (Escala N) con base de datos dinámica, incluyendo apartado digital con decodificadores, funciones programadas, CVs y proyectos de sonido.

## User Personas
- **Coleccionista de modelismo ferroviario**: Usuario que desea catalogar y gestionar su colección de trenes escala N
- **Entusiasta DCC Digital**: Usuario interesado en documentar configuraciones de decodificadores, funciones programadas y proyectos de sonido

## Core Requirements (Static)
1. Gestión de locomotoras con campos: marca, modelo, referencia, dirección DCC, decodificador, proyecto de sonido, fecha compra, precio, estado, época, compañía ferroviaria, notas, fotos
2. Gestión de funciones programadas F0-F28 con descripción y tipo (sonido/no sonido)
3. Seguimiento de modificaciones de CVs
4. Catálogo de decodificadores con especificaciones técnicas
5. Gestión de proyectos de sonido
6. Dashboard con estadísticas de la colección
7. Subida de fotos de locomotoras
8. Tema visual claro

## What's Been Implemented - 11/02/2026
### Backend (FastAPI + MongoDB)
- ✅ API completa REST para locomotoras (CRUD)
- ✅ API completa REST para decodificadores (CRUD)
- ✅ API completa REST para proyectos de sonido (CRUD)
- ✅ Endpoint de estadísticas con métricas de colección
- ✅ Modelos Pydantic para validación de datos
- ✅ Subida de fotos en base64

### Frontend (React + Tailwind + Shadcn UI)
- ✅ Dashboard con estadísticas (total locomotoras, decodificadores, proyectos sonido, valor total)
- ✅ Distribución por marca y compañía ferroviaria
- ✅ Lista de locomotoras con tabla densa y filtros (búsqueda, marca, estado)
- ✅ Formulario de locomotora completo con:
  - Información básica (marca, modelo, referencia)
  - Información técnica DCC (dirección, decodificador, proyecto sonido)
  - Información de compra (fecha, precio, estado, época, compañía)
  - Gestión de funciones F0-F28
  - Gestión de modificaciones CV
  - Subida de foto
  - Notas
- ✅ Vista detallada de locomotora
- ✅ Lista de decodificadores en tarjetas con especificaciones
- ✅ Formulario de decodificador (marca, modelo, tipo, escala, interfaz, funciones, capacidad sonido)
- ✅ Lista de proyectos de sonido
- ✅ Formulario de proyecto de sonido con selección de sonidos comunes
- ✅ Navegación completa con iconos
- ✅ Tema claro estilo "Collector's Studio"
- ✅ Fuentes: Oswald (headings), Public Sans (body), JetBrains Mono (data)
- ✅ Confirmación de eliminación con AlertDialog

## Testing Status
- Backend: 100% tests passed
- Frontend: 100% workflows tested
- Integration: Verified working

## Prioritized Backlog

### P0 - Done
- [x] CRUD Locomotoras
- [x] CRUD Decodificadores
- [x] CRUD Proyectos Sonido
- [x] Dashboard con estadísticas
- [x] Subida de fotos

### P1 - Next Features
- [ ] Exportar catálogo a PDF
- [ ] Lista de deseos para modelos futuros
- [ ] Búsqueda avanzada con múltiples filtros
- [ ] Ordenación por columnas en tablas

### P2 - Nice to Have
- [ ] Importar/Exportar colección en JSON/CSV
- [ ] Modo offline con sincronización
- [ ] Gráficos de valor de colección en el tiempo
- [ ] Duplicar locomotora existente

## Next Tasks
1. Implementar exportación a PDF del catálogo
2. Añadir lista de deseos para modelos pendientes
3. Mejorar filtros con fechas y rangos de precio
