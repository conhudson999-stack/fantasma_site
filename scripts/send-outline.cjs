const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

(async () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: 'Fantasma Football - Project Outline',
    text: fs.readFileSync(path.join(__dirname, '..', 'docs', 'project_outline.md'), 'utf-8'),
    attachments: [{ filename: 'project_outline.md', path: path.join(__dirname, '..', 'docs', 'project_outline.md') }]
  });

  console.log('Sent!');
})();
