# Instagram Post: Player Evaluation Carousel

## Overview

A 4-slide Instagram carousel showcasing Fantasma's player evaluation reports. The angle: no other coach provides this level of care and detail after a session. Targets parents who are used to getting zero feedback from training.

## Audience

Parents of youth soccer players (ages 6-14) in the Pittsburgh area who are evaluating training options or already considering private coaching.

## Tone

Parent-facing and warm. Speak to their investment in their child. Not salesy — let the professionalism of the report do the selling.

## Technical Specs

- **Format:** 4-slide Instagram carousel
- **Dimensions:** 1080x1080px per slide
- **Pipeline:** Single HTML file with 4 `.slide` divs (1080x1080 each), screenshotted individually via Puppeteer — matches existing `publish-post.cjs` pipeline which queries `page.$$('.slide')`
- **Palette:** Navy `#040C14`, Gold `#C5B358`, Cream `#F8F7F4`
- **Fonts:** Bebas Neue (headlines), Outfit (body/subtext)
- **Texture:** Subtle grid texture on dark slides — CSS linear gradients at 40px spacing with gold at 3% opacity (same as `evaluation.html` hero `::before`)
- **Watermark:** `@fantasmafootball` on each slide — bottom-center, Outfit 14px, cream at 40% opacity
- **Logo:** `public/fantasma_logo_final.png` — top-right corner on slides 1-3 (48px wide, 60% opacity), centered above headline on slide 4 (80px wide)

## Typography Scale

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| Main headline | Bebas Neue | 82px | 400 | Cream `#F8F7F4` |
| Gold accent word | Bebas Neue | 82px | 400 | Gold `#C5B358` |
| Sub-headline | Outfit | 24px | 300 | Cream at 60% opacity |
| Body / lead text | Outfit | 22px | 400 | Cream at 85% opacity |
| List items | Bebas Neue | 36px | 400 | Cream `#F8F7F4` |
| Small text / credential | Outfit | 18px | 400 | Cream at 60% opacity |
| Watermark | Outfit | 14px | 400 | Cream at 40% opacity |

## Slides

### Slide 1 — Hook

**Purpose:** Stop the scroll. Hit a nerve every sports parent knows.

**Copy:**
- Main headline (Bebas Neue, 82px): `AFTER YOUR KID'S TRAINING SESSION, WHAT DO YOU GET?`
- Follow-up line (Outfit, 24px, cream at 60%): `A wave goodbye?`

**Design:**
- Dark navy `#040C14` background with grid texture overlay
- Headline dominates the frame, centered or left-aligned with generous padding (80px sides)
- Follow-up line directly beneath headline, creates contrast/tension
- Logo top-right (48px), watermark bottom-center

### Slide 2 — The Differentiator

**Purpose:** Reveal what Fantasma does differently. Make parents feel the gap.

**Copy:**
- Lead line (Outfit, 22px): `At Fantasma, every player gets a full written evaluation after their first session.`
- Section list (Bebas Neue, 36px) with gold left-border accents:
  - Strengths
  - Areas to Develop
  - Homework Drills
  - Personal Coach's Notes

**Design:**
- Dark navy background with grid texture
- Lead line at top with ~80px top padding
- 1px gold divider line below the lead text
- Vertical list below with 3px gold left-border on each item, 20px gap between items
- Clean whitespace — let the list breathe
- Logo top-right, watermark bottom-center

### Slide 3 — Report Glimpse

**Purpose:** Show the report is real and polished. The visual does the talking.

**Copy:**
- Small anchoring line (Outfit, 18px, cream at 60%): `From a D1 & semi-pro trained coach.`

**Design:**
- Dark navy background (no grid texture — keep clean behind the report)
- Recreate key sections of the evaluation report inline: hero header with "PLAYER EVALUATION" title, player info strip, and the top of the strengths section — enough to show structure and polish
- Apply CSS `transform: perspective(800px) rotateY(-8deg) rotateX(3deg)` and `filter: blur(1.5px)` so it reads as a real document but details aren't legible
- Scale the report mockup to ~70% of the slide width, centered
- Credential line centered below the report
- Logo top-right, watermark bottom-center

### Slide 4 — CTA

**Purpose:** Warm close. Invite them in without being pushy.

**Copy:**
- Headline (Bebas Neue, 82px): `SEE WHAT YOUR PLAYER IS REALLY CAPABLE OF.`
- Sub-line (Outfit, 22px): `Book a first session. Get your evaluation.`
- Contact (Outfit, 18px, cream at 50%): `DM us or visit fantasmafootball.com`

**Design:**
- Dark navy background with grid texture
- Centered layout
- Logo centered above headline (80px wide)
- Headline centered, gold accent on key word ("REALLY" or "CAPABLE")
- Sub-line and contact info below in muted cream
- 1px gold horizontal rule between sub-line and contact info
- Watermark bottom-center

## Implementation Notes

- Single HTML file: `social/post-evaluation.html` with 4 `.slide` divs stacked vertically
- Screenshot via existing `scripts/publish-post.cjs` pipeline at 1080x1080 per slide
- For slide 3, the report glimpse is rebuilt inline using HTML/CSS (not an image) — reproduce the evaluation hero, player strip, and top of strengths section from `evaluations/natalie.html`, then apply transform + blur
- Follow existing post workflow: screenshot → `public/` → push → post via Instagram Graph API
- Use unique output filenames per the no-overwrite feedback rule

## Caption (draft)

```
Most training sessions end with a wave goodbye.

At Fantasma, every player gets a full written evaluation after their first session — strengths, areas to develop, homework drills, and personal notes from a D1 & semi-pro trained coach.

Because your kid deserves more than just a workout. They deserve a plan.

Book your first session — link in bio or DM us.

#fantasmafootball #soccertraining #youthsoccer #pittsburghsoccer #playerdevelopment #soccercoach #elitetraining #soccerevaluation
```
