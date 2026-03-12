import { google } from 'googleapis'
import nodemailer from 'nodemailer'

const TIMEZONE = 'America/New_York'

const GENERAL_HOURS = {
  0: null,
  1: { start: 15, end: 20 },
  2: { start: 15, end: 20 },
  3: { start: 15, end: 20 },
  4: { start: 15, end: 20 },
  5: { start: 15, end: 20 },
  6: { start: 9, end: 14 },
}

const SESSION_DURATIONS = {
  '1-on-1': 60,
  'small-group': 90,
}

const SESSION_LABELS = {
  '1-on-1': '1-on-1 Training',
  'small-group': 'Small Group Training',
}

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
}

function formatTime12(time24) {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

function formatDatePretty(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${months[m - 1]} ${d}, ${y}`
}

function bookingConfirmationHTML(name, sessionLabel, datePretty, time12, durationLabel) {
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
      <div style="font-size:11px;letter-spacing:4px;color:#C5B358;margin-bottom:16px">SESSION CONFIRMED</div>
      <div style="font-size:22px;color:#F8F7F4;font-weight:700;line-height:1.3;margin-bottom:16px">
        You're booked, ${name}.
      </div>
      <div style="width:50px;height:3px;background:#C5B358;margin-bottom:24px"></div>
      <div style="font-size:15px;color:rgba(248,247,244,0.65);line-height:1.7;margin-bottom:32px">
        Your training session is locked in. Show up ready to work.
      </div>

      <!-- Session Details -->
      <div style="background:rgba(197,179,88,0.04);border:1px solid rgba(197,179,88,0.1);border-radius:8px;padding:24px;margin-bottom:24px">
        <table style="width:100%">
          <tr>
            <td style="padding:8px 0;font-size:12px;letter-spacing:2px;color:rgba(248,247,244,0.4)">SESSION</td>
            <td style="padding:8px 0;font-size:15px;color:#F8F7F4;font-weight:600;text-align:right">${sessionLabel}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:12px;letter-spacing:2px;color:rgba(248,247,244,0.4);border-top:1px solid rgba(255,255,255,0.05)">DATE</td>
            <td style="padding:8px 0;font-size:15px;color:#F8F7F4;font-weight:600;text-align:right;border-top:1px solid rgba(255,255,255,0.05)">${datePretty}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:12px;letter-spacing:2px;color:rgba(248,247,244,0.4);border-top:1px solid rgba(255,255,255,0.05)">TIME</td>
            <td style="padding:8px 0;font-size:15px;color:#F8F7F4;font-weight:600;text-align:right;border-top:1px solid rgba(255,255,255,0.05)">${time12}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:12px;letter-spacing:2px;color:rgba(248,247,244,0.4);border-top:1px solid rgba(255,255,255,0.05)">DURATION</td>
            <td style="padding:8px 0;font-size:15px;color:#F8F7F4;font-weight:600;text-align:right;border-top:1px solid rgba(255,255,255,0.05)">${durationLabel}</td>
          </tr>
        </table>
      </div>

      <div style="font-size:14px;color:rgba(248,247,244,0.5);line-height:1.6">
        Need to reschedule? Reply to this email or call <strong style="color:#F8F7F4">412-737-2858</strong>.
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:32px;text-align:center;border-top:1px solid rgba(197,179,88,0.1)">
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
  // CORS for mobile app
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, phone, sessionType, date, time } = req.body

  // Validate required fields
  if (!name || !email || !phone || !sessionType || !date || !time) {
    return res.status(400).json({ error: 'All fields are required.' })
  }

  const duration = SESSION_DURATIONS[sessionType]
  if (!duration) {
    return res.status(400).json({ error: 'Invalid session type.' })
  }

  // Validate date/time falls within general hours
  const targetDate = new Date(`${date}T12:00:00`)
  const dayOfWeek = targetDate.getDay()
  const hours = GENERAL_HOURS[dayOfWeek]
  if (!hours) {
    return res.status(400).json({ error: 'No availability on this day.' })
  }

  const [timeH, timeM] = time.split(':').map(Number)
  const slotMinutes = timeH * 60 + timeM
  if (slotMinutes < hours.start * 60 || slotMinutes + duration > hours.end * 60) {
    return res.status(400).json({ error: 'Time is outside available hours.' })
  }

  try {
    const auth = getAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    // Double-check the slot is still available
    const endMinutes = slotMinutes + duration
    const endH = Math.floor(endMinutes / 60)
    const endM = endMinutes % 60

    const slotStart = `${date}T${time}:00`
    const slotEnd = `${date}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`

    const freeBusyRes = await calendar.freebusy.query({
      requestBody: {
        timeMin: new Date(`${slotStart}-05:00`).toISOString(),
        timeMax: new Date(`${slotEnd}-05:00`).toISOString(),
        timeZone: TIMEZONE,
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
      },
    })

    const busyPeriods = freeBusyRes.data.calendars[process.env.GOOGLE_CALENDAR_ID]?.busy || []
    if (busyPeriods.length > 0) {
      return res.status(409).json({ error: 'This time slot is no longer available.' })
    }

    // Create the calendar event
    const event = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `Fantasma Training - ${SESSION_LABELS[sessionType]} - ${name}`,
        description: `Session Type: ${SESSION_LABELS[sessionType]}\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\n\nBooked via fantasma-site.vercel.app`,
        start: {
          dateTime: `${slotStart}`,
          timeZone: TIMEZONE,
        },
        end: {
          dateTime: `${slotEnd}`,
          timeZone: TIMEZONE,
        },
        colorId: '6', // Tangerine — stands out on calendar
      },
    })

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    // Send branded confirmation to customer (always, most important)
    try {
      await transporter.sendMail({
        from: `"Fantasma Football" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Fantasma Football — Session Confirmed',
        html: bookingConfirmationHTML(name, SESSION_LABELS[sessionType], formatDatePretty(date), formatTime12(time), duration === 60 ? '1 hour' : '1.5 hours'),
      })
    } catch (emailErr) {
      console.error('Customer confirmation email failed:', emailErr)
    }

    // Send coach notification (fail silently)
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER,
        subject: `Fantasma Booking: ${name} - ${formatDatePretty(date)} at ${formatTime12(time)}`,
        text: `New booking from the website:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nSession: ${SESSION_LABELS[sessionType]}\nDate: ${formatDatePretty(date)}\nTime: ${formatTime12(time)}\nDuration: ${duration === 60 ? '1 hour' : '1.5 hours'}`,
      })
    } catch (coachErr) {
      console.error('Coach notification email failed:', coachErr)
    }

    // Send SMS via Verizon gateway (fail silently)
    try {
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: '4127372858@vtext.com',
        subject: '',
        text: `New Booking: ${SESSION_LABELS[sessionType]} - ${name} - ${formatDatePretty(date)} at ${formatTime12(time)}`,
      })
    } catch (smsErr) {
      console.error('SMS notification failed:', smsErr)
    }

    return res.status(200).json({
      success: true,
      booking: {
        sessionType: SESSION_LABELS[sessionType],
        date: formatDatePretty(date),
        time: formatTime12(time),
        duration: duration === 60 ? '1 hour' : '1.5 hours',
        calendarEventId: event.data.id,
      },
    })
  } catch (err) {
    console.error('Booking error:', err)
    return res.status(500).json({ error: 'Failed to create booking.' })
  }
}
