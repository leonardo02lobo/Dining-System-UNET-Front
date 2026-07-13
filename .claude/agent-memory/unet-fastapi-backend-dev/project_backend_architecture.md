---
name: project-backend-architecture
description: Estructura real del backend FastAPI UNET — rutas, módulos, patrones de acceso, contratos API
metadata:
  type: project
---

## Ubicación del backend
`/home/leonardo/Documentos/Project/Servicio comunitario/Dining-System-UNET-Backend`
(ruta observada en máquinas distintas entre sesiones; verificar cwd/entorno si no coincide)

## Stack y versión
- FastAPI, SQLAlchemy ORM, Pydantic v2, Alembic, PostgreSQL
- `app/core/config.py` define `PORT: int = 8000` por defecto, pero el CLAUDE.md del
  frontend y `.env.example` apuntan a 8001 — confirmar el valor real de `.env` activo
  antes de asumir cualquiera de los dos.

## Estructura de capas
```
app/
  api/
    deps.py            ← auth cookies + Bearer, require_role(), require_permission()
    v1/
      router.py        ← agrega todos los sub-routers bajo /api/v1
      endpoints/       ← un archivo por módulo (routers thin)
  crud/                ← lógica de acceso a BD
  models/              ← SQLAlchemy ORM
  schemas/             ← Pydantic request/response (separados)
  core/
    config.py          ← Settings via pydantic-settings
    security.py        ← bcrypt + JWT (jose)
    database.py        ← SessionLocal, get_db
  db/init_db.py        ← seeds roles, superadmin, permisos; expira sanciones. Corre en cada startup.
alembic/versions/      ← 19 migraciones, HEAD: f9999999999f → d4e5f6a7b8c9 (última)
api/index.py           ← entry point para Vercel (re-exporta app)
```

## Módulos/endpoints activos bajo /api/v1
| Prefix | Router |
|---|---|
| /auth | login, logout, refreshToken, changeRole, audit-logs |
| /users | CRUD + /me |
| /users (compartido!) | /{user_id}/permissions (GET/PUT) |
| /roles | listado de roles |
| /permissions | permisos del sistema |
| /accesos_directos | CRUD beneficiarios (tabla real: `beneficiaries`) |
| /access-reasons | motivos de acceso (deportes, etc.) |
| /lunch-sessions | abrir/cerrar sesiones de almuerzo |
| /consumptions | registro normal y manual CRUD |
| /sanctions | suspensiones CRUD + quick + lift |
| /reports | reportes consumo y sanciones |
| /consumption-reports | reportes por insumo (CSV/PDF) |
| /audit-logs | logs de acciones |
| /inventory | insumos, categorías, stock |
| /lunches | almuerzos y confirmación |
| /lunch-templates | plantillas de almuerzo |
| /sedes | sedes físicas |

**test_data.py** existe pero NO está montado en router.py.

## Auth y cookies
- Cookie `unet_access_token` (httponly) + Bearer token (dual)
- Cookie `unet_refresh_token` path="/api/v1/auth/refreshToken"
- Cookie `unet_user_role` (no httponly, para filtrar UI)
- `_SECURE = not settings.DEBUG` → en desarrollo (DEBUG=true) las cookies son insecure

## Tablas reales (SQLAlchemy __tablename__)
- `AccesoDirecto` → `beneficiaries`
- `Sanction.acceso_directo_id` → columna real `beneficiary_id`
- `Consumption.acceso_directo_id` → columna real `beneficiary_id`

## Sistema de permisos
- `require_permission(route)` en `deps.py` retorna `Depends(checker)` directamente
- Cache en memoria de permisos por user_id, TTL 5 min
- `invalidate_permissions_cache(user_id)` se llama al actualizar permisos

## Roles
- SUPER_ADMIN, ADMIN, TAQUILLERO, ACCESO_DIRECTO (valor DB: "BENEFICIARIO")

## Módulos adicionales confirmados en auditoría 2026-07-13 (ver [[audit-olas-3-7-issues-reunion]])
- `app/api/v1/endpoints/`: además de lo listado arriba, existen `email_settings.py`,
  `email_templates.py`, `external_people.py`, `consumption_reports.py`, `sanctions.py`,
  `lunches.py` (incluye `templates_router` para `/lunch-templates`).
- `app/api/v1/router.py` YA NO tiene imports duplicados (contradice hallazgo previo del
  2026-06-28) — es un único bloque limpio de imports; no reintroducir el patrón duplicado.
- Persona externa: tabla `external_people` (modelo `ExternalPerson`, enum
  `ExternalPersonType` JUBILADO/EXTERNO) paralela a `beneficiaries`. `Consumption` tiene
  `external_person_id` (FK, nullable) además de `beneficiary_id` (ahora nullable), con
  CHECK `ck_consumption_one_person` (XOR) y UNIQUE por sesión/día para externos.
- `Lunch` y `LunchSession` NO tienen FK entre sí: se asocian implícitamente por
  `Lunch.date == LunchSession.date`. `GET /lunches?date=` es el mecanismo de "menú del día".
- `Lunch.status` (`DRAFT`/`CONFIRMED`): solo `DRAFT` es editable; `_ensure_editable()` en
  `app/api/v1/endpoints/lunches.py` bloquea con 409 edición/borrado de almuerzo e
  ingredientes cuando `CONFIRMED`.
- `confirm_lunch()` en `app/crud/lunch.py` llama `upsert_template_from_lunch()` SIEMPRE
  (no opcional) dentro de la misma transacción — upsert de `LunchTemplate` por nombre.
- `StockMovement.entry_date` (Date, nullable) persiste la fecha de ingreso real del
  insumo; `POST /inventory/items/{id}/stock/increase` la acepta vía `StockChange.entry_date`
  (default: hoy si se omite; rechaza fechas futuras).
- `EmailSettings` (fila única, tabla `email_settings`): `from_name`/`from_address`/`cc`.
  `GET`/`PUT /email-settings` protegidos SUPER_ADMIN. `crud/email_settings.get_or_default()`
  cae a `settings.EMAIL_FROM_NAME/EMAIL_FROM_ADDRESS/DECANATO_NOTIFY_ADDRESS` si no hay fila.
  `services/email.py::notify_sanction` ya usa estos valores persistidos.
- `ConsumptionResponse` embebe datos de persona (nombre/apellido/cédula/carrera) y
  `is_priority` directamente en cada fila (evita N+1 en el frontend); acepta filtro
  `is_priority` además de `session_id`/`from_date`/`to_date` en `GET /consumptions/`.
  Envelope `{total, items}` en todos los listados paginados del proyecto.
