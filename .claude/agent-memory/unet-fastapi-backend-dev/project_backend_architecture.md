---
name: project-backend-architecture
description: Estructura real del backend FastAPI UNET — rutas, módulos, patrones de acceso, contratos API
metadata:
  type: project
---

## Ubicación del backend
`/home/frankly-bautista/Documentos/Servicio_Comunitario/Dining-System-UNET-Backend`

## Stack y versión
- FastAPI, SQLAlchemy ORM, Pydantic v2, Alembic, PostgreSQL
- Puerto por defecto: **8000** (config) pero doc externa dice 8001; verificar `.env` activo

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
