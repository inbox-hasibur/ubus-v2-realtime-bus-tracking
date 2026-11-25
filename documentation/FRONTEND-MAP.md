# FRONTEND-MAP (UI & Design Bug-Fix Reference)

Quick reference for fixing layout, responsiveness, theme, and visual bugs.

## 1. Responsive Breakpoints & Viewport Split

| Breakpoint | Active Shell | Source |
| :--- | :--- | :--- |
| `< 768px` (Mobile) | Fullscreen Map + `LocationSearchBar` + `BottomBusCard` + `MobileBottomNav` + `RightPanel` | `src/app/page.tsx` (`md:hidden`, `h-[calc(100dvh-53px)]`) |
| `>= 768px` (`md:` Tablet) | Full-bleed `DesktopDashboard` with `w-20` icon-only sidebar | `src/components/DesktopDashboard.tsx` |
| `>= 1024px` (`lg:` Desktop) | Full-bleed `DesktopDashboard` with `w-52` sidebar + 12-col grid (8/9 map, 4/3 form) | `src/components/DesktopDashboard.tsx` |
| Fullscreen (`F` / button) | Edge-to-edge map (`h-[calc(100vh-53px)] min-h-[540px]`) + floating card | `src/components/DesktopDashboard.tsx` |

## 2. Theme System (Dark / Light Sync)

- **Storage key**: `localStorage.getItem("ubus_theme")` (`"dark"` | `"light"`).
- **Broadcast events**: `set-map-theme` and `set-app-theme` with `detail: "dark" | "light"`.
- **Theme-aware components**:
  - `TopNavbar.tsx` (header + mobile drawer)
  - `DesktopDashboard.tsx` (windowed frame + fullscreen overlay + sidebar)
  - `page.tsx` (desktop wrapper + footer + mobile schedule wrappers)
  - `LocationSearchBar.tsx` & `BottomBusCard.tsx` (accept `theme` prop)
  - `BusSchedule.tsx`, `ClassSchedule.tsx`, `Settings.tsx`, `DriverCockpit.tsx` (accept `theme` prop + listen to `set-app-theme` / `set-map-theme`)
  - `Map.tsx` & `MapLibreView.tsx` (switch tile/vector styles on theme change)

## 3. Z-Index & Overlay Layers

| Layer | Z-Index | Component |
| :--- | :--- | :--- |
| Map canvas | `z-0` | `Map.tsx` / `MapLibreView.tsx` |
| Map internal controls / expand button | `z-[400]` | `DesktopDashboard.tsx` / Leaflet controls |
| Mobile floating search, action buttons, bottom card | `z-20` | `page.tsx`, `LocationSearchBar.tsx`, `BottomBusCard.tsx` |
| Mobile filter dropdown | `z-30` / `z-50` | `BusSchedule.tsx`, `LocationSearchBar.tsx` |
| `TopNavbar` sticky header & mobile drawer | `z-50` | `TopNavbar.tsx` |
| Modals (`AuthModal`, `NoticeBoardModal`, fullscreen schedule) | `z-50` | `page.tsx`, `DesktopDashboard.tsx` |

## 4. UI Component & Styling Map

| Area | File | Key Elements / Classes |
| :--- | :--- | :--- |
| Global CSS & Map Markers | `src/app/globals.css` | `.bus-marker-badge`, `.bus-marker-pointer`, `.user-gps-marker`, `.user-pulse-ring` |
| Header & Mobile Menu | `src/components/TopNavbar.tsx` | Elevated sticky header (`shadow-md`/`shadow-lg`), live clock/date, `menu` pill, mobile drawer |
| Mobile Bottom Nav | `src/components/MobileBottomNav.tsx` | Fixed `bottom-0 z-40` 5-slot bar (`Map`, `Buses`, raised yellow Track FAB, `Classes`, `Settings`) |
| Desktop Frame | `src/components/DesktopDashboard.tsx` | Full-bleed `w-full` block, sidebar (`w-16 md:w-20 lg:w-52`), Guest/Auth header, map (`h-[calc(100vh-215px)]`) |
| About & Team | `src/components/LandingPage.tsx` | Minimal theme-aware overview, 3-card highlights, testimonials, team, contact form |
| Mobile Search Bar | `src/components/LocationSearchBar.tsx` | `max-w-md`, mode switcher (`Current` / `Destination`), stop dropdown |
| Mobile Bottom Card | `src/components/BottomBusCard.tsx` | `max-w-md`, expandable 3-col telemetry drawer (`Speed`, `Seats`, `AI Flow`) |
| Mobile Trip Drawer | `src/components/RightPanel.tsx` | Slide-over panel triggered by `SlidersHorizontal` button |
| Bus Timetable | `src/components/BusSchedule.tsx` | Route dropdown filter, `flex-wrap sm:flex-nowrap` station rows |
| Class Routine | `src/components/ClassSchedule.tsx` | Status pills (`Missed`, `0h 3m`, `Next`), Modify / Add / Delete controls |

## 5. Common Design Bug-Fix Lookup

- **Mobile bottom card clipped by browser bar**: Check `h-[calc(100dvh-53px)]` in `src/app/page.tsx`.
- **Fullscreen panel buttons cut off on 720p laptop**: Check `max-h-[calc(100%-84px)] overflow-y-auto` on the right floating card in `DesktopDashboard.tsx`.
- **Component stuck in dark mode when light mode is active**: Ensure component listens to both `set-map-theme` and `set-app-theme` or receives `theme={appTheme}`.
- **Narrow 360px phone row overflow**: Use `min-w-0 flex-1` on text containers and `truncate` / `flex-wrap sm:flex-nowrap` on badge rows.
