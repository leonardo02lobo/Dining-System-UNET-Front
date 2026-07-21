## MODIFIED Requirements

### Requirement: Gestión de permisos clara

La pantalla de gestión de permisos SHALL permitir seleccionar un usuario, ver el catálogo de rutas
con su estado (por defecto según rol u override) y editar y guardar los overrides por usuario, con
feedback del resultado. La pantalla SHALL rastrear si hay cambios sin guardar comparando el estado
actual contra el snapshot cargado del servidor, y SHALL confirmar explícitamente antes de descartar
esos cambios al cambiar de usuario o al intentar cerrar/recargar la pestaña. El botón de guardar
SHALL reflejar cuántos cambios hay pendientes y SHALL deshabilitarse cuando no hay ninguno.

#### Scenario: Editar y guardar overrides

- **WHEN** un SUPER_ADMIN activa o desactiva rutas para un usuario y guarda
- **THEN** los overrides se persisten y se refleja el resultado del guardado

#### Scenario: Estado por defecto vs. override

- **WHEN** se muestra una ruta sin override para el usuario
- **THEN** su estado corresponde al rol por defecto del usuario

#### Scenario: Cambiar de usuario con cambios sin guardar pide confirmación

- **WHEN** hay cambios sin guardar y el usuario intenta seleccionar otro usuario en el desplegable
- **THEN** se muestra una confirmación con la cantidad de cambios pendientes y las opciones de
  guardar y continuar, descartar, o cancelar — el cambio de usuario no ocurre directamente

#### Scenario: Cerrar o recargar la pestaña con cambios sin guardar avisa

- **WHEN** hay cambios sin guardar y el usuario intenta cerrar o recargar la pestaña
- **THEN** el navegador muestra una advertencia nativa de salida

#### Scenario: El botón de guardar refleja el estado sucio

- **WHEN** no hay cambios pendientes
- **THEN** el botón de guardar está deshabilitado; en cuanto hay cambios, se habilita y muestra
  cuántos hay
