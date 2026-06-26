# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (Vite, port 5173)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
npx shadcn@latest add <component-name>  # Add shadcn/ui component
```

## Architecture

React 19 SPA — Vite + Tailwind CSS v4 + React Router v7. Configured as a PWA (`vite-plugin-pwa`).

### Path Aliases (vite.config.js)

- `@` → `./src`
- `@components` → `./src/components`
- `@auth` → `./src/auth`
- `@app` → `./src/app`
- `@shared` → `./src/shared`
- `@utils` → `./src/utils`

### Auth Flow

`Auth.jsx` (`src/App/auth/Auth.jsx`) wraps the entire app and blocks render until token check completes. It uses `JwtService` (`src/App/auth/services/jwtService.js`), an EventEmitter-based singleton that:

1. On `init()`: checks `sessionStorage` for `jwt_access_token`
2. Emits `onAutoLogin` → calls `GET /auth/jwt` to re-validate token and refresh user data
3. Emits `onAutoLogout` → clears session and redirects to `/iniciar-sesion`
4. Emits `onNoAccessToken` → renders app unauthenticated

After successful auth, `JwtService.setSession(token)` stores the token in `sessionStorage` and sets `axios.defaults.headers.common.Authorization`. All axios calls automatically carry the Bearer token.

A global axios response interceptor in `JwtService.setInterceptors` handles 401 responses by emitting `onAutoLogout` (except for auth endpoints).

### State Management (Zustand)

Three stores in `src/App/context/`:

- `userStore.js` — `user` object (with `roleId`, `name`, `lastName`) + `userIsLogin` boolean
- `sharedStore.js` — shared catalog data: `cities`, `departments`, `documentTypes`
- `themeStore.jsx` — UI theme state

### Routing

`RouterComponent.jsx` has three route groups:

1. **No-auth routes** (`routesNoAuth`): `/iniciar-sesion` — accessible only when logged out
2. **Auth routes** (`routesAuth`): All main app pages — filtered by role at runtime:
   - `colaboradores/*` and `inventario` require admin access
   - `workerOnly` routes (e.g. `mi-perfil`) are only for roleId 2 (Colaborador)
   - Client users (roleId 4) are excluded from this group entirely
3. **Client routes** (`routesClient`): `/cliente/*` — only for roleId 4

Default redirect after login: `/dashboard` (admin/worker) or `/cliente/dashboard` (client).

### Services Pattern

Each feature folder under `src/App/routes/<Feature>/services/` contains axios calls for that module. The API base URL is hardcoded in `src/App/utils/constants/apiConstants.js` as `http://localhost:3000/api/v1` — change this for production.

### UI Components

shadcn/ui components live in `src/components/ui/` (new-york style, JSX, CSS variables, neutral base color, lucide-react icons). Do not hand-edit these — re-run `npx shadcn@latest add` to update them.

Tailwind v4 via `@tailwindcss/vite` plugin — no `tailwind.config.js`. Entry CSS: `src/index.css`. Utility merging: `clsx` + `tailwind-merge` via `src/lib/utils.js`.

### Forms

`react-hook-form` + `yup` (with `@hookform/resolvers`).

### Special Features

- **Canvas/zones editor**: `eventos/:eventId/canvas` uses Mapbox GL + `@mapbox/mapbox-gl-draw` for drawing event zones. Requires `VITE_MAPBOX_TOKEN` env var.
- **Map layout**: `eventos/:eventId/map-layout` shows collaborator locations on a Mapbox map.
- **PWA**: Service worker caches API responses (`NetworkFirst`), fonts (`CacheFirst`). SW configured in `vite.config.js` workbox section.
