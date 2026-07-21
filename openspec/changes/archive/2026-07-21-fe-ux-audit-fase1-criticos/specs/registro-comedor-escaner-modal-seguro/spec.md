## ADDED Requirements

### Requirement: El escáner se desactiva mientras hay un modal abierto

En Registro al Comedor, el escáner de código de barras SHALL desactivarse mientras cualquiera de
los modales de la pantalla (consumo duplicado, suspensión rápida, últimos registros) esté abierto,
de modo que un escaneo detrás de un modal no reemplace la persona mostrada.

#### Scenario: Escaneo con un modal abierto no cambia la persona

- **WHEN** hay un modal abierto en Registro al Comedor y se escanea un carnet
- **THEN** la persona consultada en pantalla no cambia hasta que el modal se cierra

### Requirement: La suspensión rápida congela a la persona objetivo

Al abrir el modal de suspensión rápida, la pantalla SHALL capturar la persona objetivo en un
estado propio, y la confirmación de suspensión SHALL aplicar sobre esa persona congelada, no sobre
el estado `student` general de la pantalla.

#### Scenario: Un escaneo durante el modal de suspensión no cambia el objetivo

- **WHEN** el modal de suspensión rápida está abierto mostrando a una persona y llega un escaneo de
  otro carnet
- **THEN** al confirmar la suspensión, la persona suspendida es la que se mostraba en el modal, no
  la del nuevo escaneo
