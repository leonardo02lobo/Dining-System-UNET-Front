## ADDED Requirements

### Requirement: La cabecera institucional no tiene errores ortográficos

El texto "VICERRECTORADO ACADÉMICO" SHALL mostrarse con tilde en todas las pantallas, incluida la
de login.

#### Scenario: Texto correcto en toda la aplicación

- **WHEN** se renderiza la cabecera en cualquier pantalla
- **THEN** el texto dice "VICERRECTORADO ACADÉMICO", nunca "ACADEMICO" sin tilde

### Requirement: El reloj de la cabecera refleja la hora actual

La cabecera SHALL actualizar la hora mostrada periódicamente (cada 30 s) mientras la sesión esté
activa, en vez de mostrar únicamente la hora de montaje del componente.

#### Scenario: La hora avanza durante una sesión larga

- **WHEN** un usuario mantiene la aplicación abierta más de 30 segundos
- **THEN** la hora mostrada en la cabecera refleja la hora real del sistema, no la hora de inicio
  de sesión

### Requirement: Los logos institucionales son proporcionales al contexto

Los logos de la cabecera SHALL mostrarse a tamaño completo en `/login`, y a tamaño reducido en el
shell autenticado (todas las demás pantallas), para no consumir una porción desproporcionada del
alto disponible.

#### Scenario: Logos reducidos fuera del login

- **WHEN** el usuario navega por cualquier pantalla autenticada
- **THEN** los logos de la cabecera ocupan menos espacio vertical que en la pantalla de login

### Requirement: El saludo de la cabecera es una sola frase bien puntuada

El saludo mostrado en el shell autenticado SHALL componerse como una única cadena
("Hola, {nombre} · {rol} · {fecha y hora}"), sin emoji decorativo ni la forma "Bienvenid@".

#### Scenario: Saludo legible por lector de pantalla

- **WHEN** un lector de pantalla anuncia el saludo de la cabecera
- **THEN** anuncia una frase única y correctamente puntuada, sin símbolos sin pronunciación
  definida
