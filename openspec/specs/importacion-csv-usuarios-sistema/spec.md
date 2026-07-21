# importacion-csv-usuarios-sistema Specification

## Purpose
TBD - created by archiving change fe-import-usuarios-sistema. Update Purpose after archive.
## Requirements
### Requirement: La importación CSV crea usuarios del sistema

La pantalla de importación CSV del panel admin SHALL enviar las filas a `POST /users/bulk`
(`userApi.bulkCreate`), creando **usuarios del sistema**, no accesos directos. Los campos destino
SHALL ser Nombre completo (`full_name`), Correo (`email`), Carrera (`career`), Cédula (`cedula`) y
Activo (`is_active`). La cédula SHALL limpiarse a **solo dígitos** en el navegador antes de enviarse
y en la vista previa. `email` SHALL ser obligatorio para considerar una fila válida.

#### Scenario: Envío al endpoint de usuarios

- **WHEN** el administrador confirma la importación con filas válidas
- **THEN** el frontend envía `POST /users/bulk` con `{ items: [{ full_name, cedula, email, career, is_active }] }`
- **AND** no envía nada a `/accesos_directos/bulk`

#### Scenario: La cédula se limpia a solo dígitos

- **WHEN** una celda de cédula trae `"V-12.345.678"`
- **THEN** la vista previa y el envío usan `"12345678"`

#### Scenario: El correo es obligatorio

- **WHEN** una fila no tiene correo
- **THEN** la vista previa la marca como inválida y no se incluye en el envío

#### Scenario: Resumen del resultado

- **WHEN** el backend responde `{ total, created, updated, unchanged, failed, results: [{ row, cedula, status, id, error }] }`
- **THEN** la UI muestra los conteos y el detalle de errores por fila con la cédula

