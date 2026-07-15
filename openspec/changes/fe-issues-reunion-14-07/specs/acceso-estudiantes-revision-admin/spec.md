## REMOVED Requirements

### Requirement: Pantalla de acceso de estudiantes funcional

**Reason:** El cliente indicó en la reunión del 14/07 que la ventana "Acceso Estudiantes" del área
de Administración ya no es necesaria (Issue #9). Se elimina su ítem de menú, su ruta, su página y el
código huérfano asociado (API/tipos del frontend y endpoint/schema del backend).

**Migration:** No hay flujo que preservar. Tras quitar el ítem de menú y la ruta, `StudentAccessPage`
queda inaccesible; verificar por `grep` que `studentAccess.ts`/`types/studentAccess.ts` no se usan en
otro sitio antes de borrarlos y que el build (TS estricto) queda sin imports huérfanos.
