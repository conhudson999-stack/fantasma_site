import './style.css'
import './shared.js'

// ============================================
// FORMATION BUILDER
// ============================================

// --- Formation data ---
// Positions are defined as percentages [x%, y%] on the pitch
// y: 0% = top (opponent goal), 100% = bottom (our goal)
const FORMATIONS = {
  '4-4-2': {
    label: '4-4-2',
    positions: [
      { x: 50, y: 92, pos: 'GK' },
      { x: 15, y: 75, pos: 'LB' },
      { x: 38, y: 78, pos: 'CB' },
      { x: 62, y: 78, pos: 'CB' },
      { x: 85, y: 75, pos: 'RB' },
      { x: 15, y: 52, pos: 'LM' },
      { x: 38, y: 55, pos: 'CM' },
      { x: 62, y: 55, pos: 'CM' },
      { x: 85, y: 52, pos: 'RM' },
      { x: 36, y: 28, pos: 'ST' },
      { x: 64, y: 28, pos: 'ST' },
    ],
  },
  '4-3-3': {
    label: '4-3-3',
    positions: [
      { x: 50, y: 92, pos: 'GK' },
      { x: 15, y: 75, pos: 'LB' },
      { x: 38, y: 78, pos: 'CB' },
      { x: 62, y: 78, pos: 'CB' },
      { x: 85, y: 75, pos: 'RB' },
      { x: 30, y: 55, pos: 'CM' },
      { x: 50, y: 50, pos: 'CM' },
      { x: 70, y: 55, pos: 'CM' },
      { x: 18, y: 28, pos: 'LW' },
      { x: 50, y: 22, pos: 'ST' },
      { x: 82, y: 28, pos: 'RW' },
    ],
  },
  '4-2-3-1': {
    label: '4-2-3-1',
    positions: [
      { x: 50, y: 92, pos: 'GK' },
      { x: 15, y: 75, pos: 'LB' },
      { x: 38, y: 78, pos: 'CB' },
      { x: 62, y: 78, pos: 'CB' },
      { x: 85, y: 75, pos: 'RB' },
      { x: 38, y: 60, pos: 'CDM' },
      { x: 62, y: 60, pos: 'CDM' },
      { x: 18, y: 40, pos: 'LW' },
      { x: 50, y: 38, pos: 'CAM' },
      { x: 82, y: 40, pos: 'RW' },
      { x: 50, y: 20, pos: 'ST' },
    ],
  },
  '3-5-2': {
    label: '3-5-2',
    positions: [
      { x: 50, y: 92, pos: 'GK' },
      { x: 25, y: 78, pos: 'CB' },
      { x: 50, y: 80, pos: 'CB' },
      { x: 75, y: 78, pos: 'CB' },
      { x: 10, y: 52, pos: 'LWB' },
      { x: 35, y: 58, pos: 'CM' },
      { x: 50, y: 52, pos: 'CM' },
      { x: 65, y: 58, pos: 'CM' },
      { x: 90, y: 52, pos: 'RWB' },
      { x: 38, y: 26, pos: 'ST' },
      { x: 62, y: 26, pos: 'ST' },
    ],
  },
  '3-4-3': {
    label: '3-4-3',
    positions: [
      { x: 50, y: 92, pos: 'GK' },
      { x: 25, y: 78, pos: 'CB' },
      { x: 50, y: 80, pos: 'CB' },
      { x: 75, y: 78, pos: 'CB' },
      { x: 15, y: 55, pos: 'LM' },
      { x: 40, y: 58, pos: 'CM' },
      { x: 60, y: 58, pos: 'CM' },
      { x: 85, y: 55, pos: 'RM' },
      { x: 18, y: 28, pos: 'LW' },
      { x: 50, y: 22, pos: 'ST' },
      { x: 82, y: 28, pos: 'RW' },
    ],
  },
  '4-5-1': {
    label: '4-5-1',
    positions: [
      { x: 50, y: 92, pos: 'GK' },
      { x: 15, y: 75, pos: 'LB' },
      { x: 38, y: 78, pos: 'CB' },
      { x: 62, y: 78, pos: 'CB' },
      { x: 85, y: 75, pos: 'RB' },
      { x: 12, y: 48, pos: 'LM' },
      { x: 33, y: 55, pos: 'CM' },
      { x: 50, y: 50, pos: 'CDM' },
      { x: 67, y: 55, pos: 'CM' },
      { x: 88, y: 48, pos: 'RM' },
      { x: 50, y: 22, pos: 'ST' },
    ],
  },
}

// --- Position info data ---
const POSITION_INFO = {
  GK: {
    name: 'Goalkeeper',
    role: 'Last line of defense. Commands the box, organizes the backline, and distributes to start attacks.',
    skills: ['Shot stopping & reflexes', 'Positioning & angles', 'Distribution (short & long)', 'Communication & leadership'],
    training: 'Focus on footwork, diving technique, and building confidence with the ball at your feet. Our 1-on-1 sessions develop your decision-making under pressure.',
  },
  CB: {
    name: 'Center Back',
    role: 'Anchors the defense. Reads the game, wins aerial duels, and plays out from the back.',
    skills: ['Tackling & interceptions', 'Aerial dominance', 'Composure on the ball', 'Positional awareness'],
    training: 'Work on your passing range, defensive positioning, and ability to step into midfield with the ball. We build defenders who can play.',
  },
  LB: {
    name: 'Left Back',
    role: 'Defends the flank and overlaps to create width in attack. Modern fullbacks are essentially wingers who can defend.',
    skills: ['1v1 defending', 'Overlapping runs & crossing', 'Recovery pace', 'Stamina & work rate'],
    training: 'Develop your attacking contribution while maintaining defensive discipline. Sessions focus on crossing technique and transition play.',
  },
  RB: {
    name: 'Right Back',
    role: 'Defends the right side and provides attacking width. Combines with the winger and links defense to attack.',
    skills: ['1v1 defending', 'Overlapping runs & crossing', 'Recovery pace', 'Stamina & work rate'],
    training: 'Develop your attacking contribution while maintaining defensive discipline. Sessions focus on crossing technique and transition play.',
  },
  LWB: {
    name: 'Left Wing Back',
    role: 'Covers the entire left flank. More attacking than a fullback but still responsible for defensive duties in a 3-at-the-back system.',
    skills: ['Endurance & engine', 'Crossing & final ball', 'Defensive awareness', 'Pace & dribbling'],
    training: 'Build the engine and technical ability to dominate the flank. We focus on your final ball quality and tactical positioning.',
  },
  RWB: {
    name: 'Right Wing Back',
    role: 'Covers the entire right flank. Provides width and attacking threat while tracking back to form a back five.',
    skills: ['Endurance & engine', 'Crossing & final ball', 'Defensive awareness', 'Pace & dribbling'],
    training: 'Build the engine and technical ability to dominate the flank. We focus on your final ball quality and tactical positioning.',
  },
  CDM: {
    name: 'Defensive Midfielder',
    role: 'The shield in front of the defense. Breaks up play, wins the ball back, and keeps things simple.',
    skills: ['Reading the game', 'Tackling & pressing', 'Short passing & recycling', 'Positional discipline'],
    training: 'Sharpen your ability to read passing lanes, time tackles, and distribute quickly. We develop the football IQ that makes elite CDMs.',
  },
  CM: {
    name: 'Central Midfielder',
    role: 'The engine room. Links defense to attack, controls tempo, and contributes in both halves.',
    skills: ['Passing range (short & long)', 'Box-to-box running', 'Vision & awareness', 'Ball retention under pressure'],
    training: 'Improve your ability to receive under pressure, switch play, and arrive late in the box. Complete midfielders are made in training.',
  },
  CAM: {
    name: 'Attacking Midfielder',
    role: 'The creative hub. Finds pockets of space, plays the killer pass, and links the midfield to the forwards.',
    skills: ['Vision & creativity', 'Final ball & through passes', 'Dribbling in tight spaces', 'Movement between the lines'],
    training: 'Develop your ability to unlock defenses with a pass or a dribble. We work on your movement, touch, and decision-making in the final third.',
  },
  LM: {
    name: 'Left Midfielder',
    role: 'Works the left side from box to box. Provides width, delivers crosses, and tracks back to defend.',
    skills: ['Crossing & delivery', 'Work rate & stamina', 'Dribbling & 1v1', 'Defensive tracking'],
    training: 'Balance your attacking flair with defensive responsibility. Sessions focus on beating your man, delivering quality crosses, and game intelligence.',
  },
  RM: {
    name: 'Right Midfielder',
    role: 'Works the right side from box to box. Combines pace with work rate to influence both halves.',
    skills: ['Crossing & delivery', 'Work rate & stamina', 'Dribbling & 1v1', 'Defensive tracking'],
    training: 'Balance your attacking flair with defensive responsibility. Sessions focus on beating your man, delivering quality crosses, and game intelligence.',
  },
  LW: {
    name: 'Left Winger',
    role: 'Stretches the defense with pace and trickery. Cuts inside to shoot or stays wide to cross.',
    skills: ['Pace & acceleration', 'Dribbling & skill moves', 'Finishing & shooting', 'Creating chances'],
    training: 'Master the art of beating defenders. We train your finishing, crossing, and ability to make things happen in 1v1 situations.',
  },
  RW: {
    name: 'Right Winger',
    role: 'Attacks from the right side with speed and directness. A constant threat who keeps defenders guessing.',
    skills: ['Pace & acceleration', 'Dribbling & skill moves', 'Finishing & shooting', 'Creating chances'],
    training: 'Master the art of beating defenders. We train your finishing, crossing, and ability to make things happen in 1v1 situations.',
  },
  ST: {
    name: 'Striker',
    role: 'The goalscorer. Lives for putting the ball in the net. Makes intelligent runs and finishes chances.',
    skills: ['Clinical finishing', 'Movement & runs', 'Hold-up play & link-up', 'Heading & aerial ability'],
    training: 'Sharpen your finishing, improve your movement off the ball, and learn to create space in the box. Strikers are made on the training ground.',
  },
}

// --- Arrow config ---
const ARROW_STYLES = {
  pass: { color: '#C5B358', width: 2.5, dash: '8 5', marker: 'ah-pass' },
  dribble: { color: '#4FC3F7', width: 2.5, dash: '', marker: 'ah-dribble', wavy: true },
  run: { color: '#FF7043', width: 3, dash: '', marker: 'ah-run' },
}

// --- State ---
let currentFormation = '4-3-3'
let opponentFormation = '4-4-2'
let players = []
let opponentPlayers = []
let showOpponent = false
let youIndex = -1
let selectedIndex = -1
let draggingIndex = -1
let draggingTeam = 'own' // 'own' or 'opponent'
let dragOffset = { x: 0, y: 0 }

// Arrows state
let arrows = []
let activeArrowTool = null // 'pass' | 'dribble' | 'run' | null
let arrowPlacingStart = null // {x, y} in percent
let selectedArrowIndex = -1

// --- DOM refs ---
const pitch = document.getElementById('pitch')
const pitchPlayers = document.getElementById('pitchPlayers')
const pitchArrows = document.getElementById('pitchArrows')
const formationGrid = document.getElementById('formationSelectGrid')
const opponentFormationGrid = document.getElementById('opponentFormationGrid')
const opponentToggle = document.getElementById('opponentToggle')
const opponentFormationSelect = document.getElementById('opponentFormationSelect')
const positionPanel = document.getElementById('positionPanel')
const positionTitle = document.getElementById('positionTitle')
const positionRole = document.getElementById('positionRole')
const positionSkills = document.getElementById('positionSkills')
const positionTraining = document.getElementById('positionTraining')
const youInfo = document.getElementById('youInfo')
const youPosition = document.getElementById('youPosition')
const clearYouBtn = document.getElementById('clearYou')
const resetBtn = document.getElementById('resetBtn')
const shareBtn = document.getElementById('shareBtn')
const arrowToolbar = document.getElementById('arrowToolbar')
const clearArrowsBtn = document.getElementById('clearArrowsBtn')

// ============================================
// FORMATION SELECTOR
// ============================================
function renderFormationSelector() {
  formationGrid.innerHTML = Object.keys(FORMATIONS).map(key => {
    const f = FORMATIONS[key]
    const active = key === currentFormation ? ' formation-btn--active' : ''
    return `<button class="formation-btn${active}" data-formation="${key}">${f.label}</button>`
  }).join('')

  formationGrid.querySelectorAll('.formation-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFormation = btn.dataset.formation
      youIndex = -1
      selectedIndex = -1
      loadFormation()
      renderFormationSelector()
      updateYouInfo()
      hidePositionPanel()
    })
  })
}

function renderOpponentFormationSelector() {
  opponentFormationGrid.innerHTML = Object.keys(FORMATIONS).map(key => {
    const f = FORMATIONS[key]
    const active = key === opponentFormation ? ' formation-btn--active' : ''
    return `<button class="formation-btn${active}" data-formation="${key}">${f.label}</button>`
  }).join('')

  opponentFormationGrid.querySelectorAll('.formation-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      opponentFormation = btn.dataset.formation
      loadOpponentFormation()
      renderOpponentFormationSelector()
      renderAllPlayers()
    })
  })
}

// ============================================
// LOAD FORMATIONS
// ============================================
function loadFormation() {
  const formation = FORMATIONS[currentFormation]
  players = formation.positions.map(p => ({ ...p }))
  renderAllPlayers()
}

function loadOpponentFormation() {
  const formation = FORMATIONS[opponentFormation]
  // Mirror: flip y (100 - y) and swap L/R labels
  opponentPlayers = formation.positions.map(p => {
    const mirrored = { x: p.x, y: 100 - p.y, pos: p.pos }
    return mirrored
  })
}

// ============================================
// RENDER PLAYERS
// ============================================
function renderAllPlayers() {
  pitchPlayers.innerHTML = ''

  // Render own team
  players.forEach((player, i) => {
    const el = createPlayerElement(player, i, 'own')
    pitchPlayers.appendChild(el)
  })

  // Render opponent team if enabled
  if (showOpponent) {
    opponentPlayers.forEach((player, i) => {
      const el = createPlayerElement(player, i, 'opponent')
      pitchPlayers.appendChild(el)
    })
  }
}

function createPlayerElement(player, index, team) {
  const el = document.createElement('div')
  el.classList.add('pitch-player')
  if (team === 'opponent') el.classList.add('pitch-player--opponent')
  if (team === 'own' && index === youIndex) el.classList.add('pitch-player--you')
  if (team === 'own' && index === selectedIndex) el.classList.add('pitch-player--selected')

  el.style.left = `${player.x}%`
  el.style.top = `${player.y}%`

  const label = team === 'own' && index === youIndex ? 'YOU' : player.pos
  el.innerHTML = `
    <div class="pitch-player-dot"></div>
    <span class="pitch-player-label">${label}</span>
  `

  el.dataset.index = index
  el.dataset.team = team

  // Click handler (only for own team)
  el.addEventListener('click', (e) => {
    if (draggingIndex !== -1) return
    e.stopPropagation()
    if (team === 'own') handlePlayerClick(index)
  })

  // Drag support for both teams
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    startDrag(index, e, team)
  })

  return el
}

// ============================================
// PLAYER INTERACTION
// ============================================
function handlePlayerClick(index) {
  if (selectedIndex === index) {
    youIndex = index
    selectedIndex = -1
    updateYouInfo()
  } else {
    selectedIndex = index
  }
  renderAllPlayers()
  showPositionPanel(players[selectedIndex !== -1 ? selectedIndex : index].pos)
}

// ============================================
// DRAG LOGIC
// ============================================
function startDrag(index, e, team) {
  // Don't start drag if we're placing an arrow
  if (activeArrowTool) return

  draggingIndex = index
  draggingTeam = team
  const pitchRect = pitch.getBoundingClientRect()
  const source = team === 'own' ? players : opponentPlayers
  const playerX = (source[index].x / 100) * pitchRect.width
  const playerY = (source[index].y / 100) * pitchRect.height
  const pointerX = e.clientX - pitchRect.left
  const pointerY = e.clientY - pitchRect.top
  dragOffset.x = pointerX - playerX
  dragOffset.y = pointerY - playerY

  // Find the DOM element
  const allPlayerEls = pitchPlayers.querySelectorAll('.pitch-player')
  allPlayerEls.forEach(el => {
    if (parseInt(el.dataset.index) === index && el.dataset.team === team) {
      el.classList.add('pitch-player--dragging')
    }
  })

  document.addEventListener('pointermove', onDrag)
  document.addEventListener('pointerup', stopDrag)
}

function onDrag(e) {
  if (draggingIndex === -1) return
  const pitchRect = pitch.getBoundingClientRect()
  let x = ((e.clientX - pitchRect.left - dragOffset.x) / pitchRect.width) * 100
  let y = ((e.clientY - pitchRect.top - dragOffset.y) / pitchRect.height) * 100

  x = Math.max(5, Math.min(95, x))
  y = Math.max(4, Math.min(96, y))

  const source = draggingTeam === 'own' ? players : opponentPlayers
  source[draggingIndex].x = x
  source[draggingIndex].y = y

  // Update DOM directly for smooth drag
  const allPlayerEls = pitchPlayers.querySelectorAll('.pitch-player')
  allPlayerEls.forEach(el => {
    if (parseInt(el.dataset.index) === draggingIndex && el.dataset.team === draggingTeam) {
      el.style.left = `${x}%`
      el.style.top = `${y}%`
    }
  })
}

function stopDrag() {
  if (draggingIndex !== -1) {
    const allPlayerEls = pitchPlayers.querySelectorAll('.pitch-player')
    allPlayerEls.forEach(el => {
      if (parseInt(el.dataset.index) === draggingIndex && el.dataset.team === draggingTeam) {
        el.classList.remove('pitch-player--dragging')
      }
    })
  }
  draggingIndex = -1
  document.removeEventListener('pointermove', onDrag)
  document.removeEventListener('pointerup', stopDrag)
}

// ============================================
// OPPONENT TOGGLE
// ============================================
if (opponentToggle) {
  opponentToggle.addEventListener('change', () => {
    showOpponent = opponentToggle.checked
    opponentFormationSelect.style.display = showOpponent ? 'block' : 'none'
    if (showOpponent && opponentPlayers.length === 0) {
      loadOpponentFormation()
    }
    renderAllPlayers()
  })
}

// ============================================
// ARROWS
// ============================================

// Arrow tool selection
if (arrowToolbar) {
  arrowToolbar.querySelectorAll('.arrow-tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.arrow
      if (activeArrowTool === type) {
        // Deselect
        activeArrowTool = null
        arrowPlacingStart = null
        pitch.classList.remove('pitch--placing-arrow')
      } else {
        activeArrowTool = type
        arrowPlacingStart = null
        pitch.classList.add('pitch--placing-arrow')
      }
      updateArrowToolbarUI()
    })
  })
}

function updateArrowToolbarUI() {
  if (!arrowToolbar) return
  arrowToolbar.querySelectorAll('.arrow-tool-btn').forEach(btn => {
    btn.classList.toggle('arrow-tool-btn--active', btn.dataset.arrow === activeArrowTool)
  })
}

// Pitch click for arrow placement
if (pitch) {
  pitch.addEventListener('click', (e) => {
    if (activeArrowTool) {
      e.stopPropagation()
      const pitchRect = pitch.getBoundingClientRect()
      const x = ((e.clientX - pitchRect.left) / pitchRect.width) * 100
      const y = ((e.clientY - pitchRect.top) / pitchRect.height) * 100

      if (!arrowPlacingStart) {
        // First click: set start point
        arrowPlacingStart = { x, y }
      } else {
        // Second click: create arrow
        arrows.push({
          type: activeArrowTool,
          x1: arrowPlacingStart.x,
          y1: arrowPlacingStart.y,
          x2: x,
          y2: y,
        })
        arrowPlacingStart = null
        renderArrows()
        updateClearArrowsBtn()
      }
      return
    }

    // If not placing arrow, deselect player & arrow
    selectedIndex = -1
    selectedArrowIndex = -1
    renderAllPlayers()
    renderArrows()
    hidePositionPanel()
  })
}

function renderArrows() {
  if (!pitchArrows) return

  // Keep the defs element
  const defs = pitchArrows.querySelector('defs')
  pitchArrows.innerHTML = ''
  pitchArrows.appendChild(defs)

  arrows.forEach((arrow, i) => {
    const style = ARROW_STYLES[arrow.type]
    const isSelected = i === selectedArrowIndex
    let el

    if (style.wavy) {
      // Wavy line for dribble — path d-attr doesn't support %, so use pixels
      const svgRect = pitchArrows.getBoundingClientRect()
      const x1 = (arrow.x1 / 100) * svgRect.width
      const y1 = (arrow.y1 / 100) * svgRect.height
      const x2 = (arrow.x2 / 100) * svgRect.width
      const y2 = (arrow.y2 / 100) * svgRect.height

      const dx = x2 - x1
      const dy = y2 - y1
      const dist = Math.sqrt(dx * dx + dy * dy)
      const waves = Math.max(2, Math.round(dist / 30))
      const perpX = -dy / dist
      const perpY = dx / dist
      const amp = 8

      let d = `M ${x1} ${y1}`
      for (let w = 1; w <= waves; w++) {
        const t = w / waves
        const mx = x1 + dx * (t - 0.5 / waves)
        const my = y1 + dy * (t - 0.5 / waves)
        const dir = w % 2 === 1 ? 1 : -1
        const cx = mx + perpX * amp * dir
        const cy = my + perpY * amp * dir
        const ex = x1 + dx * t
        const ey = y1 + dy * t
        d += ` Q ${cx} ${cy} ${ex} ${ey}`
      }

      el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      el.setAttribute('d', d)
      el.setAttribute('fill', 'none')
    } else {
      el = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      el.setAttribute('x1', `${arrow.x1}%`)
      el.setAttribute('y1', `${arrow.y1}%`)
      el.setAttribute('x2', `${arrow.x2}%`)
      el.setAttribute('y2', `${arrow.y2}%`)
    }

    el.setAttribute('stroke', style.color)
    el.setAttribute('stroke-width', style.width)
    if (style.dash) el.setAttribute('stroke-dasharray', style.dash)
    el.setAttribute('marker-end', `url(#${style.marker})`)
    el.setAttribute('stroke-linecap', 'round')
    el.classList.add('pitch-arrow-line')
    if (isSelected) el.classList.add('pitch-arrow-line--selected')

    el.addEventListener('click', (e) => {
      e.stopPropagation()
      selectedArrowIndex = selectedArrowIndex === i ? -1 : i
      renderArrows()
    })

    pitchArrows.appendChild(el)
  })
}

function updateClearArrowsBtn() {
  if (clearArrowsBtn) {
    clearArrowsBtn.style.display = arrows.length > 0 ? 'block' : 'none'
  }
}

if (clearArrowsBtn) {
  clearArrowsBtn.addEventListener('click', () => {
    arrows = []
    selectedArrowIndex = -1
    renderArrows()
    updateClearArrowsBtn()
  })
}

// Delete selected arrow with Backspace/Delete
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  if ((e.key === 'Backspace' || e.key === 'Delete') && selectedArrowIndex !== -1) {
    e.preventDefault()
    arrows.splice(selectedArrowIndex, 1)
    selectedArrowIndex = -1
    renderArrows()
    updateClearArrowsBtn()
  }
  // Escape to cancel arrow placement or deselect tool
  if (e.key === 'Escape') {
    if (arrowPlacingStart) {
      arrowPlacingStart = null
    } else if (activeArrowTool) {
      activeArrowTool = null
      pitch.classList.remove('pitch--placing-arrow')
      updateArrowToolbarUI()
    }
  }
})

// ============================================
// POSITION PANEL
// ============================================
function showPositionPanel(pos) {
  const info = POSITION_INFO[pos]
  if (!info || !positionPanel) return

  positionTitle.textContent = info.name
  positionRole.textContent = info.role
  positionSkills.innerHTML = info.skills.map(s => `<li>${s}</li>`).join('')
  positionTraining.textContent = info.training
  positionPanel.style.display = 'block'
}

function hidePositionPanel() {
  if (positionPanel) positionPanel.style.display = 'none'
}

// ============================================
// YOU INFO
// ============================================
function updateYouInfo() {
  if (youIndex === -1) {
    youInfo.style.display = 'none'
    return
  }
  youInfo.style.display = 'flex'
  youPosition.textContent = POSITION_INFO[players[youIndex].pos]?.name || players[youIndex].pos
}

if (clearYouBtn) {
  clearYouBtn.addEventListener('click', () => {
    youIndex = -1
    updateYouInfo()
    renderAllPlayers()
  })
}

// ============================================
// RESET
// ============================================
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    youIndex = -1
    selectedIndex = -1
    selectedArrowIndex = -1
    arrows = []
    activeArrowTool = null
    arrowPlacingStart = null
    pitch.classList.remove('pitch--placing-arrow')
    loadFormation()
    if (showOpponent) loadOpponentFormation()
    updateYouInfo()
    hidePositionPanel()
    renderArrows()
    updateClearArrowsBtn()
    updateArrowToolbarUI()
  })
}

// ============================================
// SHARE
// ============================================
if (shareBtn) {
  shareBtn.addEventListener('click', async () => {
    const positionsList = players.map((p, i) => {
      return i === youIndex ? `YOU (${p.pos})` : p.pos
    }).join(', ')

    const shareText = `My Fantasma Formation: ${FORMATIONS[currentFormation].label}\n${positionsList}\n\nBuild yours at`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Fantasma Formation',
          text: shareText,
          url: window.location.href,
        })
        return
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareText} ${window.location.href}`)
      showShareToast()
    } catch {
      showShareToast()
    }
  })
}

function showShareToast() {
  const existing = document.querySelector('.share-toast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.classList.add('share-toast')
  toast.textContent = 'Copied to clipboard!'
  document.body.appendChild(toast)

  requestAnimationFrame(() => toast.classList.add('visible'))
  setTimeout(() => {
    toast.classList.remove('visible')
    setTimeout(() => toast.remove(), 300)
  }, 2000)
}

// ============================================
// INIT
// ============================================
renderFormationSelector()
renderOpponentFormationSelector()
loadFormation()
loadOpponentFormation()
