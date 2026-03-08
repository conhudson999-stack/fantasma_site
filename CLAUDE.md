# Fantasma Football — Claude Code Context

## Project
Elite soccer training business, Pittsburgh PA. Owner: Connor Hudson.
Live site: https://fantasmafootball.com
Vercel dashboard: https://vercel.com/connor-hudsons-projects/fantasma-site
Instagram: @fantasmafootball

## Tech Stack
- Vite 7.x (vanilla HTML/CSS/JS, no framework)
- Vercel (static + serverless functions in `api/`)
- Google Calendar API (booking system)
- Nodemailer + Gmail SMTP (confirmation emails)
- Puppeteer (screenshot social posts to 1080×1080 PNG)
- Instagram Graph API v21.0 (posting)

## Deployment
Push to GitHub triggers Vercel auto-deploy. If changes aren't live after ~2 min, run:
```
npx vercel --prod
```
Remote may have newer commits — always `git fetch origin main && git rebase origin/main` before pushing.

## Brand
| Token | Value |
|-------|-------|
| Dark Navy | `#040C14` |
| Vegas Gold | `#C5B358` |
| Light Cream | `#F8F7F4` |
| Display font | Bebas Neue |
| Body font | Outfit |
| Tagline | "Fear the Phantom. Train Fantasma." |

Design philosophy: ultra-bold editorial typography, high contrast, navy/gold/cream, grain texture, no frameworks.

## Key Files
- `src/style.css` — all styles
- `src/main.js` — index page logic
- `src/shared.js` — nav/scroll/ghost mode (shared across pages)
- `api/availability.js` — GET time slots (1hr increments, Mon–Fri 3–8pm, Sat 9am–2pm)
- `api/book.js` — POST booking (Google Calendar + confirmation email)
- `api/contact.js` — POST contact form (confirmation email + SMS + coach notification)
- `social/daily-template.html` — Instagram post template (layouts: quote/stat/tip/cta/callout)
- `social/brand-portfolio.html` — Brand design reference (always check before designing posts)
- `scripts/publish-post.cjs` — Screenshot → Instagram pipeline

## Instagram Image Hosting Rule
**Instagram's API blocks ImgBB and wsrv.nl URLs.** To post an image:
1. Copy PNG to `public/your-image.png`
2. Push + wait ~90s for Vercel to deploy
3. Use `https://fantasmafootball.com/your-image.png` as the `image_url`

## Email Architecture
All three notifications (customer, coach, SMS) use separate try/catch blocks.
Customer confirmation **always sends first** and is the only one that can fail the request.
Coach + SMS fail silently.

## Env Vars
`.env.local` lives in the main repo root only (not in worktrees).
In scripts, load it with:
```js
const envPath = fs.existsSync(path.join(__dirname, '..', '.env.local'))
  ? path.join(__dirname, '..', '.env.local')
  : path.join(__dirname, '..', '..', '..', '..', '.env.local');
```

## Social Post Workflow
1. Design content (use layouts: `quote`, `stat`, `tip`, `cta`, `callout`)
2. Write template into `social/daily-template.html` via Puppeteer script
3. Screenshot 1080×1080 PNG → `posts/`
4. Copy PNG to `public/` → push → wait for deploy
5. Post via Instagram Graph API using fantasmafootball.com URL
6. Email preview to conhudbusiness@gmail.com before posting

## Booking System
- 1-on-1: 60 min sessions, $50/session
- Small group: 90 min sessions, $40/player/session
- Available: Mon–Fri 3–8pm, Sat 9am–2pm, Sun closed

## Contact
- Email: conhudbusiness@gmail.com
- Phone/SMS: 412-737-2858 → `4127372858@vtext.com`
