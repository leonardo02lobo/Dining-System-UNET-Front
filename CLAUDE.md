# CLAUDE.md — Dining System UNET Frontend

## 1. Project Overview

This is the frontend for the **Sistema de Comedor Universitario** of the Universidad Nacional Experimental del Táchira (UNET). It is a desktop application built with Tauri 2 (Rust shell) wrapping a React 19 SPA. The system serves three user roles — **SUPER_ADMIN**, **ADMIN**, and **TAQUILLERO** — and provides tools for:

- Student dining registration via barcode/ID card scanner
- Student lookup and suspension management
- Inventory management (ingredients and daily lunch planning)
- Consumption reporting with charts
- System user directory
- Login audit log

The backend is a separate FastAPI service (see `/home/leonardo/Documentos/Project/Dining-System-UNET-Backend`).

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Desktop shell | Tauri | 2.x |
| UI framework | React | 19.1 |
| Language | TypeScript | ~5.8 |
| Routing | React Router DOM | 7.x |
| Styling | Tailwind CSS | 3.4 |
| Build tool | Vite | 7.x |
| Icons | Lucide React | 1.16 |
| Charts | Chart.js + react-chartjs-2 | 4.5 / 5.2 |
| HTTP | Native `fetch` (no third-party client) | — |
| CSS processing | PostCSS + Autoprefixer | — |

**Key dev dependencies:** `@tauri-apps/cli`, `@vitejs/plugin-react`, TypeScript strict mode enabled.

---

## 3. Architecture Overview

```
/
├── src/                        # React/TypeScript source
│   ├── api/                    # API layer (fetch wrappers)
│   │   ├── client.ts           # Base HTTP client
│   │   ├── auth.ts             # Auth endpoints
│   │   ├── audit.ts            # Audit log endpoints
│   │   └── user.ts             # User data (currently mock via randomuser.me)
│   ├── components/
│   │   ├── layout/             # App-level shell components
│   │   │   ├── Header.tsx      # University header bar
│   │   │   └── Footer.tsx      # Copyright footer
│   │   └── ui/                 # Reusable primitive components
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Chart.tsx       # BarChart, PieChart, LineChart, MixedChart
│   │       ├── FilterPanel.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── NavBar.tsx      # Role-filtered sidebar navigation
│   │       ├── PageHeader.tsx
│   │       ├── SearchInput.tsx
│   │       ├── Select.tsx
│   │       ├── Spinner.tsx
│   │       ├── Table.tsx       # Generic sortable data table
│   │       └── UnetLogo.tsx
│   ├── context/
│   │   └── AuthContext.tsx     # Global auth state (user + loading + refetch)
│   ├── pages/                  # One component per route
│   │   ├── Index.tsx           # Root layout (Header + NavBar + Outlet + Footer)
│   │   ├── LoginPage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── CheckConsumes.tsx
│   │   ├── RegisterDining.tsx
│   │   ├── SuspendStudent.tsx
│   │   ├── ListUser.tsx
│   │   ├── InventoryPage.tsx
│   │   ├── CreateLunchPage.tsx
│   │   ├── ReportsPage.tsx
│   │   └── LoginAuditPage.tsx
│   ├── types/                  # TypeScript interfaces/types
│   │   ├── auth.ts
│   │   ├── audit.ts
│   │   ├── user.ts
│   │   └── inventory.ts
│   ├── App.tsx                 # Router and AuthProvider root
│   ├── main.tsx                # ReactDOM.createRoot entry point
│   └── index.css               # Tailwind directives + global resets
├── src-tauri/                  # Rust/Tauri shell
│   ├── tauri.conf.json         # Tauri config (window size, bundle targets)
│   ├── Cargo.toml
│   └── build.rs
├── public/                     # Static assets served by Vite
├── vite.config.ts              # Vite config (port 1420, Tauri-specific settings)
├── tailwind.config.cjs
├── postcss.config.cjs
├── tsconfig.json               # Strict TypeScript, ES2020 target
└── .env.example
```

---

## 4. How to Run / Build

### Web-only development (no Tauri desktop shell)
```bash
npm run dev        # Vite dev server on http://localhost:1420
npm run build      # tsc + vite build → dist/
npm run preview    # Preview production build
```

### Desktop application (Tauri)
```bash
npm run tauri dev      # Launches Tauri + Vite dev server together
npm run tauri build    # Packages the desktop app for all targets
```

**Important:** Vite is configured with `strictPort: true` on port **1420**. Tauri expects this exact port. Do not change it without updating `tauri.conf.json` (`devUrl`).

---

## 5. Key Components and Their Responsibilities

### Pages

| Page | Route | Description |
|---|---|---|
| `LoginPage` | `/login` | Standalone login form, no sidebar |
| `Index` | `/` | Root layout shell — Header, sidebar NavBar, Outlet, Footer |
| `Dashboard` | `/dashboard` | Bar + Pie charts (currently uses randomuser.me mock data) |
| `CheckConsumes` | `/comedor/consultar` | Look up student by ID card; shows profile + suspension status |
| `RegisterDining` | `/comedor/registrar` | Barcode scanner integration — listens to `keydown` for fast hardware scanner input |
| `SuspendStudent` | `/suspendStudent` | Look up student, toggle suspension status |
| `ListUser` | `/usuarios` | Filterable/sortable user directory table |
| `InventoryPage` | `/inventario` | CRUD for pantry ingredients (add/edit/delete via modal) |
| `CreateLunchPage` | `/inventario/crear` | Build today's lunch from inventory ingredients |
| `ReportsPage` | `/comedor/reporte` | Date-range report with charts and printable table |
| `LoginAuditPage` | `/auditoria` | Paginated login audit log from real API |

### Layout Components

- **`Header`** — Displays UNET and Decanato logos. Accepts `isLogin?: boolean` to show a greeting bar with the current date/time when inside the authenticated shell.
- **`NavBar`** — Role-filtered sidebar. Uses `useAuth()` to read the current user's role and shows only the nav items that role is allowed to see. Handles logout.
- **`Footer`** — Static copyright bar.

### UI Primitives

All primitives live in `src/components/ui/` and accept a `className` prop for overrides.

- **`Button`** — `variant`: primary | secondary | ghost | danger. `size`: sm | md | lg. Supports `loading`, `leftIcon`, `rightIcon`, `fullWidth`.
- **`Input`** — `forwardRef` wrapper. Supports `label`, `error`, `hint`, `leftIcon`, built-in password show/toggle. Passes `aria-invalid` and `aria-describedby` for accessibility.
- **`Card`** — Compound component with `Card.Header`, `Card.Body`, `Card.Footer` sub-components. `variant`: default | elevated | outlined.
- **`Table<T>`** — Generic, typed. Column definitions include optional `render` function and `sortable` flag. Built-in client-side sort; supports `actions` column and `onRowClick`.
- **`Modal`** — Uses `ReactDOM.createPortal` to render into `document.body`. Closes on Escape key and backdrop click.
- **`Badge`** — `variant`: success | danger | warning | info | neutral.
- **`SearchInput`** — Debounced search field. Pass `debounceMs` and `onSearch` callback.
- **`Chart`** — Exports `BarChart`, `PieChart`, `LineChart`, `MixedChart` built on Chart.js. Each has sensible defaults and accepts `data` and `options` overrides.
- **`FilterPanel`** — Collapsible sidebar panel for checkbox filters.
- **`Avatar`** — Shows image or falls back to first-letter initials.
- **`Spinner`** — Animated Lucide `Loader2` icon. `size`: sm | md | lg.

---

## 6. API Layer

### Base client — `src/api/client.ts`

All HTTP calls go through `apiClient`, a thin wrapper around `fetch`:

```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api/v1'
```

- `credentials: 'include'` — session cookies are sent automatically on every request.
- `Content-Type: application/json` by default; `postForm` uses `application/x-www-form-urlencoded` (needed for OAuth2 password flow).
- Errors are thrown as `ApiError` objects: `{ message, status, details? }`.
- HTTP 204 responses return `undefined` without attempting JSON parsing.

### Domain modules

| Module | File | Notes |
|---|---|---|
| Auth | `src/api/auth.ts` | `login` (posts form, then fetches `/users/me`), `logout`, `me` |
| Audit | `src/api/audit.ts` | `getLogs(skip, limit)` — paginated |
| User | `src/api/user.ts` | **Currently a mock** — fetches from randomuser.me and seeds careers locally. Replace with real backend calls when the endpoint is ready. |

### Backend API base path

The backend exposes routes under `/api/v1`. Key endpoints used:

- `POST /auth/login` (form-encoded)
- `POST /auth/logout`
- `GET  /users/me`
- `GET  /auth/audit-logs?skip=&limit=`

---

## 7. State Management

There is **no global state library** (no Redux, Zustand, etc.). State is managed with:

1. **`AuthContext`** (`src/context/AuthContext.tsx`) — the only React context. Stores the authenticated `User` object and a `loading` flag. Exposes a `refetch()` function. Consumed via `useAuth()` hook throughout the app. Session is established by cookies; `refetch` calls `/users/me` to re-hydrate on page load.

2. **Local component state** (`useState`) — each page manages its own loading, error, data, filter, and modal states independently. There is no shared page-level state.

3. **No persistent client-side storage** — authentication relies entirely on HTTP-only cookies set by the backend. There is no localStorage or sessionStorage usage.

---

## 8. Styling Conventions

- **Tailwind CSS** is the sole styling mechanism. No CSS modules, no styled-components, no custom CSS beyond the global resets in `src/index.css`.
- **Inline class string composition** via array-join pattern used in primitives:
  ```typescript
  const classes = ['base-class', conditionalClass, className ?? '']
    .filter(Boolean)
    .join(' ')
  ```
- **Color palette in use:**
  - Primary actions: `blue-600` / `blue-700`
  - Danger/destructive: `red-600`
  - Backgrounds: `white`, `slate-50`
  - Borders: `slate-200`, `slate-300`
  - Text: `slate-800` (headings), `slate-700` (body), `slate-500` (secondary), `slate-400` (muted)
  - Success badges: `green-100 / green-700`
  - Header gradient: `from-[#03216A] via-[#7D8EB7] to-[#EBEFF4]` (UNET institutional blue)
- **Font:** Inter (system stack fallback). Set globally in `index.css`.
- **No custom Tailwind theme extensions** — `tailwind.config.cjs` uses the default theme with an empty `extend`.

---

## 9. Important Patterns and Conventions

### Role-based navigation

`NavBar` defines a `navGroups` array where each nav item carries a `roles: RoleName[]` array. Items not matching the current user's role are filtered out at render time. The three roles are `SUPER_ADMIN`, `ADMIN`, and `TAQUILLERO`.

### Async data loading in pages

Pages use the `void (async () => { ... })()` IIFE pattern inside `useEffect` to load data:

```typescript
useEffect(() => {
  void (async () => {
    try {
      const data = await someApi.fetch()
      setData(data)
    } catch (err: any) {
      setError(err.message ?? 'Error desconocido')
    } finally {
      setLoading(false)
    }
  })()
}, [])
```

### Barcode scanner detection (`RegisterDining`)

The barcode scanner integration works by listening to `window keydown` events globally. Characters arriving faster than `MAX_GAP_MS = 60ms` are accumulated in a ref buffer; an `Enter` key finalises the scan. This is the standard approach for USB HID barcode readers that emulate a keyboard.

### Mock data / stubs in progress

Several pages are partially wired up with mocks pending real API integration:

- **`CheckConsumes`** and **`SuspendStudent`** — hardcode a student object after a fake 600ms delay instead of calling the backend.
- **`Dashboard`** — pulls from randomuser.me (public test API).
- **`api/user.ts`** — the `getData()` function is a mock. The `ListUser` page uses this.
- **`InventoryPage`** and **`CreateLunchPage`** — `MOCK_INGREDIENTS` constant; `handleSave`/`handleConfirm` use `setTimeout` and `alert()`.
- **`ReportsPage`** — `MOCK_DATA` constant; API call is a `TODO` comment.

When wiring up real API calls, follow the pattern in `auditApi` (the only fully real endpoint besides auth).

### Backward-compatible route redirects

`App.tsx` keeps old route aliases alive:

```
/checkConsumes  → /comedor/consultar
/registerDining → /comedor/registrar
/listUser       → /usuarios
/loginAudit     → /auditoria
```

### TypeScript strict mode

`tsconfig.json` enables `strict`, `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`. Keep these passing — the build (`tsc && vite build`) will fail otherwise.

---

## 10. Environment Variables

Copy `.env.example` to `.env` before starting development:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8001/api/v1` | Full base URL of the FastAPI backend, including `/api/v1` |

The variable is read in `src/api/client.ts`. If absent, the client falls back to the default shown above.

**Important:** Vite exposes only variables prefixed with `VITE_` to the browser bundle. Do not put secrets here.

---

## 11. Backend Connection Notes

- The backend runs on **port 8001** by default.
- Authentication uses **HTTP-only session cookies** (set by the backend on `POST /auth/login`). The frontend never stores tokens in JS-accessible storage.
- The login flow calls `POST /auth/login` with `application/x-www-form-urlencoded` body (`username`, `password`), then immediately calls `GET /users/me` to hydrate the user object.
- CORS must be configured on the backend to allow `http://localhost:1420` (Tauri dev) with `credentials: true`.
