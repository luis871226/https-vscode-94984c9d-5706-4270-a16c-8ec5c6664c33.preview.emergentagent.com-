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

## What's Been Implemented - 11/02/2026

### Backend (FastAPI + MongoDB)
- ✅ CRUD Locomotoras con campos Prototipo (paint_scheme, registration_number, prototype_type)
- ✅ CRUD Vagones/Coches (rolling-stock)
- ✅ CRUD Decodificadores
- ✅ CRUD Proyectos de sonido
- ✅ **Backup endpoint** GET /api/backup - Exporta toda la BD
- ✅ **Restore endpoint** POST /api/restore - Restaura desde backup
- ✅ Estadísticas completas

### Frontend (React + Tailwind + Shadcn UI)
- ✅ Dashboard con estadísticas
- ✅ Formulario locomotoras con **sección Prototipo**
- ✅ Vista detallada locomotoras muestra prototipo
- ✅ Sección Vagones/Coches completa
- ✅ Gestión de decodificadores
- ✅ Gestión de proyectos de sonido
- ✅ **Página Backup/Restore** con descarga y restauración
- ✅ Navegación con 6 secciones

## Testing Status - 11/02/2026
- Backend: 95% tests passed
- Frontend: 85% functional (timing issues en tests automatizados)
- Backup/Restore: Working

## Prioritized Backlog

### P0 - Done
- [x] CRUD completo todas las entidades
- [x] Campos Prototipo en locomotoras
- [x] Sistema Backup/Restore
- [x] Dashboard con estadísticas

### P1 - Next Features
- [ ] Exportar catálogo a PDF
- [ ] Lista de deseos
- [ ] Ordenación de columnas

### P2 - Nice to Have
- [ ] Composiciones de trenes (locomotora + vagones)
- [ ] Importar desde CSV
- [ ] Historial de precios

## Next Tasks
1. Exportación a PDF del catálogo
2. Lista de deseos para modelos pendientes
