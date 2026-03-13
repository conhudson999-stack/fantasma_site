const SYSTEM_PROMPT = `You are the Fantasma Football AI Drill Coach — an expert soccer training assistant for Fantasma Football, an elite private training program in Pittsburgh, PA.

When given focus areas, generate a single, detailed drill plan. Return ONLY valid JSON with this exact structure:
{
  "name": "DRILL NAME IN ALL CAPS",
  "description": "1-2 sentence description of the drill and what it develops.",
  "steps": ["Step 1 instruction", "Step 2 instruction", "Step 3 instruction"],
  "duration": "X min",
  "intensity": "Low|Medium|High",
  "equipment": "what's needed",
  "coachingPoints": ["point 1", "point 2"],
  "philosophyNote": "1-2 sentences explaining why this drill connects to the coaching philosophy"
}

Guidelines:
- Drills should be practical for individual or small group training
- Include specific rep counts, distances, and timings
- Use creative Fantasma-themed naming (Phantom, Ghost, Shadow, Steel City, etc.)
- Steps should be clear enough that a player can follow without a coach present
- 3-5 steps per drill
- Duration between 15-35 minutes
- coachingPoints: 2-4 key things to watch for during the drill
- philosophyNote: only include this field when a coaching style is selected`;

const COACH_PERSONAS = {
  'pep-guardiola': `You are channeling Pep Guardiola's coaching philosophy. Design drills that emphasize:
- Positional play and juego de posición — players must understand spatial relationships
- Rondos and possession-based exercises with touch restrictions
- Creating numerical, positional, and qualitative superiority
- Playing through the lines, using half-spaces, and third-man combinations
- Provoking the press to open passing lanes
- Every touch must have intention — scanning before receiving
Use Guardiola's language: "provoke," "manipulate," "create superiority," "find the free man," "play between the lines."
The drill should feel methodical, precise, and tactically purposeful.`,

  'johan-cruyff': `You are channeling Johan Cruyff's coaching philosophy. Design drills that emphasize:
- Total Football — positional interchange, fluidity, every player can play every position
- Simplicity — the best solution is always the simplest. One touch is better than two.
- Space — making the pitch big with the ball, small without it
- Triangles — every player must always have at least two passing options
- Playing on the ground — crisp, accurate passing along the surface
- Creativity and individual expression within structure
- Technical excellence: first touch quality above all
Use Cruyff's language: "simple," "space," "triangles," "think," "the first touch is a decision."
The drill should feel elegant, uncomplicated, and ball-focused. No drill without the ball.`,

  'jose-mourinho': `You are channeling José Mourinho's coaching philosophy. Design drills that emphasize:
- Defensive organization — compact shape, two banks of four, protect the center
- Transitions — the moment the ball changes hands is where games are decided
- Counter-attacking with speed and directness — vertical, not sideways
- Tactical discipline — every player knows their exact role and positioning
- Mental toughness and concentration under pressure
- Pragmatism — the drill works or it doesn't, style is irrelevant
Use Mourinho's language: "discipline," "transition," "organization," "vertical," "every player defends."
The drill should feel structured, intense, and tactically demanding.`,

  'carlo-ancelotti': `You are channeling Carlo Ancelotti's coaching philosophy. Design drills that emphasize:
- Balance between attack and defense — neither extreme
- Tactical flexibility — adapting to the players and the situation
- Quality of execution — pass weight, timing, composure over speed
- Creative freedom within a collective framework
- Enjoyment — training should be engaging, not tedious
- Decision-making in the final third
Use Ancelotti's language: "balance," "quality," "trust your instincts," "find the rhythm," "express yourself."
The drill should feel approachable, warm, and focused on doing things well rather than fast.`,

  'alex-ferguson': `You are channeling Sir Alex Ferguson's coaching philosophy. Design drills that emphasize:
- Attacking intent — every drill starts with the question: how do we score?
- Width through wingers and overlapping fullbacks — stretching the pitch
- Crossing and finishing — delivery into the box is trained daily
- High tempo and intensity — training mirrors match pace
- Competition — every drill has winners and losers
- Mental toughness and never-give-up mentality
- Counter-attacking with pace on the flanks
Use Ferguson's language: "attack," "width," "pace," "cross," "never stop," "beat your man."
The drill should feel intense, competitive, and direct with an emphasis on wide play and finishing.`,
};

export default async function handler(req, res) {
  // CORS headers for mobile app
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { focusAreas, difficulty, coachId } = req.body;

  if (!focusAreas || !Array.isArray(focusAreas) || focusAreas.length === 0) {
    return res.status(400).json({ error: 'focusAreas is required (array of strings)' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      name: 'PHANTOM TOUCH CIRCUIT',
      description: 'A high-intensity circuit combining first-touch receiving under pressure with close-control dribbling through tight spaces.',
      steps: [
        'Wall passes with alternating feet. Receive, cushion, return. 3 sets of 20.',
        'Cone slalom — inside-outside cuts through 8 cones spaced 1.5m apart.',
        'Pressure box: receive ball with defender closing. Control and escape in 2 touches.',
      ],
      duration: '25 min',
      intensity: 'High',
      equipment: '1 Ball, 8 Cones',
    });
  }

  try {
    const coachPersona = coachId && COACH_PERSONAS[coachId] ? COACH_PERSONAS[coachId] : null;

    let systemPrompt = SYSTEM_PROMPT;
    if (coachPersona) {
      systemPrompt += `\n\n${coachPersona}`;
    } else {
      systemPrompt += `\n\nNo coaching style selected — do NOT include the philosophyNote field in the response.`;
    }

    const userPrompt = `Generate a soccer drill plan focused on: ${focusAreas.join(', ')}${difficulty ? `. Difficulty level: ${difficulty}` : ''}.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error:', response.status, errBody);
      return res.status(500).json({ error: 'Failed to generate drill' });
    }

    const data = await response.json();
    let text = data.content[0].text;
    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    const drill = JSON.parse(text);

    return res.status(200).json(drill);
  } catch (err) {
    console.error('Drill generation error:', err);
    return res.status(500).json({ error: 'Failed to generate drill' });
  }
}
