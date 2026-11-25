# CODEBASE-MAP

## 1. File Tree

```text
src/
├── app/
│   ├── layout.tsx              # Root HTML shell, Geist fonts, metadata & /icon.svg favicon
│   ├── globals.css             # Tailwind v4 import, bus marker & .user-gps-marker pulse CSS
│   ├── icon.svg                # App SVG favicon
│   ├── page.tsx                # Main SPA router: TopNavbar + DesktopDashboard / Mobile Map + Modals
│   ├── driver/page.tsx         # Standalone /driver route wrapping DriverCockpit + theme toggle
│   ├── api/traffic/route.ts    # POST/GET telemetry ingestion for ESP32 GPS & YOLO vehicle counts
│   ├── api/chat/route.ts       # POST Gemini-powered UBus AI Assistant endpoint (with local fallback)
│   └── api/scan-schedule/route.ts # POST Gemini Vision routine image OCR endpoint
├── components/
│   ├── TopNavbar.tsx           # Elevated sticky header, live clock, theme toggle, mobile drawer
│   ├── MobileBottomNav.tsx     # Mobile 5-slot bottom nav bar with raised center Track FAB
│   ├── DesktopDashboard.tsx    # Full-bleed edge-to-edge + fullscreen dashboard, sidebar, map & trip form
│   ├── Map.tsx                 # Dual-engine map wrapper (Leaflet 2D + MapLibre 3D), Supabase sub, GPS
│   ├── MapLibreView.tsx        # MapLibre GL 3D vector renderer + custom DOM markers
│   ├── RightPanel.tsx          # Mobile slide-over trip info & navigation form
│   ├── LocationSearchBar.tsx   # Mobile top floating stop selector & navigation trigger
│   ├── BottomBusCard.tsx       # Mobile bottom floating live bus card + expandable telemetry drawer
│   ├── BusSchedule.tsx         # Route list, search/filter, and station-by-station drilldown
│   ├── ClassSchedule.tsx       # Student class routine list + Modify/Add/Delete controls
│   ├── DriverCockpit.tsx       # Driver live GPS broadcaster & bus selector
│   ├── Settings.tsx            # Admin route CRUD (Supabase `routes`) & system overview
│   ├── AuthModal.tsx           # Login / Sign-up modal (Supabase Auth + localStorage student_id)
│   ├── NoticeBoardModal.tsx    # Campus transit announcements modal
│   ├── LandingPage.tsx         # About & Team product overview view
│   ├── DashboardUI.tsx         # Reusable PanelCard, InfoBlock, NavItem primitives
│   ├── Sidebar.tsx             # Legacy collapsible sidebar (superseded by DesktopDashboard)
│   └── StudentLogin.tsx        # Legacy student ID login component
└── lib/
    ├── supabase.ts             # Supabase client, isSupabaseConfigured, getCurrentUser, signOutUser
    ├── routing.ts              # KNOWN_STOPS, MAP_PROVIDERS, OSRM, Overpass, traffic segmentation
    └── transitData.ts          # Legacy stop coordinates, Haversine distance & ETA helpers
```

---

## 2. Architecture

- **Entry Points**:
  - `/` → `src/app/page.tsx` (`App`)
  - `/driver` → `src/app/driver/page.tsx` (`DriverPage`)
  - `/api/traffic` → `src/app/api/traffic/route.ts` (`POST`, `GET`)
- **Modules**:
  - **Shell & Navigation**: `TopNavbar`, `DesktopDashboard`, `LandingPage`
  - **Geospatial & Mapping**: `Map` (Leaflet), `MapLibreView` (MapLibre GL), `routing.ts` (OSRM + Overpass)
  - **Transit & Student Features**: `BusSchedule`, `ClassSchedule`, `RightPanel`, `LocationSearchBar`, `BottomBusCard`
  - **Driver & Admin**: `DriverCockpit`, `Settings`, `AuthModal`, `NoticeBoardModal`
- **System Flow**:
  - Desktop (`md:`+): `TopNavbar` → `DesktopDashboard` (Sidebar + `Map` + Inline Trip Form, or Fullscreen Map overlay).
  - Mobile (`< md`): `TopNavbar` → Full-viewport `Map` + `LocationSearchBar` + `BottomBusCard` + slide-over `RightPanel`.
  - Cross-component signals use `window` `CustomEvent`s (`set-map-theme`, `set-app-theme`, `track-user`, `toggle-map-layer`, `user-location`).

---

## 3. Knowledge Graph

- `src/app/page.tsx`
  - imports: `TopNavbar`, `MobileBottomNav`, `LandingPage`, `DesktopDashboard`, `LocationSearchBar`, `BottomBusCard`, `BusSchedule`, `ClassSchedule`, `RightPanel`, `Settings`, `DriverCockpit`, `AuthModal`, `NoticeBoardModal`, `Map` (dynamic `ssr: false`), `supabase`, `routing.ts` (`fetchOSRMRoute`, `geocodeLocation`, `calculateDistanceKm`)
- `src/components/DesktopDashboard.tsx`
  - imports: `Map` (dynamic `ssr: false`), `BusSchedule`, `ClassSchedule`, `Settings`, `DriverCockpit`, `routing.ts` (`KNOWN_STOPS`, `RouteResult`, `KnownStop`), `supabase.ts` (`signOutUser`)
- `src/components/Map.tsx`
  - imports: `MapLibreView`, `supabase.ts` (`supabase`), `routing.ts` (`RouteResult`, `KNOWN_STOPS`, `MAP_PROVIDERS`, `fetchOverpassBusStops`)
- `src/components/RightPanel.tsx`
  - imports: `DashboardUI` (`PanelCard`, `InfoBlock`), `routing.ts` (`KNOWN_STOPS`)
- `src/components/BusSchedule.tsx`, `DriverCockpit.tsx`, `Settings.tsx`, `AuthModal.tsx`
  - import: `supabase.ts` (`supabase`)
- `src/app/api/traffic/route.ts`
  - imports: `supabase.ts` (`supabase`), `routing.ts` (`getTrafficStatus`)

---

## 4. Frontend Map

- **Pages**:
  - `src/app/page.tsx` (`App`): owns `activeTab`, `authModal`, `isNoticeBoardOpen`, `isMobileFullscreenMap`, `isRightPanelOpen`, `userCoords`, `startPoint`, `destination`, `navigationRoute`, `selectedBusNo`, `bottomBusData`, `journeyInfo`, `appTheme`.
  - `src/app/driver/page.tsx` (`DriverPage`): owns `theme` and renders `DriverCockpit`.
- **State & Persistence**:
  - `localStorage`: `ubus_theme` (`"dark" | "light"`), `student_id`, `user_display_name`.
  - `window` events: `set-map-theme`, `set-app-theme`, `track-user`, `toggle-map-layer`, `user-location`.
- **CSS**:
  - `src/app/globals.css`: `@import "tailwindcss"`, `.bus-marker-badge`, `.bus-marker-pointer`, `.leaflet-interactive`, `.user-gps-marker`, `.user-pulse-ring`, `.user-dot`.
  - Tailwind CSS v4 inline utility classes across all components.

---

## 5. Backend Map

- **API Route**: `src/app/api/traffic/route.ts`
  - `POST`: validates `{ bus_no, latitude, longitude, speed, vehicle_count }`, computes traffic via `getTrafficStatus()`, looks up `buses.id` by `bus_no`, upserts `bus_locations` in Supabase.
  - `GET`: returns API online status and sample telemetry payload.
- **Database (Supabase PostgreSQL)**:
  - `buses` — bus metadata (`id`, `bus_no`, `route_name`, `driver_number`, `status`)
  - `bus_locations` — live GPS (`id`, `bus_id`, `latitude`, `longitude`, `speed`, `updated_at`), subscribed via Supabase Realtime
  - `routes` — route schedules (`id`, `route_name`, `bus_number`, `route_color`, etc.), CRUD in `Settings.tsx`
  - `route_geometry` — polyline points + route color, queried in `Map.tsx`

---

## 6. Data Flow

1. **Navigation & ETA**: User enters `startPoint`/`destination` → `page.tsx` `handleStartNavigation()` → `geocodeLocation()` + Supabase `bus_locations` query → `fetchOSRMRoute()` → sets `navigationRoute`, `journeyInfo`, `bottomBusData` → `Map.tsx` / `MapLibreView.tsx` draws segmented route polyline.
2. **Live Bus Tracking**: ESP32 / `DriverCockpit` → `POST /api/traffic` or Supabase upsert on `bus_locations` → Supabase Realtime pushes update → `Map.tsx` updates markers.
3. **User GPS**: Click "Track Near Me" / Crosshair → dispatches `track-user` → `Map.tsx` / `MapLibreView.tsx` calls `navigator.geolocation` → dispatches `user-location` → `page.tsx` updates `userCoords` and renders pulse marker.

---

## 7. Change Impact

- **Critical Shared Files**:
  - `src/lib/routing.ts`: changing `RouteResult`, `KnownStop`, or `MAP_PROVIDERS` impacts `page.tsx`, `DesktopDashboard.tsx`, `Map.tsx`, `MapLibreView.tsx`, `RightPanel.tsx`, and `api/traffic/route.ts`.
  - `src/lib/supabase.ts`: changing client or auth helpers impacts `page.tsx`, `TopNavbar.tsx`, `DesktopDashboard.tsx`, `Map.tsx`, `BusSchedule.tsx`, `DriverCockpit.tsx`, `Settings.tsx`, and `api/traffic/route.ts`.
  - `src/components/Map.tsx`: changing `MapProps` or `BusLocationItem` impacts `page.tsx` and `DesktopDashboard.tsx`.
- **Verification**: `npx tsc --noEmit` (typecheck) and `npm run lint` / `npm run build`.
