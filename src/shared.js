// ============================================
// SHARED — Nav, scroll effects, mobile menu, reveal animations
// Used by both index.html and booking.html
// ============================================

// --- Element references ---
const navbar = document.getElementById('navbar')
const navToggle = document.getElementById('navToggle')
const navMenu = document.getElementById('navMenu')
const topBar = document.getElementById('topBar')
const wraithBg = document.querySelector('.wraith-bg')

// --- Consolidated scroll handler ---
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY

  // Navbar scroll effect
  if (navbar) {
    if (scrollY > 50) {
      navbar.classList.add('scrolled')
      if (topBar) topBar.classList.add('hidden')
    } else {
      navbar.classList.remove('scrolled')
      if (topBar) topBar.classList.remove('hidden')
    }
  }

  // Background wraith parallax (subtle drift)
  if (wraithBg) {
    const parallax = scrollY * 0.15
    wraithBg.style.transform = `translateY(${parallax}px)`
  }
})

// --- Mobile nav toggle ---
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active')
    navMenu.classList.toggle('active')
  })

  // Close mobile menu when a link is clicked
  navMenu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active')
      navMenu.classList.remove('active')
    })
  })
}

// --- Scroll reveal animations ---
const revealElements = document.querySelectorAll('.reveal')

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const siblings = entry.target.parentElement.querySelectorAll('.reveal')
        const siblingIndex = Array.from(siblings).indexOf(entry.target)
        setTimeout(() => {
          entry.target.classList.add('active')
        }, siblingIndex * 120)
        revealObserver.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
)

revealElements.forEach(el => revealObserver.observe(el))

// --- Smooth scroll for anchor links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'))
    if (target) {
      e.preventDefault()
      target.scrollIntoView({ behavior: 'smooth' })
    }
  })
})

// ============================================
// GHOST MODE — Easter Egg
// Type "ghost" to toggle phantom mode
// ============================================
;(() => {
  const GHOST_KEY = 'fantasma-ghost-mode'
  const TRIGGER_WORD = 'ghost'
  let keyBuffer = ''
  let bufferTimeout = null

  // --- Ghost particle system ---
  let particleCanvas = null
  let particleCtx = null
  let particles = []
  let animationId = null

  function createParticleCanvas() {
    particleCanvas = document.createElement('canvas')
    particleCanvas.classList.add('ghost-particles')
    document.body.appendChild(particleCanvas)
    particleCtx = particleCanvas.getContext('2d')
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
  }

  function resizeCanvas() {
    if (!particleCanvas) return
    particleCanvas.width = window.innerWidth
    particleCanvas.height = window.innerHeight
  }

  function spawnParticles(count) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * particleCanvas.width,
        y: Math.random() * particleCanvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.4,
        speedY: -Math.random() * 0.6 - 0.1,
        opacity: Math.random() * 0.4 + 0.1,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      })
    }
  }

  function animateParticles() {
    if (!particleCtx || !particleCanvas) return
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height)

    particles.forEach(p => {
      p.x += p.speedX
      p.y += p.speedY
      p.pulse += p.pulseSpeed
      const alpha = p.opacity * (0.5 + 0.5 * Math.sin(p.pulse))

      // Wrap around
      if (p.y < -10) p.y = particleCanvas.height + 10
      if (p.x < -10) p.x = particleCanvas.width + 10
      if (p.x > particleCanvas.width + 10) p.x = -10

      // Draw glowing particle
      particleCtx.beginPath()
      particleCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      particleCtx.fillStyle = `rgba(0, 255, 200, ${alpha})`
      particleCtx.fill()

      // Glow effect
      particleCtx.beginPath()
      particleCtx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
      particleCtx.fillStyle = `rgba(0, 255, 200, ${alpha * 0.15})`
      particleCtx.fill()
    })

    animationId = requestAnimationFrame(animateParticles)
  }

  function startParticles() {
    if (!particleCanvas) createParticleCanvas()
    particles = []
    spawnParticles(60)
    animateParticles()
  }

  function stopParticles() {
    if (animationId) cancelAnimationFrame(animationId)
    animationId = null
    particles = []
    if (particleCtx && particleCanvas) {
      particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height)
    }
  }

  // --- Scanline element ---
  let scanlineEl = null

  function createScanline() {
    scanlineEl = document.createElement('div')
    scanlineEl.classList.add('ghost-scanline')
    document.body.appendChild(scanlineEl)
  }

  function removeScanline() {
    if (scanlineEl) {
      scanlineEl.remove()
      scanlineEl = null
    }
  }

  // --- Ghost toggle button ---
  let toggleBtn = null

  function createToggleButton() {
    toggleBtn = document.createElement('button')
    toggleBtn.classList.add('ghost-toggle')
    toggleBtn.setAttribute('aria-label', 'Toggle Ghost Mode')
    toggleBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h1v2c0 .55.45 1 1 1s1-.45 1-1v-2h2v2c0 .55.45 1 1 1s1-.45 1-1v-2h1c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7zm-2 13H9v-1h1v1zm6 0h-1v-1h1v1zm1.5-5.5c-.5.66-1.16 1.18-1.93 1.5H8.43c-.77-.32-1.43-.84-1.93-1.5C5.89 8.62 5.5 7.62 5.5 9c0 3.31 2.69 6 6 6h1c3.31 0 6-2.69 6-6 0 1.38-.39 2.38-1 3.5z" opacity="0.9"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/></svg>`
    document.body.appendChild(toggleBtn)

    toggleBtn.addEventListener('click', () => toggleGhostMode())
  }

  // --- Flash effect ---
  function flashScreen() {
    const flash = document.createElement('div')
    flash.classList.add('ghost-flash-overlay')
    document.body.appendChild(flash)
    flash.addEventListener('animationend', () => flash.remove())
  }

  // --- Main toggle ---
  function toggleGhostMode(forceState) {
    const isActive = document.body.classList.contains('ghost-mode')
    const nextState = forceState !== undefined ? forceState : !isActive

    if (nextState === isActive) return

    // Add transition class temporarily
    document.body.classList.add('ghost-mode-transition')

    // Flash on activation
    if (nextState) flashScreen()

    // Toggle the class
    setTimeout(() => {
      document.body.classList.toggle('ghost-mode', nextState)
    }, nextState ? 200 : 0)

    // Manage particles
    if (nextState) {
      startParticles()
      createScanline()
    } else {
      stopParticles()
      removeScanline()
    }

    // Show/hide toggle button
    if (toggleBtn) {
      if (nextState) {
        setTimeout(() => toggleBtn.classList.add('visible'), 800)
      } else {
        toggleBtn.classList.remove('visible')
      }
    }

    // Persist
    localStorage.setItem(GHOST_KEY, nextState ? '1' : '0')

    // Remove transition class after animations complete
    setTimeout(() => {
      document.body.classList.remove('ghost-mode-transition')
    }, 1000)
  }

  // --- Keyboard listener ---
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    clearTimeout(bufferTimeout)
    keyBuffer += e.key.toLowerCase()

    // Keep buffer trimmed
    if (keyBuffer.length > 20) keyBuffer = keyBuffer.slice(-20)

    // Check for trigger word
    if (keyBuffer.includes(TRIGGER_WORD)) {
      keyBuffer = ''
      toggleGhostMode()
    }

    // Reset buffer after inactivity
    bufferTimeout = setTimeout(() => { keyBuffer = '' }, 2000)
  })

  // --- Init ---
  createToggleButton()

  // Restore persisted state
  if (localStorage.getItem(GHOST_KEY) === '1') {
    document.body.classList.add('ghost-mode')
    startParticles()
    createScanline()
    setTimeout(() => toggleBtn.classList.add('visible'), 500)
  }
})()

