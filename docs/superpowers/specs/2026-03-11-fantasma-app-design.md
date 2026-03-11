# Fantasma Football — Mobile App Design Spec

## Overview

React Native / Expo mobile app for Fantasma Football training clients. Players use the app to view their schedule, book sessions, log training activity, and access AI-generated drill plans.

**Separate repo:** `fantasma-app` — standalone from the `fantasma-site` website repo. Calls existing Vercel API endpoints as an external service.

## Target User

Players (training clients). Coach-facing features are out of scope for MVP.

## MVP Screens

Two tabs + auth + profile:

1. **Home / Schedule** — daily dashboard with next session, weekly calendar, quick booking, progress stats, activity logging
2. **AI Drill Coach** — curated drill library, AI drill generation, saved drills

Profile accessible from header (not a tab). Auth screens outside the tab navigator.

## Navigation Structure

```
Root
├── Auth (unauthenticated)
│   ├── SignIn
│   └── SignUp
└── Main (authenticated)
    ├── MainTabs
    │   ├── HomeTab
    │   │   ├── HomeScreen
    │   │   ├── BookingScreen (select date/time)
    │   │   └── BookingConfirmation
    │   └── DrillsTab
    │       ├── DrillsHome (library + generate button)
    │       ├── GenerateDrill (focus area picker → result)
    │       └── DrillDetail (full drill view)
    └── ProfileScreen (modal, outside tabs)
```

## Home Screen

Top to bottom:

- **Greeting header** — time-aware ("Good morning, Connor"), profile icon top-right
- **Next Session card** — session type, date, time, duration, countdown. If none booked, becomes a "Book your next session" CTA. Tapping opens booking flow.
- **Weekly calendar strip** — 7 days, dots on days with sessions, today in gold
- **Quick Book button** — gold CTA, opens BookingScreen → calls `api/availability.js` for slots → player picks date/time → confirms via `api/book.js`. Booking sends `name`, `email`, and `phone` from the player's profile. If phone is not set, prompts the player to add it before booking.
- **Progress stats row** — three cards: Sessions, Hours, Streak. Fed by self-reported activity log.
- **Log Activity FAB** — floating button, opens quick modal: "I trained today" with optional duration and notes. Writes to `activity_log` table.

## AI Drills Screen

### Drills Home (default view)

- **Category filter chips** — horizontal scroll: All, Dribbling, Shooting, Passing, Defending, Fitness. Calls `api/drills.js?category=X`.
- **Featured Drill card** — rotates weekly (built into `api/drills.js`), gold-bordered, taps to DrillDetail.
- **Drill list** — two sections. **Curated drills** (from API) filtered by the selected category chip. **Your Saved Drills** section below, showing AI-generated drills from Supabase (not filtered by category — always shown). Saved drills get an "AI Generated" badge.
- **Generate button** — sticky CTA: "Generate Custom Drill", navigates to GenerateDrill.

### GenerateDrill Screen

- Focus area grid (multi-select): First Touch, Speed, Dribbling, Shooting, Vision, Defending
- Optional difficulty picker: Beginner / Intermediate / Advanced
- "Generate Drill Plan" button → calls `api/generate-drill.js`
- Loading state with branded animation
- Result as full drill card with steps
- Actions: **Save to Library** (Supabase) and **Regenerate**

### DrillDetail Screen

- Full view of any drill (curated or saved)
- Name, description, equipment, duration
- Curated drills display `difficulty` (Beginner/Intermediate/Advanced). Saved AI drills display `intensity` (Low/Medium/High). Both shown in the same UI position as a badge.
- Numbered step list
- "Remove from Library" for saved drills

## Profile Screen

Presented as a modal from the header icon. Contains:

- **Player info** — first name, last name, email (read-only), phone
- **Edit profile** — tap to edit name or phone number (phone required for booking)
- **Sign out** button
- App version at bottom

No settings or preferences for MVP.

## Auth

- **Email + password** via Supabase Auth
- **Sign-up screen collects:** first name, last name, email, password. First/last name passed as user metadata to Supabase Auth; the DB trigger reads these into the `profiles` row.
- Auth tokens stored in Expo SecureStore
- Unauthenticated users see SignIn/SignUp; authenticated users land on Home

## Data Model (Supabase)

### `profiles`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | FK to auth.users, PK |
| first_name | text | for greeting |
| last_name | text | |
| email | text | from auth |
| phone | text | required for booking |
| created_at | timestamp | |

### `saved_drills`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to profiles |
| name | text | drill name |
| description | text | |
| steps | jsonb | array of step strings |
| duration | text | "25 min" |
| intensity | text | Low/Medium/High |
| equipment | text | |
| focus_areas | text[] | what was selected |
| created_at | timestamp | |

### `activity_log`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to profiles |
| date | date | when they trained |
| duration_min | int | optional, defaults to 60 |
| notes | text | optional |
| created_at | timestamp | |

### `bookings`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK to profiles |
| session_type | text | "1-on-1" or "small-group" (API slugs) |
| date | date | |
| time | text | "4:00 PM" |
| duration_min | int | 60 or 90 |
| calendar_event_id | text | requires `api/book.js` modification to capture and return `event.data.id` from Google Calendar insert |
| created_at | timestamp | |

Row Level Security (RLS) enabled on all tables — players can only access their own data.

The `bookings` table is a local cache. Google Calendar remains the source of truth via the existing Vercel API. **Limitation:** bookings only reflect sessions booked through the app. Sessions booked via the website or rescheduled directly in Google Calendar won't appear in the app. This is acceptable for MVP.

## API Integration

### Existing Vercel Endpoints (minor changes needed)

| Action | Method | Endpoint |
|--------|--------|----------|
| Get available slots | GET | `/api/availability?date=YYYY-MM-DD` |
| Book session | POST | `/api/book` |
| Get curated drills | GET | `/api/drills?category=X` |
| Generate AI drill | POST | `/api/generate-drill` |

Required API changes:
- **CORS:** All four endpoints already set `Access-Control-Allow-Origin: *` — no changes needed.
- **`api/book.js`:** Assign the insert result to a variable (`const event = await calendar.events.insert(...)`) and include `event.data.id` in the response body as `calendarEventId`. Currently the insert result is not assigned to a variable.

### Supabase Operations

| Action | Table |
|--------|-------|
| Sign up / sign in | auth |
| Get/update profile | profiles |
| Save drill | saved_drills |
| List saved drills | saved_drills |
| Delete saved drill | saved_drills |
| Log activity | activity_log |
| Get stats | activity_log (aggregate) |
| Cache booking | bookings |
| Get upcoming sessions | bookings (date >= today) |

## Tech Stack

- **Expo SDK 53** with Expo Router (file-based navigation)
- **Supabase JS client** — auth + database
- **React Navigation** (via Expo Router) — tabs + stacks
- **Expo SecureStore** — auth token storage
- **AsyncStorage** — lightweight caching
- **TypeScript** throughout
- **React Context** for auth state (no state management library)

## Project Structure

```
fantasma-app/
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx         # Root layout (auth check)
│   ├── (auth)/
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   └── (tabs)/
│       ├── _layout.tsx     # Tab bar config
│       ├── index.tsx       # Home screen
│       ├── drills/
│       │   ├── index.tsx   # Drill library
│       │   ├── generate.tsx
│       │   └── [id].tsx    # Drill detail
├── profile.tsx             # Modal (outside tabs)
├── components/
│   ├── DrillCard.tsx
│   ├── SessionCard.tsx
│   ├── StatCard.tsx
│   └── ...
├── lib/
│   ├── supabase.ts         # Supabase client init
│   ├── api.ts              # Vercel API calls
│   └── constants.ts        # Brand colors, fonts, API URL
├── contexts/
│   └── AuthContext.tsx
├── assets/                 # Fonts, images, logo
├── app.json
└── package.json
```

## Brand Constants

```
DARK_NAVY: #040C14
VEGAS_GOLD: #C5B358
LIGHT_CREAM: #F8F7F4
FONT_DISPLAY: Bebas Neue
FONT_BODY: Outfit
API_BASE: https://fantasmafootball.com/api
```

## Error Handling

Simple and honest. Network errors show a retry prompt. API failures show a plain-language message. No silent failures.

## Out of Scope (MVP)

- Formation builder
- Coach admin view
- Push notifications
- Drill completion tracking
- Social features
- Offline mode
