# importacion-csv-accesos-directos Specification

## Purpose
TBD - created by archiving change fe-csv-import-accesos-directos. Update Purpose after archive.
## Requirements
### Requirement: Importación masiva de accesos directos vía CSV

El módulo de Administración SHALL ofrecer una sección que permita a un administrador importar accesos
directos de forma masiva a partir de un archivo CSV separado por comas, mapeando las columnas del CSV
a los campos destino, previsualizando las filas y enviándolas en una única petición al backend. La
sección SHALL estar restringida a los roles `SUPER_ADMIN` y `ADMIN`.

Los campos destino SHALL ser: Nombre completo (`full_name`), Correo (`email`), Carrera (`career`),
Cédula (`document_id`) y Activo (`is_active`, booleano).

#### Scenario: Subir y parsear un CSV

- **WHEN** el administrador selecciona un archivo CSV separado por comas en el input de archivo
- **THEN** el frontend lo parsea en el navegador, detecta la fila de cabecera y muestra las columnas
  detectadas sin enviar nada al backend todavía

#### Scenario: Mapeo de columnas con auto-mapeo

- **WHEN** se han detectado las cabeceras del CSV
- **THEN** la UI ofrece un desplegable por cada campo destino para asociarlo a una columna del CSV, con
  un auto-mapeo inicial deducido del nombre de la cabecera (p. ej. "nombre"/"nombre completo" →
  `full_name`, "correo"/"email" → `email`, "carrera" → `career`, "cedula"/"cédula"/"documento" →
  `document_id`, "activo"/"active" → `is_active`)

#### Scenario: Parseo tolerante del booleano Activo

- **WHEN** la columna mapeada a `is_active` contiene valores como `true/false`, `1/0`, `si/sí/no`,
  `activo/inactivo`, `x`/vacío (en cualquier combinación de mayúsculas/minúsculas)
- **THEN** cada valor se interpreta como booleano de forma tolerante y la UI documenta los valores
  aceptados

#### Scenario: Vista previa con validación

- **WHEN** el administrador ha mapeado las columnas
- **THEN** se muestra una tabla de vista previa de las filas mapeadas, marcando como inválidas las filas
  sin `full_name` o sin `document_id`, o con un email de formato no razonable, antes de permitir el envío

#### Scenario: Envío masivo al backend

- **WHEN** el administrador confirma la importación
- **THEN** el frontend envía `POST /accesos_directos/bulk` con cuerpo
  `{ "items": [ { full_name, email|null, career|null, document_id, is_active } ] }` usando el
  `apiClient` existente

#### Scenario: Resumen de resultado y errores por fila

- **WHEN** el backend responde
  `{ total, created, updated, unchanged, failed, results: [ { row, document_id, status, id, error } ] }`
  con `status` ∈ `created|updated|unchanged|error`
- **THEN** la UI muestra el resumen (total / creados / actualizados / sin cambios / fallidos) y el
  detalle de errores por fila, y ofrece una acción para refrescar/ver la lista existente de accesos
  directos (`accesoDirectoApi.list`)

#### Scenario: La ventana de carga se limpia tras una importación

- **WHEN** la importación finaliza correctamente
- **THEN** el frontend limpia el área de carga (archivo seleccionado, mapeo de columnas y vista previa)
  y deja visible únicamente el resumen del resultado, con la opción de importar otro archivo

#### Scenario: Acceso restringido a administradores

- **WHEN** un usuario con rol `TAQUILLERO` (u otro sin permiso) intenta acceder a la ruta de importación
- **THEN** el gate de rutas (`routeAccess`) impide el acceso, igual que en el resto de rutas de admin de
  accesos directos

