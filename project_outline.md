# Fantasma Football Training — Project Outline

## Project Overview

**Fantasma Football Training** is an elite soccer development and coaching business based in Pittsburgh, PA. The website is a modern one-page marketing site designed to attract players and parents, showcase training programs, and drive bookings.

- **Tagline:** "Fear the Phantom. Train Fantasma"
- **Positioning:** Where the poetry and grit of football meet.
- **Founded by:** Coach Connor Hudson - former NCAA Division 1 and semi-professional player
- **Core pillars:** Passion, tactical intelligence, desire

---

## Tech Stack

- **Build tool:** Vite (vanilla setup, no framework)
- **Languages:** HTML, CSS, JavaScript (no libraries or frameworks)
- **Fonts:** Google Fonts via CDN — Bebas Neue (display/headlines) + Outfit (body text)
- **Assets:** Custom wraith artwork (PNG), Fantasma F logo (`fantasma_logo_final.png`, transparent background), team logos (PNG), coach profile photo (`gcc_profile.webp`)
- **Image generation:** Gemini API script (`tools/generate-image.cjs`) for on-demand asset creation
- **Dependencies:** Vite only (no npm runtime dependencies)

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
- **Centered pill-shaped nav bar** with rounded corners containing page links
- Fantasma "F" logo image (`fantasma_logo_final.png`) on the left (transparent background), "Book a Session" CTA button on the right
- Mobile: hamburger toggle with slide-out panel (cream background), includes social media icons at the bottom with a border-top separator

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
- **Mobile navigation:** Hamburger menu with slide-out cream panel
- **Instagram carousel:** Tinder-style card stack with CSS 3D transforms (perspective, rotateY, scale, opacity transitions). Circular navigation via arrows, dots, keyboard, touch swipe, and side-card clicks. Responsive card sizing scales with container width
- **Instagram lightbox:** Full-screen overlay for viewing posts/playing videos, close via button, backdrop click, or Escape key
- **Smooth scroll:** Anchor links scroll smoothly to target sections

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
├── index.html              # Main HTML (all sections)
├── src/
│   ├── style.css           # All styles, design system, responsive breakpoints
│   └── main.js             # Animations, scroll effects, form handling, IG feed, coaches section
├── public/
│   ├── pitt_wraith.png     # Wraith mascot artwork
│   ├── fantasma_logo_final.png # Fantasma "F" brand logo (transparent background)
│   ├── gcc_profile.webp    # Coach Connor Hudson profile photo
│   ├── FR_logo.png         # Franklin Regional logo (transparent background)
│   ├── presby_logo.png     # Presbyterian College logo (transparent background)
│   ├── grove_logo.png      # Grove City College logo (transparent background)
│   ├── steelcity_logo.png  # Steel City FC logo
│   └── cardinals_logo.png  # Commonwealth Cardinals FC logo (transparent background)
├── tools/
│   └── generate-image.cjs  # Gemini API image generation CLI script
├── .vercel/                # Vercel project config (git-ignored)
├── .env                    # API keys (git-ignored)
├── package.json            # Vite config
└── PROJECT_OUTLINE.md      # This file
```

---

## Deployment

The site is hosted on **Vercel** and deployed via the Vercel CLI.

### URLs

| Type | URL |
|------|-----|
| Production | https://fantasma-site.vercel.app |
| Deployment (initial) | https://fantasma-site-43kdkrc8c-connor-hudsons-projects.vercel.app |
| Vercel Dashboard | https://vercel.com/connor-hudsons-projects/fantasma-site |
| Custom Domain Settings | https://vercel.com/connor-hudsons-projects/fantasma-site/settings |

- **Production URL** — Permanent, always points to the latest production deployment. This is the URL to share publicly.
- **Deployment URL** — Unique per deploy, useful for previewing a specific version.

### Redeploying

After making changes, redeploy to production with:

```bash
vercel --prod
```

### Custom Domain

To connect a custom domain (e.g. fantasmafootball.com), visit the [domain settings](https://vercel.com/connor-hudsons-projects/fantasma-site/settings) in the Vercel dashboard.
