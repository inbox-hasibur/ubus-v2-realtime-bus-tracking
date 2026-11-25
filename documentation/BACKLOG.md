# Project Backlog & Sprints

## Sprint 1 — Core Tracking & Schedules (Completed)
- [x] Next.js App Router + Tailwind CSS + Supabase client setup (`src/lib/supabase.ts`)
- [x] Leaflet map integration with custom bus number markers (`src/components/Map.tsx`)
- [x] Bus schedule viewer with route search & station drilldown (`src/components/BusSchedule.tsx`)
- [x] Class schedule manager with Add / Modify / Delete & notification toggle (`src/components/ClassSchedule.tsx`)
- [x] Admin route CRUD in Settings (`src/components/Settings.tsx`)

## Sprint 2 — v2.0 UI Overhaul & Dual Map Engine (Completed)
- [x] MapLibre GL 3D vector map engine (`src/components/MapLibreView.tsx`)
- [x] OSRM road routing, Overpass API stops & micro-segmented traffic (`src/lib/routing.ts`)
- [x] IoT telemetry endpoint for ESP32 GPS & ESP32-CAM YOLO (`src/app/api/traffic/route.ts`)
- [x] Dedicated Driver Cockpit route & component (`src/app/driver/page.tsx`, `src/components/DriverCockpit.tsx`)
- [x] Desktop dashboard + fullscreen mode + Light/Dark theme sync (`src/components/DesktopDashboard.tsx`)
- [x] Mobile floating search bar, bottom bus card, auth modal, notice board (`src/components/LocationSearchBar.tsx`, `BottomBusCard.tsx`, `AuthModal.tsx`, `NoticeBoardModal.tsx`)

## Sprint 3 — Documentation, Branding & Responsive Polish (Completed)
- [x] Merge `origin/main` (`v2.0.0`) into `upgrade`
- [x] Create `documentation/` suite (`ABOUT-PROJECT.md`, `BACKLOG.md`, `CHANGELOG.md`, `CODEBASE-MAP.md`, `FRONTEND-MAP.md`, `DEVELOPER_GUIDE.md`)
- [x] Create `AGENTS.md` with `upgrade` branch & commit message rules
- [x] Update `README.md` with custom `public/icon.svg` and 2% rounded `public/preview.png`
- [x] Replace default favicon with `src/app/icon.svg` & `src/app/layout.tsx` metadata
- [x] Fix mobile `100dvh` height, theme-aware mobile drawer/cards, live clock/date, and 720p fullscreen fit

## Sprint 4 — Next Up (Pending)
- [ ] Hydrate `BusSchedule.tsx` directly from Supabase `routes` table instead of `DEFAULT_BUS_ROUTES` fallback
- [ ] Persist `ClassSchedule.tsx` entries per authenticated student in Supabase
- [ ] Connect `NoticeBoardModal.tsx` to a live `notices` Supabase table
- [ ] Fix OneDrive/Windows `maplibre-gl.css` Turbopack build or verify production build in CI
- [ ] Add automated E2E / component tests for routing and schedule CRUD
