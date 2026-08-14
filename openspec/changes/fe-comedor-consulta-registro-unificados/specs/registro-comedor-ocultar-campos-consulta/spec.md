## REMOVED Requirements

### Requirement: Ocultar sede y cédula con un estudiante consultado

**Reason**: El requisito nació para recuperar alto vertical escondiendo controles al mostrar una
persona. Dos cosas lo dejan sin objeto:

1. **No está implementado.** `RegisterDining` mantiene visibles el selector de sede y el campo de
   cédula en todo momento; ninguno de sus escenarios se cumple hoy. Es una spec que nadie comprueba,
   y arrastrarla solo produce la ilusión de una garantía.
2. **Esconder el campo de cédula pelea con el flujo del lector.** El escaneo de la siguiente persona
   tiene que poder ocurrir en cualquier instante; el propio requisito tuvo que añadir un escenario
   ("Escaneo tras registrar") para tapar el agujero que él mismo abría.

El alto que perseguía se recupera por otra vía en la capacidad
`comedor-consulta-registro-unificados`: maquetación a dos columnas y retirada de todos los campos
vacíos, sin ocultar ningún control operativo.

**Migration**: Sustituido por los requisitos "Ningún campo vacío en pantalla" y "Consultar no depende
de la sede ni de la sesión abierta" de `comedor-consulta-registro-unificados`. La acción explícita de
limpiar la ficha se conserva ("Limpiar"); lo que desaparece es la exigencia de ocultar controles.
