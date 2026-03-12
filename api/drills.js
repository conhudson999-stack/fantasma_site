const DRILLS = [
  {
    id: '1',
    name: 'PHANTOM TOUCH CIRCUIT',
    description: 'A high-intensity circuit combining first-touch receiving under pressure with close-control dribbling through tight spaces.',
    difficulty: 'Advanced',
    duration: '25 min',
    equipment: '1 ball, 8 cones',
    category: 'Dribbling',
    steps: [
      'Wall passes with alternating feet. Receive, cushion, return. 3 sets of 20.',
      'Cone slalom — inside-outside cuts through 8 cones spaced 1.5m apart.',
      'Pressure box: receive ball with defender closing. Control and escape in 2 touches.',
    ],
  },
  {
    id: '2',
    name: 'LADDER SPEED BURN',
    description: 'Quick-feet agility ladder workout targeting footwork speed and coordination.',
    difficulty: 'Beginner',
    duration: '15 min',
    equipment: 'Agility ladder',
    category: 'Fitness',
    steps: [
      'Single-step through: one foot per rung, full speed. 4 reps.',
      'Lateral shuffle: face sideways, two feet per rung. 4 reps each direction.',
      'In-out hop: jump in with both feet, jump out, advance one rung. 4 reps.',
    ],
  },
  {
    id: '3',
    name: 'FINISHING UNDER PRESSURE',
    description: 'Simulated game scenarios for clinical finishing when time and space are limited.',
    difficulty: 'Intermediate',
    duration: '20 min',
    equipment: '4 cones, goal, balls',
    category: 'Shooting',
    steps: [
      'Receive pass at edge of box, one touch to set, one touch to finish. 10 reps each foot.',
      'Sprint to cone, cut inside, shoot far post. Alternate sides. 8 reps.',
      'Back-to-goal receiving: chest down, turn, finish. 6 reps.',
    ],
  },
  {
    id: '4',
    name: 'DEFENSIVE RECOVERY',
    description: 'Transition defending drills focused on recovery runs and 1v1 containment.',
    difficulty: 'Advanced',
    duration: '30 min',
    equipment: '6 cones',
    category: 'Defending',
    steps: [
      'Backpedal sprint: start forward, coach signals, backpedal to cone, then sprint. 6 reps.',
      'Shadow defending: mirror attacker movements without ball for 30 seconds. 5 sets.',
      '1v1 channel: contain attacker in 10m wide channel. Deny the turn. 8 reps.',
    ],
  },
  {
    id: '5',
    name: 'STEEL CITY RONDO',
    description: '5v2 keep-away with positional rotations. Develops passing under pressure and quick decision-making.',
    difficulty: 'Intermediate',
    duration: '20 min',
    equipment: '1 ball, bibs',
    category: 'Passing',
    steps: [
      'Set up 12m x 12m grid. 5 outside, 2 inside.',
      '2-touch maximum for outside players. Defender who wins ball swaps with passer.',
      'Every 3 minutes, rotate positions. Focus on body shape and first-touch direction.',
    ],
  },
  {
    id: '6',
    name: 'CLOSE CONTROL MAZE',
    description: 'Tight-space dribbling through a cone maze testing control at speed.',
    difficulty: 'Advanced',
    duration: '20 min',
    equipment: '10 cones, 1 ball',
    category: 'Dribbling',
    steps: [
      'Set up random cone pattern in 15m x 15m area. Dribble through all cones using sole rolls only.',
      'Repeat using inside-outside cuts only. Time each run.',
      'Add defender: navigate maze while shielding ball. 4 reps.',
    ],
  },
  {
    id: '7',
    name: 'WALL PASS COMBOS',
    description: 'Wall-based passing drill to sharpen one-touch technique and weight of pass.',
    difficulty: 'Beginner',
    duration: '15 min',
    equipment: 'Wall, 1 ball',
    category: 'Passing',
    steps: [
      'Stand 3m from wall. Alternate feet, one-touch passing. 3 sets of 30.',
      'Move to 5m. Driven pass with laces, cushion control on return. 3 sets of 20.',
      'Add movement: pass, shuffle left/right 2m, receive return. 3 sets of 15.',
    ],
  },
  {
    id: '8',
    name: 'SPRINT & SHOOT',
    description: 'Combines explosive sprinting with finishing to simulate breakaway goals.',
    difficulty: 'Intermediate',
    duration: '25 min',
    equipment: '4 cones, goal, balls',
    category: 'Shooting',
    steps: [
      'Sprint 20m to ball placed at edge of box. First-time finish. 8 reps.',
      'Sprint around cone, receive through ball, finish 1v1 vs imaginary keeper. 8 reps.',
      'Sprint relay: 3 sprints with a finish at the end of each. 4 sets.',
    ],
  },
  {
    id: '9',
    name: 'VISION SCANNING DRILL',
    description: 'Develops awareness and scanning habit before receiving the ball.',
    difficulty: 'Intermediate',
    duration: '20 min',
    equipment: '4 cones, 2 balls, bibs',
    category: 'Passing',
    steps: [
      'Stand in center of 4 cones. Coach holds up fingers — call number before receiving pass.',
      'Add movement: check to ball, scan, receive, play to cone matching number. 10 reps.',
      'Game scenario: 3v1 with scanning required before every pass. 5 min rounds.',
    ],
  },
  {
    id: '10',
    name: 'IRON LEGS CIRCUIT',
    description: 'Lower body strength and power circuit for explosive acceleration.',
    difficulty: 'Advanced',
    duration: '30 min',
    equipment: 'Cones, resistance band (optional)',
    category: 'Fitness',
    steps: [
      'Jump squats: 3 sets of 12. 30 seconds rest between sets.',
      'Single-leg bounds: 20m distance, 4 reps each leg.',
      'Box step-ups (use bench or wall): 3 sets of 10 each leg. Finish with 4x20m sprints.',
    ],
  },
];

export default function handler(req, res) {
  // Set CORS headers for the mobile app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { category, search } = req.query;

  let filtered = DRILLS;

  if (category && category !== 'All') {
    filtered = filtered.filter(d => d.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(d =>
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q)
    );
  }

  // Pick a featured drill (rotate weekly based on week number)
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const featured = DRILLS[weekNum % DRILLS.length];

  return res.status(200).json({ drills: filtered, featured });
}
