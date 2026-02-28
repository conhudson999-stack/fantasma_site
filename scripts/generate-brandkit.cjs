const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const DESKTOP = path.join(require('os').homedir(), 'OneDrive', 'Desktop');
const ASSETS = path.join(__dirname, '..', 'public');
const OUTPUT = path.join(DESKTOP, 'Fantasma-Brand-Kit.pdf');

// Brand colors
const NAVY = [4, 12, 20];
const GOLD = [197, 179, 88];
const CREAM = [248, 247, 244];
const BLACK = [10, 10, 10];
const WHITE = [255, 255, 255];

function createPDF() {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [1080, 1080], margin: 0 });
    const stream = fs.createWriteStream(OUTPUT);
    doc.pipe(stream);

    // Register fonts - use built-in for now
    const FONT_BOLD = 'Helvetica-Bold';
    const FONT_REG = 'Helvetica';
    const FONT_LIGHT = 'Helvetica';

    // ============ PAGE 1: COVER ============
    doc.rect(0, 0, 1080, 1080).fill(rgbStr(NAVY));

    // Corner marks
    drawCorners(doc, 60, 60, 1020, 1020, GOLD, 0.25);

    // Subtle radial glow (gold circle)
    doc.opacity(0.04);
    doc.circle(540, 440, 300).fill(rgbStr(GOLD));
    doc.opacity(1);

    // Label
    doc.font(FONT_REG).fontSize(14).fillColor(rgbStr(GOLD, 0.6));
    doc.text('BRAND IDENTITY', 0, 320, { align: 'center', characterSpacing: 6 });

    // Title
    doc.font(FONT_BOLD).fontSize(148).fillColor(rgbStr(WHITE));
    doc.text('FANTASMA', 0, 370, { align: 'center', characterSpacing: 4 });

    // Subtitle
    doc.font(FONT_BOLD).fontSize(72).fillColor(rgbStr(GOLD));
    doc.text('FOOTBALL', 0, 510, { align: 'center', characterSpacing: 12 });

    // Gold line
    doc.rect(500, 610, 80, 2).fill(rgbStr(GOLD));

    // Tagline
    doc.font(FONT_REG).fontSize(16).fillColor(rgbStr(WHITE, 0.45));
    doc.text('PITTSBURGH, PA', 0, 650, { align: 'center', characterSpacing: 3 });

    // Year
    doc.font(FONT_REG).fontSize(13).fillColor(rgbStr(WHITE, 0.2));
    doc.text('EST. 2025', 0, 990, { align: 'center', characterSpacing: 4 });

    // Logo
    try {
      const logoPath = path.join(ASSETS, 'fantasma_logo_final.png');
      if (fs.existsSync(logoPath)) {
        doc.opacity(0.15);
        doc.image(logoPath, 440, 720, { width: 200, align: 'center' });
        doc.opacity(1);
      }
    } catch(e) {}

    // ============ PAGE 2: MISSION ============
    doc.addPage({ size: [1080, 1080], margin: 0 });
    doc.rect(0, 0, 1080, 1080).fill(rgbStr(CREAM));

    doc.font(FONT_REG).fontSize(12).fillColor(rgbStr(BLACK, 0.3));
    doc.text('01 / MISSION', 80, 80, { characterSpacing: 4 });

    doc.font(FONT_BOLD).fontSize(64).fillColor(rgbStr(BLACK));
    doc.text('WHERE THE', 80, 140);
    doc.text('POETRY AND GRIT', 80, 210);
    doc.text('OF FOOTBALL', 80, 280);
    doc.font(FONT_BOLD).fontSize(64).fillColor(rgbStr(GOLD));
    doc.text('MEET.', 80, 350);

    doc.rect(80, 440, 48, 3).fill(rgbStr(GOLD));

    doc.font(FONT_REG).fontSize(18).fillColor(rgbStr(BLACK, 0.5));
    doc.text(
      'Personalized training that develops technically gifted, tactically intelligent, mentally tough athletes.',
      80, 480, { width: 600, lineGap: 10 }
    );

    doc.font(FONT_REG).fontSize(16).fillColor(rgbStr(BLACK, 0.35));
    doc.text(
      'You don\'t need to be the fastest, tallest, or most athletic. You need a willingness to learn, the ability to think through problems, and a relentless desire to get better every single day.',
      80, 570, { width: 600, lineGap: 8 }
    );

    // Wraith image
    try {
      const wraith = path.join(ASSETS, 'pitt_wraith.png');
      if (fs.existsSync(wraith)) {
        doc.image(wraith, 660, 600, { width: 360 });
      }
    } catch(e) {}

    // ============ PAGE 3: COLOR PALETTE ============
    doc.addPage({ size: [1080, 1080], margin: 0 });
    doc.rect(0, 0, 1080, 1080).fill(rgbStr(CREAM));

    doc.font(FONT_REG).fontSize(12).fillColor(rgbStr(BLACK, 0.3));
    doc.text('02 / COLOR', 80, 80, { characterSpacing: 4 });

    doc.font(FONT_BOLD).fontSize(64).fillColor(rgbStr(BLACK));
    doc.text('COLOR PALETTE', 80, 120);

    doc.rect(80, 200, 48, 3).fill(rgbStr(GOLD));

    // Color swatches
    const colors = [
      { name: 'Dark Navy', hex: '#040C14', rgb: NAVY, textColor: WHITE },
      { name: 'Vegas Gold', hex: '#C5B358', rgb: GOLD, textColor: NAVY },
      { name: 'Light Cream', hex: '#F8F7F4', rgb: CREAM, textColor: BLACK },
      { name: 'Rich Black', hex: '#0A0A0A', rgb: BLACK, textColor: WHITE },
    ];

    const swatchW = 440;
    const swatchH = 160;
    const gap = 24;

    colors.forEach((c, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 80 + col * (swatchW + gap);
      const y = 240 + row * (swatchH + 80 + gap);

      // Swatch
      doc.roundedRect(x, y, swatchW, swatchH, 12).fill(rgbStr(c.rgb));

      // Border for cream swatch
      if (c.name === 'Light Cream') {
        doc.roundedRect(x, y, swatchW, swatchH, 12)
          .strokeColor(rgbStr(BLACK, 0.1)).lineWidth(1).stroke();
      }

      // Info below
      doc.font(FONT_BOLD).fontSize(16).fillColor(rgbStr(BLACK));
      doc.text(c.name, x, y + swatchH + 16);
      doc.font(FONT_REG).fontSize(13).fillColor(rgbStr(BLACK, 0.4));
      doc.text(c.hex, x, y + swatchH + 38, { characterSpacing: 1 });
    });

    // Full palette bar at bottom
    const barY = 740;
    const barH = 100;
    doc.rect(80, barY, 230, barH).fill(rgbStr(NAVY));
    doc.rect(310, barY, 230, barH).fill(rgbStr(GOLD));
    doc.rect(540, barY, 230, barH).fill(rgbStr(CREAM));
    doc.roundedRect(540, barY, 230, barH, 0).strokeColor(rgbStr(BLACK, 0.08)).lineWidth(1).stroke();
    doc.rect(770, barY, 230, barH).fill(rgbStr(BLACK));

    // Round the whole bar
    doc.font(FONT_REG).fontSize(12).fillColor(rgbStr(BLACK, 0.3));
    doc.text('FULL PALETTE HARMONY', 80, barY + barH + 20, { characterSpacing: 2 });

    // Usage notes
    doc.font(FONT_REG).fontSize(14).fillColor(rgbStr(BLACK, 0.35));
    doc.text('Navy + Gold: Primary brand combination for headers, CTAs, and key visuals', 80, 900, { width: 900 });
    doc.text('Cream: Light backgrounds and content sections', 80, 925, { width: 900 });
    doc.text('Alternating dark/light sections create the editorial rhythm of the brand', 80, 950, { width: 900 });

    // ============ PAGE 4: TYPOGRAPHY ============
    doc.addPage({ size: [1080, 1080], margin: 0 });
    doc.rect(0, 0, 1080, 1080).fill(rgbStr(NAVY));

    doc.font(FONT_REG).fontSize(12).fillColor(rgbStr(WHITE, 0.25));
    doc.text('03 / TYPE', 80, 80, { characterSpacing: 4 });

    doc.font(FONT_BOLD).fontSize(64).fillColor(rgbStr(WHITE));
    doc.text('TYPOGRAPHY', 80, 120);

    doc.rect(80, 200, 48, 3).fill(rgbStr(GOLD));

    // Display font
    doc.font(FONT_REG).fontSize(12).fillColor(rgbStr(GOLD));
    doc.text('DISPLAY FONT', 80, 250, { characterSpacing: 4 });

    doc.font(FONT_BOLD).fontSize(100).fillColor(rgbStr(WHITE));
    doc.text('Bebas Neue', 80, 280);

    doc.font(FONT_REG).fontSize(14).fillColor(rgbStr(WHITE, 0.35));
    doc.text('Headlines  /  Titles  /  Hero Text  /  Brand Statements', 80, 395, { characterSpacing: 1 });

    doc.font(FONT_BOLD).fontSize(48).fillColor(rgbStr(WHITE, 0.15));
    doc.text('ABCDEFGHIJKLMNOPQRSTUVWXYZ', 80, 440);

    doc.font(FONT_BOLD).fontSize(48).fillColor(rgbStr(WHITE, 0.1));
    doc.text('0123456789', 80, 500);

    // Body font
    doc.font(FONT_REG).fontSize(12).fillColor(rgbStr(GOLD));
    doc.text('BODY FONT', 80, 590, { characterSpacing: 4 });

    doc.font(FONT_BOLD).fontSize(80).fillColor(rgbStr(WHITE));
    doc.text('Outfit', 80, 620);

    doc.font(FONT_REG).fontSize(14).fillColor(rgbStr(WHITE, 0.35));
    doc.text('Body Text  /  Navigation  /  Buttons  /  Descriptions', 80, 720, { characterSpacing: 1 });

    // Weight samples
    const weights = [
      { label: 'LIGHT (300)', font: FONT_REG },
      { label: 'REGULAR (400)', font: FONT_REG },
      { label: 'SEMIBOLD (600)', font: FONT_BOLD },
      { label: 'BOLD (800)', font: FONT_BOLD },
    ];

    weights.forEach((w, i) => {
      const y = 780 + i * 60;
      doc.font(FONT_REG).fontSize(11).fillColor(rgbStr(WHITE, 0.25));
      doc.text(w.label, 80, y + 8, { width: 120, characterSpacing: 2 });
      doc.font(w.font).fontSize(28).fillColor(rgbStr(WHITE, 0.6 + i * 0.12));
      doc.text('Where the poetry meets', 220, y);
    });

    // ============ PAGE 5: BRAND PILLARS ============
    doc.addPage({ size: [1080, 1080], margin: 0 });
    doc.rect(0, 0, 1080, 1080).fill(rgbStr(CREAM));

    doc.font(FONT_REG).fontSize(12).fillColor(rgbStr(BLACK, 0.3));
    doc.text('04 / FOUNDATION', 80, 80, { characterSpacing: 4 });

    doc.font(FONT_BOLD).fontSize(64).fillColor(rgbStr(BLACK));
    doc.text('BRAND PILLARS', 80, 120);

    doc.rect(80, 200, 48, 3).fill(rgbStr(GOLD));

    const pillars = [
      {
        num: '01',
        title: 'PASSION',
        desc: 'Deep, unconditional love for the game. Every session, every drill, every conversation is fueled by a passion that deserves to be pursued with everything.'
      },
      {
        num: '02',
        title: 'TACTICAL INTELLIGENCE',
        desc: 'Smart players solve problems. Read the game, see what others miss, and make every decision count. You don\'t need to be the fastest. You need to think.'
      },
      {
        num: '03',
        title: 'DESIRE',
        desc: 'Show up early. Stay late. Refuse to settle. The players who outwork everyone else are the ones who change the game. Relentless work ethic over raw talent.'
      }
    ];

    pillars.forEach((p, i) => {
      const y = 260 + i * 250;

      // Divider line
      if (i < 2) {
        doc.rect(80, y + 220, 920, 1).fill(rgbStr(BLACK, 0.06));
      }

      // Number
      doc.font(FONT_BOLD).fontSize(56).fillColor(rgbStr(GOLD));
      doc.text(p.num, 80, y);

      // Title
      doc.font(FONT_BOLD).fontSize(44).fillColor(rgbStr(BLACK));
      doc.text(p.title, 180, y + 4);

      // Description
      doc.font(FONT_REG).fontSize(16).fillColor(rgbStr(BLACK, 0.45));
      doc.text(p.desc, 180, y + 60, { width: 700, lineGap: 6 });
    });

    // ============ PAGE 6: BRAND VOICE ============
    doc.addPage({ size: [1080, 1080], margin: 0 });
    doc.rect(0, 0, 1080, 1080).fill(rgbStr(NAVY));

    // Decorative circles
    doc.opacity(0.05);
    doc.circle(540, 540, 300).strokeColor(rgbStr(GOLD)).lineWidth(1).stroke();
    doc.circle(540, 540, 200).strokeColor(rgbStr(GOLD)).lineWidth(1).stroke();
    doc.opacity(1);

    doc.font(FONT_REG).fontSize(12).fillColor(rgbStr(WHITE, 0.25));
    doc.text('05 / VOICE', 80, 80, { characterSpacing: 4 });

    // Main quote
    doc.font(FONT_BOLD).fontSize(84).fillColor(rgbStr(WHITE));
    doc.text('FEAR THE', 0, 330, { align: 'center', characterSpacing: 3 });
    doc.font(FONT_BOLD).fontSize(84).fillColor(rgbStr(GOLD));
    doc.text('PHANTOM.', 0, 415, { align: 'center', characterSpacing: 3 });
    doc.font(FONT_BOLD).fontSize(84).fillColor(rgbStr(WHITE));
    doc.text('TRAIN', 0, 510, { align: 'center', characterSpacing: 3 });
    doc.font(FONT_BOLD).fontSize(84).fillColor(rgbStr(GOLD));
    doc.text('FANTASMA.', 0, 595, { align: 'center', characterSpacing: 3 });

    // Divider
    doc.rect(516, 710, 48, 2).fill(rgbStr(GOLD));

    // Sub
    doc.font(FONT_REG).fontSize(16).fillColor(rgbStr(WHITE, 0.4));
    doc.text('Where the poetry and grit of football meet.', 0, 740, { align: 'center', characterSpacing: 1 });
    doc.text('Bold. Editorial. Confident.', 0, 770, { align: 'center', characterSpacing: 1 });

    // Tone tags
    doc.font(FONT_REG).fontSize(11).fillColor(rgbStr(WHITE, 0.2));
    doc.text('BRAND TONE  /  ASPIRATIONAL  /  ATHLETIC  /  POETIC', 0, 960, { align: 'center', characterSpacing: 4 });

    // ============ PAGE 7: DESIGN SYSTEM ============
    doc.addPage({ size: [1080, 1080], margin: 0 });
    doc.rect(0, 0, 1080, 1080).fill(rgbStr(CREAM));

    doc.font(FONT_REG).fontSize(12).fillColor(rgbStr(BLACK, 0.3));
    doc.text('06 / SYSTEM', 80, 80, { characterSpacing: 4 });

    doc.font(FONT_BOLD).fontSize(64).fillColor(rgbStr(BLACK));
    doc.text('DESIGN SYSTEM', 80, 120);

    doc.rect(80, 200, 48, 3).fill(rgbStr(GOLD));

    // Buttons section
    doc.font(FONT_REG).fontSize(11).fillColor(rgbStr(BLACK, 0.3));
    doc.text('BUTTONS', 80, 250, { characterSpacing: 3 });

    // Dark button
    doc.roundedRect(80, 280, 200, 48, 24).fill(rgbStr(BLACK));
    doc.font(FONT_BOLD).fontSize(13).fillColor(rgbStr(WHITE));
    doc.text('Book a Session', 80, 296, { width: 200, align: 'center' });

    // Outline button
    doc.roundedRect(300, 280, 180, 48, 24).strokeColor(rgbStr(BLACK)).lineWidth(1.5).stroke();
    doc.font(FONT_BOLD).fontSize(13).fillColor(rgbStr(BLACK));
    doc.text('Learn More', 300, 296, { width: 180, align: 'center' });

    // Gold button
    doc.roundedRect(500, 280, 180, 48, 24).fill(rgbStr(GOLD));
    doc.font(FONT_BOLD).fontSize(13).fillColor(rgbStr(NAVY));
    doc.text('Get Started', 500, 296, { width: 180, align: 'center' });

    // Border radius section
    doc.font(FONT_REG).fontSize(11).fillColor(rgbStr(BLACK, 0.3));
    doc.text('BORDER RADIUS', 80, 380, { characterSpacing: 3 });

    const radii = [
      { r: 0, label: '0px' },
      { r: 12, label: '12px' },
      { r: 20, label: '20px' },
      { r: 35, label: 'Pill' },
    ];

    radii.forEach((item, i) => {
      const x = 80 + i * 100;
      doc.roundedRect(x, 415, 70, 70, item.r).fill(rgbStr(GOLD));
      doc.font(FONT_REG).fontSize(12).fillColor(rgbStr(BLACK, 0.35));
      doc.text(item.label, x, 500, { width: 70, align: 'center' });
    });

    // Accent details
    doc.font(FONT_REG).fontSize(11).fillColor(rgbStr(BLACK, 0.3));
    doc.text('ACCENT DETAILS', 80, 560, { characterSpacing: 3 });

    // Gold vertical bar
    doc.rect(80, 600, 4, 36).fill(rgbStr(GOLD));
    doc.font(FONT_REG).fontSize(14).fillColor(rgbStr(BLACK, 0.4));
    doc.text('Vertical gold markers', 100, 610);

    // Gradient line
    for (let i = 0; i < 200; i++) {
      const opacity = 1 - (i / 200);
      doc.rect(80 + i, 670, 1, 2).fill(rgbStr(GOLD, opacity));
    }
    doc.font(FONT_REG).fontSize(14).fillColor(rgbStr(BLACK, 0.4));
    doc.text('Gradient line separators', 100, 690);

    // Spacing
    doc.font(FONT_REG).fontSize(11).fillColor(rgbStr(BLACK, 0.3));
    doc.text('SPACING & LAYOUT', 80, 750, { characterSpacing: 3 });

    const spacings = [
      { label: 'Max Width', value: '1280px' },
      { label: 'Section Padding', value: '140px' },
      { label: 'Container Padding', value: '32px' },
    ];

    spacings.forEach((s, i) => {
      const y = 790 + i * 50;
      doc.font(FONT_BOLD).fontSize(16).fillColor(rgbStr(BLACK));
      doc.text(s.value, 80, y);
      doc.font(FONT_REG).fontSize(14).fillColor(rgbStr(BLACK, 0.35));
      doc.text(s.label, 220, y + 2);
    });

    // Transition
    doc.font(FONT_REG).fontSize(11).fillColor(rgbStr(BLACK, 0.3));
    doc.text('MOTION', 550, 560, { characterSpacing: 3 });

    doc.font(FONT_BOLD).fontSize(16).fillColor(rgbStr(BLACK));
    doc.text('0.3s cubic-bezier(0.4, 0, 0.2, 1)', 550, 600);
    doc.font(FONT_REG).fontSize(14).fillColor(rgbStr(BLACK, 0.35));
    doc.text('Standard transition', 550, 625);

    doc.font(FONT_BOLD).fontSize(16).fillColor(rgbStr(BLACK));
    doc.text('0.7 - 0.9s ease', 550, 670);
    doc.font(FONT_REG).fontSize(14).fillColor(rgbStr(BLACK, 0.35));
    doc.text('Scroll reveal animations', 550, 695);

    // Grain note
    doc.font(FONT_REG).fontSize(14).fillColor(rgbStr(BLACK, 0.35));
    doc.text('Subtle noise grain texture overlay across entire page for tactile depth', 550, 790, { width: 400, lineGap: 4 });

    // ============ PAGE 8: SOCIAL & CONTACT ============
    doc.addPage({ size: [1080, 1080], margin: 0 });
    doc.rect(0, 0, 1080, 1080).fill(rgbStr(NAVY));

    drawCorners(doc, 60, 60, 1020, 1020, GOLD, 0.15);

    doc.font(FONT_BOLD).fontSize(100).fillColor(rgbStr(WHITE));
    doc.text('FEAR THE', 0, 280, { align: 'center', characterSpacing: 4 });
    doc.text('PHANTOM.', 0, 380, { align: 'center', characterSpacing: 4 });

    doc.font(FONT_BOLD).fontSize(100).fillColor(rgbStr(GOLD));
    doc.text('TRAIN', 0, 500, { align: 'center', characterSpacing: 4 });
    doc.text('FANTASMA.', 0, 600, { align: 'center', characterSpacing: 4 });

    doc.rect(516, 730, 48, 2).fill(rgbStr(GOLD, 0.4));

    const socials = [
      '@fantasmafootball',
      '@fantasmafooty',
    ];

    socials.forEach((s, i) => {
      doc.font(FONT_REG).fontSize(15).fillColor(rgbStr(WHITE, 0.35));
      doc.text(s, 0, 770 + i * 30, { align: 'center', characterSpacing: 2 });
    });

    doc.font(FONT_REG).fontSize(13).fillColor(rgbStr(GOLD, 0.5));
    doc.text('FANTASMAFOOTBALL.COM', 0, 860, { align: 'center', characterSpacing: 3 });

    doc.font(FONT_REG).fontSize(11).fillColor(rgbStr(WHITE, 0.15));
    doc.text('PITTSBURGH, PA', 0, 980, { align: 'center', characterSpacing: 4 });

    // Finalize
    doc.end();
    stream.on('finish', () => resolve(OUTPUT));
    stream.on('error', reject);
  });
}

function drawCorners(doc, x1, y1, x2, y2, color, opacity) {
  const len = 40;
  doc.opacity(opacity);
  doc.strokeColor(rgbStr(color)).lineWidth(1);
  // TL
  doc.moveTo(x1, y1 + len).lineTo(x1, y1).lineTo(x1 + len, y1).stroke();
  // TR
  doc.moveTo(x2 - len, y1).lineTo(x2, y1).lineTo(x2, y1 + len).stroke();
  // BL
  doc.moveTo(x1, y2 - len).lineTo(x1, y2).lineTo(x1 + len, y2).stroke();
  // BR
  doc.moveTo(x2 - len, y2).lineTo(x2, y2).lineTo(x2, y2 - len).stroke();
  doc.opacity(1);
}

function rgbStr(rgb, opacity) {
  if (opacity !== undefined && opacity < 1) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
  }
  // PDFKit uses RGB arrays for fill
  return rgb;
}

async function emailPDF(filePath) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
  });

  await transporter.sendMail({
    from: GMAIL_USER,
    to: GMAIL_USER,
    subject: 'Fantasma Football - Brand Kit',
    text: 'Your Fantasma Football brand kit is attached. 8 pages covering mission, colors, typography, pillars, voice, and design system.',
    attachments: [{ filename: 'Fantasma-Brand-Kit.pdf', path: filePath }]
  });
}

(async () => {
  try {
    console.log('Generating brand kit PDF...');
    const file = await createPDF();
    console.log('PDF saved to Desktop.');

    console.log('Sending email...');
    await emailPDF(file);
    console.log('Email sent to ' + GMAIL_USER);
    console.log('\nDone!');
  } catch (err) {
    console.error('Error:', err);
  }
})();
