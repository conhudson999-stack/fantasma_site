import { google } from 'googleapis'

const TIMEZONE = 'America/New_York'

const GENERAL_HOURS = {
  0: { start: 7, end: 10 },
  1: { start: 15, end: 21 },
  2: { start: 15, end: 21 },
  3: { start: 15, end: 21 },
  4: { start: 15, end: 21 },
  5: { start: 15, end: 21 },
  6: { start: 7, end: 14 },
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

function getEasternOffset(dateStr, hour) {
  const utcGuess = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00Z`)
  const eastern = new Date(utcGuess.toLocaleString('en-US', { timeZone: TIMEZONE }))
  const diffMs = eastern.getTime() - utcGuess.getTime()
  const diffHours = Math.round(diffMs / (60 * 1000 * 60))
  const sign = diffHours >= 0 ? '+' : '-'
  return `${sign}${String(Math.abs(diffHours)).padStart(2, '0')}:00`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { date, coach = 'connor' } = req.query

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD.' })
  }

  const targetDate = new Date(`${date}T12:00:00`)
  const dayOfWeek = targetDate.getDay()
  const hours = GENERAL_HOURS[dayOfWeek]

  if (!hours) {
    return res.status(200).json({ location: null })
  }

  const offset = getEasternOffset(date, hours.start)
  const timeMin = new Date(`${date}T${String(hours.start).padStart(2, '0')}:00:00${offset}`).toISOString()
  const timeMax = new Date(`${date}T${String(hours.end).padStart(2, '0')}:00:00${offset}`).toISOString()

  try {
    const auth = getAuth(coach)
    const calendarId = getCalendarId(coach)
    const calendar = google.calendar({ version: 'v3', auth })

    const eventsRes = await calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    })

    // Find the first Fantasma booking event that has a location set
    const booking = eventsRes.data.items?.find(
      e => e.summary?.startsWith('Fantasma Training') && e.location
    )

    return res.status(200).json({ location: booking?.location || null })
  } catch (err) {
    console.error('Booking location error:', err)
    return res.status(500).json({ error: 'Failed to fetch booking location.' })
  }
}
