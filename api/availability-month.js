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

  const { month, sessionType = '1-on-1', coach = 'connor' } = req.query

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM.' })
  }

  const duration = SESSION_DURATIONS[sessionType]
  if (!duration) {
    return res.status(400).json({ error: 'Invalid session type.' })
  }

  const [year, mon] = month.split('-').map(Number)
  const now = new Date()
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: TIMEZONE })
  const daysInMonth = new Date(year, mon, 0).getDate()

  // One freebusy query covers the whole month
  const monthStartStr = `${month}-01`
  const nextMonthYear = mon === 12 ? year + 1 : year
  const nextMonthMon = mon === 12 ? 1 : mon + 1
  const nextMonthStr = `${nextMonthYear}-${String(nextMonthMon).padStart(2, '0')}-01`

  const windowStart = new Date(`${monthStartStr}T00:00:00${getEasternOffset(monthStartStr, 0)}`).toISOString()
  const windowEnd = new Date(`${nextMonthStr}T00:00:00${getEasternOffset(nextMonthStr, 0)}`).toISOString()

  try {
    const auth = getAuth(coach)
    const calendarId = getCalendarId(coach)
    const calendar = google.calendar({ version: 'v3', auth })

    const freeBusyRes = await calendar.freebusy.query({
      requestBody: {
        timeMin: windowStart,
        timeMax: windowEnd,
        timeZone: TIMEZONE,
        items: [{ id: calendarId }],
      },
    })

    const busyPeriods = (freeBusyRes.data.calendars[calendarId]?.busy || [])
      .map(b => ({ start: new Date(b.start), end: new Date(b.end) }))

    const unavailableDates = []

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(mon).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      // Past days are already greyed out — skip them
      if (dateStr < todayStr) continue

      const date = new Date(year, mon - 1, day)
      const dayOfWeek = date.getDay()
      const hours = GENERAL_HOURS[dayOfWeek]

      if (!hours) {
        unavailableDates.push(dateStr)
        continue
      }

      const offset = getEasternOffset(dateStr, hours.start)
      const isToday = dateStr === todayStr
      const nowET = isToday ? new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE })) : null
      const nowMinutes = isToday ? (nowET.getHours() * 60 + nowET.getMinutes()) : -1

      let hasSlot = false
      for (let minutes = hours.start * 60; minutes + duration <= hours.end * 60; minutes += 30) {
        if (isToday && minutes <= nowMinutes) continue

        const slotStartH = Math.floor(minutes / 60)
        const slotStartM = minutes % 60
        const slotEndMinutes = minutes + duration
        const slotEndH = Math.floor(slotEndMinutes / 60)
        const slotEndM = slotEndMinutes % 60

        const slotStart = new Date(`${dateStr}T${String(slotStartH).padStart(2, '0')}:${String(slotStartM).padStart(2, '0')}:00${offset}`)
        const slotEnd = new Date(`${dateStr}T${String(slotEndH).padStart(2, '0')}:${String(slotEndM).padStart(2, '0')}:00${offset}`)

        const isBlocked = busyPeriods.some(b => slotStart < b.end && slotEnd > b.start)
        if (!isBlocked) {
          hasSlot = true
          break
        }
      }

      if (!hasSlot) unavailableDates.push(dateStr)
    }

    return res.status(200).json({ month, unavailableDates })
  } catch (err) {
    console.error('Month availability error:', err)
    return res.status(500).json({ error: 'Failed to fetch month availability.' })
  }
}
