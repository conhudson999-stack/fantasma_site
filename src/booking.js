import './style.css'
import './shared.js'

// ============================================
// BOOKING PAGE — Calendar, Time Slots, Booking Form
// ============================================

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const SESSION_LABELS = {
  '1-on-1': '1-on-1 Training',
  'small-group': 'Small Group Training'
}

const SESSION_DURATIONS = {
  '1-on-1': '1 hour',
  'small-group': '1.5 hours'
}

// --- State ---
const state = {
  currentMonth: new Date().getMonth(),
  currentYear: new Date().getFullYear(),
  selectedDate: null,
  selectedTime: null,
  selectedSessionType: '1-on-1',
  availableSlots: [],
  isLoadingSlots: false,
  isBooking: false
}

// --- Element references ---
const calendarGrid = document.getElementById('calendarGrid')
const calendarTitle = document.getElementById('calendarTitle')
const calendarPrev = document.getElementById('calendarPrev')
const calendarNext = document.getElementById('calendarNext')
const slotsPlaceholder = document.getElementById('slotsPlaceholder')
const slotsLoading = document.getElementById('slotsLoading')
const slotsContent = document.getElementById('slotsContent')
const slotsEmpty = document.getElementById('slotsEmpty')
const slotsGrid = document.getElementById('slotsGrid')
const slotsPanelTitle = document.getElementById('slotsPanelTitle')
const slotsPanelDate = document.getElementById('slotsPanelDate')
const bookingFormWrapper = document.getElementById('bookingFormWrapper')
const bookingForm = document.getElementById('bookingForm')
const bookingSessionDisplay = document.getElementById('bookingSessionDisplay')
const bookingDateTimeDisplay = document.getElementById('bookingDateTimeDisplay')
const bookingSubmitBtn = document.getElementById('bookingSubmitBtn')
const bookingConfirmation = document.getElementById('bookingConfirmation')
const confirmationDetails = document.getElementById('confirmationDetails')
const bookAnotherBtn = document.getElementById('bookAnotherBtn')
const slotsPanel = document.getElementById('slotsPanel')

// --- Utility: format 24h time to 12h ---
function formatTime(time24) {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

// --- Utility: format date for display ---
function formatDate(date) {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

// --- Utility: format date as YYYY-MM-DD ---
function toDateString(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ============================================
// CALENDAR
// ============================================

function renderCalendar() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstDay = new Date(state.currentYear, state.currentMonth, 1).getDay()
  const daysInMonth = new Date(state.currentYear, state.currentMonth + 1, 0).getDate()

  // Update title
  calendarTitle.textContent = `${MONTHS[state.currentMonth]} ${state.currentYear}`

  // Update nav button states
  const isCurrentMonth = state.currentYear === today.getFullYear() && state.currentMonth === today.getMonth()
  const maxMonth = today.getMonth() + 2
  const maxYear = today.getFullYear() + (maxMonth > 11 ? 1 : 0)
  const isMaxMonth = state.currentYear === maxYear && state.currentMonth === (maxMonth % 12)

  calendarPrev.disabled = isCurrentMonth
  calendarNext.disabled = isMaxMonth

  // Build grid
  let html = ''

  // Empty cells before the 1st
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-day calendar-day--empty"></div>'
  }

  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(state.currentYear, state.currentMonth, day)
    date.setHours(0, 0, 0, 0)

    const isSunday = date.getDay() === 0
    const isPast = date < today
    const isToday = date.getTime() === today.getTime()
    const isSelected = state.selectedDate && date.getTime() === state.selectedDate.getTime()

    let classes = 'calendar-day'
    if (isSunday || isPast) classes += ' calendar-day--disabled'
    if (isToday && !isSunday) classes += ' calendar-day--today'
    if (isSelected) classes += ' calendar-day--selected'

    const attrs = (isSunday || isPast)
      ? 'aria-disabled="true"'
      : `role="button" tabindex="0" aria-label="${formatDate(date)}" data-day="${day}"`

    html += `<div class="${classes}" ${attrs}>${day}</div>`
  }

  calendarGrid.innerHTML = html

  // Attach click handlers to valid days
  calendarGrid.querySelectorAll('.calendar-day[data-day]').forEach(cell => {
    cell.addEventListener('click', () => {
      const day = parseInt(cell.dataset.day)
      onDayClick(day)
    })
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        const day = parseInt(cell.dataset.day)
        onDayClick(day)
      }
    })
  })
}

function onDayClick(day) {
  state.selectedDate = new Date(state.currentYear, state.currentMonth, day)
  state.selectedDate.setHours(0, 0, 0, 0)
  state.selectedTime = null

  // Hide booking form
  bookingFormWrapper.classList.remove('is-visible')
  bookingFormWrapper.style.maxHeight = null

  renderCalendar()
  fetchSlots()
}

// --- Calendar Navigation ---
calendarPrev.addEventListener('click', () => {
  state.currentMonth--
  if (state.currentMonth < 0) {
    state.currentMonth = 11
    state.currentYear--
  }
  renderCalendar()
})

calendarNext.addEventListener('click', () => {
  state.currentMonth++
  if (state.currentMonth > 11) {
    state.currentMonth = 0
    state.currentYear++
  }
  renderCalendar()
})

// ============================================
// TIME SLOTS
// ============================================

async function fetchSlots() {
  if (!state.selectedDate) return

  state.isLoadingSlots = true
  showSlotsView('loading')

  const dateStr = toDateString(state.selectedDate)

  try {
    const res = await fetch(`/api/availability?date=${dateStr}&sessionType=${state.selectedSessionType}`)
    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()
    state.availableSlots = data.slots || []

    if (state.availableSlots.length === 0) {
      showSlotsView('empty')
    } else {
      renderSlots()
      showSlotsView('content')
    }
  } catch (err) {
    console.error('Failed to fetch slots:', err)
    state.availableSlots = []
    showSlotsView('empty')
  }

  state.isLoadingSlots = false
}

function showSlotsView(view) {
  slotsPlaceholder.style.display = view === 'placeholder' ? '' : 'none'
  slotsLoading.style.display = view === 'loading' ? '' : 'none'
  slotsContent.style.display = view === 'content' ? '' : 'none'
  slotsEmpty.style.display = view === 'empty' ? '' : 'none'
}

function renderSlots() {
  slotsPanelDate.textContent = formatDate(state.selectedDate)

  slotsGrid.innerHTML = state.availableSlots.map(time => {
    const isSelected = state.selectedTime === time
    return `<button class="slot-pill${isSelected ? ' slot-pill--selected' : ''}" data-time="${time}">${formatTime(time)}</button>`
  }).join('')

  slotsGrid.querySelectorAll('.slot-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      state.selectedTime = pill.dataset.time
      renderSlots()
      showBookingForm()
    })
  })
}

// ============================================
// SESSION TYPE SELECTOR
// ============================================

document.querySelectorAll('.session-type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.session-type-btn').forEach(b => b.classList.remove('session-type-btn--active'))
    btn.classList.add('session-type-btn--active')

    state.selectedSessionType = btn.dataset.session
    state.selectedTime = null

    // Hide booking form
    bookingFormWrapper.classList.remove('is-visible')
    bookingFormWrapper.style.maxHeight = null

    // Re-fetch if a date is selected
    if (state.selectedDate) {
      fetchSlots()
    }
  })
})

// ============================================
// BOOKING FORM
// ============================================

function showBookingForm() {
  bookingSessionDisplay.value = SESSION_LABELS[state.selectedSessionType]
  bookingDateTimeDisplay.value = `${formatDate(state.selectedDate)} at ${formatTime(state.selectedTime)}`

  bookingFormWrapper.classList.add('is-visible')
  bookingFormWrapper.style.maxHeight = bookingFormWrapper.scrollHeight + 'px'
}

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (state.isBooking) return

  state.isBooking = true
  bookingSubmitBtn.disabled = true
  bookingSubmitBtn.textContent = 'Booking...'

  const formData = {
    name: bookingForm.name.value.trim(),
    email: bookingForm.email.value.trim(),
    phone: bookingForm.phone.value.trim(),
    sessionType: state.selectedSessionType,
    date: toDateString(state.selectedDate),
    time: state.selectedTime
  }

  try {
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    const data = await res.json()

    if (res.ok && data.success) {
      showConfirmation(data.booking)

      // Send email notification (client-side, non-blocking)
      const emailForm = new FormData()
      emailForm.append('access_key', '90f97860-135b-4202-b24d-2234a6113296')
      emailForm.append('subject', `New Booking: ${SESSION_LABELS[state.selectedSessionType]} — ${formData.name} — ${data.booking.date} at ${data.booking.time}`)
      emailForm.append('from_name', 'Fantasma Booking System')
      emailForm.append('name', formData.name)
      emailForm.append('email', formData.email)
      emailForm.append('phone', formData.phone)
      emailForm.append('session_type', data.booking.sessionType)
      emailForm.append('date', data.booking.date)
      emailForm.append('time', data.booking.time)
      emailForm.append('duration', data.booking.duration)
      emailForm.append('message', `New booking from the website:\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nSession: ${data.booking.sessionType}\nDate: ${data.booking.date}\nTime: ${data.booking.time}\nDuration: ${data.booking.duration}`)
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: emailForm,
      }).catch(() => {})
    } else if (res.status === 409) {
      alert('This time slot was just booked by someone else. Please choose another time.')
      state.selectedTime = null
      bookingFormWrapper.classList.remove('is-visible')
      bookingFormWrapper.style.maxHeight = null
      fetchSlots()
    } else {
      alert('Something went wrong. Please try again or contact us directly.')
    }
  } catch {
    alert('Something went wrong. Please try again or contact us directly.')
  }

  state.isBooking = false
  bookingSubmitBtn.disabled = false
  bookingSubmitBtn.textContent = 'Confirm Booking'
})

// ============================================
// CONFIRMATION
// ============================================

function showConfirmation(booking) {
  // Hide everything else in the panel
  slotsPanel.style.display = 'none'
  bookingFormWrapper.style.display = 'none'
  document.querySelector('.session-type-selector').style.display = 'none'

  confirmationDetails.innerHTML = `
    <div class="booking-confirmation-detail">
      <span class="booking-confirmation-detail-label">Session</span>
      <span class="booking-confirmation-detail-value">${booking.sessionType}</span>
    </div>
    <div class="booking-confirmation-detail">
      <span class="booking-confirmation-detail-label">Date</span>
      <span class="booking-confirmation-detail-value">${booking.date}</span>
    </div>
    <div class="booking-confirmation-detail">
      <span class="booking-confirmation-detail-label">Time</span>
      <span class="booking-confirmation-detail-value">${booking.time}</span>
    </div>
    <div class="booking-confirmation-detail">
      <span class="booking-confirmation-detail-label">Duration</span>
      <span class="booking-confirmation-detail-value">${booking.duration}</span>
    </div>
  `

  bookingConfirmation.style.display = ''
}

bookAnotherBtn.addEventListener('click', () => {
  // Reset everything
  state.selectedDate = null
  state.selectedTime = null
  state.availableSlots = []

  bookingConfirmation.style.display = 'none'
  slotsPanel.style.display = ''
  bookingFormWrapper.style.display = ''
  bookingFormWrapper.classList.remove('is-visible')
  bookingFormWrapper.style.maxHeight = null
  document.querySelector('.session-type-selector').style.display = ''

  showSlotsView('placeholder')
  bookingForm.reset()
  renderCalendar()
})

// ============================================
// INIT
// ============================================
renderCalendar()
