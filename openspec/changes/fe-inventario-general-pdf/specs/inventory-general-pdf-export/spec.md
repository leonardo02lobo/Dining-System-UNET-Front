## ADDED Requirements

### Requirement: Exportar el inventario general en PDF desde la UI

La pantalla Inventario General SHALL ofrecer una acción visible para descargar en PDF toda
la data del inventario, consumiendo el endpoint existente `GET /inventory/export/pdf` a
través de `inventoryApi`.

#### Scenario: Descargar el PDF del inventario

- **WHEN** el usuario abre Inventario General y presiona "Descargar PDF"
- **THEN** la app solicita `GET /inventory/export/pdf` y dispara la descarga de un archivo PDF
  con la data del inventario

#### Scenario: Se exporta el inventario completo

- **WHEN** hay filtros de búsqueda o categoría activos en la UI y el usuario presiona
  "Descargar PDF"
- **THEN** el PDF contiene toda la data del inventario (no solo el subconjunto filtrado)

#### Scenario: Inventario vacío

- **WHEN** el inventario no tiene insumos y el usuario presiona "Descargar PDF"
- **THEN** la descarga se genera sin error

### Requirement: Estados de la acción de exportación

El botón de exportación SHALL reflejar su estado de carga y comunicar los errores sin romper
la vista.

#### Scenario: Estado de carga durante la descarga

- **WHEN** la descarga del PDF está en curso
- **THEN** el botón muestra estado de carga y evita disparos duplicados

#### Scenario: Error al exportar

- **WHEN** la solicitud del PDF falla
- **THEN** la UI muestra un mensaje de error legible y permite reintentar, sin perder la
  tabla ni el resumen ya cargados
