## 1. Modal accesible (UX-005)

- [x] 1.1 `Modal.tsx`: guardar `document.activeElement` al abrir y restaurar foco al cerrar
- [x] 1.2 `Modal.tsx`: enfocar el primer elemento focalizable del panel al montar
- [x] 1.3 `Modal.tsx`: focus trap con `Tab`/`Shift+Tab` dentro del panel
- [x] 1.4 `Modal.tsx`: `aria-labelledby` con `useId()` sobre el `<h2>` del título
- [x] 1.5 `Modal.tsx`: bloquear scroll del `body` mientras el modal está abierto

## 2. Toggle con nombre accesible (UX-007)

- [x] 2.1 `Toggle.tsx`: prop `label` obligatoria → `aria-label`; `focus-visible` en vez de `focus`
- [x] 2.2 `PermissionsPage.tsx`: pasar `label` con el nombre del permiso y su estado

## 3. Table: aislar acciones de fila (UX-014)

- [x] 3.1 `Table.tsx`: `stopPropagation` en la celda de acciones
- [x] 3.2 `Table.tsx`: filas con `onRowClick` alcanzables por teclado (`tabIndex`, `Enter`/`Espacio`)

## 4. Registro al Comedor: salida y seguridad del flujo (UX-003, UX-004, UX-015, UX-016, UX-009)

- [x] 4.1 Extraer `resetSearch()` y añadir botón "Cancelar / Consultar otra persona" (ghost, primera
      acción) en la ficha del estudiante
- [x] 4.2 Franja compacta con sede + estado de sesión visible mientras hay una persona consultada
- [x] 4.3 `useBarcodeScanner(..., { enabled: !duplicateOpen && !suspendOpen && !recentOpen })`
- [x] 4.4 Congelar `suspendTarget` al abrir el modal de suspensión rápida; `handleQuickSuspend` usa
      el objetivo congelado, no `student`
- [x] 4.5 Acotar el atajo `ArrowDown` al contenedor de la ficha (ref + foco automático al consultar);
      excluir también `INPUT` del listener
- [x] 4.6 Desacoplar el cierre del modal de duplicado de `onEnded` del sonido (cierre manual)
- [x] 4.7 Eliminar el `setError` duplicado junto al toast en el catch de `handleRegister`
- [x] 4.8 Corregir gramática del subtítulo de la página

## 5. Permisos: proteger cambios sin guardar (UX-002, UX-032)

- [x] 5.1 Snapshot `initialPermissions` + `isDirty` derivado por comparación
- [x] 5.2 Confirmación (Guardar y continuar / Descartar / Cancelar) al cambiar de usuario con
      cambios pendientes
- [x] 5.3 Aviso `beforeunload` mientras `isDirty`
- [x] 5.4 Botón "Guardar" deshabilitado sin cambios, etiquetado con la cantidad; filas modificadas
      marcadas visualmente
- [x] 5.5 Corregir gramática del subtítulo de la página
- [ ] 5.6 Bloqueo de navegación in-app con `useBlocker` — **no implementado**: requiere migrar de
      `<BrowserRouter>` a un router de datos (`createBrowserRouter`); fuera de alcance de este
      cambio, documentado como seguimiento

## 6. Login: mensajes consistentes con el backend (UX-006)

- [x] 6.1 Confirmar en el backend que `POST /auth/login` solo autentica por correo
      (`crud_user.authenticate` → `get_by_email`)
- [x] 6.2 Corregir mensaje de validación y de error 401 para hablar de "correo electrónico"

## 7. Filtros de rol completos (UX-019, UX-025 parcial)

- [x] 7.1 `ListUser.tsx`: derivar `roleOptions` desde `ROLE_LABEL`; añadir `label` a los `Select` de
      Estado y Rol
- [x] 7.2 `LoginAuditPage.tsx`: añadir `ACCESO_DIRECTO` a `ROLE_MAP`, derivar `roleOptions`; añadir
      `label` al `Select` de Rol

## 8. Cabecera institucional (UX-035, UX-011 parcial)

- [x] 8.1 "VICERRECTORADO ACADEMICO" → "VICERRECTORADO ACADÉMICO"
- [x] 8.2 Reloj con `setInterval` de 30 s en vez de congelado al montar
- [x] 8.3 Logos reducidos (`lg:h-16`) cuando `isLogin` (shell autenticado); tamaño completo en
      `/login`
- [x] 8.4 Saludo reescrito como una sola cadena, sin emoji `Smile` ni "Bienvenid@"

## 9. Contraste de texto (UX-010)

- [x] 9.1 Reemplazar `text-slate-400` → `text-slate-500`/`600` en ~24 nodos de texto informativo y
      mensajes de estado vacío en 20 archivos, preservando iconos decorativos y `placeholder:`

## 10. Contraseña accesible por teclado (UX-037)

- [x] 10.1 Quitar `tabIndex={-1}` del botón de mostrar/ocultar contraseña en `Input.tsx`

## 11. Verificación

- [x] 11.1 `npx tsc --noEmit` sin errores
- [x] 11.2 `npm run build` verde
- [x] 11.3 `npx vitest run` — 49/51 (2 fallos preexistentes no relacionados)
