# Diseño — La interfaz decide por permiso, no por rol

El mapa normativo de rutas vive en
`../Dining-System-UNET-Backend/openspec/changes/be-permisos-conceden-capacidad/design.md` §3. Este
documento solo decide cómo lo consulta el cliente.

---

## 1. `useCan()`

`AuthContext` ya expone `permissions: Permission[]` y `user`. Falta el atajo para preguntarle.

```typescript
// src/hooks/useCan.ts
export function useCan() {
  const { user, permissions } = useAuth()
  const can = (route: string) =>
    user != null && canAccess(route, user.role.name, permissions)
  const canAny = (...routes: string[]) => routes.some(can)
  return { can, canAny }
}
```

Se apoya en `canAccess`, que ya resuelve con la precedencia correcta —permiso explícito por usuario y,
si no lo hay, la lista estática por rol—, que es **la misma** que aplica `get_user_permissions` en el
servidor. Reimplementar esa precedencia sería garantizar que los dos lados se separen con el tiempo.

`canAny` existe porque el servidor tiene endpoints compartidos entre pantallas, y el cliente debe
poder preguntar lo mismo que va a preguntar la guarda.

---

## 2. Qué se decide por permiso y qué sigue siendo por rol

La regla es sencilla: **el cliente comprueba lo mismo que comprueba el servidor**. Si el backend
protege un endpoint con un permiso, el cliente pregunta por ese permiso; si lo protege con un rol
(el suelo del §2 del diseño de servidor), el cliente pregunta por el rol.

En `LunchSessionPage`:

```typescript
const { can } = useCan()
const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN'

const canOpen  = can('/comedor/sesion')                       // permiso, como el POST
const isOwner  = (s) => s.opened_by_id != null && s.opened_by_id === user?.id
const canClose = (s) => can('/comedor/sesion') && (isOwner(s) || (isAdmin && s.opened_by_id == null))
const canForce = (s) => role === 'SUPER_ADMIN' && !canClose(s) // rol, como el force-close
```

`isAdmin` sobrevive **solo** en los dos sitios donde el servidor también razona por administrador: la
excepción de las sesiones sin propietario y el cierre forzado. En ningún otro.

`isOwner` no cambia: la propiedad del cierre nunca dependió del rol.

---

## 3. El estado vacío deja de mentir

Hoy `fetchOpenSessions` traga cualquier error y deja la lista a cero, así que un 403 se pinta como
"No tienes ninguna sesión abierta". Es el fallo que costó la depuración de este mismo problema.

```typescript
const [listError, setListError] = useState<'forbidden' | 'error' | null>(null)
// …
catch (err) {
  setListError(err?.status === 403 ? 'forbidden' : 'error')
  setOpenSessions([])
}
```

| Estado | Mensaje |
|---|---|
| `forbidden` | "No tienes acceso a las sesiones de servicio. Pide que te concedan la pantalla *Sesión de Servicio de alimentación*." |
| `error` | El mensaje del servidor |
| Sin error y sin sesiones, administrador | "Ninguna sede tiene una sesión activa en este momento." |
| Sin error y sin sesiones, no administrador | "No tienes ninguna sesión abierta." |

La diferencia entre "no hay nada" y "no puedes ver" no es un matiz de redacción: es la diferencia
entre configurar el sistema en un minuto o pasar media hora buscando un fallo inexistente.

---

## 4. El cliente nunca es más restrictivo que el servidor

Ante la duda, la interfaz **muestra** la acción y deja que el servidor conteste. Un botón que da 403
es un fallo recuperable y explicable; una acción que el usuario tiene derecho a ejecutar y no aparece
en ninguna parte es indistinguible de un error del sistema, y no hay forma de diagnosticarla desde la
pantalla.

Por eso `canClose` compone permiso **y** autoría solo para *rotular* el botón, y el 403 del servidor
sigue siendo la autoridad: cuando llegue, se muestra su mensaje tal cual y se recarga el listado.

---

## 5. Barrido de comprobaciones de rol

Patrón a sustituir, presente en varias pantallas:

```typescript
const canManage = currentUser?.role.name === 'SUPER_ADMIN' || currentUser?.role.name === 'ADMIN'
```

| Pantalla | Pasa a |
|---|---|
| `AccesoDirectoPage` | `can('/accesos_directos')`; el borrado sigue siendo SUPER_ADMIN (suelo) |
| `StudentsPage` | `can('/estudiantes')` |
| `ListUser` | `can('/usuarios')`; editar y borrar cuentas siguen siendo SUPER_ADMIN (suelo) |
| `ExternalPeoplePage` | `can('/gente-externa')`; el borrado sigue siendo SUPER_ADMIN (suelo) |
| `SedesPage` | `can('/sedes')` |
| `CareerCatalogPage` | `can('/admin/carreras')` |
| `SuspendedListPage` | `can('/suspendidos')` |

En las tres pantallas con borrado, la acción destructiva SHALL seguir condicionada al rol
SUPER_ADMIN, porque es lo que el servidor exige: ofrecerla a quien va a recibir un 403 sería volver al
problema de partida por el otro lado.
