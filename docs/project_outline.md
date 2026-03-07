# Fantasma Football Training — Project Outline

## Project Overview

**Fantasma Football Training** is an elite soccer development and coaching business based in Pittsburgh, PA. The website is a multi-page marketing site with a live booking system, interactive formation builder, and automated daily research/content pipeline — designed to attract players and parents, showcase training programs, and drive bookings.

- **Tagline:** "Fear the Phantom. Train Fantasma"
- **Positioning:** Where the poetry and grit of football meet.
- **Founded by:** Coach Connor Hudson — former NCAA Division 1 and semi-professional player
- **Core pillars:** Passion, tactical intelligence, desire
- **Live URL:** https://fantasmafootball.com

---

## Tech Stack

- **Build tool:** Vite 7.x (vanilla setup, no framework, multi-page config via `vite.config.js`)
- **Languages:** HTML, CSS, JavaScript (no libraries or frameworks)
- **Fonts:** Google Fonts via CDN — Bebas Neue (display/headlines) + Outfit (body text)
- **Hosting:** Vercel (static site + serverless API functions)
- **Assets:** Custom wraith artwork (PNG/SVG), Fantasma F logo (`fantasma_logo_final.png`, transparent background), team logos (PNG), coach profile photos
- **Image generation:** Script (`scripts/generate-image.cjs`) for on-demand asset creation
- **Dependencies:**
  - **Dev:** Vite
  - **Runtime:** dotenv, googleapis (Google Calendar integration), nodemailer (email), pdfkit, puppeteer (screenshotting social posts)

---

## Design Direction

Inspired by the **Dayos** website aesthetic — ultra-bold editorial typography, high contrast, confident spatial composition, and magazine-quality layout. Adapted to Fantasma's navy/gold/cream brand palette.

### Key Design Principles
- **Massive condensed headlines** (Bebas Neue) that dominate each section
- **Alternating light/dark sections** creating visual rhythm
- **Editorial typography hierarchy** with strong contrast between display and body text
- **Generous whitespace** balanced with bold graphic elements
- **Grain texture overlay** across the entire page for tactile depth
- **Clip-path reveal animations** on hero headline for cinematic entrance

---

## Site Sections

### Top Bar
- **Slim dark navy utility bar** (36px height) fixed above the navbar
- Left: email link (conhudbusiness@gmail.com)
- Right: four social media icon links (Instagram, Facebook, X, TikTok) using inline SVGs
- Icon hover state transitions to gold (`var(--gold)`)
- **Hides on scroll** past 50px (synced with navbar scroll state) via `transform: translateY(-100%)` + opacity fade
- **Hidden on mobile** (768px and below) — social icons appear in the hamburger slide-out menu instead

### Navigation
- Fixed at top, sits below the top bar (`top: 36px`, transitions to `top: 0` when scrolled)
- Frosted glass effect (`backdrop-filter: blur`) on scroll
- **Centered pill-shaped nav menu** (`<ul class="nav-menu">` styled as pill, separate from the empty `<div class="nav-pill">`) with rounded corners containing page links
- Fantasma "F" logo image (`fantasma_logo_final.png`) on the left (transparent background), "Book a Session" CTA button on the right
- Links: About, Programs, Coaches, FAQ, Contact, Book a Session, Formation Builder
- **Mobile:** Hamburger toggle (3-line button, z-index 1003) with slide-out panel (cream background, z-index 1002, slides from right). Includes all nav links plus social media icons at the bottom with a border-top separator. Logo scales down to 48px on mobile. Navbar padding reduces to 8px (6px when scrolled).
- Shared across all pages via consistent HTML (booking.html and formation.html use `/#about` style links to route back to index sections)

### Hero
- **Split layout:** massive headline text on the left, dark visual panel on the right
- Headline uses Bebas Neue at `clamp(4.5rem, 11vw, 11rem)` — reads "FEAR THE PHANTOM. TRAIN FANTASMA."
- Tag line with gold dot: "Elite Soccer Development, Pittsburgh, PA"
- Two CTA buttons: "Book a Session" (dark fill) and "View Programs" (outline)
- **Right panel:** wraith figure at full opacity with rounded corners (`border-radius: 24px`), transparent background
- Clip-path reveal animation staggers each headline word on page load
- Light cream (`#F8F7F4`) background

### Pillars (Dayos-style three-column callout)
- **Dark navy background** section
- Three bold keyword headlines with periods: **"PASSION."** / **"TACTICAL INTELLIGENCE."** / **"DESIRE."**
- Short descriptive text underneath each in smaller body font, reflecting the About section's core values (love for the game, reading the game, outworking everyone)
- Adapts Dayos' "AI. / GAP. / CLOSED." pattern for Fantasma's core pillars
- Gold period accent on each headline (e.g., PASSION**.**)

### About
- Light cream background
- Section tag: "Who We Are" / Title: "TOTAL FOOTBALL. COMPLETE TRAINING."
- Two paragraphs focused on: deep love and passion for the game, unrelenting work ethic, you don't need to be the fastest/tallest/most athletic — you need willingness to learn and the ability to think through problems, and a desire to get better each day
- Three feature highlights with vertical gold bar markers (4px × 36px):
  - **Love for the Sport** — Passion is the foundation
  - **Outwork Everyone** — Relentless work ethic over raw talent
  - **Read the Game** — Smart players solve problems, see what others miss
- **Instagram Feed:** Tinder-style card carousel pulling the latest 9 posts from @fantasmafootball via the Facebook Graph API. One post is displayed prominently in the center with neighboring posts peeking from the left and right at reduced scale and opacity with a subtle 3D tilt. Navigation via left/right arrow buttons, dot indicators, keyboard arrows, touch swipe, or clicking side cards. The carousel loops circularly — navigating past the last post wraps back to the first. Video posts display a play badge; clicking the active center card opens a lightbox. Auto-updates on every page load.

### Training Programs
- Dark navy background
- Section tag: "What We Offer" / Title: "TRAINING PROGRAMS."
- **Stacked editorial row layout** — full-width horizontal rows, not a card grid
- Each row structure: large decorative number (01/02/03) | gold vertical divider (gradient-tapered) | body content (SVG shield icon + title + description + 2-column feature list) | outline pill CTA button
- **Alternating background tones** — odd rows slightly lighter, even rows slightly darker navy, with gold hairline `::before` separators between rows
- **Inline SVG shield/crest icons** (80×96px) unique to each program:
  - **1-on-1 Training** — Shield with centered star + dashed focus ring (individual attention)
  - **Small Group Training** — Shield with 3 stars in triangle formation + connecting lines (team dynamic)
  - **Elite Camps** — Shield with crown/chevron motif + jewels (elite status)
- **Program features (4 bullets each):**
  - **1-on-1 Training:** Personalized training plan, direct coach mentorship, flexible scheduling, progress tracking
  - **Small Group Training:** Reduced per player rates, competitive game scenarios, position-specific work, speed & agility training
  - **Elite Camps:** Multi-day immersive format, guest professional coaches, small-sided scrimmages & tournaments, opportunity to be selected to travel/train with European partner academies
- **Hover interactions:** Row lifts (`translateY(-3px)`) with layered box-shadow, shield icon scales/rotates with dual gold drop-shadow glow, title underline expands from 0→60px, divider brightens, feature bullet rings fill, number opacity increases
- **Button hover:** Fills gold with directional arrow (`→`) sliding in from the left, padding expands to accommodate
- **No prices shown** — inquiry-based CTAs ("Learn More") linking to contact form
- Features always visible (4 bullets per program in 2-column grid)
- Responsive: rows become compact rounded cards at 768px (divider hidden, vertical stacking, full-width CTA), tighter at 480px
- Uses existing `.reveal` scroll animation with 120ms stagger between rows

### Coaches (Meet Your Coaches)
- Light cream background with **generous spacing** — section padding 140px, section header margin-bottom 72px, layout gap 56px
- Section tag: "Meet The Team" / Title: "MEET YOUR COACHES."
- **30/70 grid layout** (`align-items: stretch`) — coach accordion on the left (30%), team logo timeline on the right (70%). Collapses to single column at 1024px.
- **Left column — Coach Accordion:** Clickable coach names with dropdown arrow, one-at-a-time expand/collapse (like FAQ). When expanded shows coach profile photo (`gcc_profile.webp`) stacked above bio text in a vertical layout. First coach starts expanded by default. Data-driven from `coachesData` array in main.js. **Height-matched to right column** via `align-items: stretch` with `overflow-y: auto` and a thin gold scrollbar — accordion never extends past the bottom of the team info card.
- **Right column — Team Logo Timeline:** All 5 team logos at **140px × 140px** in a horizontal row with alternating up/down vertical stepping (±20px) and 36px gaps. A **gold zigzag connecting line** (2px, `var(--gold)`, 50% opacity, 50px wide) runs between logos via `::after` pseudo-elements at 45° angles. Active logo displays at full color and size with a per-team colored glow (`filter: drop-shadow` using `--glow-color`). Inactive logos are grayscale, reduced opacity (0.4), and slightly scaled down (0.85). Navigation via dot indicators, keyboard arrows, touch swipe, or clicking any logo directly.
- **Team Info Panel:** Below the timeline, a **white card** (`border-radius: 20px`, `border-left: 4px solid var(--gold)`) with 40px/44px padding and 200px min-height displays the team name, years, location, and description — updates with a fade transition on selection.
- **Linked behavior:** Selecting a different coach on the left rebuilds the timeline on the right with that coach's teams.
- Currently features one coach (Connor Hudson) with 5 teams, built to support additional coaches.
- **Teams & Logos (display order):**
  - Franklin Regional (`FR_logo.png`) — gold glow, 2016–2019, Murrysville, PA — Two-time WPIAL champion, PIAA state semi-finalist, two-time All-WPIAL, one-time All-State, senior captain
  - Presbyterian College (`presby_logo.png`) — blue glow, 2020–2023, Clinton, SC — NCAA D1, 50+ appearances, Big South Defender of the Week, competed against Clemson and South Carolina
  - Commonwealth Cardinals FC (`cardinals_logo.png`) — red glow, Summer 2022, Fredericksburg, VA — Inaugural USL League 2 roster
  - Steel City FC (`steelcity_logo.png`) — yellow glow, Summer 2023, Pittsburgh, PA — Record-breaking USL League 2 conference champions
  - Grove City College (`grove_logo.png`) — red glow, 2024, Grove City, PA — NCAA D3 graduate year, consistent starter, conference finalist
- All team logos are PNGs with transparent backgrounds.

### FAQ
- Dark navy background with light text
- Section tag: "Common Questions" / Title: "FREQUENTLY ASKED QUESTIONS."
- Five collapsible accordion questions centered in a max-width wrapper
- One-at-a-time expand/collapse with smooth `max-height` transitions
- Gold accent on active/expanded items

### Contact
- Light cream background
- **Bold asymmetric two-column layout** — editorial header on the left, form on the right
- **Left column — Editorial header:**
  - Section tag: "Get In Touch"
  - Oversized stacked title: "START / YOUR / JOURNEY." in Bebas Neue at `clamp(4rem, 7vw, 7.5rem)` with gold-accented period
  - **Gold horizontal line** (3px) that animates from 0 to 80px width on scroll via IntersectionObserver
  - Subtitle text below the gold line
  - Three contact details (Location, Email, Phone) styled with **gold vertical bar markers** (4px × 36px) — uppercase bold labels with values beneath, no cards or emoji icons
- **Right column — Form:**
  - Sits inside a subtle darker card (`#F2F0EB` background, `border-radius: 20px`, 40px padding)
  - **Underline-style inputs** — transparent background, no borders except a bottom line (`rgba(10,10,10,0.25)`)
  - On focus, a **gold accent line** animates across the full width of the field via `::after` pseudo-element
  - Uppercase bold labels (`--dark-text-dim`) with generous letter-spacing
  - Placeholder text at 0.5 opacity for readability
  - Submit button is left-aligned pill on desktop, full-width on mobile
- **"CONTACT" watermark** — oversized Bebas Neue text behind the section at 3% opacity (similar to footer's "FANTASMA" watermark)
- Responsive: stacks to single column at 1024px, button goes full-width on mobile

### Footer
- Dark navy background with oversized "FANTASMA" watermark text behind content
- Four-column layout: brand tagline + three link columns (Training, Company, Connect)
- Bottom bar with copyright and social media icon links (Instagram, Facebook, X, TikTok)

---

## Additional Pages

### Booking Page (`booking.html`)
A dedicated session booking page with Google Calendar integration.

- **Hero:** Dark navy background with "BOOK YOUR SESSION." headline (gold accent on "SESSION."), section tag "Schedule Training"
- **Calendar:** Interactive month-view calendar rendered in JS (`src/booking.js`). Navigate months with prev/next arrows. Days with availability are clickable; past dates and Sundays are disabled.
- **Session Types:** Toggle between "1-on-1" (60 min) and "Small Group" (90 min) via pill buttons
- **Time Slots:** Fetched from Vercel serverless API (`/api/availability`) which checks Google Calendar for existing events. Available hours: Mon–Fri 3pm–8pm, Sat 9am–2pm, Sun closed.
- **Booking Form:** After selecting a time, form collects name, email, phone. Submits to `/api/book` which creates a Google Calendar event and sends confirmation email via nodemailer.
- **JS:** `src/booking.js` — imports `shared.js` for nav/scroll behavior, handles calendar rendering, API calls, form submission
- **Layout:** Two-column on desktop (calendar left, panel right), stacks on mobile

### Formation Builder Page (`formation.html`)
An interactive soccer formation builder tool.

- **Hero:** Dark navy background with "FORMATION BUILDER." headline, section tag "Build Your Lineup"
- **Formation Selector:** Grid of formation buttons (4-4-2, 4-3-3, 3-5-2, 4-2-3-1, etc.) — clicking renders player dots on the pitch
- **Pitch:** CSS-rendered soccer field with markings (half line, center circle, penalty areas, goal areas, corner arcs). Player dots are draggable.
- **Place Yourself:** Click any player dot to mark it as "YOU" (gold highlight with badge)
- **Opposing Team:** Checkbox to toggle a second formation in a different color
- **Tactical Arrows:** Toolbar with Pass (dashed gold), Dribble (wavy blue), Run (solid orange) — click two points on the pitch to draw an arrow between them
- **Position Info Panel:** Clicking a position shows its name, role description, key skills, recommended training, and a "Book a Session" CTA
- **Actions:** Reset Formation, Share Formation (URL-based sharing)
- **JS:** `src/formation.js` — imports `shared.js`, handles formation data, drag-and-drop, arrow drawing, position info
- **Layout:** Two-column on desktop (controls left, pitch right), stacks on mobile

### Privacy Policy Page (`privacy.html`)
Simple standalone page with self-contained inline styles (not using the main CSS). Covers data handling for the website and social media automation. Last updated February 27, 2026.

---

## Design System

### Typography
| Font | Weight | Usage |
|------|--------|-------|
| Bebas Neue | 400 (only weight) | All section titles, hero headline, pillar keywords |
| Outfit | 300–800 | Body text, nav links, buttons, form inputs, descriptions |

All headlines render in ALL-CAPS via `text-transform: uppercase` or natural Bebas Neue casing.

### Color Palette
| Color | Hex | Usage |
|-------|-----|-------|
| Dark Navy | `#040C14` | Dark section backgrounds, hero visual panel |
| Vegas Gold | `#C5B358` | Accent color, CTAs, hover states, active indicators |
| Light Cream | `#F8F7F4` | Light section backgrounds, hero background |
| White | `#FFFFFF` | Text on dark sections, card backgrounds |
| Dark Text | `#0A0A0A` | Primary text on light sections |

### Section Rhythm
The site alternates between light and dark backgrounds:
- **Light (cream):** Hero, About, Coaches, Contact
- **Dark (navy):** Pillars, Programs, FAQ, Footer

### Visual Style
- **Pill-shaped buttons** (`border-radius: 9999px`) — dark fill or outline variants
- **Centered pill navigation** with frosted glass on scroll
- **Vertical gold bar markers** (4px × 36px) on feature highlights
- **Grain texture overlay** via inline SVG `feTurbulence` filter on `body::after`
- **Clip-path reveal animations** for hero headline entrance
- **Generous whitespace** and strong typographic hierarchy
- **Rounded wraith image** in hero (`border-radius: 24px`, full opacity, transparent background)
- **Minimal card design** with subtle hover lift effects

---

## Key Visual Asset — Wraith

A hooded specter/ghost figure cradling a soccer ball, serving as the brand mascot.

- Located at `public/pitt_wraith.png`
- Displayed in the hero at full opacity with rounded corners, no background frame
- Background wraith element hidden via CSS (`opacity: 0`)

---

## Interactive Features

- **Clip-path hero reveal:** Headline words animate in with staggered `clip-path` transitions on page load
- **Scroll animations:** Elements with `.reveal` class fade in and slide up as they enter the viewport (IntersectionObserver with staggered sibling delays)
- **Top bar hide/show:** Top bar slides up and fades out on scroll past 50px, reappears on scroll back to top
- **Navbar transform:** Frosted glass background and shadow appear on scroll past 50px; navbar slides from `top: 36px` to `top: 0` as top bar hides
- **Programs row hover:** Row lifts with layered shadow, shield icon scales/rotates with gold glow, title underline expands, divider brightens, feature bullets fill, number brightens. Button hover reveals sliding arrow.
- **Coach accordion:** One-at-a-time expand/collapse with smooth `max-height` transitions, linked to team logo timeline. Selecting a coach rebuilds the timeline with that coach's teams. Accordion height constrained to match right column via `align-items: stretch` with scroll overflow.
- **Team logo timeline:** Horizontal row of all logos with alternating up/down stepping and a gold zigzag connecting line (`::after` pseudo-elements at 45°). Active logo is full color with `drop-shadow` glow; inactive logos are grayscale + faded. CSS-driven state via `.is-active` class toggling. Navigation via dots, keyboard arrows, touch swipe, and clicking any logo. Team info panel below updates with fade transition.
- **FAQ accordion:** One-at-a-time expand/collapse with smooth `max-height` transitions
- **Contact gold line:** A 3px gold horizontal line animates from 0 to 80px width when the contact section scrolls into view (IntersectionObserver, `.is-visible` class toggle)
- **Contact form underline focus:** Each form field has a gold `::after` line that expands from 0 to full width on focus via `width` transition
- **Contact form:** Client-side handling with styled success message
- **Mobile navigation:** Hamburger menu with slide-out cream panel (280px width, slides from right)
- **Instagram carousel:** Tinder-style card stack with CSS 3D transforms (perspective, rotateY, scale, opacity transitions). Circular navigation via arrows, dots, keyboard, touch swipe, and side-card clicks. Responsive card sizing scales with container width
- **Instagram lightbox:** Full-screen overlay for viewing posts/playing videos, close via button, backdrop click, or Escape key
- **Smooth scroll:** Anchor links scroll smoothly to target sections
- **Ghost Mode Easter Egg:** Type "ghost" on keyboard to toggle phantom mode — adds green particle canvas overlay, scanline effect, and a floating toggle button. Persisted via `localStorage`. Implemented in `src/shared.js` as an IIFE.
- **Booking calendar:** Interactive month navigation with real-time availability fetched from Google Calendar API
- **Formation builder:** Drag-and-drop player positioning, tactical arrow drawing (pass/dribble/run), position info panels, formation sharing via URL

---

## Vercel Serverless API (`api/`)

### `GET /api/availability`
Returns available time slots for a given date and session type. Checks Google Calendar for existing events and computes free slots within general business hours (Mon–Fri 3–8pm, Sat 9am–2pm, Sun closed). Session durations: 1-on-1 = 60min, small-group = 90min.

### `POST /api/book`
Creates a booking: adds a Google Calendar event for the selected slot and sends a confirmation email to both the client and Connor via nodemailer/Gmail.

### `GET /api/daily/approve`
Approval endpoint for the daily research pipeline. Validates a secret token, then triggers a GitHub Actions `repository_dispatch` event to implement the approved plan (post to Instagram, apply site changes, etc.). Returns a mobile-friendly HTML confirmation page. Actions: `all`, `social`, `site`.

---

## Social Media Post System

### Design Templates (`social/`)
HTML templates for generating social media assets, all following the Fantasma "Interference" design system (corner marks, radial glow, grain texture, scan lines, Bebas Neue + Outfit fonts, Navy/Gold/Cream palette):

- `social/post-draft.html` — Single post design workspace
- `social/post-batch.html` — Multi-post batch layout
- `social/instagram-posts.html` — Instagram post collection view
- `social/brand-portfolio.html` — Brand reference / design language guide (**always reference this for post design**)
- `social/daily-template.html` — Auto-generated daily post template (multiple layout variants: stat-highlight, training-tip, quote, local-callout, testimonial)
- `social/profile-banner.html` — Profile banner design
- `social/profile-pic.html` — Profile picture design

### Post Pipeline
1. Design post in `social/post-draft.html`
2. Run `node scripts/publish-post.cjs --caption "..."` which:
   - Screenshots with Puppeteer (1080x1080)
   - Uploads to ImgBB
   - Posts to Instagram via Facebook Graph API
3. `--dry-run` flag skips upload/post, just screenshots
4. Post size: 1080x1080px, watermark: @fantasmafootball

### Automation Scripts (`scripts/`)
| Script | Purpose |
|--------|---------|
| `publish-post.cjs` | Screenshot → ImgBB → Instagram Graph API pipeline |
| `screenshot-posts.cjs` | Batch screenshot social post HTML files |
| `screenshot-banner.cjs` | Screenshot profile banner |
| `screenshot-pfp.cjs` | Screenshot profile picture |
| `generate-brandkit.cjs` | Generate brand kit assets |
| `generate-image.cjs` | AI image generation via API |
| `send-posts.cjs` | Email generated posts |
| `send-file.cjs` | Email a file attachment |
| `send-outline.cjs` | Email the project outline |

---

## Daily Research & Auto-Implementation Pipeline

A fully automated system that runs daily via GitHub Actions, researches the Pittsburgh soccer training market, generates content, and emails an approval-based execution plan.

### Flow
```
GitHub Actions cron (6:30 AM ET daily)
  → Research competitors, SEO keywords, trends, seasonal data
  → Generate Instagram post (Interference design) + screenshot via Puppeteer → ImgBB
  → Prepare site change recommendations
  → Save plan to docs/daily-plans/YYYY-MM-DD.json
  → Email HTML report with post preview + APPROVE buttons

User taps APPROVE on phone
  → Vercel API /api/daily/approve validates token
  → Triggers GitHub Actions repository_dispatch
  → Posts to Instagram, commits site changes, sends confirmation email
```

### Workflows (`.github/workflows/`)
- `daily-research.yml` — Cron schedule (`30 11 * * *` = 6:30 AM ET), runs `scripts/daily-research.cjs`, commits daily plan JSON
- `daily-implement.yml` — Triggered by `repository_dispatch` (type: `approve-daily-plan`), reads today's plan, posts to Instagram, applies site changes, sends confirmation

### Daily Plans (`docs/daily-plans/`)
JSON files per day tracking research findings, social post recommendations, site change proposals, and approval status.

### Research Rotation
- **Always:** Competitor social activity, seasonal calendar, Instagram engagement
- **Mon:** Competitor deep-dive (pricing, offerings, website changes)
- **Tue:** SEO keywords + ranking opportunities
- **Wed:** Content strategy analysis
- **Thu:** Local soccer news (tryout dates, tournaments)
- **Fri:** Community engagement opportunities
- **Sat:** Weekly performance summary
- **Sun:** Week-ahead planning

### Required Secrets
**GitHub Actions:** `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `OPENAI_API_KEY`, `IMGBB_API_KEY`, `APPROVE_SECRET`, `SITE_URL`, `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`, `GH_PAT`
**Vercel:** `APPROVE_SECRET`, `GITHUB_PAT`, `GITHUB_REPO`, `GOOGLE_SERVICE_ACCOUNT_KEY`

---

## Contact & Social Media

| Channel | Detail |
|---------|--------|
| Location | Pittsburgh, PA |
| Email | conhudbusiness@gmail.com |
| Phone | 412-737-2858 |
| Instagram | @fantasmafootball |
| Facebook | FantasmaFootballTraining |
| X (Twitter) | @FantasmaFooty |
| TikTok | @fantasma.football.t |

---

## File Structure

```
fantasma-site/
├── index.html                  # Main marketing page (all sections)
├── booking.html                # Session booking page (calendar + form)
├── formation.html              # Interactive formation builder
├── privacy.html                # Privacy policy (standalone styles)
├── vite.config.js              # Vite multi-page build config
├── vercel.json                 # Vercel rewrites (API routing)
├── package.json                # Dependencies & scripts
│
├── src/
│   ├── style.css               # All styles, design system, responsive breakpoints
│   ├── main.js                 # Index page: animations, scroll, form, IG feed, coaches
│   ├── shared.js               # Shared: nav, scroll effects, mobile menu, reveal animations, ghost mode
│   ├── booking.js              # Booking page: calendar, time slots, API calls, form
│   └── formation.js            # Formation builder: drag-drop, arrows, position info
│
├── api/                        # Vercel serverless functions
│   ├── availability.js         # GET — available time slots (Google Calendar)
│   ├── book.js                 # POST — create booking (Calendar + email)
│   └── daily/
│       └── approve.js          # GET — approve daily plan (triggers GitHub Actions)
│
├── scripts/                    # Automation scripts (Node.js CJS)
│   ├── daily-research.cjs      # Daily research pipeline orchestrator
│   ├── daily-implement.cjs     # Daily plan implementation (post + site changes)
│   ├── publish-post.cjs        # Screenshot → ImgBB → Instagram pipeline
│   ├── screenshot-posts.cjs    # Batch screenshot social post HTML files
│   ├── screenshot-banner.cjs   # Screenshot profile banner
│   ├── screenshot-pfp.cjs      # Screenshot profile picture
│   ├── generate-brandkit.cjs   # Generate brand kit assets
│   ├── generate-image.cjs      # AI image generation
│   ├── send-posts.cjs          # Email generated posts
│   ├── send-file.cjs           # Email a file attachment
│   └── send-outline.cjs        # Email the project outline
│
├── social/                     # Social media HTML templates
│   ├── brand-portfolio.html    # Brand reference / design language guide
│   ├── daily-template.html     # Auto-generated daily post template
│   ├── post-draft.html         # Single post design workspace
│   ├── post-batch.html         # Multi-post batch layout
│   ├── instagram-posts.html    # Instagram post collection view
│   ├── profile-banner.html     # Profile banner design
│   └── profile-pic.html        # Profile picture design
│
├── docs/
│   ├── project_outline.md      # This file
│   └── daily-plans/            # Auto-generated daily plan JSON files
│
├── public/                     # Static assets
│   ├── pitt_wraith.png         # Wraith mascot artwork (PNG)
│   ├── wraith.svg              # Wraith mascot artwork (SVG)
│   ├── fantasma_logo_final.png # Fantasma "F" brand logo (transparent)
│   ├── gcc_profile.webp        # Coach Connor profile photo
│   ├── coachprofilepic.jpg     # Coach profile photo (alt)
│   ├── FR_logo.png             # Franklin Regional logo
│   ├── presby_logo.png         # Presbyterian College logo
│   ├── grove_logo.png          # Grove City College logo
│   ├── grove_me.webp           # Grove City action photo
│   ├── steelcity_logo.png      # Steel City FC logo
│   └── cardinals_logo.png      # Commonwealth Cardinals FC logo
│
├── .github/workflows/
│   ├── daily-research.yml      # Cron: daily research + email pipeline
│   └── daily-implement.yml     # Dispatch: approve + implement daily plan
│
├── .env / .env.local           # API keys (git-ignored)
└── .vercel/                    # Vercel project config (git-ignored)
```

---

## Deployment

The site is hosted on **Vercel** and deployed via the Vercel CLI. The custom domain **fantasmafootball.com** is connected.

### URLs

| Type | URL |
|------|-----|
| Production (custom domain) | https://fantasmafootball.com |
| Vercel default | https://fantasma-site.vercel.app |
| Vercel Dashboard | https://vercel.com/connor-hudsons-projects/fantasma-site |

### Redeploying

After making changes, deploy to production with:

```bash
npx vercel --prod
```

**Note:** GitHub auto-deploy may not always trigger. If changes aren't appearing after a push, deploy manually with the command above.
