## Contexto

Este cambio se implementa **en paralelo** con `be-mejoras-operativas-comedor` en el repositorio del
backend. El contrato de la API es normativo y está definido en el `design.md` de aquel cambio; aquí
solo se recogen las decisiones propias de la interfaz.

## Decisión: cómo se marca el sexo

La petición original decía "marcar con un check el sexo de los estudiantes". Se implementa como
**dos opciones excluyentes (Masculino / Femenino) sobre un estado inicial vacío**, no como una única
casilla.

Una casilla tiene dos estados y el dominio tiene tres: masculino, femenino y *sin clasificar*. Con
8.380 filas importadas sin sexo, una casilla sin marcar sería indistinguible de "femenino" y no
habría forma de saber cuántos faltan por revisar ni de ofrecer el filtro "Sin sexo asignado" que
convierte la pantalla en una cola de trabajo. Visualmente ocupa lo mismo que la casilla pedida.

El control SHALL permitir volver al estado sin clasificar, para poder deshacer una clasificación
equivocada.

## Decisión: dónde vive el aviso de consumo previo

Se pinta en la ranura `notice` que `StudentResultCard` ya expone, no en un modal.

Un modal interrumpe y exige un clic antes de seguir; el taquillero necesita la información **mientras
mira la ficha**, no encima de ella. El modal actual disparado por el 409 se conserva sin cambios:
sigue siendo la red que atrapa el caso en que dos taquillas registran a la misma persona a la vez,
que ninguna consulta previa puede prevenir.

## Decisión: la fecha del aviso en el registro manual

`ManualRegistrationPage` opera sobre una fecha arbitraria, así que consulta `check-by-document` con
**la fecha seleccionada en el formulario**, no con hoy. Avisar de lo que alguien comió hoy cuando se
le está registrando un consumo del día 3 sería ruido, y peor: entrenaría al operador a ignorar el
aviso.

## Decisión: un solo mapa de etiquetas de rol

Los cuatro `ROLE_LABEL` duplicados (`UserFormModal`, `Header`, `ListUser`, `PermissionsPage`) se
consolidan en `src/utils/labels.ts`. Además de arreglar el rol de acceso directo, elimina la
divergencia que ya existe entre copias —`'Super Administrador'` frente a `'Super Admin'`— y que es
exactamente el mecanismo por el que se coló este fallo.

## Dependencia de orden

`GET /roles/` empieza a devolver `ACCESO_DIRECTO` solo cuando la migración del backend está aplicada.
Hasta entonces el mapa consolidado SHALL tolerar el valor antiguo sin romper: la clave desconocida
cae en el respaldo `?? r.name`, que es el comportamiento actual. No se añade una traducción
permanente `BENEFICIARIO → ACCESO_DIRECTO`; eso perpetuaría los dos nombres que este cambio elimina.
