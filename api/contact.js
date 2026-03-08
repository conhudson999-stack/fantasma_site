// Vercel Serverless Function — /api/contact
// Receives contact form submissions, sends confirmation to customer + notification to coach

import nodemailer from 'nodemailer'

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

function confirmationHTML(name) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#040C14;border-top:4px solid #C5B358">

    <!-- Header -->
    <div style="padding:40px 32px 24px;text-align:center;border-bottom:1px solid rgba(197,179,88,0.15)">
      <div style="font-size:11px;letter-spacing:6px;color:#C5B358;margin-bottom:8px">FANTASMA</div>
      <div style="font-size:24px;letter-spacing:3px;color:#F8F7F4;font-weight:700">FOOTBALL</div>
    </div>

    <!-- Body -->
    <div style="padding:40px 32px">
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:16px">MESSAGE RECEIVED</div>
      <div style="font-size:22px;color:#F8F7F4;font-weight:700;line-height:1.3;margin-bottom:16px">
        Thanks, ${name}.
      </div>
      <div style="width:50px;height:3px;background:#C5B358;margin-bottom:24px"></div>
      <div style="font-size:15px;color:rgba(248,247,244,0.65);line-height:1.7">
        We received your message and will get back to you within <strong style="color:#F8F7F4">24 hours</strong>.
        If you need immediate assistance, feel free to call or text us directly.
      </div>
    </div>

    <!-- Contact Info -->
    <div style="padding:24px 32px;background:rgba(197,179,88,0.04);border-top:1px solid rgba(197,179,88,0.1);border-bottom:1px solid rgba(197,179,88,0.1)">
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:16px">REACH US DIRECTLY</div>
      <table style="width:100%">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(248,247,244,0.4);width:60px">Phone</td>
          <td style="padding:6px 0;font-size:14px;color:#F8F7F4;font-weight:500">412-737-2858</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:rgba(248,247,244,0.4);width:60px">Email</td>
          <td style="padding:6px 0;font-size:14px;color:#F8F7F4;font-weight:500">conhudbusiness@gmail.com</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding:32px;text-align:center">
      <div style="font-size:11px;color:rgba(248,247,244,0.2);letter-spacing:2px">
        FANTASMA FOOTBALL &middot; PITTSBURGH, PA
      </div>
      <div style="margin-top:8px">
        <a href="https://fantasmafootball.com" style="font-size:11px;color:rgba(197,179,88,0.4);letter-spacing:1px;text-decoration:none">fantasmafootball.com</a>
      </div>
    </div>

  </div>
</body>
</html>`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, phone, message } = req.body

  // Validate required fields
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' })
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' })
  }

  const transporter = getTransporter()

  // Send confirmation to customer (always, most important)
  try {
    await transporter.sendMail({
      from: `"Fantasma Football" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Fantasma Football — We Got Your Message',
      html: confirmationHTML(name),
    })
  } catch (err) {
    console.error('Customer confirmation email failed:', err)
    return res.status(500).json({ error: 'Failed to send message. Please try again.' })
  }

  // Send notification to coach (fail silently)
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: `New Inquiry: ${name}`,
      text: `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\nMessage:\n${message}`,
    })
  } catch (coachErr) {
    console.error('Coach notification email failed:', coachErr.message)
  }

  // SMS notification (fail silently)
  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: '4127372858@vtext.com',
      subject: '',
      text: `New Inquiry: ${name} — ${message.substring(0, 80)}`,
    })
  } catch (smsErr) {
    console.error('SMS notification failed:', smsErr.message)
  }

  return res.status(200).json({ success: true })
}
