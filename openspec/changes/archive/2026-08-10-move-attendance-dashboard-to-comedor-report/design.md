## Context

Este es el tercer movimiento de este dashboard dentro de esta serie de cambios: primero se integró
en Reporte al Comedor (`add-attendance-statistics`), luego se movió a Reportes de Consumo
(`improve-dining-ux-and-consumption-reports`), y ahora el usuario pidió explícitamente moverlo de
vuelta a Reporte al Comedor. Se confirmó con el usuario (no se asumió) que es una mudanza, no una
duplicación.

Dado que los paneles (`PeriodAttendancePanel`, `LunchSessionAttendancePanel`) y sus componentes de
gráficas viven en `src/components/reports/` y `src/components/statistics/`, independientes de qué
página los monta, esta mudanza es puramente de "qué página importa y renderiza qué" — no requiere
tocar la lógica de los paneles en absoluto.

## Goals / Non-Goals

**Goals:**
- `ReportsPage.tsx` recupera únicamente las 2 pestañas de asistencia (sin insumos), con los paneles
  ya mejorados (chips, limpiar, gráfica diaria, planificados-vs-servidos, filtros en URL).
- `ConsumptionReportPage.tsx` vuelve a ser solo-insumos.
- Las specs quedan consistentes con la ubicación final.

**Corrección post-implementación (misma sesión)**: la primera pasada de este change dejó la
pestaña "Consumo de Insumos" también en `ReportsPage.tsx` (junto a las dos de asistencia), sin
darse cuenta de que el usuario quería que el consumo de insumos quedara **exclusivamente** en
Inventario. El usuario lo señaló con una captura de pantalla marcando la pestaña sobrante.
Corrección: `ReportsPage.tsx` se reescribió para no tener estado, imports, ni lógica de insumos en
absoluto — solo las 2 pestañas de asistencia.

**Non-Goals:**
- No se modifica la lógica interna de los paneles ni de los componentes de gráficas.
- No se cambian rutas, permisos ni ítems de navegación — ambas páginas ya existen en sus lugares.

## Decisions

### 1. Copiar el patrón de pestañas tal cual, sin extraer un componente compartido

Tanto `ReportsPage.tsx` como `ConsumptionReportPage.tsx` ya implementaron el mismo patrón de
pestañas (estado local + barra de botones con `border-b-2`) en cambios anteriores. Se mantiene el
mismo patrón inline en `ReportsPage.tsx` en vez de extraer un componente `Tabs` compartido, porque
ninguna otra pantalla del proyecto usa pestañas de esta forma (excepto `RegisterDining.tsx`, que
tiene su propio patrón visual distinto, con fondo oscuro) — extraer un componente para dos usos
sería una abstracción prematura fuera del alcance de este cambio.

### 2. `ConsumptionReportPage.tsx` vuelve exactamente a su forma pre-dashboard

Se revierte al estado que tenía antes del cambio `improve-dining-ux-and-consumption-reports`: sin
pestañas, sin imports de los paneles de asistencia, con el `<h1>` simple. No se conservan las
pestañas "vacías" ni ningún rastro de la UI de asistencia en esta página.

## Risks / Trade-offs

- **[Riesgo] Volver a mover esta pieza genera fatiga de contexto si se pide mover otra vez** →
  Mitigación: se confirmó explícitamente con el usuario antes de proceder (no se asumió), y se
  documenta como el tercer movimiento para que quede claro en el historial de OpenSpec.
- **[Trade-off] Ninguno funcional** — es un cambio puramente de ubicación, sin riesgo de romper
  lógica ya probada en los paneles.

## Migration Plan

1. `src/pages/ReportsPage.tsx`: agregar pestañas + montar los paneles.
2. `src/pages/ConsumptionReportPage.tsx`: quitar pestañas + paneles, volver a solo-insumos.
3. `tsc --noEmit` + `vitest run` + verificación contra el backend/frontend reales ya corriendo
   (mismo patrón de verificación de las rondas anteriores).
