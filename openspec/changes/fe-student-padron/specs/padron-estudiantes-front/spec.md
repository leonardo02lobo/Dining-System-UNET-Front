## ADDED Requirements

### Requirement: Los flujos de estudiantes usan el padrón backend

El frontend SHALL consultar e importar estudiantes contra el backend `/students`, no contra el
servicio Node externo. La consulta por cédula (usada en Registro al Comedor, Consultar Consumo,
Suspender Usuario y Registro Manual) SHALL usar `GET /students/lookup?q=`, y la importación CSV SHALL
enviar a `POST /students/bulk` con la cédula limpiada a solo dígitos.

#### Scenario: Consulta de estudiante contra el backend

- **WHEN** una pantalla busca un estudiante por cédula
- **THEN** el frontend llama a `GET /students/lookup?q=` del backend (con cookies) y no al API externo
- **AND** si no existe, muestra el mensaje de "no inscrito" (HTTP 404)

#### Scenario: Importación CSV al padrón de estudiantes

- **WHEN** el administrador confirma la importación con filas válidas
- **THEN** el frontend envía `POST /students/bulk` con `{ items: [{ full_name, cedula, email, career, is_active }] }`
- **AND** la cédula se limpia a solo dígitos antes de enviarse y en la vista previa

#### Scenario: Resumen del resultado de importación

- **WHEN** el backend responde `{ total, created, updated, unchanged, failed, results: [{ row, cedula, status, id, error }] }`
- **THEN** la UI muestra los conteos y el detalle de errores por fila con la cédula
