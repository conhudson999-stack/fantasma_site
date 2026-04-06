// Vercel Serverless Function — /api/stripe-webhook
// Handles Stripe checkout.session.completed webhook
// Sends confirmation email to player and notification to coach

import Stripe from 'stripe'
import nodemailer from 'nodemailer'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

function confirmationHTML(meta) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0A0A0A;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#040C14;border-top:4px solid #C5B358">
    <div style="padding:40px 32px 24px;text-align:center;border-bottom:1px solid rgba(197,179,88,0.15)">
      <div style="font-size:11px;letter-spacing:6px;color:#C5B358;margin-bottom:8px">FANTASMA</div>
      <div style="font-size:24px;letter-spacing:3px;color:#F8F7F4;font-weight:700">FOOTBALL</div>
    </div>
    <div style="padding:40px 32px">
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:16px">CAMP REGISTRATION CONFIRMED</div>
      <div style="font-size:22px;color:#F8F7F4;font-weight:700;line-height:1.3;margin-bottom:16px">
        You're in, ${meta.playerName}!
      </div>
      <div style="width:50px;height:3px;background:#C5B358;margin-bottom:24px"></div>
      <div style="font-size:15px;color:rgba(248,247,244,0.65);line-height:1.7;margin-bottom:24px">
        Your spot has been reserved for <strong style="color:#F8F7F4">${meta.campName}</strong>.
      </div>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="padding:10px 0;font-size:13px;color:rgba(248,247,244,0.4);border-bottom:1px solid rgba(197,179,88,0.1)">Camp</td>
          <td style="padding:10px 0;font-size:14px;color:#F8F7F4;font-weight:500;border-bottom:1px solid rgba(197,179,88,0.1);text-align:right">${meta.campName}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:13px;color:rgba(248,247,244,0.4);border-bottom:1px solid rgba(197,179,88,0.1)">Dates</td>
          <td style="padding:10px 0;font-size:14px;color:#F8F7F4;font-weight:500;border-bottom:1px solid rgba(197,179,88,0.1);text-align:right">${meta.campDates}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:13px;color:rgba(248,247,244,0.4);border-bottom:1px solid rgba(197,179,88,0.1)">Player</td>
          <td style="padding:10px 0;font-size:14px;color:#F8F7F4;font-weight:500;border-bottom:1px solid rgba(197,179,88,0.1);text-align:right">${meta.playerName}</td>
        </tr>
        <tr>
          <td style="padding:10px 0;font-size:13px;color:rgba(248,247,244,0.4)">Shirt Size</td>
          <td style="padding:10px 0;font-size:14px;color:#F8F7F4;font-weight:500;text-align:right">${meta.shirtSize}</td>
        </tr>
      </table>
    </div>
    <div style="padding:24px 32px;background:rgba(197,179,88,0.04);border-top:1px solid rgba(197,179,88,0.1)">
      <div style="font-size:13px;color:rgba(248,247,244,0.5);line-height:1.6">
        Questions? Reply to this email or call <strong style="color:#F8F7F4">412-737-2858</strong>.
      </div>
    </div>
    <div style="padding:24px 32px;text-align:center;border-top:1px solid rgba(197,179,88,0.08)">
      <div style="font-size:10px;letter-spacing:3px;color:rgba(248,247,244,0.2)">FANTASMA FOOTBALL TRAINING · PITTSBURGH, PA</div>
    </div>
  </div>
</body>
</html>`
}

export const config = {
  api: {
    bodyParser: false,
  },
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sig = req.headers['stripe-signature']
  const rawBody = await readBody(req)

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).json({ error: 'Webhook signature verification failed' })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const meta = session.metadata

    const transporter = getTransporter()

    // 1. Send confirmation email to player/parent
    try {
      await transporter.sendMail({
        from: `"Fantasma Football" <${process.env.GMAIL_USER}>`,
        to: meta.email,
        subject: `Camp Registration Confirmed — ${meta.campName}`,
        html: confirmationHTML(meta),
      })
      console.log('Confirmation email sent to', meta.email)
    } catch (err) {
      console.error('Failed to send confirmation email:', err.message)
    }

    // 2. Send notification to coach (fail silently)
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: 'conhudbusiness@gmail.com',
        subject: `New Camp Registration — ${meta.playerName} for ${meta.campName}`,
        text: [
          `New camp registration:`,
          ``,
          `Camp: ${meta.campName}`,
          `Dates: ${meta.campDates}`,
          `Player: ${meta.playerName}`,
          `DOB: ${meta.playerDob}`,
          `Parent: ${meta.parentName}`,
          `Email: ${meta.email}`,
          `Phone: ${meta.phone}`,
          `Position: ${meta.position}`,
          `Shirt Size: ${meta.shirtSize}`,
          `Medical: ${meta.medical}`,
          `Amount Paid: $${(session.amount_total / 100).toFixed(2)}`,
        ].join('\n'),
      })
    } catch (err) {
      console.error('Failed to send coach notification:', err.message)
    }

    // 3. Send SMS notification (fail silently)
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: '4127372858@vtext.com',
        subject: '',
        text: `New camp registration: ${meta.playerName} for ${meta.campName} ($${(session.amount_total / 100).toFixed(2)})`,
      })
    } catch (err) {
      console.error('Failed to send SMS notification:', err.message)
    }
  }

  return res.status(200).json({ received: true })
}
