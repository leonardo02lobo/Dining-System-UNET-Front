# plantilla-correo-levantamiento Specification

## Purpose
TBD - created by archiving change fe-mejoras-operativas-comedor. Update Purpose after archive.
## Requirements
### Requirement: El panel edita la plantilla del correo de levantamiento


La pantalla de plantillas de correo SHALL permitir editar **dos** plantillas, presentadas como
secciones separadas: la de **suspensión** y la de **levantamiento de suspensión**.

Cada sección SHALL mostrar el asunto, el cuerpo, la lista de marcadores admitidos **por esa
plantilla** y su previsualización, y SHALL advertir de los marcadores escritos que no estén
admitidos.

La lista de marcadores SHALL provenir del backend y no fijarse en el panel: la plantilla de
levantamiento admite un juego distinto al de sanción, y una lista cableada quedaría desalineada en
cuanto el contrato cambie.

La configuración de emisor y copia es global a todos los correos y SHALL permanecer fuera de las
secciones de plantilla.

#### Scenario: Editar la plantilla de levantamiento

- **WHEN** el administrador abre la sección de levantamiento, modifica el cuerpo y guarda
- **THEN** el panel persiste la plantilla y confirma el guardado

#### Scenario: Marcadores propios de cada plantilla

- **WHEN** el administrador abre la sección de levantamiento
- **THEN** los marcadores ofrecidos son los de esa plantilla
- **AND** no incluyen los que solo aplican a la notificación de sanción

#### Scenario: Marcador no admitido

- **WHEN** el administrador escribe en el cuerpo un marcador que la plantilla no admite
- **THEN** el panel lo señala como no soportado antes de guardar

#### Scenario: Previsualización

- **WHEN** el administrador escribe el cuerpo de la plantilla
- **THEN** la previsualización muestra el texto con los marcadores sustituidos por valores de ejemplo

#### Scenario: Contenido por defecto

- **GIVEN** una plantilla de levantamiento que nunca se ha personalizado
- **WHEN** el administrador abre su sección
- **THEN** el editor se rellena con el asunto y el cuerpo por defecto del sistema
