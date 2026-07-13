## 1. Fase 0 — Resolver decisiones con impacto en UI (con Producto/cliente)

> Resueltas con los **defaults recomendados** de `issues_reunion.md`. Cada change hija
> las hereda como supuesto y las reconfirma con el cliente antes de cerrar su design.

- [x] 1.1 #6: **70% tabla / 30% resumen** (el resumen crece a 30%; la tabla queda al 70%)
- [x] 1.2 #3: "acceso directo" = **`is_priority`** (persona marcada como prioritaria); la UI filtra por ese campo
- [x] 1.3 #4: **PDF con branding institucional** (logos UNET/Decanato); historial **ordenado por fecha descendente** por defecto
- [x] 1.4 #14: "consumo" = **menú planificado** (nombre + ingredientes/cantidades del `Lunch` del día)
- [x] 1.5 #9: **componente de tabla reutilizable** para ambas; tablas **independientes** (base vs. recalculada)
- [x] 1.6 #10: editar **solo estados que `_ensure_editable` permita** (borradores); confirmados bloqueados con aviso claro
- [x] 1.7 #12: editables **nombre, platos base e ingredientes**; **bloquear borrado** de plantilla referenciada por almuerzos
- [x] 1.8 #7: **no** se permite fecha futura; aplica a la **entrada de stock (increase)**; default = hoy
- [x] 1.9 #13: **solo renombrar el rótulo**; se mantiene la ruta `/inventario/crear`
- [x] 1.10 #5: la UI edita **solo "From" (nombre+dirección) y CC**; credenciales SMTP siguen en `.env`; **CC global**
- [x] 1.11 #15: campos espejo de estudiante con **carrera opcional** y **foto opcional**; el externo consume por el **mismo flujo** creando un registro mínimo referenciable por `Consumption`

## 2. Ola 1 — Quick wins Frontend (sin gate de backend)

- [x] 2.1 Proponer `fe-inventario-general-pdf` (#8) — botón PDF sobre `GET /inventory/export/pdf` en `GeneralInventoryPage` ✅ propuesta y validada
- [x] 2.2 Proponer `fe-rename-crear-servicio-alimentacion` (#13) — requiere 1.9 ✅ propuesta e implementada
- [x] 2.3 Proponer `fe-comedor-vistas-sin-scroll` (#1) — `CheckConsumes`/`RegisterDining` ✅ propuesta e implementada (densificación segura; verificación visual a resolución objetivo pendiente)
- [x] 2.4 Proponer `fe-inventario-resumen-70-30` (#6) — requiere 1.1 ✅ propuesta e implementada
- [x] 2.5 Proponer `fe-registro-atajo-arrowdown` (#2) — conviviendo con `useBarcodeScanner` ✅ propuesta e implementada

## 3. Ola 2 — Pantalla "Crear servicio de alimentación"

- [x] 3.1 Proponer `fe-crear-servicio-tablas-50-50` (#9) tras 2.2 (misma pantalla) — requiere 1.5 ✅ propuesta e implementada (verificación de recálculo en vivo/responsivo pendiente)

## 4. Ola 3 — Sesiones / reportes / menú (contrato-primero)

- [x] 4.1 Gemela backend `be-consumptions-acceso-directo` (#3) ✅ implementada (auditoría 2026-07-13): `GET /consumptions/?is_priority`
- [x] 4.2 `fe-entrantes-filtro-acceso-directo` (#3) ✅ propuesta e implementada
- [x] 4.3 Gemela backend `be-lunch-sessions-rango-y-pdf` (#4) ✅ implementada; PDF de sesión delegado al FE
- [x] 4.4 `fe-reportes-historial-sesiones` (#4) ✅ propuesta e implementada (nueva SessionHistoryPage)
- [x] 4.5 Gemela backend `be-lunch-menu-del-dia` (#14) ✅ implementada: `GET /lunches?date=`
- [x] 4.6 `fe-sesion-menu-del-dia` (#14) ✅ propuesta e implementada (panel Menú del día)

## 5. Ola 4 — Almuerzos y plantillas

- [x] 5.1 Gemela backend `be-lunches-regla-editabilidad` (#10) ✅ implementada (solo DRAFT editable, 409 si CONFIRMED)
- [x] 5.2 `fe-almuerzos-editar-historial` (#10) ✅ propuesta e implementada (editar DRAFT en el detalle; ingredientes diferidos)
- [x] 5.3 Gemela backend `be-lunch-auto-plantilla` (#11) ✅ implementada (upsert de plantilla al confirmar)
- [x] 5.4 `fe-crear-servicio-quitar-toggle-plantilla` (#11) ✅ propuesta e implementada (toggle eliminado)
- [x] 5.5 Proponer `fe-plantillas-crud-inventario` (#12) — requiere 1.7; métodos `/lunch-templates` completados en `src/api/lunch.ts` ✅ propuesta e implementada (R-U-D; crear-desde-cero y edición de ingredientes diferidos; end-to-end con backend pendiente). Adelantada: no depende de backend nuevo

## 6. Ola 5 — Inventario / fecha de insumo

- [ ] 6.1 Verificar que `be-inventario-fecha-movimiento` (#7) está propuesta y su contrato fijado — requiere 1.8
- [ ] 6.2 Proponer `fe-inventario-modal-fecha-insumo` (#7) tras 6.1

## 7. Ola 6 — Configuración de correo

- [ ] 7.1 Verificar que `be-email-settings-emisor-cc` (#5) está propuesta y su contrato fijado — requiere 1.10
- [ ] 7.2 Proponer `fe-panel-config-correo` (#5) tras 7.1

## 8. Ola 7 — Gente externa (XL, dos sub-entregas)

- [ ] 8.1 Verificar que `be-gente-externa` (#15) está propuesta (recurso `/external-people` + integración de consumo) — requiere 1.11
- [ ] 8.2 Proponer `fe-gente-externa` (#15) tras 8.1 — sub-entrega 1 gestión/CRUD, sub-entrega 2 opción en el registro al comedor

## 9. Cierre del plan

- [ ] 9.1 Verificar que cada change de UI enlaza a su gemela de backend y respeta las convenciones del frontend (primitivos `ui/`, IIFE async, `apiClient`, PDF de `src/utils/`, build verde)
- [ ] 9.2 Archivar `plan-issues-reunion` de este repo cuando todos los grupos de UI estén propuestos y en ejecución
