import { google } from 'googleapis'

const TIMEZONE = 'America/New_York'

// General available hours per day of week (0=Sun, 1=Mon, ..., 6=Sat)
const GENERAL_HOURS = {
  0: null,                     // Sunday — closed
  1: { start: 15, end: 20 },  // Monday 3pm-8pm
  2: { start: 15, end: 20 },  // Tuesday
  3: { start: 15, end: 20 },  // Wednesday
  4: { start: 15, end: 20 },  // Thursday
  5: { start: 15, end: 20 },  // Friday
  6: { start: 9, end: 14 },   // Saturday 9am-2pm
}

const SESSION_DURATIONS = {
  '1-on-1': 60,
  'small-group': 90,
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

export default async function handler(req, res) {
  // CORS for mobile app
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { date, sessionType = '1-on-1' } = req.query

  // Validate date
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' })
  }

  // Validate session type
  const duration = SESSION_DURATIONS[sessionType]
  if (!duration) {
    return res.status(400).json({ error: 'Invalid session type. Use "1-on-1" or "small-group".' })
  }

  // Parse the date in Eastern time
  const [year, month, day] = date.split('-').map(Number)
  const targetDate = new Date(`${date}T12:00:00`)
  const dayOfWeek = targetDate.getDay()

  // Check if Sunday
  const hours = GENERAL_HOURS[dayOfWeek]
  if (!hours) {
    return res.status(200).json({ date, sessionType, slots: [] })
  }

  // Check if in the past
  const now = new Date()
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  if (date < todayStr) {
    return res.status(200).json({ date, sessionType, slots: [] })
  }

  // Build time window
  const timeMin = `${date}T${String(hours.start).padStart(2, '0')}:00:00`
  const timeMax = `${date}T${String(hours.end).padStart(2, '0')}:00:00`

  try {
    const auth = getAuth()
    const calendar = google.calendar({ version: 'v3', auth })

    // Query calendar events (not free/busy) so we can read event titles
    const windowStart = new Date(`${timeMin}-05:00`).toISOString()
    const windowEnd = new Date(`${timeMax}-05:00`).toISOString()

    const eventsRes = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: windowStart,
      timeMax: windowEnd,
      singleEvents: true,
      orderBy: 'startTime',
    })

    const events = eventsRes.data.items || []

    // Build blocked periods: each event blocks its time range,
    // and "work" events add a 30-min buffer after they end
    const blockedPeriods = events.map(event => {
      const busyStart = new Date(event.start.dateTime || event.start.date)
      const busyEnd = new Date(event.end.dateTime || event.end.date)
      const title = (event.summary || '').toLowerCase().trim()
      const bufferMs = title === 'work' ? 30 * 60 * 1000 : 0
      return { start: busyStart, end: new Date(busyEnd.getTime() + bufferMs) }
    })

    // Generate all possible slots at 1-hour intervals
    const slots = []
    const isToday = date === todayStr

    for (let minutes = hours.start * 60; minutes + duration <= hours.end * 60; minutes += 60) {
      const slotStartH = Math.floor(minutes / 60)
      const slotStartM = minutes % 60
      const slotEndMinutes = minutes + duration
      const slotEndH = Math.floor(slotEndMinutes / 60)
      const slotEndM = slotEndMinutes % 60

      // Skip past slots for today
      if (isToday) {
        const nowET = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE }))
        const nowMinutes = nowET.getHours() * 60 + nowET.getMinutes()
        if (minutes <= nowMinutes) continue
      }

      // Check overlap with blocked periods (includes work buffer)
      const slotStart = new Date(`${date}T${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}:00-05:00`)
      const slotEnd = new Date(`${date}T${String(slotEndH).padStart(2, '0')}:${String(slotEndM).padStart(2, '0')}:00-05:00`)

      const isBlocked = blockedPeriods.some(blocked => {
        return slotStart < blocked.end && slotEnd > blocked.start
      })

      if (!isBlocked) {
        slots.push(`${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}`)
      }
    }

    return res.status(200).json({ date, sessionType, slots })
  } catch (err) {
    console.error('Google Calendar API error:', err)
    return res.status(500).json({ error: 'Failed to fetch availability.' })
  }
}
