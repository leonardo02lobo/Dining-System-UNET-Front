## ADDED Requirements

### Requirement: Hora de apertura y cierre en el historial de sesiones

La tabla de sesiones del Historial SHALL mostrar la **hora de apertura** (`opened_at`) y la **hora
de cierre** (`closed_at`) de cada sesión, formateadas como hora local (`HH:mm`, es-VE). Cuando la
sesión sigue abierta (`closed_at` nulo), la columna de cierre SHALL indicar "En curso" (o "—").

#### Scenario: Sesión cerrada muestra apertura y cierre

- **WHEN** el usuario abre el Historial de Sesiones con sesiones cerradas
- **THEN** cada fila muestra la hora de apertura y la hora de cierre

#### Scenario: Sesión abierta no tiene hora de cierre

- **WHEN** una sesión sigue abierta (`closed_at` nulo)
- **THEN** la columna de cierre muestra "En curso" (o "—") sin romper el render
