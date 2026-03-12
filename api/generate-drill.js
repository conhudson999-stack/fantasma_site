
const SYSTEM_PROMPT = `You are the Fantasma Football AI Drill Coach — an expert soccer training assistant for Fantasma Football, an elite private training program in Pittsburgh, PA.

When given focus areas, generate a single, detailed drill plan. Return ONLY valid JSON with this exact structure:
{
  "name": "DRILL NAME IN ALL CAPS",
  "description": "1-2 sentence description of the drill and what it develops.",
  "steps": ["Step 1 instruction", "Step 2 instruction", "Step 3 instruction"],
  "duration": "X min",
  "intensity": "Low|Medium|High",
  "equipment": "what's needed"
}

Guidelines:
- Drills should be practical for individual or small group training
- Include specific rep counts, distances, and timings
- Use creative Fantasma-themed naming (Phantom, Ghost, Shadow, Steel City, etc.)
- Steps should be clear enough that a player can follow without a coach present
- 3-5 steps per drill
- Duration between 15-35 minutes`;

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

  const { focusAreas, difficulty } = req.body;

  if (!focusAreas || !Array.isArray(focusAreas) || focusAreas.length === 0) {
    return res.status(400).json({ error: 'focusAreas is required (array of strings)' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    // Fallback if API key not configured yet
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
    const userPrompt = `Generate a soccer drill plan focused on: ${focusAreas.join(', ')}${difficulty ? `. Difficulty level: ${difficulty}` : ''}.`;

    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content[0].text;
    const drill = JSON.parse(text);

    return res.status(200).json(drill);
  } catch (err) {
    console.error('Drill generation error:', err);
    return res.status(500).json({ error: 'Failed to generate drill' });
  }
}
