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
- **Pipeline:** Single HTML file per slide, Puppeteer screenshot to PNG
- **Palette:** Navy `#040C14`, Gold `#C5B358`, Cream `#F8F7F4`
- **Fonts:** Bebas Neue (headlines), Outfit (body/subtext)
- **Texture:** Subtle grain overlay on dark slides
- **Watermark:** `@fantasmafootball` on each slide

## Slides

### Slide 1 — Hook

**Purpose:** Stop the scroll. Hit a nerve every sports parent knows.

**Copy:**
- Main headline (Bebas Neue, large): `AFTER YOUR KID'S TRAINING SESSION, WHAT DO YOU GET?`
- Follow-up line (Outfit, smaller, muted): `A wave goodbye?`

**Design:**
- Dark navy background with subtle grid texture (matching evaluation report hero)
- Big editorial typography — headline dominates the frame
- Follow-up line creates contrast/tension beneath the headline
- Fantasma logo small in corner, watermark bottom

### Slide 2 — The Differentiator

**Purpose:** Reveal what Fantasma does differently. Make parents feel the gap.

**Copy:**
- Lead line (Outfit, medium): `At Fantasma, every player gets a full written evaluation after their first session.`
- Section list with gold accents:
  - Strengths
  - Areas to Develop
  - Homework Drills
  - Personal Coach's Notes

**Design:**
- Dark navy background
- Lead line at top, clean and readable
- Vertical list below with gold bullet/line accents, each item in Bebas Neue
- Subtle gold divider between lead line and list
- Clean whitespace — let the list breathe

### Slide 3 — Report Glimpse

**Purpose:** Show the report is real and polished. The visual does the talking.

**Copy:**
- Small anchoring line (Outfit): `From a D1 & semi-pro trained coach.`

**Design:**
- Dark navy background
- Angled/tilted rendering of the actual Natalie evaluation report
- Report is slightly blurred or scaled so it's not fully readable — shows structure, sections, gold accents, professionalism
- The credential line sits below or above the report image
- This slide is primarily visual — the report preview is the hero element

### Slide 4 — CTA

**Purpose:** Warm close. Invite them in without being pushy.

**Copy:**
- Headline (Bebas Neue): `SEE WHAT YOUR PLAYER IS REALLY CAPABLE OF.`
- Sub-line (Outfit): `Book a first session. Get your evaluation.`
- Contact: `DM us or visit fantasmafootball.com`

**Design:**
- Dark navy background
- Centered layout, headline dominant
- Fantasma logo above the headline
- Contact info / booking prompt below in muted cream
- Gold accent line or border element to frame the CTA

## Implementation Notes

- Each slide is a self-contained HTML file in `social/` (e.g., `social/post-evaluation-s1.html` through `s4`)
- Screenshot via Puppeteer script at 1080x1080
- For slide 3, the report glimpse can be achieved with a CSS transform (rotate + scale) and a slight blur filter applied to an embedded version of the report's key sections
- Follow existing post workflow: screenshot → `public/` → push → post via Instagram Graph API
- Use unique filenames per the no-overwrite feedback rule

## Caption (draft)

```
Most training sessions end with a wave goodbye.

At Fantasma, every player gets a full written evaluation after their first session — strengths, areas to develop, homework drills, and personal notes from a D1 & semi-pro trained coach.

Because your kid deserves more than just a workout. They deserve a plan.

Book your first session — link in bio or DM us.

#fantasmafootball #soccertraining #youthsoccer #pittsburghsoccer #playerevelopment #soccercoach #elitetraining #soccerevaluation
```
