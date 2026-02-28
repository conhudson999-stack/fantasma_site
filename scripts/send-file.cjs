const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const file = process.argv[2];
if (!file) { console.log('Usage: node send-file.cjs <filename>'); process.exit(1); }

(async () => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
  });

  const filePath = path.resolve(file);
  const fileName = path.basename(filePath);

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: `Fantasma Football - ${fileName}`,
    text: `Attached: ${fileName}`,
    attachments: [{ filename: fileName, path: filePath }]
  });

  console.log(`Sent ${fileName}!`);
})();
