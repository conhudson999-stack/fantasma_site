// Vercel Serverless Function — /api/camp-register
// Validates camp registration form, creates Stripe Checkout session

import Stripe from 'stripe'

export default async function handler(req, res) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    campId, campName, campPrice, campDates,
    playerName, playerDob, parentName, email, phone,
    position, shirtSize, medical, waiver,
  } = req.body

  // Debug: check if key exists
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'STRIPE_SECRET_KEY not configured' })
  }

  // Validate required fields
  if (!campId || !campName || !campPrice || !playerName || !playerDob || !parentName || !email || !phone || !position || !shirtSize) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (!waiver || waiver === 'false') {
    return res.status(400).json({ error: 'Liability waiver must be accepted' })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: campName,
              description: `${campDates} — Player: ${playerName}`,
            },
            unit_amount: Math.round(campPrice * 100), // cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        campId,
        campName,
        campDates,
        playerName,
        playerDob,
        parentName,
        email,
        phone,
        position,
        shirtSize,
        medical: medical || 'None',
      },
      success_url: `${req.headers.origin || 'https://fantasmafootball.com'}/camps.html?success=true&camp=${campId}`,
      cancel_url: `${req.headers.origin || 'https://fantasmafootball.com'}/camps.html`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe session error:', err.message)
    return res.status(500).json({ error: 'Failed to create checkout session', detail: err.message })
  }
}
