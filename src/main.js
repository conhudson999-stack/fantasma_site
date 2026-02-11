import './style.css'

// --- Element references ---
const navbar = document.getElementById('navbar')
const navToggle = document.getElementById('navToggle')
const navMenu = document.getElementById('navMenu')
const topBar = document.getElementById('topBar')
const wraithBg = document.querySelector('.wraith-bg')
const heroWraith = document.querySelector('.wraith-figure')

// --- Consolidated scroll handler ---
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY

  // Navbar scroll effect
  if (scrollY > 50) {
    navbar.classList.add('scrolled')
    if (topBar) topBar.classList.add('hidden')
  } else {
    navbar.classList.remove('scrolled')
    if (topBar) topBar.classList.remove('hidden')
  }

  // Background wraith parallax (subtle drift)
  if (wraithBg) {
    const parallax = scrollY * 0.15
    wraithBg.style.transform = `translateY(${parallax}px)`
  }
})

// --- Hero wraith entrance animation ---
if (heroWraith) {
  setTimeout(() => {
    heroWraith.classList.add('wraith-entered')
  }, 2400)
}

// --- Mobile nav toggle ---
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

// --- Contact gold line reveal ---
const goldLine = document.querySelector('.contact-gold-line')
if (goldLine) {
  const goldLineObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          goldLine.classList.add('is-visible')
          goldLineObserver.unobserve(goldLine)
        }
      })
    },
    { threshold: 0.1 }
  )
  goldLineObserver.observe(goldLine)
}

// --- FAQ accordion ---
document.querySelectorAll('.faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const item = button.parentElement
    const answer = item.querySelector('.faq-answer')
    const isActive = item.classList.contains('active')

    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(faqItem => {
      faqItem.classList.remove('active')
      faqItem.querySelector('.faq-answer').style.maxHeight = null
    })

    // Open clicked item if it wasn't already open
    if (!isActive) {
      item.classList.add('active')
      answer.style.maxHeight = answer.scrollHeight + 'px'
    }
  })
})

// ============================================
// COACHES SECTION
// ============================================
const coachesData = [
  {
    id: 'connor-hudson',
    name: 'Connor Hudson',
    title: 'Head Coach & Founder',
    photo: '/gcc_profile.webp',
    bio: 'Former NCAA Division 1 and semi-professional player whose deep, unconditional love for the game drives everything he does. Connor founded Fantasma because the beautiful game deserves to be studied, respected, and pursued with everything you\u2019ve got. He believes you don\u2019t need to be the fastest or most athletic, you need a willingness to learn, the ability to think through problems, and a relentless desire to get better every single day.',
    teams: [
      {
        logo: '/FR_logo.png',
        name: 'Franklin Regional',
        location: 'Murrysville, PA',
        years: '2016 – 2019',
        glowColor: '#C5A55A',
        description: 'Came up through one of Western Pennsylvania\'s most competitive high school programs. Two-time WPIAL champion (2018, 2019) and PIAA state semi-finalist, earning two All-WPIAL and one All-State selection along the way. Captained the team as a senior and built the technical foundation that carried into the college game.'
      },
      {
        logo: '/presby_logo.png',
        name: 'Presbyterian College',
        location: 'Clinton, SC',
        years: '2020 – 2023',
        glowColor: '#2E7BD5',
        description: 'Competed as a four-year NCAA Division 1 athlete in Clinton, SC, logging over 50 appearances with the majority being starts. Named Big South Defender of the Week for standout performances on the back line. Tested himself against elite competition including national defending champions Clemson University and the University of South Carolina. Developed a deep understanding of high-level tactical systems, grew as a vocal leader, and gained invaluable experience competing against top collegiate talent week in and week out.'
      },
      {
        logo: '/cardinals_logo.png',
        name: 'Commonwealth Cardinals FC',
        location: 'Fredericksburg, VA',
        years: 'Summer 2022',
        glowColor: '#CC0000',
        description: 'Selected to the inaugural USL League 2 roster for Commonwealth Cardinals FC in Fredericksburg, VA. Helped lay the groundwork for the club\'s identity and culture in its very first competitive season, gaining early semi-professional experience alongside players from programs across the country.'
      },
      {
        logo: '/steelcity_logo.png',
        name: 'Steel City FC',
        location: 'Pittsburgh, PA',
        years: 'Summer 2023',
        glowColor: '#FFD700',
        description: 'Part of a record-breaking USL League 2 squad based in Pittsburgh, PA that captured the conference championship. Competed at the semi-professional level against high-caliber opposition, sharpening game intelligence, on-field communication, and the ability to perform under pressure in high-stakes match situations.'
      },
      {
        logo: '/grove_logo.png',
        name: 'Grove City College',
        location: 'Grove City, PA',
        years: '2024',
        glowColor: '#E00000',
        description: 'Returned to collegiate soccer for a graduate year at the NCAA Division 3 level in Grove City, PA. Became a consistent starter from day one, chipping in several goals and bringing Division 1 experience and leadership to the squad. Helped guide the team to a conference finalist finish in a tightly contested season.'
      }
    ]
  }
]

let activeCoachIndex = 0
let coachTeamActiveIndex = 0
let currentCoachTeams = []

function initCoaches() {
  if (coachesData.length === 0) return
  renderCoachAccordion()
  selectCoach(0)
  setupCoachCarouselControls()
}

function renderCoachAccordion() {
  const container = document.getElementById('coachesAccordion')
  if (!container) return

  container.innerHTML = coachesData.map((coach, i) => {
    const initials = coach.name.split(' ').map(w => w[0]).join('')
    const photoHTML = coach.photo
      ? `<img src="${coach.photo}" alt="${coach.name}" />`
      : `<div class="coach-photo-placeholder">${initials}</div>`

    return `
      <div class="coach-item${i === 0 ? ' active' : ''}" data-coach-index="${i}">
        <button class="coach-header">
          <div class="coach-header-left">
            <span class="coach-header-name">${coach.name.toUpperCase()}</span>
            <span class="coach-header-title">${coach.title}</span>
          </div>
          <span class="coach-icon">&#9662;</span>
        </button>
        <div class="coach-body">
          <div class="coach-body-inner">
            <div class="coach-photo">${photoHTML}</div>
            <p class="coach-bio">${coach.bio}</p>
          </div>
        </div>
      </div>
    `
  }).join('')

  container.querySelectorAll('.coach-header').forEach(button => {
    button.addEventListener('click', () => {
      const item = button.parentElement
      const index = parseInt(item.dataset.coachIndex)
      const wasActive = item.classList.contains('active')

      container.querySelectorAll('.coach-item').forEach(ci => {
        ci.classList.remove('active')
        ci.querySelector('.coach-body').style.maxHeight = null
      })

      if (!wasActive) {
        item.classList.add('active')
        const body = item.querySelector('.coach-body')
        body.style.maxHeight = body.scrollHeight + 'px'

        if (index !== activeCoachIndex) {
          activeCoachIndex = index
          selectCoach(index)
        }
      }
    })
  })

  const firstBody = container.querySelector('.coach-item.active .coach-body')
  if (firstBody) {
    firstBody.style.maxHeight = firstBody.scrollHeight + 'px'
  }
}

function selectCoach(index) {
  activeCoachIndex = index
  coachTeamActiveIndex = 0
  currentCoachTeams = coachesData[index].teams
  renderCoachTeamCarousel()
}


function renderCoachTeamCarousel() {
  const track = document.getElementById('coachesCarouselTrack')
  const dots = document.getElementById('coachesCarouselDots')
  if (!track || !dots) return

  track.innerHTML = currentCoachTeams.map((team, i) => {
    const glowStyle = team.glowColor ? `--glow-color: ${team.glowColor}` : ''
    const logoHTML = team.logo
      ? `<img src="${team.logo}" alt="${team.name}" />`
      : `<div class="coaches-logo-placeholder"><span>${team.name}</span></div>`

    return `<div class="coaches-carousel-card" data-team-index="${i}" style="${glowStyle}">${logoHTML}</div>`
  }).join('')

  dots.innerHTML = currentCoachTeams.map((_, i) =>
    `<button class="coaches-carousel-dot${i === 0 ? ' is-active' : ''}" data-team-dot="${i}" aria-label="Go to team ${i + 1}"></button>`
  ).join('')

  track.querySelectorAll('.coaches-carousel-card').forEach(card => {
    card.addEventListener('click', () => {
      const idx = parseInt(card.dataset.teamIndex)
      if (idx !== coachTeamActiveIndex) {
        coachTeamActiveIndex = idx
        updateCoachTeamCarousel()
      }
    })
  })

  dots.querySelectorAll('.coaches-carousel-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      coachTeamActiveIndex = parseInt(dot.dataset.teamDot)
      updateCoachTeamCarousel()
    })
  })

  updateCoachTeamCarousel()
}

function updateCoachTeamCarousel() {
  const cards = document.querySelectorAll('.coaches-carousel-card')
  const dots = document.querySelectorAll('.coaches-carousel-dot')

  cards.forEach(card => {
    const index = parseInt(card.dataset.teamIndex)
    card.classList.toggle('is-active', index === coachTeamActiveIndex)
  })

  dots.forEach(dot => {
    dot.classList.toggle('is-active', parseInt(dot.dataset.teamDot) === coachTeamActiveIndex)
  })

  updateCoachTeamInfo()
}

function updateCoachTeamInfo() {
  const infoEl = document.getElementById('coachesTeamInfo')
  if (!infoEl) return

  const team = currentCoachTeams[coachTeamActiveIndex]
  if (!team) return

  infoEl.classList.add('is-fading')

  setTimeout(() => {
    infoEl.innerHTML = `
      <h4 class="coaches-team-info-name">${team.name.toUpperCase()}</h4>
      <p class="coaches-team-info-years">${team.years}${team.location ? ' \u2014 ' + team.location : ''}</p>
      <p class="coaches-team-info-desc">${team.description}</p>
    `
    infoEl.classList.remove('is-fading')
  }, 200)
}

function setupCoachCarouselControls() {
  const prevBtn = document.getElementById('coachesCarouselPrev')
  const nextBtn = document.getElementById('coachesCarouselNext')
  const carouselEl = document.getElementById('coachesCarousel')

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      coachTeamActiveIndex = (coachTeamActiveIndex - 1 + currentCoachTeams.length) % currentCoachTeams.length
      updateCoachTeamCarousel()
    })
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      coachTeamActiveIndex = (coachTeamActiveIndex + 1) % currentCoachTeams.length
      updateCoachTeamCarousel()
    })
  }

  if (carouselEl) {
    let touchStartX = 0
    const SWIPE_THRESHOLD = 50

    carouselEl.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX
    }, { passive: true })

    carouselEl.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].screenX
      if (Math.abs(diff) > SWIPE_THRESHOLD) {
        if (diff > 0) {
          coachTeamActiveIndex = (coachTeamActiveIndex + 1) % currentCoachTeams.length
        } else {
          coachTeamActiveIndex = (coachTeamActiveIndex - 1 + currentCoachTeams.length) % currentCoachTeams.length
        }
        updateCoachTeamCarousel()
      }
    }, { passive: true })
  }

}

// --- Contact form ---
const contactForm = document.getElementById('contactForm')

contactForm.addEventListener('submit', (e) => {
  e.preventDefault()

  const formData = new FormData(contactForm)
  const name = formData.get('name')

  contactForm.innerHTML = `
    <div class="form-success">
      <h3>MESSAGE SENT!</h3>
      <p>Thanks ${name}! We'll get back to you within 24 hours.</p>
    </div>
  `
})

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
// INSTAGRAM FEED
// ============================================
const IG_TOKEN = 'EAAmC0evJQjYBQosf0F6ZBvUOeMnJ9qumI9RmBp67lTk8ZBcG8YTkrwiFI9WgoElOPR6bKqVXjamKLM7eXS6f5H3cyqHh1JjXSXOShoOxzwK85kGoS5Ge1XZCr4LsWMI5ZCoZAxewLejgZC8OyQsVQexr6Qrldu3Euxe3FJW3gbk1nH2mmlWkSRYZAIJQvjK1hBuSZAljnhZC78KOGaJZAAFF7GkGLsOGt2M5qr6gyG'
const IG_ACCOUNT_ID = '17841478778350197'
const IG_POST_COUNT = 9

let igPosts = []
let igActiveIndex = 0

async function loadInstagramFeed() {
  const track = document.getElementById('igCarouselTrack')
  if (!track) return

  if (IG_TOKEN === 'YOUR_INSTAGRAM_ACCESS_TOKEN') {
    track.innerHTML = `
      <div class="ig-feed-error">
        <p>Instagram feed not configured yet.</p>
        <a href="https://instagram.com/fantasmafootball" target="_blank" rel="noopener noreferrer">Visit @fantasmafootball</a>
      </div>
    `
    return
  }

  try {
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${IG_ACCOUNT_ID}/media?fields=${fields}&limit=${IG_POST_COUNT}&access_token=${IG_TOKEN}`
    )
    if (!res.ok) throw new Error(`API error: ${res.status}`)

    const data = await res.json()
    if (!data.data || data.data.length === 0) throw new Error('No posts')

    igPosts = data.data
    renderIGCarousel()
  } catch (err) {
    console.error('Instagram feed:', err)
    track.innerHTML = `
      <div class="ig-feed-error">
        <p>Couldn't load the feed right now.</p>
        <a href="https://instagram.com/fantasmafootball" target="_blank" rel="noopener noreferrer">View on Instagram</a>
      </div>
    `
  }
}

function getCarouselMetrics() {
  const container = document.getElementById('igCarousel')
  const width = container ? container.offsetWidth : 400
  const ratio = Math.min(width / 400, 1)
  return {
    offset1: Math.round(180 * ratio),
    offset2: Math.round(150 * ratio)
  }
}

function renderIGCarousel() {
  const track = document.getElementById('igCarouselTrack')
  const dots = document.getElementById('igCarouselDots')
  const loading = document.getElementById('igFeedLoading')

  if (loading) loading.style.display = 'none'

  track.innerHTML = igPosts.map((post, i) => {
    const isVideo = post.media_type === 'VIDEO'
    const isCarousel = post.media_type === 'CAROUSEL_ALBUM'
    const thumb = isVideo ? post.thumbnail_url : post.media_url

    return `
      <div class="ig-carousel-card" data-ig-index="${i}">
        <img src="${thumb}" alt="" loading="lazy" />
        ${isVideo ? `
          <div class="ig-media-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
          <div class="ig-play-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21"/></svg>
          </div>
        ` : ''}
        ${isCarousel ? `
          <div class="ig-media-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M7 21h10a4 4 0 0 0 4-4V7"/></svg>
          </div>
        ` : ''}
      </div>
    `
  }).join('')

  dots.innerHTML = igPosts.map((_, i) =>
    `<button class="ig-carousel-dot${i === 0 ? ' is-active' : ''}" data-dot-index="${i}" aria-label="Go to post ${i + 1}"></button>`
  ).join('')

  // Click handlers for cards
  track.querySelectorAll('.ig-carousel-card').forEach(card => {
    card.addEventListener('click', () => {
      const index = parseInt(card.dataset.igIndex)
      if (index === igActiveIndex) {
        openIGLightbox(igPosts[index])
      } else {
        igActiveIndex = index
        updateCarousel()
      }
    })
  })

  // Click handlers for dots
  dots.querySelectorAll('.ig-carousel-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      igActiveIndex = parseInt(dot.dataset.dotIndex)
      updateCarousel()
    })
  })

  updateCarousel()
}

function updateCarousel() {
  const cards = document.querySelectorAll('.ig-carousel-card')
  const dots = document.querySelectorAll('.ig-carousel-dot')
  const prevBtn = document.getElementById('igCarouselPrev')
  const nextBtn = document.getElementById('igCarouselNext')
  const metrics = getCarouselMetrics()

  const total = igPosts.length

  cards.forEach(card => {
    const index = parseInt(card.dataset.igIndex)
    // Circular offset: find the shortest path around the loop
    let offset = index - igActiveIndex
    if (offset > total / 2) offset -= total
    if (offset < -total / 2) offset += total

    let translateX, scale, opacity, rotateY, zIndex, brightness

    if (offset === 0) {
      translateX = 0; scale = 1; opacity = 1; rotateY = 0; zIndex = 3; brightness = 1
    } else if (Math.abs(offset) === 1) {
      translateX = offset * metrics.offset1
      scale = 0.82; opacity = 0.55; rotateY = offset * -4; zIndex = 2; brightness = 0.85
    } else if (Math.abs(offset) === 2) {
      translateX = offset * metrics.offset2
      scale = 0.65; opacity = 0.2; rotateY = offset * -6; zIndex = 1; brightness = 0.7
    } else {
      translateX = offset * 100; scale = 0.5; opacity = 0; zIndex = 0; brightness = 1
    }

    card.style.transform = `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`
    card.style.opacity = opacity
    card.style.zIndex = zIndex
    card.style.filter = brightness < 1 ? `brightness(${brightness})` : ''
    card.classList.toggle('is-active', offset === 0)
  })

  dots.forEach(dot => {
    dot.classList.toggle('is-active', parseInt(dot.dataset.dotIndex) === igActiveIndex)
  })

  if (prevBtn) prevBtn.disabled = false
  if (nextBtn) nextBtn.disabled = false
}

function openIGLightbox(post) {
  const lightbox = document.getElementById('igLightbox')
  const media = document.getElementById('igLightboxMedia')
  const info = document.getElementById('igLightboxInfo')

  if (post.media_type === 'VIDEO') {
    media.innerHTML = `<video src="${post.media_url}" controls autoplay playsinline></video>`
  } else {
    media.innerHTML = `<img src="${post.media_url}" alt="" />`
  }

  const caption = post.caption
    ? `<p>${post.caption.length > 200 ? post.caption.substring(0, 200) + '...' : post.caption}</p>`
    : ''

  info.innerHTML = `
    ${caption}
    <a href="${post.permalink}" target="_blank" rel="noopener noreferrer">View on Instagram &rarr;</a>
  `

  lightbox.classList.add('active')
  document.body.style.overflow = 'hidden'
}

function closeIGLightbox() {
  const lightbox = document.getElementById('igLightbox')
  const media = document.getElementById('igLightboxMedia')

  lightbox.classList.remove('active')
  document.body.style.overflow = ''

  const video = media.querySelector('video')
  if (video) video.pause()
}

// Lightbox event listeners
const igLightbox = document.getElementById('igLightbox')
if (igLightbox) {
  igLightbox.querySelector('.ig-lightbox-close').addEventListener('click', closeIGLightbox)
  igLightbox.querySelector('.ig-lightbox-backdrop').addEventListener('click', closeIGLightbox)
}

// Carousel arrow listeners
const igCarouselPrev = document.getElementById('igCarouselPrev')
const igCarouselNext = document.getElementById('igCarouselNext')

if (igCarouselPrev) {
  igCarouselPrev.addEventListener('click', () => {
    igActiveIndex = (igActiveIndex - 1 + igPosts.length) % igPosts.length
    updateCarousel()
  })
}

if (igCarouselNext) {
  igCarouselNext.addEventListener('click', () => {
    igActiveIndex = (igActiveIndex + 1) % igPosts.length
    updateCarousel()
  })
}

// Keyboard navigation (arrows + escape)
document.addEventListener('keydown', (e) => {
  if (igLightbox && igLightbox.classList.contains('active')) {
    if (e.key === 'Escape') closeIGLightbox()
    return
  }

  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    // Determine which carousel to navigate based on viewport visibility
    const coachesSection = document.getElementById('coaches')
    const aboutSection = document.getElementById('about')
    let coachesInView = false
    let igInView = false

    if (coachesSection) {
      const rect = coachesSection.getBoundingClientRect()
      coachesInView = rect.top < window.innerHeight && rect.bottom > 0
    }
    if (aboutSection) {
      const rect = aboutSection.getBoundingClientRect()
      igInView = rect.top < window.innerHeight && rect.bottom > 0
    }

    if (coachesInView && currentCoachTeams.length > 0) {
      if (e.key === 'ArrowLeft') {
        coachTeamActiveIndex = (coachTeamActiveIndex - 1 + currentCoachTeams.length) % currentCoachTeams.length
      } else {
        coachTeamActiveIndex = (coachTeamActiveIndex + 1) % currentCoachTeams.length
      }
      updateCoachTeamCarousel()
    } else if (igInView && igPosts.length > 0) {
      if (e.key === 'ArrowLeft') {
        igActiveIndex = (igActiveIndex - 1 + igPosts.length) % igPosts.length
      } else {
        igActiveIndex = (igActiveIndex + 1) % igPosts.length
      }
      updateCarousel()
    }
  }
})

// Touch swipe support
const carouselEl = document.getElementById('igCarousel')
if (carouselEl) {
  let touchStartX = 0
  const SWIPE_THRESHOLD = 50

  carouselEl.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX
  }, { passive: true })

  carouselEl.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) {
        igActiveIndex = (igActiveIndex + 1) % igPosts.length
      } else {
        igActiveIndex = (igActiveIndex - 1 + igPosts.length) % igPosts.length
      }
      updateCarousel()
    }
  }, { passive: true })
}

// Recalculate on resize
let igResizeTimer
window.addEventListener('resize', () => {
  clearTimeout(igResizeTimer)
  igResizeTimer = setTimeout(() => {
    if (igPosts.length > 0) updateCarousel()
  }, 150)
})

initCoaches()
loadInstagramFeed()
