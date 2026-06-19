import { google } from 'googleapis'

const TIMEZONE = 'America/New_York'

// General available hours per day of week (0=Sun, 1=Mon, ..., 6=Sat)
const GENERAL_HOURS = {
  0: { start: 7, end: 10 },    // Sunday 7am-10am (last 1-on-1 start 9am)
  1: { start: 15, end: 21 },  // Monday 3pm-9pm (last slot 8pm)
  2: { start: 15, end: 21 },  // Tuesday
  3: { start: 15, end: 21 },  // Wednesday
  4: { start: 15, end: 21 },  // Thursday
  5: { start: 15, end: 21 },  // Friday
  6: { start: 7, end: 14 },   // Saturday 7am-2pm
}

const SESSION_DURATIONS = {
  '1-on-1': 60,
  'small-group': 60,
}

const COACH_CONFIG = {
  connor: {
    serviceEmail: () => process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: () => process.env.GOOGLE_PRIVATE_KEY,
    calendarId: () => process.env.GOOGLE_CALENDAR_ID,
  },
  colton: {
    serviceEmail: () => process.env.COLTON_GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: () => process.env.COLTON_GOOGLE_PRIVATE_KEY,
    calendarId: () => process.env.COLTON_GOOGLE_CALENDAR_ID,
  },
}

function getAuth(coach = 'connor') {
  const config = COACH_CONFIG[coach] || COACH_CONFIG.connor
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: config.serviceEmail(),
      private_key: config.privateKey().replace(/\\n/g, '\n').replace(/\r/g, ''),
    },
    scopes: ['https://www.googleapis.com/auth/calendar'],
  })
}

function getCalendarId(coach = 'connor') {
  const config = COACH_CONFIG[coach] || COACH_CONFIG.connor
  return config.calendarId()
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

  const { date, sessionType = '1-on-1', coach = 'connor' } = req.query

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

  // Compute the correct UTC offset for the target date in Eastern time
  // (handles EST vs EDT automatically)
  function getEasternOffset(dateStr, hour) {
    const utcGuess = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00Z`)
    const eastern = new Date(utcGuess.toLocaleString('en-US', { timeZone: TIMEZONE }))
    const diffMs = eastern.getTime() - utcGuess.getTime()
    const diffHours = Math.round(diffMs / (60 * 1000 * 60))
    const sign = diffHours >= 0 ? '+' : '-'
    return `${sign}${String(Math.abs(diffHours)).padStart(2, '0')}:00`
  }

  const offset = getEasternOffset(date, hours.start)

  // Build time window
  const timeMin = `${date}T${String(hours.start).padStart(2, '0')}:00:00`
  const timeMax = `${date}T${String(hours.end).padStart(2, '0')}:00:00`

  try {
    const auth = getAuth(coach)
    const calendarId = getCalendarId(coach)
    const calendar = google.calendar({ version: 'v3', auth })

    const windowStart = new Date(`${timeMin}${offset}`).toISOString()
    const windowEnd = new Date(`${timeMax}${offset}`).toISOString()

    // Query free/busy for general blocking
    const freeBusyRes = await calendar.freebusy.query({
      requestBody: {
        timeMin: windowStart,
        timeMax: windowEnd,
        timeZone: TIMEZONE,
        items: [{ id: calendarId }],
      },
    })

    const busyPeriods = freeBusyRes.data.calendars[calendarId]?.busy || []

    // Events (including "Work") block only the time they actually occupy. There
    // is no extra post-event buffer: a session can be booked as soon as a busy
    // period ends, so e.g. work ending by 5pm leaves the 5pm slot open. This
    // matches book.js, which validates a booking against busy time alone.
    const blockedPeriods = busyPeriods.map(b => ({ start: new Date(b.start), end: new Date(b.end) }))

    // Generate all possible slots at 1-hour intervals
    const slots = []
    const isToday = date === todayStr

    for (let minutes = hours.start * 60; minutes + duration <= hours.end * 60; minutes += 30) {
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
      const slotStart = new Date(`${date}T${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}:00${offset}`)
      const slotEnd = new Date(`${date}T${String(slotEndH).padStart(2, '0')}:${String(slotEndM).padStart(2, '0')}:00${offset}`)

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
    console.error('Google Calendar API error:', err)
    return res.status(500).json({ error: 'Failed to fetch availability.' })
  }
}
