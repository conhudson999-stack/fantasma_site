// Vercel Serverless Function — /api/camp-register
// Validates camp registration form, creates Stripe Checkout session using fetch

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    campId, campName, campPrice, campDates,
    playerName, playerDob, parentName, email, phone,
    position, shirtSize, medical, waiver,
  } = req.body

  if (!campId || !campName || !campPrice || !playerName || !playerDob || !parentName || !email || !phone || !position || !shirtSize) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (!waiver || waiver === 'false') {
    return res.status(400).json({ error: 'Liability waiver must be accepted' })
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' })
  }

  try {
    const origin = req.headers.origin || 'https://fantasmafootball.com'

    const params = new URLSearchParams()
    params.append('payment_method_types[]', 'card')
    params.append('mode', 'payment')
    params.append('customer_email', email)
    params.append('line_items[0][price_data][currency]', 'usd')
    params.append('line_items[0][price_data][product_data][name]', campName)
    params.append('line_items[0][price_data][product_data][description]', `${campDates} — Player: ${playerName}`)
    params.append('line_items[0][price_data][unit_amount]', String(Math.round(campPrice * 100)))
    params.append('line_items[0][quantity]', '1')
    params.append('metadata[campId]', campId)
    params.append('metadata[campName]', campName)
    params.append('metadata[campDates]', campDates)
    params.append('metadata[playerName]', playerName)
    params.append('metadata[playerDob]', playerDob)
    params.append('metadata[parentName]', parentName)
    params.append('metadata[email]', email)
    params.append('metadata[phone]', phone)
    params.append('metadata[position]', position)
    params.append('metadata[shirtSize]', shirtSize)
    params.append('metadata[medical]', medical || 'None')
    params.append('success_url', `${origin}/camps.html?success=true&camp=${campId}`)
    params.append('cancel_url', `${origin}/camps.html`)

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await response.json()

    if (data.error) {
      console.error('Stripe error:', data.error)
      return res.status(500).json({ error: 'Stripe error', detail: data.error.message })
    }

    return res.status(200).json({ url: data.url })
  } catch (err) {
    console.error('Checkout error:', err.message)
    return res.status(500).json({ error: 'Failed to create checkout session', detail: err.message })
  }
}
