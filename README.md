# Dining System UNET — Frontend

Cliente del **Sistema de Comedor Universitario** de la Universidad Nacional
Experimental del Táchira (UNET). Es una SPA de React 19 + TypeScript que se
distribuye de dos formas:

- **Web** — compilada con Vite y desplegada en Vercel.
- **Escritorio** — la misma SPA empaquetada con **Tauri 2** (shell en Rust).

Consume la API REST de
[`Dining-System-UNET-Backend`](../Dining-System-UNET-Backend).

---

## ¿Qué incluye?

| Módulo | Pantallas |
|---|---|
| **Comedor** | Sesión de servicio, Consultar consumo, Registro al comedor (con lector de código de barras y aviso previo si la persona ya consumió), Reporte de comedor, Historial de sesiones, Registro manual (con la relación de ingresos del día), Suspender usuario, Usuarios suspendidos, Verificar acceso directo |
| **Personas** | Padrón de estudiantes, Accesos directos, Gente externa, Importación de estudiantes por CSV, Lista de usuarios del sistema |
| **Inventario** | Registrar inventario, Inventario general, Reportes de consumo de insumos, Crear servicio de alimentación, Plantillas, Pruebas de cálculo |
| **Administración** | Auditoría de acceso, Gestión de permisos, Plantilla de correo, Sedes, Catálogo de carreras |

Cada pantalla se muestra u oculta según el rol (`SUPER_ADMIN`, `ADMIN`,
`TAQUILLERO`, `ACCESO_DIRECTO`) y los permisos por usuario que define el backend.

---

## Requisitos

- **Node.js 18+** y npm
- Solo para la app de escritorio: **Rust** estable y las
  [dependencias del sistema de Tauri 2](https://tauri.app/start/prerequisites/)
- El backend corriendo (por defecto en `http://localhost:8001`)

---

## Puesta en marcha

```bash
npm install
cp .env.example .env     # opcional: el valor por defecto ya funciona en desarrollo
npm run dev              # http://localhost:1420
```

En desarrollo Vite hace *proxy* de `/api` hacia `http://localhost:8001`, así que
no hace falta configurar ninguna URL si el backend corre con Docker Compose.

### Levantar todo el sistema de una vez

Desde el directorio padre:

```bash
../start_projects.sh
```

Arranca el backend (PostgreSQL + FastAPI en Docker) y este servidor de desarrollo,
espera a que ambos respondan y los detiene juntos con `Ctrl+C`.

---

## Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Vite en el puerto **1420** |
| `npm run build` | `tsc && vite build` → genera `dist/` |
| `npm run preview` | Sirve la compilación de producción |
| `npm test` | Ejecuta las pruebas con Vitest |
| `npm run test:watch` | Vitest en modo observación |
| `npm run tauri dev` | Aplicación de escritorio en desarrollo (Rust + Vite) |
| `npm run tauri build` | Empaqueta la aplicación de escritorio |

> ⚠️ Vite usa `strictPort: true` en el puerto **1420** porque es el que espera
> Tauri (`devUrl` en `src-tauri/tauri.conf.json`). Si el puerto está ocupado el
> arranque falla en lugar de cambiar de puerto. Compruébalo con
> `ss -lptn 'sport = :1420'`.

---

## Variables de entorno

```bash
cp .env.example .env
```

| Variable | Por defecto | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Base de la API. La ruta relativa funciona tanto en desarrollo (proxy de Vite) como en producción (rewrite de Vercel). Solo hace falta una URL absoluta si el backend está en otro host; el sufijo `/api/v1` se añade solo si falta |

Vite solo expone al navegador las variables con prefijo `VITE_`. **No pongas
secretos aquí**: el bundle es público.

---

## Estructura del proyecto

```
src/
├── api/           # Un módulo por recurso del backend; todos pasan por client.ts
├── components/
│   ├── ui/        # Primitivas reutilizables (Button, Input, Card, Table, Modal, Chart…)
│   ├── layout/    # Header y Footer
│   ├── inventory/ · lunch/ · reports/ · statistics/ · icons/
├── config/        # routeAccess.ts — mapa de rutas por rol
├── context/       # AuthContext (usuario + permisos)
├── hooks/         # useBarcodeScanner
├── pages/         # 27 pantallas, una por ruta
├── types/         # Tipos que reflejan los contratos del backend
├── utils/         # CSV, PDF, impresión, sonidos, toasts, cálculo de almuerzos
├── App.tsx        # Rutas + AuthProvider + Toaster
└── main.tsx       # Punto de entrada

src-tauri/         # Shell de escritorio en Rust (config, iconos, build)
public/            # Recursos estáticos (incluye sounds/Alerta.mp3)
```

---

## Cómo funciona la sesión

- La autenticación es **por cookies HttpOnly** que emite el backend; el frontend
  nunca guarda tokens en JavaScript.
- El cliente HTTP (`src/api/client.ts`) renueva el token de forma transparente:
  ante un `401` llama a `/auth/refreshToken` y reintenta la petición una vez. Si
  la renovación falla, redirige a `/login`.
- El único dato que se guarda en `localStorage` es `selected_sede_id`, para
  recordar la sede elegida por el taquillero entre sesiones del navegador.
- El acceso a cada pantalla se decide con `canAccess()`
  (`src/config/routeAccess.ts`): primero manda el permiso individual que devuelve
  el backend y, si no existe, la lista de roles de `ROUTE_ACCESS`. Es un filtro de
  experiencia de usuario — el backend vuelve a validarlo todo.

---

## Lector de código de barras

La pantalla de registro admite lectores USB que se comportan como teclado. El
hook `useBarcodeScanner` acumula las teclas que llegan a menos de 60 ms de
distancia y considera terminada la lectura al recibir `Enter`. Mientras el foco
esté en un campo de texto el lector se ignora, de modo que también se puede
escribir la cédula a mano.

---

## Despliegue

`vercel.json` configura:

- compilación con `npm run build` y salida en `dist/`,
- reescritura de `/api/v1/*` hacia
  `https://dining-system-unet-backend-nine.vercel.app/api/v1/*`,
- *fallback* de cualquier otra ruta a `/index.html` (necesario para una SPA).

Para la aplicación de escritorio, `npm run tauri build` genera los instaladores en
`src-tauri/target/release/bundle/`.

---

## Documentación adicional

| Documento | Contenido |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Guía técnica detallada: arquitectura, capa de API, patrones y convenciones |
| [`../docs/DOCUMENTACION.md`](../docs/DOCUMENTACION.md) | Documentación funcional del sistema completo |
| [`../docs/MANUAL_DE_USO.md`](../docs/MANUAL_DE_USO.md) | Manual de usuario |
| `problematicas_clasificadas_frontend_backend.md` | Registro de incidencias que citan los comentarios del código |
