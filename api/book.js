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

export default async function handler(req, res) {
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
    await calendar.events.insert({
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

    // Send SMS notification via email-to-SMS gateway
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })

      const smsText = `New Booking: ${SESSION_LABELS[sessionType]} - ${name} - ${formatDatePretty(date)} at ${formatTime12(time)}`

      // Send SMS via Verizon gateway
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: '4127372858@vtext.com',
        subject: '',
        text: smsText,
      })

      // Also send email notification via Gmail
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: process.env.GMAIL_USER,
        subject: `Fantasma Booking: ${name} - ${formatDatePretty(date)} at ${formatTime12(time)}`,
        text: `New booking from the website:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nSession: ${SESSION_LABELS[sessionType]}\nDate: ${formatDatePretty(date)}\nTime: ${formatTime12(time)}\nDuration: ${duration === 60 ? '1 hour' : '1.5 hours'}`,
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
      },
    })
  } catch (err) {
    console.error('Booking error:', err)
    return res.status(500).json({ error: 'Failed to create booking.' })
  }
}
