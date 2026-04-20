# Remotion Booking Reel v2 — Design Spec

## Overview

A 15-second 9:16 Instagram Reel built with Remotion that simulates a phone screen recording of someone booking a session on fantasmafootball.com. An animated cursor interacts with the actual UI. Bold text callouts appear beside the phone. Rendered as silent MP4 (music added in Instagram).

## Goals

- Remove booking friction: "that looks easy"
- Elevate brand perception: "that looks premium"
- Feel authentic: looks like a real person using the real site

## Format

- **Dimensions:** 1080×1920 (9:16 vertical)
- **FPS:** 30
- **Duration:** 450 frames / 15 seconds
- **Output:** Silent MP4 (H.264)
- **Render:** `npx remotion render src/index.ts BookingReel out/booking-reel.mp4`

## Visual Design

### Phone Mockup
- iPhone-style frame: rounded corners (60px radius), dark bezel
- Notch/dynamic island at top
- Status bar (time, wifi, battery icons)
- Centered on dark navy (#040C14) background
- Phone is ~65% of frame width (~700px), ~75% of frame height (~1440px)
- This leaves ~190px on each side for text callouts
- Subtle drop shadow behind phone

### Inside the Phone
- Faithful recreation of the booking page at fantasmafootball.com/booking
- **Mobile single-column layout** (since it's a phone screen)
- Cream background (#F8F7F4), white cards, gold accents
- Simplified nav bar (logo + hamburger icon, mobile-style)
- UI elements match site: coach bubbles, calendar grid, slot pills, form
- **Fully static/mocked UI** — no API calls, deterministic render. Calendar always shows April 2026 with day 15 selectable. All state driven by frame number.

### Cursor
- Small white circle (20px) with subtle shadow
- Moves between targets with spring animation (damping: 20, mass: 1) — feels like a relaxed human hand, not robotic
- On "click": scales to 0.7 briefly, then back to 1
- Slight trailing motion (position lags 2-3 frames behind target)

### Text Callouts
- Appear beside the phone (left or right side, alternating)
- Bebas Neue, white, 36px, letterspacing 2px
- Slide in from edge (spring), hold ~40 frames, slide out
- Three callouts total across the video
- Positioned vertically centered relative to the action happening inside the phone
- ~190px margin on each side of phone provides space

### Grain
- Subtle SVG noise overlay on the entire frame (opacity 0.03)
- Matches the site's editorial texture

## Scene Breakdown

### Scene 1: Landing (frames 0–60, 2s)
- Phone slides up from below frame (spring, from y+400 to y=0)
- Inside phone: booking hero visible — "BOOK YOUR SESSION" headline, nav at top
- Cursor fades in at bottom-right of phone screen at ~frame 40

### Scene 2: Choose Coach (frames 60–150, 3s)
- Page content scrolls up to reveal coach selector
- Cursor glides to Connor's bubble (spring)
- Cursor clicks at ~frame 110
- Gold ring + shadow activates on Connor's bubble
- **Callout:** "PICK YOUR COACH" slides in from left (frames 80–140)

### Scene 3: Pick Date (frames 150–250, 3.3s)
- Cursor moves to calendar area
- Calendar card visible with "APRIL 2026" header
- Cursor clicks day 15 at ~frame 200
- Day 15 fills gold, slight scale pulse
- **Callout:** "CHOOSE A DATE" slides in from right (frames 170–240)

### Scene 4: Select Time (frames 250–330, 2.7s)
- Page scrolls slightly to reveal time slot panel below calendar (mobile single-column)
- 3-column pill grid: 3:00, 4:00, 5:00, 6:00, 7:00, 8:00
- Cursor clicks "5:00 PM" at ~frame 285
- Pill fills gold

### Scene 5: Book (frames 330–390, 2s)
- Page scrolls to form section
- Simplified form: 3 fields only (name, email, phone) for visual clarity
- Fields auto-fill with fast typing animation (time-lapse feel — all 3 fill in ~20 frames)
- Cursor moves to "Book Session" button
- Cursor clicks at ~frame 370
- Button depresses slightly on click
- **Callout:** "BOOK IN SECONDS" slides in from left (frames 335–370, exits by frame 380)

### Scene 6: Confirmation (frames 390–450, 2s)
- Screen transitions to success state
- Animated checkmark (gold on navy) with spring scale
- "You're Booked!" in Bebas Neue
- Quick fade to navy + Fantasma logo + @fantasmafootball handle (last 20 frames)

## Transitions

Use `@remotion/transitions` `TransitionSeries`:
- Between scenes 1→2, 2→3, 3→4, 4→5: **no transition** — continuous flow (it's one page scrolling)
- Scene 5→6: **fade** (10 frames) — the confirmation is a state change, not a scroll

Actually, since this simulates a continuous screen recording, scenes 1-5 should be ONE continuous composition with the cursor moving through a scrollable page. Only scene 6 (confirmation) is a separate state that fades in.

## Architecture

### Revised approach: Single scrollable page + confirmation overlay

Rather than separate scenes with transitions, the phone content is a single tall page that scrolls programmatically. The cursor, scroll position, and UI state are all driven by frame number.

```
Frame 0-60:    scrollY = 0 (hero visible), phone enters
Frame 60-150:  scrollY animates to coach section (~400px down), cursor selects
Frame 150-250: scrollY animates to calendar (~800px down), cursor selects day
Frame 250-330: scrollY animates slightly further (~1050px) to reveal time slots, cursor selects
Frame 330-390: scrollY animates to form section (~1400px), fast-fill, cursor clicks book
Frame 390-450: confirmation overlay fades in over current content
```

Note: scrollY values are approximate and will be calibrated empirically based on the rendered BookingPage component heights. The mobile single-column layout means coach selector, calendar, time slots, and form are all stacked vertically.

This is MORE authentic because it's literally one continuous flow — no cuts.

## Tech Stack

- `remotion` 4.x + `@remotion/cli` — core (AbsoluteFill, spring, interpolate, interpolateColors, Sequence, Img)
- `@remotion/google-fonts` — Bebas Neue, Outfit (proper font loading with delayRender)
- `@remotion/animation-utils` — `makeTransform`, `translateX`, `translateY`, `scale` (CSS transform composition)
- `react` 18, `typescript`
- NO `@remotion/transitions` needed (single continuous composition)

## Project Structure

```
video/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts            # registerRoot
│   ├── Root.tsx            # Composition definition
│   ├── BookingReel.tsx     # Main composition component
│   ├── brand.ts            # Colors, fonts, timing constants
│   ├── components/
│   │   ├── PhoneMockup.tsx # iPhone frame + status bar
│   │   ├── Cursor.tsx      # Animated cursor (spring x/y + click)
│   │   ├── TextCallout.tsx # Side text labels
│   │   ├── GrainOverlay.tsx
│   │   └── BookingPage.tsx # The full scrollable page recreation
│   └── assets/             # Logo, coach images
└── render.sh
```

### Key Design Decision: BookingPage as single scrollable component

`BookingPage.tsx` renders the full booking page (hero → coach selector → calendar → time slots → form → confirmation) as one tall column. A `scrollY` prop (driven by interpolated frame values) controls which portion is visible in the phone viewport. UI state (selected coach, selected day, selected time, form values) are also driven by frame number.

This means:
- ONE component renders the entire page
- Frame number drives everything: scroll, selections, cursor position
- No scene transitions needed — it's literally a continuous scroll

## Brand Constants

| Token | Value |
|-------|-------|
| Navy | `#040C14` |
| Gold | `#C5B358` |
| Cream | `#F8F7F4` |
| White | `#FFFFFF` |
| Display font | Bebas Neue (via @remotion/google-fonts) |
| Body font | Outfit (via @remotion/google-fonts) |

## Dependencies

```json
{
  "@remotion/cli": "4.0.450",
  "@remotion/google-fonts": "4.0.450",
  "@remotion/animation-utils": "4.0.450",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "remotion": "4.0.450",
  "typescript": "^5.3.0"
}
```
