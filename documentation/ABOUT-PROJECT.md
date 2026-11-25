# About UBUS V2

## 1. Concept
**UBUS V2** is a real-time university shuttle and campus bus tracking web application built for IUBAT students, drivers, and transport administrators. It eliminates arrival uncertainty by combining live GPS bus tracking, road-snapped OSRM routing & ETAs, micro-segmented traffic visualization, bus timetables, and student class schedules in one responsive dashboard.

## 2. Tech Stack
- **Framework**: Next.js 16.1.1 (App Router, Turbopack), React 19.2.3
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 (`@tailwindcss/postcss`), `clsx`, `tailwind-merge`, `lucide-react`
- **Database & Realtime**: Supabase (`@supabase/supabase-js` 2.90.0 — PostgreSQL, Realtime WebSockets, Auth)
- **Map Engines**:
  - **MapLibre GL** (`maplibre-gl` 6.15.0) — 3D vector maps (OpenFreeMap Liberty, Bright, Positron)
  - **Leaflet** (`leaflet` 1.9.4, `react-leaflet` 5.0.0) — 2D raster maps (CartoDB Dark Matter, Voyager, OSM)
- **Routing & Geodata**: OSRM (turn-by-turn road paths), Overpass API (live bus stop discovery)
- **Telemetry API**: `/api/traffic` (ESP32 GPS + ESP32-CAM YOLO vehicle count ingestion)

## 3. Architecture Overview
- **Client-First App Router**: `src/app/page.tsx` acts as the main viewport router, rendering `DesktopDashboard` on `md:`+ screens and a fullscreen map + floating `LocationSearchBar` / `BottomBusCard` on mobile (`< md`).
- **Dedicated Driver Route**: `src/app/driver/page.tsx` renders `DriverCockpit` for live driver GPS broadcasting.
- **Event-Driven Map & Theme Sync**: Components communicate cross-tree via `window` `CustomEvent`s (`set-map-theme`, `set-app-theme`, `track-user`, `toggle-map-layer`, `user-location`).
- **Realtime Data Layer**: `Map.tsx` and `MapLibreView.tsx` subscribe to Supabase `bus_locations` and query `route_geometry`; `Settings.tsx` manages `routes` CRUD.

## 4. File Tree
```text
ubus-v2-realtime-bus-tracking/
├── AGENTS.md
├── README.md
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── documentation/
│   ├── ABOUT-PROJECT.md
│   ├── BACKLOG.md
│   ├── CHANGELOG.md
│   ├── CODEBASE-MAP.md
│   ├── DEVELOPER_GUIDE.md
│   └── FRONTEND-MAP.md
├── public/
│   ├── icon.svg
│   ├── preview.png
│   └── ... (default svg assets)
└── src/
    ├── app/
    │   ├── api/traffic/route.ts
    │   ├── driver/page.tsx
    │   ├── globals.css
    │   ├── icon.svg
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── AuthModal.tsx
    │   ├── BottomBusCard.tsx
    │   ├── BusSchedule.tsx
    │   ├── ClassSchedule.tsx
    │   ├── DashboardUI.tsx
    │   ├── DesktopDashboard.tsx
    │   ├── DriverCockpit.tsx
    │   ├── LandingPage.tsx
    │   ├── LocationSearchBar.tsx
    │   ├── Map.tsx
    │   ├── MapLibreView.tsx
    │   ├── NoticeBoardModal.tsx
    │   ├── RightPanel.tsx
    │   ├── Settings.tsx
    │   ├── Sidebar.tsx
    │   ├── StudentLogin.tsx
    │   └── TopNavbar.tsx
    └── lib/
        ├── routing.ts
        ├── supabase.ts
        └── transitData.ts
```
