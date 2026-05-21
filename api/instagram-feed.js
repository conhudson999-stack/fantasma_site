export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = process.env.INSTAGRAM_TOKEN
  if (!token) {
    return res.status(500).json({ error: 'Instagram token not configured.' })
  }

  const limit = parseInt(req.query.limit) || 9
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'

  try {
    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${token}`
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Instagram API error:', response.status, errorData)
      return res.status(response.status).json({ error: 'Instagram API request failed.' })
    }

    const data = await response.json()
    return res.status(200).json(data)
  } catch (err) {
    console.error('Instagram feed error:', err)
    return res.status(500).json({ error: 'Failed to fetch Instagram feed.' })
  }
}
