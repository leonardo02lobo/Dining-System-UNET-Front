# CLAUDE.md — Dining System UNET (Frontend)

## 1. Project Overview

Client for the **Sistema de Comedor Universitario** of the Universidad Nacional
Experimental del Táchira (UNET). A React 19 SPA that ships two ways: as a web app
(Vite build, deployed to Vercel) and as a desktop app (Tauri 2 / Rust shell).

Four roles — **SUPER_ADMIN**, **ADMIN**, **TAQUILLERO** and **ACCESO_DIRECTO** —
drive 27 screens covering:

- Meal registration at the counter, driven by a USB barcode/ID-card scanner, with
  an up-front warning when the person already ate that day
- Person lookup, quick suspension (with a capped end date) and the suspended list
- Service sessions per campus (*sede*) and their history
- Manual registration by date, the day's full entry list, and printable listings
- Direct-access people, external people, official student-roster import, the roster
  screen where sex is classified, career catalogue
- Pantry inventory and meal planning with proportional ingredient scaling
- Consumption / supply reports, attendance statistics and PDF·CSV export
- User directory, per-user permission management, login audit, email templates

The backend is the FastAPI service in
[`../Dining-System-UNET-Backend`](../Dining-System-UNET-Backend).

> UI copy and code comments are in **Spanish**; identifiers and this document are
> in English. Keep that split.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Desktop shell | Tauri | 2.x |
| UI framework | React | 19.1 |
| Language | TypeScript (strict) | ~5.8 |
| Routing | React Router DOM | 7.x |
| Styling | Tailwind CSS | 3.4 |
| Build tool | Vite | 7.x |
| Tests | Vitest + Testing Library + jsdom | 2.1 / 16.3 |
| Icons | Lucide React | 1.16 |
| Charts | Chart.js + react-chartjs-2 | 4.5 / 5.2 |
| Toasts | Sonner | 2.0 |
| PDF | jsPDF + jspdf-autotable | 4.2 / 5.0 |
| HTTP | native `fetch` (no third-party client) | — |
| CSS processing | PostCSS + Autoprefixer | — |

Rust side: `tauri` 2, `tauri-plugin-opener`, `serde`/`serde_json`.

---

## 3. Architecture

```
.
├── src/
│   ├── api/                  # One module per backend resource; all go through client.ts
│   │   ├── client.ts         # fetch wrapper: cookies, 401 → refresh → retry, error mapping, blobs
│   │   ├── auth.ts  user.ts  permissions.ts  audit.ts
│   │   ├── student.ts  externalStudent.ts  acceso_directo.ts  externalPerson.ts
│   │   ├── accessReason.ts  career.ts  sedes.ts
│   │   ├── lunchSession.ts  consumption.ts  sanction.ts
│   │   ├── inventory.ts  lunch.ts  reports.ts  statistics.ts  emailTemplate.ts
│   │   └── lunch.test.ts
│   ├── components/
│   │   ├── ui/               # 18 primitives (Button, Input, Card, Table, Modal, Chart…)
│   │   ├── layout/           # Header, Footer
│   │   ├── inventory/        # Inventory tables, filters, toolbar, summary panel, stock alerts
│   │   ├── lunch/            # Lunch form, ingredients table, recalculation table, plate stepper
│   │   ├── reports/          # Report table, charts, date filters, attendance panels
│   │   ├── statistics/       # Attendance charts by career / date / gender / person type
│   │   ├── icons/            # UNET and Decanato logos (SVG + embedded data)
│   │   ├── ProtectedRoute.tsx  SedeSelector.tsx  StudentResultCard.tsx
│   │   ├── AccesoDirectoFormModal.tsx  UserFormModal.tsx  CareerInput.tsx
│   │   ├── EmailTemplateEditor.tsx   # One template editor, parameterised by key
│   ├── config/routeAccess.ts # ROUTE_ACCESS, DEFAULT_ROUTE, canAccess() — the client-side gate
│   ├── context/AuthContext.tsx  # The only React context: user + permissions + loading
│   ├── hooks/useBarcodeScanner.ts
│   ├── pages/                # 27 route components (see §5)
│   ├── types/                # 16 type modules mirroring the backend contracts
│   ├── utils/                # csvImport, rosterMerge, lunchRecalculation, pdf*, printManual, sessionStats,
│   │                         # sound, toast, labels, cedula, apiErrors, chartPercent, downloadBlob,
│   │                         # sanctionDates (end-date window), consumptionNotice (shared warning text)
│   ├── data/mockLunch.ts     # Demo data only (used by LunchTestPage)
│   ├── test/setup.ts         # jest-dom matchers for Vitest
│   ├── App.tsx · main.tsx · index.css
├── src-tauri/                # Rust shell: tauri.conf.json, Cargo.toml, build.rs, src/lib.rs, icons/
├── public/                   # Static assets served as-is (includes sounds/Alerta.mp3)
├── openspec/                 # OpenSpec change proposals & specs
├── vite.config.ts · vitest.config.ts · tailwind.config.cjs · postcss.config.cjs
├── tsconfig.json · vercel.json · .env.example
```

---

## 4. Run / Build / Test

### Web

```bash
npm install
npm run dev        # Vite dev server on http://localhost:1420
npm run build      # tsc && vite build → dist/
npm run preview    # serve the production build
```

### Desktop (Tauri)

```bash
npm run tauri dev      # Rust shell + Vite together
npm run tauri build    # bundles for every target
```

### Tests

```bash
npm test           # vitest run
npm run test:watch
```

Vitest uses its **own config** (`vitest.config.ts`) so the Tauri-specific server
settings in `vite.config.ts` don't leak into the runner: jsdom environment,
globals on, `src/test/setup.ts` loaded, `src/**/*.{test,spec}.{ts,tsx}` collected.
Test files are excluded from `tsconfig.json` so `npm run build` doesn't typecheck
them.

### Ports and proxying

- Vite runs on port **1420** with `strictPort: true` — Tauri's `devUrl` expects
  exactly that. Changing it means changing `src-tauri/tauri.conf.json` too.
- In dev, Vite proxies `/api` → `http://localhost:8001` (the Docker Compose
  backend), so `VITE_API_BASE_URL` can stay at its default `/api/v1`.
- In production, `vercel.json` rewrites `/api/v1/*` to
  `https://dining-system-unet-backend-nine.vercel.app/api/v1/*` and sends
  everything else to `/index.html` (SPA fallback).

### Full stack

`../start_projects.sh` boots the backend (Docker Compose) and this dev server
together and shuts both down on `Ctrl+C`.

---

## 5. Routes and Pages

All authenticated routes render inside `Index` (Header + sidebar `NavBar` +
`Outlet` + Footer) behind `ProtectedRoute`.

| Route | Page | What it does |
|---|---|---|
| `/login` | `LoginPage` | Standalone login form, no shell |
| `/` | `Index` | Layout shell; the home view shows a watermark only |
| `/comedor/sesion` | `LunchSessionPage` | Open/close the service session for a sede, set planned plate count |
| `/comedor/consultar` | `CheckConsumes` | Look up a person and see whether they already ate today + sanction status |
| `/comedor/registrar` | `RegisterDining` | The counter screen: scan or type a cédula, register the meal, see the session counter and the last 10 entrants. Warns **before** registering when the person already ate today, and blocks the button |
| `/comedor/reporte` | `ReportsPage` | Consumption report with charts |
| `/comedor/historial` | `SessionHistoryPage` | Past sessions with attendance breakdown and printable entrant lists |
| `/comedor/registro-manual` | `ManualRegistrationPage` | Add/edit/delete registrations attached to a date; printable listing. Second tab lists **every** entry of that date (counter + manual), and the duplicate warning uses the **selected** date, not today |
| `/comedor/suspender` | `SuspendStudent` | Same lookup flow as registration, but the action is a quick suspension, with an end date capped at 365 days or an explicit "Indefinida" |
| `/suspendidos` | `SuspendedListPage` | Currently suspended people; lift a suspension (which emails the person) |
| `/verificar-acceso-directo` | `VerifyAccesoDirectoPage` | Self-service verification screen for the `ACCESO_DIRECTO` role |
| `/accesos_directos` | `AccesoDirectoPage` | CRUD of direct-access people |
| `/accesos_directos/importar` | `StudentImportPage` | Import of the official student roster: multi-file, auto-detected encoding/delimiter, merge, paged preview, chunked upload. The path keeps its historical prefix (twin of `_PERMISSIONS`) but the screen writes to `/students` |
| `/estudiantes` | `StudentsPage` | The roster itself: paginated list with search / status / career / **"Sin sexo asignado"** filters, and a detail panel split into sections. Everything is read-only **except the sex**, which is the only field the CSV does not carry and the panel must supply |
| `/gente-externa` | `ExternalPeoplePage` | CRUD of external people, classified by an **admin-managed label** (seeded *Jubilado* / *Externo*, plus whatever the operator creates for an event). Labels are created inline from the form. A SUPER_ADMIN-only action deactivates **everyone carrying a label** in one go, behind a modal that shows the count and requires typing the label's name |
| `/usuarios` | `ListUser` | Staff account directory. **No CSV import screen exists** — `userApi.bulkCreate` and the `UserBulk*` types are defined but unused |
| `/inventario` | `InventoryPage` | Register supplies: categories, items, stock entries |
| `/inventario/general` | `GeneralInventoryPage` | Read-only overview + PDF export |
| `/inventario/reportes-consumo` | `ConsumptionReportPage` | Supply consumption report, CSV/PDF export |
| `/inventario/crear` | `CreateLunchPage` | Build a meal: pick ingredients, scale by plate count, validate stock, confirm |
| `/inventario/plantillas` | `LunchTemplatesPage` | Reusable recipe templates |
| `/inventario/pruebas-almuerzo` | `LunchTestPage` | Sandbox to try the scaling maths without persisting |
| `/auditoria` | `LoginAuditPage` | Login audit log with date/role filters |
| `/admin/permisos` | `PermissionsPage` | Per-user route permission toggles (SUPER_ADMIN) |
| `/admin/plantilla-correo` | `EmailTemplatePage` | Two tabs — **suspension** and **lift** — each editing its template's subject/body with live preview, plus the shared sender settings. Placeholders come from the server, since each template admits a different set |
| `/sedes` | `SedesPage` | Campus CRUD |
| `/admin/carreras` | `CareerCatalogPage` | Career catalogue used by statistics filters |

**Legacy redirects** kept alive in `App.tsx`: `/dashboard` → `/`,
`/checkConsumes` → `/comedor/consultar`, `/registerDining` → `/comedor/registrar`,
`/listUser` → `/usuarios`, `/loginAudit` → `/auditoria`.

---

## 6. Auth and Access Control

### Session

Authentication is entirely cookie-based. The backend sets `unet_access_token`
(HttpOnly), `unet_refresh_token` (HttpOnly, scoped to the refresh path) and
`unet_user_role` (readable by JS). **Nothing is stored in localStorage or
sessionStorage** except one non-sensitive key: `selected_sede_id`, which remembers
the counter operator's chosen sede between browser sessions.

`AuthContext` is the only React context. On mount it calls `authApi.me()`
(`GET /users/me` with `noRefresh: true` so a logged-out visitor isn't bounced
through a refresh attempt) and then loads the user's effective permissions. On
failure it clears state and navigates to `/login`.

### Two-layer gating

1. **`ProtectedRoute`** blocks unauthenticated users and, for authenticated ones,
   checks `canAccess(pathname, role, permissions)`; on denial it redirects to
   `DEFAULT_ROUTE[role]`.
2. **`NavBar`** filters its three groups (Comedor / Inventario / Administración)
   with the same `canAccess`, hiding whole groups that end up empty.

`canAccess` (`src/config/routeAccess.ts`) resolves in this order: an explicit
per-user permission from the backend wins; otherwise the static `ROUTE_ACCESS`
role list decides; a route absent from the table is open.

> `ROUTE_ACCESS` is the **twin of `_PERMISSIONS` in the backend's
> `app/db/init_db.py`**. A new protected screen must be added to both, or the
> permission simply won't exist server-side.

All of this is UX gating only — the backend enforces the same rules with
`require_role` / `require_permission`.

---

## 7. API Layer

### `src/api/client.ts`

```typescript
const BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)  // default '/api/v1'
```

`normalizeApiBaseUrl` strips trailing slashes and appends `/api/v1` if it isn't
already there, so both `https://host` and `https://host/api/v1` work as the env
value.

Behaviour worth knowing:

- `credentials: 'include'` on every request — cookies do the authentication.
- **Transparent refresh:** a `401` triggers `POST /auth/refreshToken` and one
  retry. Concurrent 401s share a single in-flight `refreshPromise` so only one
  refresh call goes out. If the refresh fails, the client hard-navigates to
  `/login`. Pass `{ noRefresh: true }` to opt out (used by `authApi.me`).
- `204` returns `undefined` without touching the body.
- Errors are thrown as `ApiError` `{ message, status, details? }`. The backend's
  `detail` may be a string or an object; both are unwrapped into `message`.
- A `403` whose `detail` carries a `sanction` object is thrown as
  **`SanctionBlockError`** (`ApiError & { sanction }`), which the registration
  screens catch to show the blocking sanction.
- `getBlob(path, accept)` for CSV/PDF downloads (same refresh logic).
- `postForm` sends `application/x-www-form-urlencoded` — required by the OAuth2
  password flow on `/auth/login`.

### Domain modules

| Module | Backend prefix | Notes |
|---|---|---|
| `auth.ts` | `/auth`, `/users/me` | `login` posts the form then fetches `/users/me`; `logout`; `me` |
| `user.ts` | `/users`, `/roles` | `userApi` CRUD + `bulkCreate`; `roleApi.list` |
| `permissions.ts` | `/users/{id}/permissions` | `getByUser`, `update` |
| `student.ts` | composite | `lookup` runs **three** lookups in parallel (`Promise.allSettled`) — roster, direct access and external person — and fails only when all three fail. It used to throw as soon as the roster missed, which is why an external person was never found at the counter (and why the ArrowDown shortcut "did nothing": with no card on screen the listener was never even attached). `person_kind` travels explicitly on `Student`. Merge rules: the direct-access record wins on `user_type`, the **roster wins on `career`** (it is reloaded from the official CSV every term, the direct-access one was typed once). `studentToIdentity` must carry `career` and `user_type` — they feed `beneficiaries.career`, which is the column every report and career filter reads |
| `externalStudent.ts` | `/students` | Name kept for backward compatibility; `mapExternalToStudent` adapts the roster row to the UI `Student`. `list`/`getById`/`setGender` back the roster screen — `setGender` is the **only** write the panel may make to a roster row |
| `acceso_directo.ts` | `/accesos_directos` | CRUD, `lookup`, `verify`, `bulkCreate` |
| `externalPerson.ts` | `/external-people` | CRUD + `lookup` (server returns **active people only**) |
| `externalPersonLabel.ts` | `/external-people/labels` | Label catalogue CRUD + `deactivateAll` (bulk deactivation by label, SUPER_ADMIN) |
| `accessReason.ts`, `career.ts`, `sedes.ts` | catalogues | |
| `lunchSession.ts` | `/lunch-sessions` | `open`, `today` (404 → `null`), `openList`, `close`, `list`, `listByRange` |
| `consumption.ts` | `/consumptions` | `register`, `check`, `list`, `sessionRecent`, `userStats`, manual CRUD, plus `checkByDocument` (resolves by cédula, so it also answers for someone who is not yet a direct-access person) and `daySummary` (every entry of a date, counter + manual) |
| `sanction.ts` | `/sanctions` | `create`, `quickCreate`, `revoke`, `lift`, `list`, `suspended`, `history` |
| `inventory.ts` | `/inventory` | Categories, items, stock increase, PDF export |
| `lunch.ts` | `/lunches`, `/lunch-templates` | CRUD + the composed `createConfirmedLunch` flow |
| `reports.ts` | `/reports`, `/consumption-reports` | JSON reports + CSV/PDF blobs |
| `statistics.ts` | `/statistics` | Attendance by period / by session, with demographic filters |
| `emailTemplate.ts` | `/email-templates`, `/email-settings` | `get(key)` / `update(key, …)` for the `sanction` and `sanction_lift` templates, + sender settings |
| `audit.ts` | `/auth/audit-logs` | Paginated, with date and role filters |

**`lunchApi.createConfirmedLunch`** composes the whole meal-creation flow in one
call: create → add ingredients → refetch → recalculate → validate stock → confirm.
If stock is short it returns `{ status: 'insufficient_stock', items }` **without
confirming**. It does *not* create the template — the backend upserts the mirror
template automatically on confirm.

---

## 8. State Management

No global state library. Three mechanisms only:

1. **`AuthContext`** — user, permissions, loading, `refetch()`, `logout()`,
   consumed via `useAuth()`.
2. **Local `useState` per page** — each screen owns its loading/error/data/filter
   /modal state. Nothing is shared between pages.
3. **Polling where freshness matters** — `RegisterDining` re-polls the session
   counter and the recent-entrants list every 15 s (`SESSION_POLL_MS`) so several
   operators on the same sede stay in sync.

---

## 9. Styling

- Tailwind is the only styling mechanism. No CSS modules, no styled-components;
  `src/index.css` holds only the Tailwind directives and global resets.
- Class composition in primitives uses the array-join pattern:
  ```typescript
  const classes = ['base-class', conditionalClass, className ?? ''].filter(Boolean).join(' ')
  ```
- Palette: primary `blue-600`/`blue-700`; danger `red-600`; surfaces `white` /
  `slate-50`; borders `slate-200`/`slate-300`; text `slate-800` → `slate-400`;
  success badges `green-100`/`green-700`; header gradient
  `from-[#03216A] via-[#7D8EB7] to-[#EBEFF4]` (UNET institutional blue).
- Font: **Inter**, loaded from Google Fonts in `index.html`.
- `tailwind.config.cjs` extends nothing — no custom theme tokens.
- Layout is responsive: the sidebar is a fixed drawer with a backdrop below `lg`
  and static from `lg` up.

---

## 10. Patterns and Conventions

### Barcode scanning

`useBarcodeScanner(onScan, options?)` listens to `window` `keydown`. Characters
arriving faster than `maxGapMs` (default 60 ms) accumulate in a ref buffer; `Enter`
finalises the scan and fires `onScan` if the buffer reached `minLength` (default 6).
Modifier keys and keystrokes while focus is on an `input`/`textarea` are ignored so
manual typing still works. The callback lives in a ref, so an inline arrow function
doesn't re-attach the listener. Used by `RegisterDining`, `CheckConsumes` and
`SuspendStudent`.

### No native dialogs

`confirm()` / `alert()` / `prompt()` are **banned** — they are unreliable inside the
Tauri webview and silently blocked deletion in the past. Use the in-app `Modal`
instead. `src/pages/nativeDialogs.guard.test.ts` is a regression test that fails if
a native dialog call reappears in the pages.

### Feedback

User feedback goes through `notify` (`src/utils/toast.ts`), a thin wrapper over
Sonner that also extracts `message` from an `ApiError`. The `<Toaster />` lives in
`App.tsx`. Audio alerts use `playSound` (`src/utils/sound.ts`) — best-effort, never
throws, files served from `public/sounds/`; the duplicate-consumption alert loops
for 10 s (`DUPLICATE_ALERT_DURATION_MS`).

### Async loading in pages

```typescript
useEffect(() => {
  void (async () => {
    try {
      setData(await someApi.fetch())
    } catch (err) {
      notify.error(err)
    } finally {
      setLoading(false)
    }
  })()
}, [])
```

### Shared helpers instead of duplication

- `utils/labels.ts` — `USER_TYPE_LABEL` / `userTypeLabel()` and `ROLE_LABEL` /
  `roleLabel()` are the single source of truth for person-type and role display
  strings. `ROLE_LABEL` used to be copy-pasted into four screens that drifted apart,
  which is how `ACCESO_DIRECTO` ended up unlabelled in some of them and not others.
  An unknown value still falls through to the raw string rather than blanking the
  cell.
- `utils/sanctionDates.ts` — the suspension end-date window (today … today + 365)
  and its validation, kept apart from the modals so both can share it and it can be
  tested without rendering a form.
- `utils/consumptionNotice.ts` — the "already ate today" wording, so the counter
  screen and manual registration cannot describe the same situation differently.
- `utils/cedula.ts` — `normalizeCedula()` before every lookup.
- `utils/apiErrors.ts` — `errorMessage()` and status constants (`CONFLICT`…).
- `utils/lunchRecalculation.ts` — mirrors the backend's rule-of-three so the form
  can preview quantities instantly (`POST /lunches/calculate` is the authority).
- `utils/pdfLunch.ts`, `pdfInventory.ts`, `pdfSessionEntrants.ts`, `printManual.ts`
  — client-side jsPDF documents; `downloadBlob.ts` handles server-generated files.
- `utils/csvImport.ts` — the roster import core: `detectEncoding`/`decodeCsvBuffer`
  (UTF-8/16/32 — the official files are **UTF-32BE with no BOM**, which
  `FileReader.readAsText` cannot read), `detectDelimiter` (`,` vs `;`),
  `autoMapColumns` (maps the official header `NACIONALIDAD,CEDULA,P_NOMBRE,
  S_NOMBRE,P_APELLIDO,S_APELLIDO,EMAIL,COD_CARR,CARRERA,ESTADO,TIPO` in full, and
  builds `full_name` from the four name columns), `parseActiveState` (`A`/`I` plus
  the tolerant set; returns `null` on an unknown value so the row warns instead of
  silently importing as inactive), `buildBulkItems`, `validateRow`, `chunk`.
- `utils/rosterMerge.ts` — merges `Activos.csv` + `Inactivos.csv` into one row per
  cédula. **The active record wins**; every discarded row is reported. Without this
  the backend rejects the overlap as "cédula repetida dentro del archivo".
- `utils/rosterRealFiles.verify.test.ts` — acceptance check that runs the whole
  pipeline over the real CSVs in the project root, and skips when they are absent.
- `utils/sessionStats.ts`, `chartPercent.ts` — chart data shaping.

### TypeScript strictness

`strict`, `noUnusedLocals`, `noUnusedParameters` and `noFallthroughCasesInSwitch`
are all on, and `npm run build` runs `tsc` first — an unused import breaks the
build.

### Tauri notes

`src-tauri/src/lib.rs` still carries the scaffold `greet` command; no real Rust
command is used by the app. The webview loads the same SPA, so **everything must
work through the HTTP API** — there is no Tauri-only code path. `productName` and
the window title are still the scaffold's `tauri-app`; the bundle identifier is
`Dining System`.

---

## 11. Environment Variables

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `/api/v1` | Backend base URL. The relative default works in dev (Vite proxy) and in production (Vercel rewrite). Set an absolute URL only when pointing at a backend on another host — `/api/v1` is appended automatically if missing |

Only `VITE_`-prefixed variables reach the browser bundle. **Never put secrets
here** — the bundle is public.

---

## 12. Backend Contract Notes

- Dev backend: `http://localhost:8001` (Docker Compose). Production:
  `https://dining-system-unet-backend-nine.vercel.app`.
- CORS on the backend must allow the frontend origin **with credentials**;
  `http://localhost:1420` and the Vercel URL are already in
  `BACKEND_CORS_ORIGINS`.
- Paginated endpoints answer `{ total, items }`. A few older ones still return a
  bare array (`/users/`, `/inventory/*`, `/consumption-reports/`, `/roles/`,
  `/careers/`, `/access-reasons/`) — the corresponding API modules type them
  accordingly.
- Business rules the UI must respect (all enforced server-side too): one meal per
  person per day; an external person in `INACTIVE` state cannot be looked up **or**
  register a consumption (that is what makes the bulk deactivation mean something);
  registering an external person sends `external_person_id`, never the on-the-fly
  `person` payload, which would duplicate them as a direct-access record; at most one open session per sede; an active sanction blocks
  registration with a `403` carrying the sanction; confirmed lunches are immutable;
  a sanction's `end_date` may not exceed `MAX_SANCTION_DAYS` (365) from its start,
  though a null one still means indefinite.
- **The role arrives as `ACCESO_DIRECTO`.** It used to travel as `BENEFICIARIO` —
  the enum member and its value diverged server-side — which is why every
  `ROLE_LABEL` lookup missed. Migration `f9a0b1c2d3e4` renamed the value; the table
  is still physically `beneficiaries`, so backend paths keep that word.
- `GET /consumptions/check-by-document?document_id=&date=` answers **200 even for an
  unknown person** (`acceso_directo_id: null`, `has_consumed: false`). Not having
  eaten is a valid answer, not a 404, and the call never creates anybody — so it is
  safe to fire on every lookup.
- `PATCH /students/{id}` accepts **only** `gender`; any other field is a 422. That
  is what makes the roster screen's read-only fields actually read-only, rather than
  a convention the form happens to follow.

---

## 13. Tooling in `.claude/`

Three project agents with persistent memory under `.claude/agent-memory/`:
`unet-dining-architect`, `unet-fastapi-backend-dev`, `unet-frontend-developer`
(the last one tracks API contracts, duplicate patterns, mock status and Tauri
issues).

Skills: the OpenSpec workflow set (`openspec-propose`, `openspec-apply-change`,
`openspec-update-change`, `openspec-sync-specs`, `openspec-archive-change`,
`openspec-explore`, also exposed as the `/opsx` commands) plus **codebase-memory**,
**cyber-neo** and **graphify**.

`problematicas_clasificadas_frontend_backend.md` is the issue log the code comments
refer to ("problemática 23", "issue #7", "fixes.md #4"…).

User-facing documentation (Spanish) lives in `../docs/`: `DOCUMENTACION.md`,
`MANUAL_DE_USO.md` and the compiled PDF.
