Build a mobile-first web app called **TrikeServe** — a community-based tricycle (trike)
platform serving **Valenzuela City, Philippines**. It connects **Customers** (book
rides, order food), **Drivers** (accept rides & deliveries within their assigned
**Terminal** zone), **Businesses** (restaurants managing menus/orders), and **Admins** (user
management, role assignment, Terminal management).

The design is a **mobile-first mobile app aesthetic** (like Grab/Angkas/Foodpanda) with a
bold **crimson-red** primary brand. It must feel fast, tactile, and polished on a phone
(360–430px wide) while still working on desktop. Follow the design system, screen specs, and
behavior rules exactly.

### A. Tech Stack

- **React 18 + Vite + TypeScript** — strict mode, function components only
- **Tailwind CSS** (utility classes with arbitrary values, e.g. `bg-[#E11D48]`)
- **react-router** (`createBrowserRouter`) — routes below
- **Supabase** (Postgres + RLS + Realtime + Storage) via `@supabase/supabase-js`
- **lucide-react** for icons (keep the exact icon set used below)
- **Google Maps** — Places Autocomplete (New API) + Map + Directions polyline decoding;
  `@react-google-maps/api` + `useMapLoader` hook; API key from `VITE_GOOGLE_MAPS_API_KEY`
- **shadcn-style primitives** under `src/app/components/ui/` (Button, Card, Input, Badge,
  Tabs, Table, Dialog, Toast, etc.)
- **Capacitor 7** for Android builds (`npm run android:build` scripts)
- Inter font (400–800 weights) via Google Fonts

### B. Design System (MUST follow exactly)

**Brand palette — "High Velocity":**

| Token | Value | Usage |
|---|---|---|
| `--crimson-red` | `#E11D48` | Primary brand, primary buttons, active states, headers |
| `--dark-charcoal` | `#121212` | Text, dark buttons, footer, dark mode bg |
| `--silver-metallic` | `#CBD5E1` | Borders, muted surfaces, disabled accents |
| `--paper-white` | `#FFFFFF` | Cards, page background |
| `--medium-grey` | `#64748B` | Secondary text, captions, icons |
| `--light-bg` | `#F8F9FA` | Page backgrounds (admin, lists) |
| `--border-soft` | `#E2E8F0` | Card borders (`border-2 border-[#E2E8F0]`) |
| Success green | `#10B981` / `#059669` | Verified, success states |
| Warning amber | `#F59E0B` / `#D97706` | Pending, warnings |
| Danger red | `#EF4444` / `#DC2626` | Destructive actions |
| Blue | `#3B82F6` / `#2563EB` | Rider identity, links, pickups |
| Purple | `#9333EA` | Business identity |
| Gradient A | `from-[#E11D48] via-[#BE123C] to-[#121212]` | Hero, auth split-panel |
| Gradient B | `from-[#E11D48] to-[#BE123C]` | Headers, FABs, logo chips |
| Gradient C | `from-[#E11D48] to-[#121212]` | Admin logo tile |

**Typography:** `font-family: 'Inter', system-ui, sans-serif`. Weight scale: normal 400,
medium 500, semibold 600, bold 700, extrabold 800. Headings use tight letter-spacing
(`letterSpacing: '-0.02em'` for big display text). Default base font-size 16px.

**Core UI rules:**
- Buttons: uppercase labels, `font-bold`, pill/rounded-lg, `active:scale-95` tactile press,
  primary = `bg-[#E11D48] hover:bg-[#BE123C] text-white`, outline = `border-2 border-[#CBD5E1]`.
- Cards: `bg-white rounded-xl` (or `rounded-2xl` for feature tiles), `border-2 border-[#E2E8F0]`.
- Inputs: `border-2 border-[#CBD5E1] focus:border-[#E11D48]`, icon inside left
  (`absolute left-3 ...`), labels `text-xs font-semibold uppercase tracking-wide`.
- Page shell: `min-h-screen` with light background; **sticky top header** with brand gradient
  (`bg-gradient-to-r from-[#E11D48] to-[#BE123C]`, `sticky top-0 z-50 shadow-lg`), white
  icon-button circles (`w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full`).
- Mobile bottom nav: `fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#E2E8F0]
  px-4 py-3 z-[1500]`, `flex justify-around`, active item in `#E11D48`.
- Floating Action Button (FAB): `fixed bottom-24 right-4 w-16 h-16 bg-[#E11D48] rounded-full
  shadow-2xl hover:bg-[#BE123C] transition-all hover:scale-110`, plus a live-tracking FAB
  `bg-gradient-to-br from-[#E11D48] to-[#BE123C]`.
- Status chips: `Badge` with solid bg colors (green `#10B981`, amber `#F59E0B`, blue,
  purple) + white uppercase text.
- Role colors: customer `#10B981`, rider `#3B82F6`, business `#9333EA`, admin `#64748B`
  (icon tiles use `bg-[#D1FAE5]/[#DBEAFE]/[#F3E8FF]` respectively).
- Avatar tiles: `w-10/12/14/16 h-*` `rounded-xl`/`rounded-full`, pastel tinted backgrounds.
- Micro-interactions: `hover:` state color shifts, `transition-all`, `active:scale-90/95`
  on buttons, `animate-pulse` on subtle hero glows, spin loader
  (`w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin`).
- Loading state: centered spinner `w-16 h-16 border-4 border-[#E11D48]
  border-t-transparent rounded-full animate-spin` + "Loading...".
- Emoji accents allowed in list items (📍 🏛️ 🚏 🍽️ etc.) for friendly local flavor.
- Philippine peso `₱` formatting for all prices.

**Auth screens (Login / Signup):** full-height split layout — left panel (desktop only,
`lg:flex lg:flex-1`) is a **branded gradient hero** with large display headline
(`text-7xl font-extrabold`), feature bullets with white dot markers, and a translucent
"service area" pill; right panel (`flex-1 lg:max-w-xl`) is a white centered form
(`max-w-md`). Mobile shows a compact logo headline only.

### C. Data Model (Supabase)

Tables (see `SUPABASE_SCHEMA.sql` for full DDL): `users`, `admins`, `terminals` (NEW),
`ride_requests`, `shared_ride_lobbies`, `messages` + `chat_conversations`/`chat_messages`,
`orders`, `order_processing`, `restaurants`, `menu_items`, `favorites`, `admin_settings`.

**NEW Terminal feature schema:**
```sql
CREATE TABLE IF NOT EXISTS terminals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  boundary TEXT NOT NULL,                -- e.g. 'Valenzuela City'
  center_lat DOUBLE PRECISION,
  center_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 2.0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS terminal_id UUID REFERENCES terminals(id) ON DELETE SET NULL;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS terminal_id UUID REFERENCES terminals(id) ON DELETE SET NULL;
ALTER TABLE shared_ride_lobbies ADD COLUMN IF NOT EXISTS terminal_id UUID REFERENCES terminals(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS terminal_id UUID REFERENCES terminals(id) ON DELETE SET NULL;
```

Roles: `'customer' | 'rider' | 'business' | 'admin'` (+ `admin_type` `'business_customer' | 'rider'`).

### D. Auth Flows (THREE CHANGED BEHAVIORS — must implement exactly)

1. **Signup = Customer only.** `/signup` offers a single account type: Customer. Collect
   first/last name, email, phone (`09XXXXXXXXX`), optional address, password + confirm.
   On submit: validate (password ≥ 6 chars, matches; phone regex `/^09\d{9}$/`); check email
   not taken; create user with `role: 'customer'`, `is_verified: true` (auto-activated);
   persist to Supabase `users` + localStorage mirror `trikeserve_users`. Success screen:
   green check circle + "✓ Account Activated! You can now login and start using TrikeServe."
   + "GO TO LOGIN" button. **No rider/business signup options anywhere.**
2. **Signin:** email + password → check `admins` table (plaintext `password_hash`), then
   `users`, then localStorage fallback. Block unverified: *"Account pending verification.
   Please visit the TrikeServe office at Barangay Hall with your documents."* On success store
   `localStorage['trikeserve_current_user']` and route via `/redirect` → role dashboard
   (customer `/customer/food`, rider `/rider`, business `/business`, admin `/admin`).
3. **Admins assign roles & terminals.** Admin Users page can edit a user's role
   (customer/rider/business — never admin) and **persist to Supabase** (not just
   localStorage). Admin Terminals page (NEW, `/admin/terminals`) creates terminals and
   **assigns each rider to exactly one terminal**.

### E. Screen-by-Screen UI Spec

**E1. Login (`/`)** — Split hero: left = gradient `from-[#E11D48]/90 via-[#BE123C]/85
to-[#121212]/90` over a Valenzuela photo (keep the photo asset), headline "TrikeServe" +
"Community-Based Tricycle Platform", bullets ("Shared & Private Rides", "Food Delivery
Service", "Fixed TODA Rates"), pill "Serving Valenzuela, Philippines". Right: "Welcome Back" →
email + password inputs (icon-prefixed, h-12), "Forgot Password?" link, crimson uppercase
"SIGN IN" button with spinner while loading, divider, "Create Account" outline button → `/signup`.

**E2. Signup (`/signup`)** — Same split hero: "Join TrikeServe", "Face-to-Face Verification
Required", 3 steps ("Register Online" → "Visit Barangay Hall" → "Get Activated"). Form:
"Back to Sign In" ghost button, "Create Account" title, 2-col first/last name, email, phone
(with format hint), optional Address, password + confirm, **green note** "Customer accounts
are automatically activated after registration. You can login immediately!", BACK + REGISTER
buttons. No role selector.

**E3. Customer Home (map booking)** — Full-screen Google Map with markers:
- Custom SVG markers: customer `#2563EB` pin, dropoff `#E11D48` pin, driver = tricycle
  photo icon (44×44), passenger = colored initials circles (palette
  `['#8B5CF6','#EC4899','#F59E0B','#10B981','#06B6D4','#6366F1']`).
- Route polyline: `strokeColor` role color, weight ~5, `FORWARD_CLOSED_ARROW` icons,
  `geodesic: true`.
- Search panel (top, card): pickup/dropoff fields + places autocomplete (PH-biased,
  country `ph`), location picker modal (tap map → preview pin → confirm).
- Vehicle selector: **Share Ride** vs **Special/Private** cards with price chips (loaded from
  `admin_settings` rates, default shared ₱15 / private ₱50), passenger count stepper.
- Ride status experience: "searching for driver" → driver-found card (photo, name, plate,
  rating, ETA) → live driver tracking (driver marker + route to pickup) → status popups
  ("Your driver is on the way to pick you up! 🚗", "Your driver has arrived! 📍", "You have
  been picked up!...", "You have arrived at your destination! 🏁") → completion popup with
  rating modal. Poll DB every 2s + Supabase realtime subscription (single source of truth;
  **no duplicate popups**).
- **NEW:** when a ride request/lobby is created, resolve `terminal_id` from pickup coords
  (`resolveTerminalForPickup`) and save it on the row.
- Bottom nav: Home, Food, Messages (unread badge), Activity, Account.

**E4. Customer Food** — Restaurant list cards (logo tile, name, rating chip, delivery
time/fee), category chips, search; RestaurantDetail (hero image, menu sections, add-to-cart
with quantity, cutlery toggle); Cart (item list, subtotal/delivery/total, payment COD/GCASH,
place order → success). **NEW:** delivery order creation resolves `terminal_id` from pickup.

**E5. Rider Dashboard (`/rider`)** — Dark-to-red header w/ driver avatar, name, "Driver"
badge, Verified badge; big online toggle; service type chips (Ride Share / Delivery /
Special); **NEW Terminal banner**: "Operating from: **Valenzuela Terminal**" (or amber warning
"⚠️ No Terminal assigned. Contact admin." with queue hidden); request queue cards (route,
fare, passengers) — **filtered by the driver's terminal**; FAB → more options; bottom nav:
Home, Requests, Activity, Messages, Profile.

**E6. Rider Requests & Active Ride** — `PassengerRequests` (list of pending + lobbies,
accept → assign driver fields); `ActiveRide` (passenger cards w/ dropoff statuses,
route progress, "picked up"/"dropped off" actions, minimize to bottom sheet
`rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]`); driver status update controls.

**E7. Rider Profile** — gradient header w/ avatar circle, badges; Personal Information card
(name, email, phone); Driver Information card (TODA plate, license, verification status
banner green/amber); Operating Locations card (service type badges, default pickup/dropoff
inputs); **NEW Terminal card** (assigned terminal name, read-only); "Use Customer App" +
"Sign Out" buttons.

**E8. Admin Dashboard (`/admin`)** — Sidebar (Overview, Users, Settings, **NEW Terminals**)
with brand tile `bg-gradient-to-br from-[#E11D48] to-[#121212]`; stat cards (Total,
Customers, Riders, Businesses, Verified, Pending); pending verification feed.

**E9. Admin Users** — Search (name/email/phone) + role + status filters; table: avatar+name,
role badge with inline **Edit** (role dropdown scoped by admin type: customer/business for
business_customer admin; rider for rider admin), verified status, email, phone, details
(TODA/address), actions Verify/Unverify + Delete (disabled + tooltip when out of admin's
scope, `cursor-not-allowed opacity-50`).

**E10. Admin Terminals (NEW)** — Cards per terminal (name, boundary, rider count, active
status, edit/delete); "New Terminal" form (name + boundary + optional center coords);
per-terminal driver list with **Assign Driver** picker (unassigned riders only) and
**Unassign** button.

**E11. Admin Settings** — Fixed-rate configuration (shared/private prices → `admin_settings`
JSON), visible only to `rider` admin type; access-restricted notice for business_customer admin.

**E12. Business screens** — Dashboard (stats, orders), Menu management (categories, items,
availability toggle, image upload), Orders (status pipeline received → confirmed →
preparing → quality_check → ready → assigned_rider → on_the_way → delivered, with rider
assignment), Account.

**E13. Shared Ride Lobby** — Join-able lobby with passenger avatars (initials circles),
seats count, host cancel; driver-found state; per-passenger dropoff management; realtime
subscription to lobby updates.

### F. Key Functions to Implement (see REBUILD_FUNCTIONS_DOCUMENTATION.md for full list)

`signup` (customer-only), `login`, `logout`, `updateProfile`, `resolveTerminalForPickup`,
`listTerminals/createTerminal/updateTerminal/deleteTerminal`, `assignDriverToTerminal`,
`unassignDriverFromTerminal`, `getDriversByTerminal`, terminal-filtered
`getWaitingLobbiesForDriver/getRideRequests/getDeliveryQueue`, plus all existing ride/lobby/
chat/order/processing/upload/realtime helpers unchanged.

### G. Acceptance Checklist (visual)

- [ ] Crimson-red brand + Inter font + gradient headers everywhere per spec
- [ ] Mobile bottom nav present on all customer/rider main screens
- [ ] Signup shows ONLY customer type; success = auto-activated
- [ ] Driver sees Terminal name; no terminal → warning + empty queue
- [ ] Admin Users role edit persists to Supabase; Terminals page exists at `/admin/terminals`
- [ ] Riders only see rides whose pickup is inside their terminal
- [ ] All buttons have press states; cards have consistent radius/borders; no layout
  overflow (use `overflow-x-hidden`, `.scrollbar-hide`)

## PROMPT END

---

## Design Reference Notes (for the implementer)

- **Colors live in `src/styles/theme.css`** as CSS variables (`--primary: #E11D48` etc.)
  mapped into Tailwind v4 via `@theme inline`. Use Tailwind tokens where possible
  (`bg-primary`), arbitrary values where the palette differs.
- **Fonts loaded in `src/styles/index.css`** — Inter 400–800, plus Tailwind + theme import
  order: `@import url(fonts)`, `@import './tailwind.css'`, `@import './theme.css'`.
- **Global animations** (index.css): `slideDown`, `slideUp`, `infiniteBounce` (used for
  driver-arrival popup), `.scrollbar-hide`, `overflow-x: hidden` on html/body/#root.
- **Marker/route helpers** live in `customer/Home.tsx`: `decodeGooglePolyline`,
  `createDriverMarkerIcon`, `createCustomerMarkerIcon`, `createDropoffMarkerIcon`,
  `createPassengerMarkerIcon`, `buildNavigationRouteOptions`. Reuse them for the map screens.
- **Recommended pickup zones** (Valenzuela): "Valenzuela Terminal", "Valenzuela Market", "Valenzuela Eco
  Park", "Valenzuela Mini Park", street list with emoji icons, plus Barangay Hall 🏛️.
- **Driver status copy** map (customer side): on-the-way/arrived/pickup/drop-off/in-progress/
  payment/completed — exact strings in section E3; keep them consistent.
- **Terminal default:** seed a "Valenzuela Terminal" record (Main Road, Valenzuela, Valenzuela City,
  lat 14.7294, lng 120.9349, radius ~2km) so the app is usable out of the box.