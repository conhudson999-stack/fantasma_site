import './style.css'
import './shared.js'

// ============================================
// CAMPS PAGE — Fetch camps, render, registration modal, Stripe checkout
// ============================================

const campsLoading = document.getElementById('campsLoading')
const featuredCampEl = document.getElementById('featuredCamp')
const upcomingCampsEl = document.getElementById('upcomingCamps')
const campsEmpty = document.getElementById('campsEmpty')

const modalOverlay = document.getElementById('campModalOverlay')
const modalClose = document.getElementById('campModalClose')
const modalTitle = document.getElementById('campModalTitle')
const modalInfo = document.getElementById('campModalInfo')
const campIdInput = document.getElementById('campId')
const registerForm = document.getElementById('campRegisterForm')
const submitBtn = document.getElementById('campSubmitBtn')

const successBanner = document.getElementById('campSuccessBanner')

let campsData = []

// --- Init ---
async function init() {
  // Check for success redirect from Stripe
  const params = new URLSearchParams(window.location.search)
  if (params.get('success') === 'true') {
    successBanner.style.display = 'block'
    // Clean URL without reload
    window.history.replaceState({}, '', '/camps.html')
  }

  try {
    const res = await fetch('/camps.json')
    campsData = await res.json()
  } catch (e) {
    console.error('Failed to load camps:', e)
    campsData = []
  }

  // Filter to future camps only
  const today = new Date().toISOString().split('T')[0]
  const futureCamps = campsData.filter(c => c.endDate >= today)

  campsLoading.style.display = 'none'

  if (futureCamps.length === 0) {
    campsEmpty.style.display = 'block'
    return
  }

  // Sort by start date
  futureCamps.sort((a, b) => a.startDate.localeCompare(b.startDate))

  // Featured = first upcoming camp
  const featured = futureCamps[0]
  const upcoming = futureCamps.slice(1)

  renderFeatured(featured)
  if (upcoming.length > 0) {
    renderUpcoming(upcoming)
  }
}

// --- Render featured camp ---
function renderFeatured(camp) {
  featuredCampEl.innerHTML = `
    <div class="camp-featured">
      ${camp.comingSoon ? '<div class="camp-coming-soon"><span>COMING SOON</span></div>' : ''}
      ${camp.image ? `<div class="camp-featured-image"><img src="${camp.image}" alt="${camp.name}" /></div>` : ''}
      <div class="camp-featured-content">
        <div class="camp-featured-badge">
          <span class="camp-badge-dot"></span>
          NEXT CAMP
        </div>
        <h2 class="camp-featured-title">${camp.name.toUpperCase()}</h2>
        <div class="camp-featured-meta">
          <div class="camp-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${camp.dates}
          </div>
          <div class="camp-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            ${camp.time}
          </div>
          <div class="camp-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${camp.location}
          </div>
          <div class="camp-meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            ${camp.ages === 'All' ? 'All Ages' : 'Ages ' + camp.ages}
          </div>
        </div>
        <p class="camp-featured-desc">${camp.description}</p>
        <div class="camp-featured-bottom">
          <div class="camp-featured-price">
            <span class="camp-price-amount">$${camp.price}</span>
            <span class="camp-price-label">per player</span>
          </div>
          ${camp.spots > 0 ? `<div class="camp-featured-spots">${camp.spotsRemaining} / ${camp.spots} spots remaining</div>` : ''}
        </div>
        ${camp.comingSoon
          ? `<button class="btn btn-dark btn-full" disabled>Registration Opening Soon</button>`
          : camp.spots > 0 && camp.spotsRemaining <= 0
            ? `<button class="btn btn-dark btn-full" disabled>Sold Out</button>`
            : `<button class="btn btn-dark btn-full camp-register-btn" data-camp-id="${camp.id}">Reserve Your Spot</button>`
        }
      </div>
    </div>
  `
  featuredCampEl.style.display = 'block'

  // Bind register button
  const btn = featuredCampEl.querySelector('.camp-register-btn')
  if (btn) btn.addEventListener('click', () => openModal(camp))
}

// --- Render upcoming camps list ---
function renderUpcoming(camps) {
  let html = '<h3 class="camps-upcoming-title">MORE CAMPS</h3><div class="camps-upcoming-list">'
  for (const camp of camps) {
    html += `
      <div class="camp-card">
        <div class="camp-card-info">
          <h4 class="camp-card-name">${camp.name}</h4>
          <p class="camp-card-dates">${camp.dates} · ${camp.time}</p>
          <p class="camp-card-location">${camp.location} · Ages ${camp.ages}</p>
        </div>
        <div class="camp-card-right">
          <div class="camp-card-price">$${camp.price}</div>
          ${camp.spots > 0 ? `<div class="camp-card-spots">${camp.spotsRemaining} spots left</div>` : ''}
          ${camp.spots > 0 && camp.spotsRemaining <= 0
            ? `<button class="btn btn-dark" disabled>Sold Out</button>`
            : `<button class="btn btn-dark camp-register-btn" data-camp-id="${camp.id}">Register</button>`
          }
        </div>
      </div>
    `
  }
  html += '</div>'
  upcomingCampsEl.innerHTML = html
  upcomingCampsEl.style.display = 'block'

  // Bind register buttons
  upcomingCampsEl.querySelectorAll('.camp-register-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const camp = campsData.find(c => c.id === btn.dataset.campId)
      if (camp) openModal(camp)
    })
  })
}

// --- Modal ---
function openModal(camp) {
  campIdInput.value = camp.id
  modalTitle.textContent = camp.name
  modalInfo.textContent = `${camp.dates} · $${camp.price}/player`
  modalOverlay.classList.add('active')
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  modalOverlay.classList.remove('active')
  document.body.style.overflow = ''
  registerForm.reset()
}

modalClose.addEventListener('click', closeModal)
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal()
})
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal()
})

// --- Form submission ---
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault()

  if (!document.getElementById('waiverCheck').checked) {
    alert('Please agree to the liability waiver to continue.')
    return
  }

  submitBtn.disabled = true
  submitBtn.textContent = 'Processing...'

  const formData = new FormData(registerForm)
  const data = Object.fromEntries(formData.entries())

  // Add camp details
  const camp = campsData.find(c => c.id === data.campId)
  if (camp) {
    data.campName = camp.name
    data.campPrice = camp.price
    data.campDates = camp.dates
  }

  try {
    const res = await fetch('/api/camp-register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = await res.json()

    if (result.url) {
      // Redirect to Stripe Checkout
      window.location.href = result.url
    } else {
      throw new Error(result.error || 'Failed to create checkout session')
    }
  } catch (err) {
    console.error('Registration error:', err)
    alert('Something went wrong. Please try again or contact us directly.')
    submitBtn.disabled = false
    submitBtn.textContent = 'Proceed to Payment'
  }
})

// --- Start ---
init()
