## ADDED Requirements

### Requirement: La alarma de consumo duplicado dura ~10 segundos

Cuando el registro al comedor detecta un consumo duplicado (respuesta `409`), la **alarma sonora**
SHALL sonar durante aproximadamente **10 segundos** (repitiendo el audio o mediante control de
duración) antes de detenerse y cerrar el aviso. La reproducción SHALL seguir siendo best-effort (un
fallo de audio no interrumpe el flujo) y SHALL cancelarse si se atiende otro registro antes de los
10 s, sin dejar instancias de `Audio` colgadas.

#### Scenario: La alarma suena ~10 segundos

- **WHEN** ocurre un registro duplicado
- **THEN** la alarma suena alrededor de 10 segundos y luego el aviso se cierra

#### Scenario: Nuevo registro antes de los 10 s

- **WHEN** se atiende a otra persona antes de que terminen los 10 segundos
- **THEN** la alarma anterior se detiene y no quedan instancias de audio activas

#### Scenario: Autoplay bloqueado

- **WHEN** el navegador impide reproducir el audio
- **THEN** el flujo continúa y el aviso se maneja igualmente (cierre manual), sin errores visibles
