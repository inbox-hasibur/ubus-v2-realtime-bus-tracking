=============================================================================
📘  UBUS V2  -  DEVELOPER IMPLEMENTATION GUIDE
=============================================================================
Version:      2.0 (Alpha)
Last Updated: January 10, 2026
Target:       VS Code Raw View / Text Editor
=============================================================================


1. PROJECT OVERVIEW
-----------------------------------------------------------------------------
UBUS V2 is a Real-time University Bus Tracking System. It provides live bus
locations, estimated arrival times (ETA), and integrated class schedules.
The system uses an incremental development approach, currently transitioning
from basic tracking to complex traffic simulation.


2. TECH STACK & ARCHITECTURE
-----------------------------------------------------------------------------
► Frontend Framework  : Next.js 15 (App Router)
► Styling             : Tailwind CSS (Glassmorphism & Responsive)
► Icons               : Lucide React
► Map Engine          : Leaflet JS (react-leaflet)
► Backend & Database  : Supabase (PostgreSQL)
► Real-time Engine    : Supabase Realtime (WebSockets)

[ SYSTEM FLOW ]
Browser Client  <----(Realtime Sub)---->  Supabase DB (bus_locations)
       |                                         ^
       |-----(Fetch API/RPC)----->  Supabase DB (schedules/users)


3. IMPLEMENTED FEATURES (CURRENT STATUS)
-----------------------------------------------------------------------------
A. Interactive Map & Live Tracking
   • Component : src/components/Map.tsx
   • Markers   : Custom DivIcons. Yellow circle = Bus, White circle = Station.
   • Real-time : Listens to Supabase channel 'bus_locations'. Updates UI instantly
                 without page refresh.
   • GPS       : 'Track Near Me' button triggers navigator.geolocation.

B. Responsive Dashboard UI
   • Components: Sidebar.tsx, RightPanel.tsx
   • Desktop   : Sidebar expands to 240px.
   • Mobile    : Sidebar collapses to 60px (icons only).
   • Effect    : Uses backdrop-blur-xl for Glassmorphism.

C. Bus & Class Schedules
   • Logic     : Auto-detects current day (e.g., "Thursday") to filter lists.
   • CRUD      : Students can Add/Edit/Delete personal class routines locally.


4. PROJECT STRUCTURE
-----------------------------------------------------------------------------
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main Dashboard State Manager
│   │   ├── layout.tsx        # Global font and metadata
│   │   └── globals.css       # Tailwind imports
│   ├── components/
│   │   ├── Map.tsx           # Leaflet Logic
│   │   ├── Sidebar.tsx       # Navigation
│   │   ├── RightPanel.tsx    # Travel Info Panel
│   │   ├── BusSchedule.tsx   # Timetable
│   │   └── ClassSchedule.tsx # Student Routine
│   └── lib/
│       └── supabase.ts       # DB Configuration
├── public/                   # Static assets
└── .env.local                # API Keys


5. MASTER PLAN: MAP UPGRADE & SIMULATION (PHASE 11)
-----------------------------------------------------------------------------
We are moving from simple lines to a "Life-like" traffic simulation.

► PHASE 1: VISUAL OVERHAUL (Map Hygiene)
   • Goal    : Remove colorful OpenStreetMap tiles.
   • Action  : Switch base layer to "CartoDB Positron" or "Clean Grayscale".
   • Reason  : To make our Traffic Polylines (Red/Yellow) pop out visually.

► PHASE 2: INTELLIGENT TRAFFIC INFRASTRUCTURE
   • Task A (Micro-Segmentation):
     Divide the route (e.g., Uttara -> Campus) into small 100m segments.
     Database Table: 'route_segments' with status (Green, Yellow, Red).

   • Task B (The Ripple Effect Logic):
     If a bus stops at Segment #10 (Speed = 0):
     Step 1: Segment #10 turns RED.
     Step 2: After 1 min, Segment #9 turns YELLOW (Jam spreading back).
     Step 3: After 2 mins, Segment #9 turns RED, Segment #8 turns YELLOW.

► PHASE 3: THE "LIFE-LIKE" SIMULATION ENGINE
   • Physics : Buses will not jump. They will accelerate (0->60) and decelerate.
   • Stops   : If a bus halts near a 'station_coordinate', the system will
               mark it as "Scheduled Stop", NOT a "Traffic Jam".
   • Random  : Introduce random speed drops to simulate real-world traffic incidents.

► PHASE 4: AUTHENTICATION & ADMIN
   • Auth    : Supabase Email/Password.
   • Roles   : Public (View only), Student (Manage Schedule), Admin (Control Routes).


6. PENDING DECISIONS (TO BE DISCUSSED)
-----------------------------------------------------------------------------
1. Simulation Runner
   [ ] Option A: Client-side browser simulation (Good for Demos).
   [ ] Option B: Background Node.js Admin Script (Professional).

2. Route Data
   [ ] Focus on ONE fixed route (Abdullahpur -> Kamarpara -> IUBAT)
       first to perfect the polyline data.


7. CONTRIBUTION GUIDELINES
-----------------------------------------------------------------------------
► Never push to 'main' directly.
► Create a branch: git checkout -b feature/your-feature-name
► Commit often:    git commit -m "feat: added acceleration logic"
► Create a Pull Request (PR).


=============================================================================
⚠️ CRITICAL NOTE
Ensure your .env.local file has NEXT_PUBLIC_SUPABASE_URL and ANON_KEY.
Contact the project administrator for credentials.
=============================================================================