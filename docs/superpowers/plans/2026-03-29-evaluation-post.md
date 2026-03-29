# Player Evaluation Carousel Post — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-slide Instagram carousel post showcasing Fantasma's player evaluation reports, positioning them as something no other coach provides.

**Architecture:** Single HTML file (`social/post-evaluation.html`) with 4 `.slide` divs (1080x1080px each). Screenshotted via existing `publish-post.cjs` pipeline. Slide 3 recreates key sections of the evaluation report inline with CSS transform + blur.

**Tech Stack:** HTML/CSS, Puppeteer (via `scripts/publish-post.cjs`), Google Fonts (Bebas Neue, Outfit)

**Spec:** `docs/superpowers/specs/2026-03-29-evaluation-post-design.md`

---

## Chunk 1: Build All 4 Slides

### Task 1: Create HTML file with shared styles and Slide 1 (Hook)

**Files:**
- Create: `social/post-evaluation.html`

- [ ] **Step 1: Create the HTML file with head, shared styles, and Slide 1**

Create `social/post-evaluation.html` with:
- `<meta name="viewport" content="width=1080">`
- Google Fonts import: Bebas Neue + Outfit (weights 300, 400, 500, 600, 700, 800)
- CSS variables: `--navy: #040C14`, `--gold: #C5B358`, `--cream: #F8F7F4`, `--navy-light: #0a1928`
- Base styles: `* { margin: 0; padding: 0; box-sizing: border-box; }`, body with `background: #1a1a1a`, flex column layout, `gap: 40px`, `padding: 40px 0`
- `.slide` base: `width: 1080px; height: 1080px; position: relative; overflow: hidden; background: var(--navy);`
- Grid texture via `::before` pseudo-element: two linear gradients at `rgba(197,179,88,0.03)` with `background-size: 40px 40px`, absolutely positioned, full coverage
- Watermark style: `.watermark` — absolute positioned, `bottom: 32px`, centered, Outfit 14px, `color: rgba(248,247,244,0.4)`
- Logo style: `.logo-corner` — absolute positioned, `top: 40px; right: 40px; width: 48px; opacity: 0.6`

Slide 1 markup:
```html
<div class="slide slide-hook">
  <!-- grid texture via ::before -->
  <img src="../public/fantasma_logo_final.png" alt="" class="logo-corner" />
  <div class="hook-content">
    <h1 class="hook-headline">AFTER YOUR KID'S<br>TRAINING SESSION,<br>WHAT DO YOU <span class="gold">GET?</span></h1>
    <p class="hook-sub">A wave goodbye?</p>
  </div>
  <div class="watermark">@fantasmafootball</div>
</div>
```

Slide 1 styles:
- `.hook-content`: absolute, centered vertically, `left: 80px; right: 80px;`
- `.hook-headline`: Bebas Neue, `font-size: 82px`, `letter-spacing: 0.03em`, `line-height: 0.95`, `color: var(--cream)`
- `.gold`: `color: var(--gold)`
- `.hook-sub`: Outfit, `font-size: 24px`, `font-weight: 300`, `color: rgba(248,247,244,0.6)`, `margin-top: 20px`

**Layout note:** Slide 1 headline is left-aligned (not centered) for editorial impact.

- [ ] **Step 2: Open in browser and visually verify Slide 1**

Open `social/post-evaluation.html` in a browser. Verify:
- Slide is 1080x1080, dark navy with subtle grid texture
- Headline is large, readable, gold accent on "GET?"
- "A wave goodbye?" sits below in muted text
- Logo top-right, watermark bottom-center

- [ ] **Step 3: Commit**

```bash
git add social/post-evaluation.html
git commit -m "add evaluation carousel slide 1: hook"
```

---

### Task 2: Add Slide 2 (The Differentiator)

**Files:**
- Modify: `social/post-evaluation.html`

- [ ] **Step 1: Add Slide 2 styles and markup**

Add to the `<style>` block:
- `.slide-diff .lead-text`: Outfit, `font-size: 22px`, `font-weight: 400`, `color: rgba(248,247,244,0.85)`, `line-height: 1.6`, `max-width: 800px`
- `.slide-diff .divider`: `height: 1px`, `background: linear-gradient(90deg, var(--gold), rgba(197,179,88,0.1))`, `margin: 32px 0`, `max-width: 600px`
- `.eval-list`: flex column, `gap: 20px`
- `.eval-list-item`: `display: flex; align-items: center; gap: 20px;`, `border-left: 3px solid var(--gold); padding-left: 20px;`
- `.eval-list-item span`: Bebas Neue, `font-size: 36px`, `letter-spacing: 1px`, `color: var(--cream)`

Add after Slide 1:
```html
<div class="slide slide-diff">
  <img src="../public/fantasma_logo_final.png" alt="" class="logo-corner" />
  <div class="diff-content">
    <p class="lead-text">At Fantasma, every player gets a full written evaluation after their first session.</p>
    <div class="divider"></div>
    <div class="eval-list">
      <div class="eval-list-item"><span>STRENGTHS</span></div>
      <div class="eval-list-item"><span>AREAS TO DEVELOP</span></div>
      <div class="eval-list-item"><span>HOMEWORK DRILLS</span></div>
      <div class="eval-list-item"><span>PERSONAL COACH'S NOTES</span></div>
    </div>
  </div>
  <div class="watermark">@fantasmafootball</div>
</div>
```

- `.diff-content`: absolute, `top: 80px; left: 80px; right: 80px;` (anchored near top per spec, not vertically centered)

- [ ] **Step 2: Open in browser and verify Slide 2**

Verify:
- Lead text is readable and warm
- Gold divider separates text from list
- List items have gold left-border, clean spacing
- Overall layout has good whitespace

- [ ] **Step 3: Commit**

```bash
git add social/post-evaluation.html
git commit -m "add evaluation carousel slide 2: differentiator"
```

---

### Task 3: Add Slide 3 (Report Glimpse)

**Files:**
- Modify: `social/post-evaluation.html`
- Reference: `evaluations/natalie.html` (for report structure to recreate)

- [ ] **Step 1: Add Slide 3 styles and markup**

This slide recreates key sections of the evaluation report inline, then applies transform + blur to make it look like a real document preview.

Add to `<style>`:
- `.slide-report::before`: `display: none;` (suppress grid texture on this slide — the `.slide::before` rule applies globally, this overrides it)
- `.report-frame`: the container for the mini-report. Styles: `width: 680px`, `background: var(--navy)`, `border: 1px solid rgba(197,179,88,0.15)`, `border-radius: 8px`, `overflow: hidden`, `transform: perspective(800px) rotateY(-8deg) rotateX(3deg)`, `filter: blur(1.5px)`, `box-shadow: 0 20px 60px rgba(0,0,0,0.5)`, centered in slide
- Inside `.report-frame`, recreate (simplified, not full content):
  - A mini hero bar: navy background, gold bottom border, "PLAYER EVALUATION" in Bebas Neue ~28px, Fantasma logo small
  - A mini player strip: navy-light background, grid showing "Player: NATALIE", "Date: 03/27/2026", "Age: 8", "Session: 1-on-1"
  - A mini strengths section header: "01" + "WHAT YOU DO GREAT." in Bebas Neue ~20px
  - 2 mini strength cards with green left-border, small placeholder text
- `.credential-line`: Outfit, `font-size: 18px`, `font-weight: 400`, `color: rgba(248,247,244,0.5)`, centered below the report frame, `margin-top: 32px`

Markup:
```html
<div class="slide slide-report">
  <img src="../public/fantasma_logo_final.png" alt="" class="logo-corner" />
  <div class="report-wrapper">
    <div class="report-frame">
      <!-- Mini hero -->
      <div class="mini-hero">
        <div class="mini-hero-tag">FIRST SESSION REPORT</div>
        <div class="mini-hero-title">PLAYER<br><span class="gold">EVALUATION.</span></div>
      </div>
      <!-- Mini player strip -->
      <div class="mini-strip">
        <div class="mini-field"><div class="mini-label">PLAYER</div><div class="mini-value mini-name">NATALIE</div></div>
        <div class="mini-field"><div class="mini-label">DATE</div><div class="mini-value">03/27/2026</div></div>
        <div class="mini-field"><div class="mini-label">AGE</div><div class="mini-value">8</div></div>
        <div class="mini-field"><div class="mini-label">SESSION</div><div class="mini-value">1-on-1</div></div>
      </div>
      <!-- Mini strengths header -->
      <div class="mini-section">
        <span class="mini-num">01</span>
        <span class="mini-section-title">WHAT YOU DO <span class="gold">GREAT.</span></span>
      </div>
      <!-- Mini strength cards -->
      <div class="mini-cards">
        <div class="mini-card">
          <div class="mini-card-title">CONFIDENCE & FEARLESSNESS</div>
          <div class="mini-card-text"></div>
        </div>
        <div class="mini-card">
          <div class="mini-card-title">NATURAL SPEED</div>
          <div class="mini-card-text"></div>
        </div>
      </div>
    </div>
    <p class="credential-line">From a D1 & semi-pro trained coach.</p>
  </div>
  <div class="watermark">@fantasmafootball</div>
</div>
```

Style the mini-report internals:
- `.mini-hero`: `padding: 24px 20px 16px`, `border-bottom: 2px solid var(--gold)`, `background: var(--navy)`
- `.mini-hero-tag`: `font-size: 8px`, `letter-spacing: 3px`, `color: var(--gold)`, `font-weight: 600`
- `.mini-hero-title`: Bebas Neue, `font-size: 32px`, `line-height: 0.9`, `color: var(--cream)`
- `.mini-strip`: `display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;`, `padding: 16px 20px`, `background: var(--navy-light)`, `border-bottom: 1px solid rgba(197,179,88,0.1)`
- `.mini-label`: `font-size: 7px`, `letter-spacing: 2px`, `color: var(--gold)`, `font-weight: 600`
- `.mini-value`: `font-size: 11px`, `color: var(--cream)`, `font-weight: 500`
- `.mini-name`: Bebas Neue, `font-size: 16px`
- `.mini-section`: `padding: 16px 20px 8px`, `display: flex; align-items: baseline; gap: 8px;`
- `.mini-num`: Bebas Neue, `font-size: 24px`, `color: rgba(197,179,88,0.15)`
- `.mini-section-title`: Bebas Neue, `font-size: 18px`, `color: var(--cream)`
- `.mini-cards`: `padding: 0 20px 20px`, `display: flex; flex-direction: column; gap: 8px;`
- `.mini-card`: `background: rgba(74, 222, 128, 0.04)`, `border: 1px solid rgba(74, 222, 128, 0.12)`, `border-left: 3px solid #4ade80`, `border-radius: 6px`, `padding: 12px 14px`
- `.mini-card-title`: Bebas Neue, `font-size: 12px`, `color: var(--cream)`, `letter-spacing: 0.5px`
- `.mini-card-text`: `height: 24px`, `background: rgba(248,247,244,0.04)`, `border-radius: 3px`, `margin-top: 6px` (placeholder for blurred text)
- `.report-wrapper`: `position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;`

- [ ] **Step 2: Open in browser and verify Slide 3**

Verify:
- Report frame is angled/tilted with perspective transform
- Content is blurred — you can see structure but can't read details
- The mini-report looks like the real evaluation (hero, player strip, strengths)
- Credential line is visible below
- Good shadow/depth effect

- [ ] **Step 3: Commit**

```bash
git add social/post-evaluation.html
git commit -m "add evaluation carousel slide 3: report glimpse"
```

---

### Task 4: Add Slide 4 (CTA)

**Files:**
- Modify: `social/post-evaluation.html`

- [ ] **Step 1: Add Slide 4 styles and markup**

Add to `<style>`:
- `.slide-cta .cta-content`: absolute, centered both ways, `text-align: center`, `width: 800px`
- `.logo-center`: `width: 80px; margin: 0 auto 40px; display: block; opacity: 0.9;`
- `.cta-headline`: Bebas Neue, `font-size: 82px`, `line-height: 0.95`, `letter-spacing: 0.03em`, `color: var(--cream)`
- `.cta-sub`: Outfit, `font-size: 22px`, `font-weight: 400`, `color: rgba(248,247,244,0.85)`, `margin-top: 24px`
- `.cta-divider`: `height: 1px`, `background: var(--gold)`, `width: 80px`, `margin: 24px auto`
- `.cta-contact`: Outfit, `font-size: 18px`, `font-weight: 400`, `color: rgba(248,247,244,0.5)`

Markup:
```html
<div class="slide slide-cta">
  <div class="cta-content">
    <img src="../public/fantasma_logo_final.png" alt="" class="logo-center" />
    <h2 class="cta-headline">SEE WHAT YOUR<br>PLAYER IS <span class="gold">REALLY</span><br>CAPABLE OF.</h2>
    <p class="cta-sub">Book a first session. Get your evaluation.</p>
    <div class="cta-divider"></div>
    <p class="cta-contact">DM us or visit fantasmafootball.com</p>
  </div>
  <div class="watermark">@fantasmafootball</div>
</div>
```

- [ ] **Step 2: Open in browser and verify Slide 4**

Verify:
- Centered layout with logo above headline
- "REALLY" is gold accent
- Sub-line and contact info are readable but muted
- Gold divider between sub-line and contact

- [ ] **Step 3: Commit**

```bash
git add social/post-evaluation.html
git commit -m "add evaluation carousel slide 4: CTA"
```

---

## Chunk 2: Polish and Screenshot

### Task 5: Visual QA and Polish

**Files:**
- Modify: `social/post-evaluation.html`

- [ ] **Step 1: Open full file in browser, review all 4 slides together**

Check:
- Consistent spacing, font sizes, and colors across all slides
- Grid texture visible but subtle on slides 1, 2, 4
- Slide 3 report glimpse is convincing — looks like a real document
- All watermarks and logos are consistent
- No text overflow or clipping issues

- [ ] **Step 2: Fix any visual issues found**

Adjust spacing, font sizes, colors as needed based on review.

- [ ] **Step 3: Commit any fixes**

```bash
git add social/post-evaluation.html
git commit -m "polish evaluation carousel: visual QA fixes"
```

---

### Task 6: Screenshot and Preview

**Files:**
- Reference: `scripts/publish-post.cjs`
- Output: `posts/post-screenshot-1.png` through `post-screenshot-4.png`

- [ ] **Step 1: Run Puppeteer screenshot**

```bash
node scripts/publish-post.cjs --html social/post-evaluation.html --dry-run
```

Expected: 4 screenshots saved to `posts/` directory, no upload attempted.

- [ ] **Step 2: Review screenshots**

Open the 4 PNGs and verify they match the browser preview. Check:
- 1080x1080 dimensions
- No rendering differences vs browser
- Text is crisp, no antialiasing issues
- Report blur on slide 3 renders correctly in PNG

- [ ] **Step 3: Rename screenshots to unique filenames**

The pipeline outputs to `posts/post-screenshot-{n}.png` (overwrites each run). Copy to unique names:
```bash
cp posts/post-screenshot-1.png posts/evaluation-carousel-1.png
cp posts/post-screenshot-2.png posts/evaluation-carousel-2.png
cp posts/post-screenshot-3.png posts/evaluation-carousel-3.png
cp posts/post-screenshot-4.png posts/evaluation-carousel-4.png
```

- [ ] **Step 4: Commit screenshots**

```bash
git add posts/evaluation-carousel-*.png
git commit -m "add evaluation carousel screenshots"
```

---

### Task 7: Post to Instagram

**Caption:**
```
Most training sessions end with a wave goodbye.

At Fantasma, every player gets a full written evaluation after their first session — strengths, areas to develop, homework drills, and personal notes from a D1 & semi-pro trained coach.

Because your kid deserves more than just a workout. They deserve a plan.

Book your first session — link in bio or DM us.

#fantasmafootball #soccertraining #youthsoccer #pittsburghsoccer #playerdevelopment #soccercoach #elitetraining #soccerevaluation
```

- [ ] **Step 1: Copy PNGs to public/ and push for Vercel deploy**

```bash
cp posts/evaluation-carousel-*.png public/
git add public/evaluation-carousel-*.png
git commit -m "add evaluation carousel images for Instagram hosting"
git push
```

Wait ~90 seconds for Vercel to deploy.

- [ ] **Step 2: Post via publish-post.cjs or manual Instagram Graph API**

Use `fantasmafootball.com/evaluation-carousel-{n}.png` URLs for the carousel images. Post with the caption above.
