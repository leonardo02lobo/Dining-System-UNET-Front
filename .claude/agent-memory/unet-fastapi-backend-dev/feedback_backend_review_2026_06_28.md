---
name: feedback-backend-review-2026-06-28
description: Hallazgos críticos de la revisión backend del 2026-06-28 — vulnerabilidades y problemas conocidos a vigilar en futuras implementaciones
metadata:
  type: feedback
---

## Regla: SIEMPRE crear un schema separado para self-update de usuario

Cuando se implemente `PUT /users/me`, usar un schema dedicado (`UserSelfUpdate`) que SOLO permita `name`, `email`, `password`. NUNCA reutilizar `UserAccountUpdate` (que incluye `role_id` e `is_active`) en endpoints de auto-edición.

**Why:** `update_me` en `users.py` actualmente permite privilege escalation: cualquier usuario autenticado puede enviarse `{"role_id": 1}` y volverse SUPER_ADMIN porque `crud_user.update()` aplica todos los campos del schema sin restricciones.

**How to apply:** Antes de implementar cualquier endpoint de "editar mi perfil" o similar, verificar que el schema de entrada no contenga campos de privilegio (`role_id`, `is_active`, `is_admin`, etc.).

---

## Regla: Los endpoints de listado con N relaciones requieren eager loading explícito

Cuando un endpoint llama a `_response_helper(obj)` que accede a `obj.relationship_attr`, verificar que la query en el CRUD usa `joinedload()` o `selectinload()` para esa relación. Sin esto, cada fila genera un SELECT adicional (N+1).

**Why:** `GET /sanctions/suspended` en `sanctions.py` llama `_suspended_response(s)` que accede a `s.acceso_directo`, pero `crud_sanction.get_active_suspensions()` solo hace el JOIN para filtrar, no para cargar el objeto.

**How to apply:** En cada CRUD list function, verificar con `options(joinedload(...))` todas las relaciones que el router accederá.

---

## Regla: Agregar UniqueConstraint a nivel de BD en columnas con chequeo app-level

Si el router/CRUD hace una query "¿ya existe?" antes de insertar, eso es check-then-act y es una race condition. Siempre complementar con `UniqueConstraint` en el modelo + migración.

**Why:** `consumptions` no tiene `UniqueConstraint("acceso_directo_id", "lunch_session_id")`. Dos requests simultáneos pueden pasar el check y crear registros duplicados.

**How to apply:** Al implementar endpoints POST, buscar el patrón `if crud.get_for_...(db, ...)` seguido de `crud.create(...)` y agregar constraint de BD.

---

## Hallazgo conocido: router.py tiene imports duplicados

`app/api/v1/router.py` líneas 2-18 importa los mismos módulos dos veces. Python no lo rechaza (usa el segundo), pero `sedes` solo aparece en la segunda línea. Al agregar nuevos módulos, poner SOLO en el bloque limpio de la línea 17-18 (o mejor, limpiar el archivo entero antes).

---

## Hallazgo conocido: CORS faltante en .env activo

`.env` tiene `BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8080"]` sin `http://localhost:1420`. Usar `.env.example` como referencia al recrear `.env` en entornos de desarrollo.
