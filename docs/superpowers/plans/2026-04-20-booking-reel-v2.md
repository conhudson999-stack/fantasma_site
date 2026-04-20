# Booking Reel v2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 15-second Remotion video simulating a phone screen recording of someone booking a session on fantasmafootball.com, with animated cursor and side text callouts.

**Architecture:** Single continuous composition. A `BookingPage` component renders the full mobile booking flow as a tall column; `scrollY` (driven by frame interpolation) controls what's visible through a `PhoneMockup` viewport. A `Cursor` component moves via spring-animated coordinates. `TextCallout` labels slide in beside the phone.

**Tech Stack:** Remotion 4.x, @remotion/google-fonts, @remotion/animation-utils, React 18, TypeScript

---

## Chunk 1: Project Setup & Foundational Components

### Task 1: Delete old video/ and scaffold fresh project

**Files:**
- Delete: `video/` (entire directory)
- Create: `video/package.json`
- Create: `video/tsconfig.json`
- Create: `video/src/index.ts`
- Create: `video/src/Root.tsx`
- Create: `video/src/brand.ts`

- [ ] **Step 1: Remove old video directory**

```bash
cd C:/Users/conhu/fantasma-site && rm -rf video
```

- [ ] **Step 2: Create new directory structure**

```bash
mkdir -p video/src/components video/src/assets
```

- [ ] **Step 3: Create package.json**

Write `video/package.json`:

```json
{
  "name": "fantasma-booking-reel",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "studio": "remotion studio src/index.ts",
    "render": "remotion render src/index.ts BookingReel out/booking-reel.mp4 --codec h264"
  },
  "dependencies": {
    "@remotion/cli": "4.0.450",
    "@remotion/google-fonts": "4.0.450",
    "@remotion/animation-utils": "4.0.450",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "remotion": "4.0.450"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Step 4: Create tsconfig.json**

Write `video/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 5: Create brand.ts**

Write `video/src/brand.ts`:

```ts
import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";

// Load fonts — Remotion handles delayRender internally
const { fontFamily: bebasNeue } = loadBebasNeue();
const { fontFamily: outfit } = loadOutfit("normal", {
  weights: ["300", "400", "500", "600", "700"],
});

export const FONTS = {
  display: bebasNeue,
  body: outfit,
} as const;

export const COLORS = {
  navy: "#040C14",
  gold: "#C5B358",
  cream: "#F8F7F4",
  white: "#FFFFFF",
  border: "rgba(10, 10, 10, 0.08)",
  muted: "rgba(4, 12, 20, 0.35)",
  dim: "rgba(4, 12, 20, 0.6)",
} as const;

export const VIDEO = {
  width: 1080,
  height: 1920,
  fps: 30,
  durationInFrames: 450,
} as const;

// Phone dimensions
export const PHONE = {
  width: 700,
  height: 1440,
  radius: 60,
  bezel: 12,
  notchWidth: 200,
  notchHeight: 34,
} as const;

// Timing keyframes (frame numbers)
export const TIMING = {
  phoneEnterEnd: 40,
  cursorAppear: 40,
  scrollToCoach: [60, 80] as const,      // start, end
  coachClick: 110,
  scrollToCalendar: [140, 160] as const,
  dateClick: 200,
  scrollToSlots: [245, 260] as const,
  timeClick: 285,
  scrollToForm: [320, 340] as const,
  formFillStart: 345,
  bookClick: 370,
  confirmationStart: 390,
} as const;

// Scroll targets (approximate, calibrate after first render)
export const SCROLL = {
  hero: 0,
  coach: 400,
  calendar: 800,
  slots: 1050,
  form: 1400,
} as const;
```

- [ ] **Step 6: Create Root.tsx**

Write `video/src/Root.tsx`:

```tsx
import React from "react";
import { Composition } from "remotion";
import { VIDEO } from "./brand";
import { BookingReel } from "./BookingReel";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="BookingReel"
    component={BookingReel}
    durationInFrames={VIDEO.durationInFrames}
    fps={VIDEO.fps}
    width={VIDEO.width}
    height={VIDEO.height}
  />
);
```

- [ ] **Step 7: Create index.ts**

Write `video/src/index.ts`:

```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

- [ ] **Step 8: Create BookingReel.tsx placeholder**

Write `video/src/BookingReel.tsx`:

```tsx
import React from "react";
import { AbsoluteFill } from "remotion";
import { COLORS } from "./brand";

export const BookingReel: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.navy }} />
);
```

- [ ] **Step 9: Copy assets**

```bash
cp C:/Users/conhu/fantasma-site/public/fantasma_logo_final.png video/src/assets/
cp C:/Users/conhu/fantasma-site/public/gcc_profile.webp video/src/assets/
cp C:/Users/conhu/fantasma-site/public/colton_profile.webp video/src/assets/
```

- [ ] **Step 10: Create asset type declarations**

Write `video/src/declarations.d.ts`:

```ts
declare module "*.png" { const src: string; export default src; }
declare module "*.webp" { const src: string; export default src; }
declare module "*.jpg" { const src: string; export default src; }
```

- [ ] **Step 11: Install dependencies**

```bash
cd C:/Users/conhu/fantasma-site/video && npm install
```

- [ ] **Step 12: Verify TypeScript compiles**

```bash
cd C:/Users/conhu/fantasma-site/video && npx tsc --noEmit
```

- [ ] **Step 13: Verify Remotion studio launches**

```bash
cd C:/Users/conhu/fantasma-site/video && npx remotion studio src/index.ts
```

Expected: Black screen composition "BookingReel" visible in Remotion Studio.

- [ ] **Step 14: Commit**

```bash
cd C:/Users/conhu/fantasma-site && git add video/ && git commit -m "feat(video): scaffold fresh Remotion project for booking reel v2"
```

---

### Task 2: GrainOverlay component

**Files:**
- Create: `video/src/components/GrainOverlay.tsx`

- [ ] **Step 1: Create GrainOverlay**

Write `video/src/components/GrainOverlay.tsx`:

```tsx
import React from "react";
import { AbsoluteFill } from "remotion";

export const GrainOverlay: React.FC = () => (
  <AbsoluteFill
    style={{
      opacity: 0.03,
      pointerEvents: "none",
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundRepeat: "repeat",
      backgroundSize: "256px 256px",
      mixBlendMode: "overlay",
    }}
  />
);
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/conhu/fantasma-site && git add video/src/components/GrainOverlay.tsx && git commit -m "feat(video): add GrainOverlay component"
```

---

### Task 3: PhoneMockup component

**Files:**
- Create: `video/src/components/PhoneMockup.tsx`

- [ ] **Step 1: Create PhoneMockup**

Write `video/src/components/PhoneMockup.tsx`:

```tsx
import React from "react";
import { AbsoluteFill } from "remotion";
import { PHONE, COLORS, FONTS } from "../brand";

interface PhoneMockupProps {
  children: React.ReactNode;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ children }) => {
  const left = (1080 - PHONE.width) / 2;
  const top = (1920 - PHONE.height) / 2;

  return (
    <AbsoluteFill>
      {/* Phone shadow */}
      <div
        style={{
          position: "absolute",
          left: left - 4,
          top: top - 4,
          width: PHONE.width + 8,
          height: PHONE.height + 8,
          borderRadius: PHONE.radius + 4,
          boxShadow: "0 20px 80px rgba(0,0,0,0.6), 0 8px 30px rgba(0,0,0,0.4)",
        }}
      />
      {/* Phone bezel */}
      <div
        style={{
          position: "absolute",
          left,
          top,
          width: PHONE.width,
          height: PHONE.height,
          borderRadius: PHONE.radius,
          background: "#1a1a1a",
          border: "2px solid #333",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Status bar */}
        <div
          style={{
            height: 54,
            background: COLORS.cream,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {/* Time */}
          <span style={{ fontFamily: FONTS.body, fontSize: 15, fontWeight: 600, color: COLORS.navy }}>
            9:41
          </span>
          {/* Notch / Dynamic Island */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 10,
              transform: "translateX(-50%)",
              width: PHONE.notchWidth,
              height: PHONE.notchHeight,
              borderRadius: 20,
              background: "#1a1a1a",
            }}
          />
          {/* Battery/signal icons (simplified) */}
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {/* Signal bars */}
            <svg width="16" height="12" viewBox="0 0 16 12">
              <rect x="0" y="8" width="3" height="4" fill={COLORS.navy} rx="0.5" />
              <rect x="4" y="5" width="3" height="7" fill={COLORS.navy} rx="0.5" />
              <rect x="8" y="2" width="3" height="10" fill={COLORS.navy} rx="0.5" />
              <rect x="12" y="0" width="3" height="12" fill={COLORS.navy} rx="0.5" />
            </svg>
            {/* Battery */}
            <svg width="24" height="12" viewBox="0 0 24 12">
              <rect x="0" y="1" width="20" height="10" rx="2" fill="none" stroke={COLORS.navy} strokeWidth="1.5" />
              <rect x="2" y="3" width="15" height="6" rx="1" fill={COLORS.navy} />
              <rect x="21" y="3.5" width="2" height="5" rx="1" fill={COLORS.navy} />
            </svg>
          </div>
        </div>
        {/* Content viewport (clipped) */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            background: COLORS.cream,
          }}
        >
          {children}
        </div>
        {/* Home indicator bar */}
        <div
          style={{
            height: 28,
            background: COLORS.cream,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 140,
              height: 5,
              borderRadius: 3,
              background: COLORS.navy,
              opacity: 0.2,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/conhu/fantasma-site && git add video/src/components/PhoneMockup.tsx && git commit -m "feat(video): add PhoneMockup component with status bar and notch"
```

---

### Task 4: Cursor component

**Files:**
- Create: `video/src/components/Cursor.tsx`

- [ ] **Step 1: Create Cursor**

Write `video/src/components/Cursor.tsx`:

```tsx
import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { makeTransform, translateX, translateY, scale } from "@remotion/animation-utils";
import { PHONE } from "../brand";

interface CursorTarget {
  x: number; // relative to phone viewport (0-700)
  y: number; // relative to phone viewport (0-1386)
  frame: number; // when to arrive
  click?: boolean; // trigger click animation
}

interface CursorProps {
  targets: CursorTarget[];
  appearFrame: number;
}

export const Cursor: React.FC<CursorProps> = ({ targets, appearFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < appearFrame) return null;

  // Find current and next target
  let currentTarget = targets[0];
  for (let i = targets.length - 1; i >= 0; i--) {
    if (frame >= targets[i].frame - 15) {
      currentTarget = targets[i];
      break;
    }
  }

  // Compute cursor position with spring
  const phoneLeft = (1080 - PHONE.width) / 2;
  const phoneTop = (1920 - PHONE.height) / 2 + 54; // below status bar

  let cursorX = phoneLeft + currentTarget.x;
  let cursorY = phoneTop + currentTarget.y;

  // Spring toward target
  const progress = spring({
    frame: frame - (currentTarget.frame - 15),
    fps,
    config: { damping: 20, mass: 1, stiffness: 120 },
  });

  // Find previous target for interpolation
  const targetIdx = targets.indexOf(currentTarget);
  if (targetIdx > 0) {
    const prev = targets[targetIdx - 1];
    const prevX = phoneLeft + prev.x;
    const prevY = phoneTop + prev.y;
    cursorX = interpolate(progress, [0, 1], [prevX, phoneLeft + currentTarget.x]);
    cursorY = interpolate(progress, [0, 1], [prevY, phoneTop + currentTarget.y]);
  }

  // Click animation
  let clickScale = 1;
  if (currentTarget.click && frame >= currentTarget.frame && frame <= currentTarget.frame + 8) {
    const clickProgress = (frame - currentTarget.frame) / 8;
    clickScale = clickProgress < 0.4 ? interpolate(clickProgress, [0, 0.4], [1, 0.7]) : interpolate(clickProgress, [0.4, 1], [0.7, 1]);
  }

  // Fade in
  const opacity = interpolate(frame - appearFrame, [0, 8], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: cursorX,
        top: cursorY,
        width: 20,
        height: 20,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.95)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        transform: makeTransform([
          translateX(-10),
          translateY(-10),
          scale(clickScale),
        ]),
        opacity,
        zIndex: 1000,
      }}
    />
  );
};
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/conhu/fantasma-site && git add video/src/components/Cursor.tsx && git commit -m "feat(video): add Cursor component with spring movement and click animation"
```

---

### Task 5: TextCallout component

**Files:**
- Create: `video/src/components/TextCallout.tsx`

- [ ] **Step 1: Create TextCallout**

Write `video/src/components/TextCallout.tsx`:

```tsx
import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { FONTS, COLORS } from "../brand";

interface TextCalloutProps {
  text: string;
  side: "left" | "right";
  enterFrame: number;
  exitFrame: number;
  y?: number; // vertical position (default: centered)
}

export const TextCallout: React.FC<TextCalloutProps> = ({
  text,
  side,
  enterFrame,
  exitFrame,
  y = 960,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < enterFrame - 5 || frame > exitFrame + 15) return null;

  // Enter spring
  const enterProgress = spring({
    frame: frame - enterFrame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  // Exit
  const exitProgress = frame >= exitFrame
    ? interpolate(frame - exitFrame, [0, 10], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  const slideDistance = 80;
  const offsetX = side === "left"
    ? interpolate(enterProgress, [0, 1], [-slideDistance, 0]) - exitProgress * slideDistance
    : interpolate(enterProgress, [0, 1], [slideDistance, 0]) + exitProgress * slideDistance;

  const opacity = enterProgress * (1 - exitProgress);

  const xPos = side === "left" ? 30 : undefined;
  const rightPos = side === "right" ? 30 : undefined;

  return (
    <div
      style={{
        position: "absolute",
        left: xPos,
        right: rightPos,
        top: y,
        transform: `translateX(${offsetX}px) translateY(-50%)`,
        opacity,
        fontFamily: FONTS.display,
        fontSize: 36,
        letterSpacing: 2,
        color: COLORS.white,
        whiteSpace: "nowrap",
        textShadow: "0 2px 10px rgba(0,0,0,0.5)",
      }}
    >
      {text}
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/conhu/fantasma-site && git add video/src/components/TextCallout.tsx && git commit -m "feat(video): add TextCallout component with spring enter/exit"
```

---

## Chunk 2: BookingPage Component

### Task 6: BookingPage — the full scrollable mobile page

**Files:**
- Create: `video/src/components/BookingPage.tsx`

This is the largest component. It renders the full mobile booking flow as a single tall column. Props control UI state (which elements are "selected") and scroll position.

- [ ] **Step 1: Create BookingPage**

Write `video/src/components/BookingPage.tsx`:

```tsx
import React from "react";
import { Img } from "remotion";
import { COLORS, FONTS, PHONE } from "../brand";
import logo from "../assets/fantasma_logo_final.png";
import connorImg from "../assets/gcc_profile.webp";
import coltonImg from "../assets/colton_profile.webp";

interface BookingPageProps {
  scrollY: number;
  coachSelected: boolean;
  selectedDay: number | null;
  selectedTime: string | null;
  formValues: { name: string; email: string; phone: string };
  showConfirmation: boolean;
  confirmationOpacity: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = ["3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM"];

export const BookingPage: React.FC<BookingPageProps> = ({
  scrollY,
  coachSelected,
  selectedDay,
  selectedTime,
  formValues,
  showConfirmation,
  confirmationOpacity,
}) => {
  const viewportHeight = PHONE.height - 54 - 28; // minus status bar and home bar

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Scrollable content */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${-scrollY}px)`,
        }}
      >
        {/* === NAV BAR === */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            background: "rgba(248, 247, 244, 0.95)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <Img src={logo} style={{ height: 32, width: "auto" }} />
          {/* Hamburger */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ width: 20, height: 2, background: COLORS.navy, borderRadius: 1 }} />
            <div style={{ width: 20, height: 2, background: COLORS.navy, borderRadius: 1 }} />
            <div style={{ width: 20, height: 2, background: COLORS.navy, borderRadius: 1 }} />
          </div>
        </div>

        {/* === HERO === */}
        <div style={{ padding: "60px 24px 40px", textAlign: "center" }}>
          <p style={{ fontFamily: FONTS.body, fontSize: 13, letterSpacing: 2, color: COLORS.muted, textTransform: "uppercase", marginBottom: 8 }}>
            Schedule Training
          </p>
          <h1 style={{ fontFamily: FONTS.display, fontSize: 48, color: COLORS.navy, lineHeight: 1, margin: 0 }}>
            BOOK YOUR
          </h1>
          <h1 style={{ fontFamily: FONTS.display, fontSize: 48, color: COLORS.gold, lineHeight: 1, margin: 0 }}>
            SESSION.
          </h1>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: COLORS.dim, marginTop: 12 }}>
            Select a date, pick a time, and reserve your spot.
          </p>
        </div>

        {/* === COACH SELECTOR === */}
        <div style={{ padding: "0 24px 32px", textAlign: "center" }}>
          <p style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 700, letterSpacing: 3, color: COLORS.muted, textTransform: "uppercase", marginBottom: 20 }}>
            SELECT YOUR COACH
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24 }}>
            {/* Connor */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 16 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: coachSelected ? `3px solid ${COLORS.gold}` : `3px solid ${COLORS.border}`,
                  boxShadow: coachSelected ? `0 0 0 3px rgba(197, 179, 88, 0.25)` : "none",
                }}
              >
                <Img src={connorImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontFamily: FONTS.display, fontSize: 16, letterSpacing: 1, color: coachSelected ? COLORS.gold : COLORS.navy }}>
                CONNOR
              </span>
              <span style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>
                Pittsburgh
              </span>
            </div>
            {/* Colton */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 16 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", border: `3px solid ${COLORS.border}` }}>
                <Img src={coltonImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
              <span style={{ fontFamily: FONTS.display, fontSize: 16, letterSpacing: 1, color: COLORS.navy }}>
                COLTON
              </span>
              <span style={{ fontFamily: FONTS.body, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: 1 }}>
                Grove City
              </span>
            </div>
          </div>
        </div>

        {/* === CALENDAR === */}
        <div style={{ padding: "0 20px 24px" }}>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden" }}>
            {/* Calendar header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: COLORS.navy }}>‹</div>
              <span style={{ fontFamily: FONTS.display, fontSize: 22, letterSpacing: 2, color: COLORS.navy }}>APRIL 2026</span>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: COLORS.navy }}>›</div>
            </div>
            {/* Weekdays */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "12px 16px 4px" }}>
              {WEEKDAYS.map((d) => (
                <div key={d} style={{ textAlign: "center", fontFamily: FONTS.body, fontSize: 10, fontWeight: 700, letterSpacing: 1, color: COLORS.muted, textTransform: "uppercase" }}>{d}</div>
              ))}
            </div>
            {/* Days (April 2026 starts Wednesday, offset 3) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "4px 16px 16px", gap: 3 }}>
              {Array.from({ length: 3 }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                const isSelected = day === selectedDay;
                const isPast = day < 10;
                return (
                  <div
                    key={day}
                    style={{
                      aspectRatio: "1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: FONTS.body,
                      fontSize: 14,
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? COLORS.navy : COLORS.navy,
                      backgroundColor: isSelected ? COLORS.gold : "transparent",
                      borderRadius: 8,
                      opacity: isPast ? 0.3 : 1,
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* === TIME SLOTS === */}
        <div style={{ padding: "0 20px 24px" }}>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20 }}>
            <p style={{ fontFamily: FONTS.display, fontSize: 18, letterSpacing: 1, color: COLORS.navy, marginBottom: 4 }}>AVAILABLE TIMES</p>
            <p style={{ fontFamily: FONTS.body, fontSize: 11, fontWeight: 600, letterSpacing: 2, color: COLORS.gold, marginBottom: 14, textTransform: "uppercase" }}>TUESDAY, APRIL 15</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {TIME_SLOTS.map((slot) => {
                const isSelected = slot === selectedTime;
                return (
                  <div
                    key={slot}
                    style={{
                      padding: "10px 6px",
                      borderRadius: 9999,
                      backgroundColor: isSelected ? COLORS.gold : COLORS.white,
                      border: `1px solid ${isSelected ? COLORS.gold : COLORS.border}`,
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 500,
                      color: COLORS.navy,
                      textAlign: "center",
                    }}
                  >
                    {slot}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* === FORM === */}
        <div style={{ padding: "0 20px 40px" }}>
          <div style={{ background: COLORS.white, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20 }}>
            <p style={{ fontFamily: FONTS.display, fontSize: 18, letterSpacing: 1, color: COLORS.navy, marginBottom: 16 }}>YOUR DETAILS</p>
            {[
              { label: "Full Name", value: formValues.name },
              { label: "Email Address", value: formValues.email },
              { label: "Phone Number", value: formValues.phone },
            ].map(({ label, value }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <p style={{ fontFamily: FONTS.body, fontSize: 12, fontWeight: 500, color: COLORS.navy, marginBottom: 6 }}>{label}</p>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: `1px solid ${value ? COLORS.gold : COLORS.border}`,
                    fontFamily: FONTS.body,
                    fontSize: 14,
                    color: value ? COLORS.navy : COLORS.muted,
                    minHeight: 38,
                  }}
                >
                  {value || ""}
                </div>
              </div>
            ))}
            {/* Book button */}
            <div
              style={{
                marginTop: 8,
                padding: "14px 24px",
                borderRadius: 10,
                backgroundColor: COLORS.gold,
                fontFamily: FONTS.display,
                fontSize: 18,
                letterSpacing: 1,
                color: COLORS.navy,
                textAlign: "center",
              }}
            >
              BOOK SESSION
            </div>
          </div>
        </div>
      </div>

      {/* === CONFIRMATION OVERLAY === */}
      {showConfirmation && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: COLORS.navy,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            opacity: confirmationOpacity,
            gap: 16,
          }}
        >
          {/* Checkmark */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              border: `4px solid ${COLORS.gold}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 40, color: COLORS.gold }}>✓</span>
          </div>
          <p style={{ fontFamily: FONTS.display, fontSize: 36, color: COLORS.cream }}>
            YOU'RE BOOKED!
          </p>
          <p style={{ fontFamily: FONTS.body, fontSize: 14, color: `${COLORS.cream}90` }}>
            See you on the field
          </p>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:/Users/conhu/fantasma-site/video && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
cd C:/Users/conhu/fantasma-site && git add video/src/components/BookingPage.tsx && git commit -m "feat(video): add BookingPage component (full mobile booking flow)"
```

---

## Chunk 3: Main Composition & Final Assembly

### Task 7: Wire up BookingReel.tsx — the orchestrator

**Files:**
- Modify: `video/src/BookingReel.tsx`

This is where frame-number-driven state, scroll, cursor targets, and callouts come together.

- [ ] **Step 1: Replace BookingReel.tsx with full implementation**

Write `video/src/BookingReel.tsx`:

```tsx
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Img } from "remotion";
import { COLORS, FONTS, TIMING, SCROLL, PHONE } from "./brand";
import { PhoneMockup } from "./components/PhoneMockup";
import { BookingPage } from "./components/BookingPage";
import { Cursor } from "./components/Cursor";
import { TextCallout } from "./components/TextCallout";
import { GrainOverlay } from "./components/GrainOverlay";
import logo from "./assets/fantasma_logo_final.png";

export const BookingReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // === PHONE ENTRANCE ===
  const phoneY = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80 },
    from: 400,
    to: 0,
  });

  // === SCROLL POSITION ===
  const scrollY = (() => {
    if (frame < TIMING.scrollToCoach[0]) return SCROLL.hero;
    if (frame < TIMING.scrollToCalendar[0]) {
      const p = interpolate(frame, TIMING.scrollToCoach, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return interpolate(p, [0, 1], [SCROLL.hero, SCROLL.coach]);
    }
    if (frame < TIMING.scrollToSlots[0]) {
      const p = interpolate(frame, TIMING.scrollToCalendar, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return interpolate(p, [0, 1], [SCROLL.coach, SCROLL.calendar]);
    }
    if (frame < TIMING.scrollToForm[0]) {
      const p = interpolate(frame, TIMING.scrollToSlots, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return interpolate(p, [0, 1], [SCROLL.calendar, SCROLL.slots]);
    }
    if (frame < TIMING.confirmationStart) {
      const p = interpolate(frame, TIMING.scrollToForm, [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
      return interpolate(p, [0, 1], [SCROLL.slots, SCROLL.form]);
    }
    return SCROLL.form;
  })();

  // === UI STATE (driven by frame) ===
  const coachSelected = frame >= TIMING.coachClick;
  const selectedDay = frame >= TIMING.dateClick ? 15 : null;
  const selectedTime = frame >= TIMING.timeClick ? "5:00 PM" : null;

  // Form values (fast fill starting at formFillStart)
  const formValues = (() => {
    const f = frame - TIMING.formFillStart;
    if (f < 0) return { name: "", email: "", phone: "" };
    const name = "Alex Rivera".slice(0, Math.min(11, Math.floor(f * 1.5)));
    const email = f >= 7 ? "alex@email.com".slice(0, Math.min(14, Math.floor((f - 7) * 1.8))) : "";
    const phone = f >= 14 ? "(412) 555-0123".slice(0, Math.min(14, Math.floor((f - 14) * 2))) : "";
    return { name, email, phone };
  })();

  const showConfirmation = frame >= TIMING.confirmationStart;
  const confirmationOpacity = showConfirmation
    ? interpolate(frame - TIMING.confirmationStart, [0, 10], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  // === CURSOR TARGETS (relative to phone viewport) ===
  const cursorTargets = [
    { x: 500, y: 600, frame: TIMING.cursorAppear },         // initial position
    { x: 220, y: 480, frame: TIMING.coachClick, click: true },  // Connor bubble
    { x: 380, y: 520, frame: TIMING.dateClick, click: true },   // Day 15
    { x: 350, y: 420, frame: TIMING.timeClick, click: true },   // 5:00 PM slot
    { x: 350, y: 600, frame: TIMING.bookClick, click: true },   // Book button
  ];

  // === END CARD (last 20 frames) ===
  const endCardOpacity = frame >= 430
    ? interpolate(frame, [430, 440], [0, 1], { extrapolateRight: "clamp" })
    : 0;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.navy }}>
      {/* Phone with entrance animation */}
      <div style={{ transform: `translateY(${phoneY}px)` }}>
        <PhoneMockup>
          <BookingPage
            scrollY={scrollY}
            coachSelected={coachSelected}
            selectedDay={selectedDay}
            selectedTime={selectedTime}
            formValues={formValues}
            showConfirmation={showConfirmation}
            confirmationOpacity={confirmationOpacity}
          />
        </PhoneMockup>
      </div>

      {/* Cursor (on top of phone) */}
      <div style={{ transform: `translateY(${phoneY}px)` }}>
        <Cursor targets={cursorTargets} appearFrame={TIMING.cursorAppear} />
      </div>

      {/* Text callouts */}
      <TextCallout text="PICK YOUR COACH" side="left" enterFrame={80} exitFrame={135} y={900} />
      <TextCallout text="CHOOSE A DATE" side="right" enterFrame={170} exitFrame={235} y={900} />
      <TextCallout text="BOOK IN SECONDS" side="left" enterFrame={335} exitFrame={370} y={900} />

      {/* End card overlay */}
      {endCardOpacity > 0 && (
        <AbsoluteFill
          style={{
            backgroundColor: COLORS.navy,
            alignItems: "center",
            justifyContent: "center",
            opacity: endCardOpacity,
            gap: 12,
          }}
        >
          <Img src={logo} style={{ width: 120, height: 120, objectFit: "contain" }} />
          <p style={{ fontFamily: FONTS.body, fontSize: 24, color: `${COLORS.cream}90` }}>@fantasmafootball</p>
        </AbsoluteFill>
      )}

      {/* Grain overlay */}
      <GrainOverlay />
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd C:/Users/conhu/fantasma-site/video && npx tsc --noEmit
```

- [ ] **Step 3: Preview in Remotion Studio**

```bash
cd C:/Users/conhu/fantasma-site/video && npx remotion studio src/index.ts
```

Expected: Full 15-second video plays — phone enters, scrolls through booking flow, cursor clicks elements, callouts appear on sides.

- [ ] **Step 4: Commit**

```bash
cd C:/Users/conhu/fantasma-site && git add video/src/BookingReel.tsx && git commit -m "feat(video): wire up BookingReel orchestrator with scroll, cursor, and callouts"
```

---

### Task 8: Render script and final render

**Files:**
- Create: `video/render.sh`

- [ ] **Step 1: Create render.sh**

Write `video/render.sh`:

```bash
#!/bin/bash
set -e
cd "$(dirname "$0")"

OUTPUT="../posts/booking-reel-$(date +%Y%m%d).mp4"
mkdir -p ../posts

echo "Rendering BookingReel..."
npx remotion render src/index.ts BookingReel "$OUTPUT" \
  --codec h264 \
  --image-format jpeg \
  --quality 90

echo "Done! Output: $OUTPUT"
```

- [ ] **Step 2: Make executable and render**

```bash
chmod +x video/render.sh && cd C:/Users/conhu/fantasma-site/video && bash render.sh
```

Expected: MP4 created in `posts/` (~15 seconds, 1080x1920).

- [ ] **Step 3: Commit**

```bash
cd C:/Users/conhu/fantasma-site && git add video/render.sh && git commit -m "feat(video): add render script"
```

---

### Task 9: Calibrate scroll values and cursor positions

After the first render, the scroll targets and cursor positions will likely need adjustment based on actual component heights.

- [ ] **Step 1: Open Remotion Studio and scrub to each keyframe**

```bash
cd C:/Users/conhu/fantasma-site/video && npx remotion studio src/index.ts
```

Check each scene visually:
- Frame 80: Is the coach selector centered in the phone viewport?
- Frame 160: Is the calendar visible and centered?
- Frame 260: Are time slots visible?
- Frame 345: Is the form visible?

- [ ] **Step 2: Adjust SCROLL values in brand.ts if needed**

Update the `SCROLL` object values based on what you observe.

- [ ] **Step 3: Adjust cursor target x/y coordinates in BookingReel.tsx if needed**

The cursor should land precisely on:
- Connor's profile picture center
- Day 15 cell center
- "5:00 PM" pill center
- "Book Session" button center

- [ ] **Step 4: Re-render and verify**

```bash
cd C:/Users/conhu/fantasma-site/video && bash render.sh
```

- [ ] **Step 5: Commit final calibration**

```bash
cd C:/Users/conhu/fantasma-site && git add video/src/ && git commit -m "fix(video): calibrate scroll positions and cursor targets"
```
