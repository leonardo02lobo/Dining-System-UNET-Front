# registro-alarma-duplicado-duracion Specification

## Purpose
TBD - created by archiving change fe-issues-reunion-14-07. Update Purpose after archive.
## Requirements
### Requirement: La alarma de consumo duplicado dura ~10 segundos

Cuando el registro al comedor detecta un consumo duplicado (respuesta `409`), la **alarma sonora**
SHALL sonar durante aproximadamente **10 segundos** (repitiendo el audio o mediante control de
duración) antes de detenerse. El **cierre del aviso modal** SHALL desacoplarse de la duración del
sonido: el aviso SHALL permanecer abierto hasta que el usuario lo cierre explícitamente (botón
"Entendido") o realice una nueva consulta/escaneo, incluso después de que el sonido termine. La
reproducción SHALL seguir siendo best-effort (un fallo de audio no interrumpe el flujo) y SHALL
cancelarse si se atiende otro registro antes de los 10 s, sin dejar instancias de `Audio` colgadas.

#### Scenario: La alarma suena ~10 segundos

- **WHEN** ocurre un registro duplicado
- **THEN** la alarma suena alrededor de 10 segundos y luego se detiene

#### Scenario: El aviso permanece abierto tras terminar el sonido

- **WHEN** el sonido de alerta termina de reproducirse (por duración o de forma natural)
- **THEN** el aviso modal permanece abierto; el usuario debe cerrarlo explícitamente

#### Scenario: Nuevo registro antes de los 10 s

- **WHEN** se atiende a otra persona antes de que terminen los 10 segundos
- **THEN** la alarma anterior se detiene y no quedan instancias de audio activas

#### Scenario: Autoplay bloqueado

- **WHEN** el navegador impide reproducir el audio
- **THEN** el flujo continúa y el aviso se maneja igualmente (cierre manual), sin errores visibles

