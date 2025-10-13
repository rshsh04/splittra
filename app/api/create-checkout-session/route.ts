import { NextRequest } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const fallbackOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'https://splittra.se'
    const originHeader = req.headers.get('origin') || ''
    const origin = originHeader || req.nextUrl.origin || fallbackOrigin

    const { coupon, userId, email } = await req.json().catch(() => ({ }))
    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      
      payment_method_collection: 'if_required',
      billing_address_collection: 'auto',
      customer_email: email,
      subscription_data: { trial_period_days: 30, metadata: { userId: String(userId) } },
      mode: 'subscription',
      success_url: `${origin}/dashboard?success=true`,
      cancel_url: `${origin}/upgrade?canceled=true`,
      allow_promotion_codes: true,
      discounts: coupon ? [{ coupon }] : [],
    })
    return Response.json({ id: session.id })
  } catch (error) {
    return Response.json({ error: (error as Error).message || 'Unknown error' }, { status: 500 })
  }
}
