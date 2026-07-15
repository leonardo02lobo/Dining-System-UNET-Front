# consumo-duplicado-aviso Specification

## Purpose
TBD - created by archiving change fe-consumo-duplicado-wizard-sonido. Update Purpose after archive.
## Requirements
### Requirement: Aviso visual y sonoro de consumo duplicado

Al registrar un consumo en la pantalla de registro al comedor, si el consumo ya existe para el día
(respuesta `409` del backend), el sistema SHALL mostrar un aviso modal con los datos del usuario
(identificación, nombre, correo y estado) indicando que ya consumió, y SHALL reproducir un sonido de
alerta servido desde una ruta pública del frontend. La reproducción del sonido SHALL ser
best-effort: un fallo de audio NO SHALL interrumpir el flujo ni impedir que se muestre el aviso.

#### Scenario: Consumo duplicado muestra el aviso y suena

- **WHEN** el usuario intenta registrar un consumo y el backend responde `409` (ya consumió hoy)
- **THEN** se abre un modal con los datos del usuario y el mensaje de que ya registró su consumo
- **AND** se reproduce el sonido de alerta

#### Scenario: No se registra un segundo consumo

- **WHEN** se muestra el aviso de consumo duplicado
- **THEN** no se ha registrado un nuevo consumo para ese usuario

#### Scenario: El fallo de audio no rompe el flujo

- **WHEN** el navegador impide reproducir el sonido (autoplay bloqueado o archivo ausente)
- **THEN** el aviso modal se muestra igualmente y no se lanza ningún error visible al usuario

#### Scenario: Cerrar el aviso prepara el siguiente registro

- **WHEN** el usuario cierra el aviso ("Entendido") o realiza una nueva consulta/escaneo
- **THEN** el aviso se cierra y la búsqueda queda lista para el siguiente usuario

#### Scenario: El aviso se cierra solo al terminar el sonido

- **WHEN** el sonido de alerta termina de reproducirse
- **THEN** el aviso se cierra automáticamente y la búsqueda queda lista para el siguiente usuario

#### Scenario: Sin reproducción, el cierre queda manual

- **WHEN** el sonido no llega a reproducirse (autoplay bloqueado)
- **THEN** el aviso permanece abierto hasta que el usuario lo cierra ("Entendido") o hace una nueva consulta

#### Scenario: Otros errores no usan el aviso de duplicado

- **WHEN** el registro falla por un motivo distinto al duplicado (p. ej. sanción activa `403`)
- **THEN** se mantiene el manejo por notificación/mensaje, sin el modal ni el sonido de duplicado

