# Changelog

All notable changes to **UBUS V2** are documented in this file.

## [2.0.0] - 2026-11-25

### Added
- **Dual Map Engine**: Added MapLibre GL 3D vector map engine (`MapLibreView.tsx`) alongside Leaflet raster maps, with OpenFreeMap Liberty, Bright, Positron, CartoDB Dark Matter, CartoDB Voyager, and OpenStreetMap layers.
- **Driver Cockpit (`/driver`)**: Dedicated driver view (`DriverCockpit.tsx`) for live GPS broadcasting and trip status updates.
- **Traffic & IoT Ingestion API (`/api/traffic`)**: REST endpoint accepting live telemetry from ESP32 GPS modules and ESP32-CAM YOLO vehicle detection.
- **OSRM & Overpass Integration (`src/lib/routing.ts`)**: Real turn-by-turn road routing, micro-segmented traffic layers, and live Overpass API bus stop discovery.
- **Auth & Notice Board**: Added `AuthModal.tsx` for login/signup and `NoticeBoardModal.tsx` for campus transit announcements.
- **Desktop & Mobile Redesign**: Added `TopNavbar.tsx`, `DesktopDashboard.tsx`, `LocationSearchBar.tsx`, `BottomBusCard.tsx`, `LandingPage.tsx`, and fullscreen mobile map toggle with dark/light mode sync.

### Changed
- Merged `origin/main` (`v2.0.0`) into `upgrade` (`9e25adc`), preserving `.user-gps-marker` pulse styling in `globals.css` and `isSupabaseConfigured` export in `src/lib/supabase.ts`.

---

## [1.2.0] - 2026-10-09

### Added
- Connected live Supabase database queries and real-time subscriptions for bus locations.
- Added user GPS pulse marker styling and interactive `RightPanel` ETA & navigation controls.

### Fixed
- Resolved build crashes, missing environment variable fallbacks, React hook rule violations, and ESLint errors.

---

## [1.1.0] - 2026-01-10

### Added
- **Class Schedule & Notifications**: Added student ID-based class schedule management with time-left notifications and auto-time calculation logic.
- **Admin Dashboard**: Added route CRUD operations in the admin interface.
- **Responsive Navigation**: Added collapsible desktop sidebar and icon-only mobile sidebar.

---

## [1.0.0] - Initial Release

### Added
- Initial Next.js + Supabase + Leaflet real-time university bus tracking dashboard.
- Bus schedule viewer with search/filter and custom bus number map markers.
